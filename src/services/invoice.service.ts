// Invoice Service - Chaching Financial Management Application
// This service handles all invoice-related operations including CRUD, PDF generation, and status management

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type {
  Invoice,
  InvoiceFormData,
  InvoiceLineItem,
  InvoiceTemplate,
  Payment,
  Client,
  CurrencyCode,
  TransactionType
} from '@/types/database.types';
import PdfService from './pdf.service';
import EmailService from './email.service';
import { exchangeRateService } from './exchange-rate.service';
import { philippineTaxService } from './philippine-tax.service';

// ==================== CONSTANTS ====================

const COLLECTIONS = {
  INVOICES: 'invoices',
  INVOICE_TEMPLATES: 'invoiceTemplates',
  PAYMENTS: 'payments',
  CLIENTS: 'clients',
  TRANSACTIONS: 'transactions'
} as const;

// Default invoice templates
const DEFAULT_TEMPLATES = {
  MODERN: 'modern',
  CLASSIC: 'classic',
  MINIMAL: 'minimal',
  PROFESSIONAL: 'professional'
} as const;

// Philippines tax rate (12% VAT) - Enhanced with BIR compliance
const PHILIPPINES_VAT_RATE = 12;
const PHILIPPINES_WITHHOLDING_TAX_RATE = 10; // 10% withholding tax for professional services

// Payment terms options
const PAYMENT_TERMS_OPTIONS = [
  'Due on receipt',
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60'
] as const;

// ==================== INVOICE OPERATIONS ====================

export class InvoiceService {
  private userId: string;
  private emailService: EmailService;

  constructor(userId: string) {
    this.userId = userId;
    this.emailService = new EmailService(userId);
  }

  // ==================== INVOICE CRUD OPERATIONS ====================

  /**
   * Create a new invoice
   */
  async createInvoice(data: InvoiceFormData): Promise<Invoice> {
    try {
      // Get client information
      const client = await this.getClientById(data.clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Calculate line items with amounts
      const lineItems = this.calculateLineItems(data.lineItems);

      // Calculate totals
      const calculations = this.calculateInvoiceTotals(lineItems, data.taxRate, data.discount);

      // Get currency conversion for PHP if needed
      const { totalPHP, exchangeRate } = await this.convertCurrency(
        calculations.total,
        data.currency
      );

      // Get business information (from user preferences or defaults)
      const businessInfo = await this.getBusinessInfo();

      // Create invoice object
      const invoiceData: Omit<Invoice, 'id'> = {
        invoiceNumber,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: client.address,
        status: 'draft',
        issueDate: Timestamp.fromDate(data.issueDate),
        dueDate: Timestamp.fromDate(data.dueDate),
        currency: data.currency,
        lineItems,
        subtotal: calculations.subtotal,
        taxRate: data.taxRate,
        taxAmount: calculations.taxAmount,
        discount: data.discount ? {
          ...data.discount,
          amount: calculations.discountAmount || 0
        } : undefined,
        total: calculations.total,
        totalPHP: data.currency !== 'PHP' ? totalPHP : undefined,
        exchangeRate: data.currency !== 'PHP' ? exchangeRate : undefined,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        businessInfo,
        templateId: data.templateId,
        remindersSent: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: this.userId
      };

      // Add to Firestore
      const docRef = await addDoc(
        collection(db, COLLECTIONS.INVOICES),
        invoiceData
      );

      // Return complete invoice with ID
      return {
        id: docRef.id,
        ...invoiceData
      } as Invoice;

    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      const docRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Verify ownership
      if (data.userId !== this.userId) {
        throw new Error('Access denied: Invoice not found');
      }

      return {
        id: docSnap.id,
        ...data
      } as Invoice;

    } catch (error) {
      console.error('Error getting invoice:', error);
      throw new Error('Failed to get invoice');
    }
  }

  /**
   * Get all invoices for the user
   */
  async getInvoices(filters?: {
    status?: Invoice['status'] | 'all';
    clientId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): Promise<Invoice[]> {
    try {
      let q = query(
        collection(db, COLLECTIONS.INVOICES),
        where('userId', '==', this.userId),
        orderBy('createdAt', 'desc')
      );

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.clientId) {
        q = query(q, where('clientId', '==', filters.clientId));
      }

      if (filters?.dateFrom) {
        q = query(q, where('issueDate', '>=', Timestamp.fromDate(filters.dateFrom)));
      }

      if (filters?.dateTo) {
        q = query(q, where('issueDate', '<=', Timestamp.fromDate(filters.dateTo)));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];

    } catch (error) {
      console.error('Error getting invoices:', error);
      throw new Error('Failed to get invoices');
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      // Get existing invoice to verify ownership
      const existingInvoice = await this.getInvoiceById(invoiceId);
      if (!existingInvoice) {
        throw new Error('Invoice not found');
      }

      // Prevent updating certain fields
      const allowedUpdates = { ...updates };
      delete allowedUpdates.id;
      delete allowedUpdates.userId;
      delete allowedUpdates.createdAt;
      delete allowedUpdates.invoiceNumber; // Invoice number should not change

      // Recalculate totals if line items or tax rate changed
      if (updates.lineItems || updates.taxRate !== undefined || updates.discount !== undefined) {
        const lineItems = updates.lineItems || existingInvoice.lineItems;
        const taxRate = updates.taxRate !== undefined ? updates.taxRate : existingInvoice.taxRate;
        const discount = updates.discount !== undefined ? updates.discount : existingInvoice.discount;

        const calculations = this.calculateInvoiceTotals(lineItems, taxRate, discount);
        
        allowedUpdates.subtotal = calculations.subtotal;
        allowedUpdates.taxAmount = calculations.taxAmount;
        allowedUpdates.total = calculations.total;
        
        if (updates.discount !== undefined) {
          allowedUpdates.discount = discount ? {
            ...discount,
            amount: calculations.discountAmount || 0
          } : undefined;
        }

        // Recalculate currency conversion if needed
        if (existingInvoice.currency !== 'PHP') {
          const { totalPHP, exchangeRate } = await this.convertCurrency(
            calculations.total,
            existingInvoice.currency
          );
          allowedUpdates.totalPHP = totalPHP;
          allowedUpdates.exchangeRate = exchangeRate;
        }
      }

      // Update timestamp
      allowedUpdates.updatedAt = Timestamp.now();

      // Update in Firestore
      const docRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
      await updateDoc(docRef, allowedUpdates);

      // Return updated invoice
      return {
        ...existingInvoice,
        ...allowedUpdates
      } as Invoice;

    } catch (error) {
      console.error('Error updating invoice:', error);
      throw new Error('Failed to update invoice');
    }
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      // Verify ownership
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Check if invoice can be deleted (only draft invoices)
      if (invoice.status !== 'draft') {
        throw new Error('Only draft invoices can be deleted');
      }

      // Delete from Firestore
      const docRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
      await deleteDoc(docRef);

    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw new Error('Failed to delete invoice');
    }
  }

  // ==================== INVOICE STATUS MANAGEMENT ====================

  /**
   * Generate and store PDF for invoice
   */
  private async generateAndStorePdf(invoiceId: string): Promise<string> {
    const pdfService = new PdfService(this.userId);
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found for PDF generation');
    }
    const pdfUrl = await pdfService.generateInvoicePdf(invoice);
    await this.updateInvoice(invoiceId, { pdfUrl });
    return pdfUrl;
  }

  /**
   * Send invoice to client with email automation
   */
  async sendInvoice(
    invoiceId: string, 
    emailData?: { 
      subject?: string; 
      message?: string;
      ccEmails?: string[];
      bccEmails?: string[];
      templateType?: 'INVOICE_NEW' | 'INVOICE_REMINDER';
    }
  ): Promise<Invoice> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Ensure PDF exists
      const pdfUrl = invoice.pdfUrl || await this.generateAndStorePdf(invoiceId);

      // Send email using EmailService
      const emailResult = await this.emailService.sendInvoiceEmail(invoice, {
        templateType: emailData?.templateType || 'INVOICE_NEW',
        customSubject: emailData?.subject,
        customMessage: emailData?.message,
        ccEmails: emailData?.ccEmails,
        bccEmails: emailData?.bccEmails
      });

      // Update invoice status and tracking
      const updates: Partial<Invoice> = {
        status: 'sent',
        sentAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        pdfUrl
      };
      
      const updatedInvoice = await this.updateInvoice(invoiceId, updates);
      
      console.log(`Invoice ${invoice.invoiceNumber} sent successfully. Email ID: ${emailResult.emailId}`);
      
      return updatedInvoice;

    } catch (error) {
      console.error('Error sending invoice:', error);
      throw new Error(`Failed to send invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send reminder email for overdue invoice
   */
  async sendReminderEmail(
    invoiceId: string,
    reminderType: 'gentle' | 'firm' | 'final' = 'gentle'
  ): Promise<Invoice> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Check if invoice is eligible for reminders
      if (invoice.status === 'paid' || invoice.status === 'cancelled') {
        throw new Error('Cannot send reminder for paid or cancelled invoices');
      }

      // Send reminder using EmailService
      const emailResult = await this.emailService.sendReminderEmail(invoice, reminderType);
      
      // Track reminder in invoice
      const reminderData = {
        id: emailResult.emailId,
        type: reminderType as 'first' | 'second' | 'final' | 'custom',
        sentAt: Timestamp.now(),
        subject: `${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} reminder for Invoice ${invoice.invoiceNumber}`,
        message: `Reminder email sent for invoice ${invoice.invoiceNumber}`,
        method: 'email' as const
      };

      const updatedReminders = [...invoice.remindersSent, reminderData];
      
      // Update invoice with reminder tracking
      const updates: Partial<Invoice> = {
        remindersSent: updatedReminders,
        updatedAt: Timestamp.now()
      };

      const updatedInvoice = await this.updateInvoice(invoiceId, updates);
      
      console.log(`${reminderType} reminder sent for invoice ${invoice.invoiceNumber}. Email ID: ${emailResult.emailId}`);
      
      return updatedInvoice;

    } catch (error) {
      console.error('Error sending reminder email:', error);
      throw new Error(`Failed to send reminder email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark invoice as viewed by client
   */
  async markInvoiceAsViewed(invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const updates: Partial<Invoice> = {
        status: invoice.status === 'sent' ? 'viewed' : invoice.status,
        viewedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      return await this.updateInvoice(invoiceId, updates);

    } catch (error) {
      console.error('Error marking invoice as viewed:', error);
      throw new Error('Failed to mark invoice as viewed');
    }
  }

  /**
   * Get all payments for an invoice
   */
  async getInvoicePayments(invoiceId: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PAYMENTS),
        where('invoiceId', '==', invoiceId),
        where('userId', '==', this.userId),
        orderBy('paymentDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];

    } catch (error) {
      console.error('Error getting invoice payments:', error);
      throw new Error('Failed to get invoice payments');
    }
  }

  /**
   * Calculate payment summary for an invoice
   */
  async calculatePaymentSummary(invoiceId: string): Promise<{
    totalPaid: number;
    remainingBalance: number;
    paymentsCount: number;
    isFullyPaid: boolean;
    isPartiallyPaid: boolean;
    paymentPercentage: number;
  }> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const payments = await this.getInvoicePayments(invoiceId);
      const totalPaid = payments
        .filter(payment => payment.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0);

      const remainingBalance = Math.max(0, invoice.total - totalPaid);
      const isFullyPaid = remainingBalance === 0 && totalPaid > 0;
      const isPartiallyPaid = totalPaid > 0 && remainingBalance > 0;
      const paymentPercentage = invoice.total > 0 ? (totalPaid / invoice.total) * 100 : 0;

      return {
        totalPaid,
        remainingBalance,
        paymentsCount: payments.length,
        isFullyPaid,
        isPartiallyPaid,
        paymentPercentage: Math.round(paymentPercentage * 100) / 100
      };

    } catch (error) {
      console.error('Error calculating payment summary:', error);
      throw new Error('Failed to calculate payment summary');
    }
  }

  /**
   * Validate payment amount and business rules
   */
  private async validatePayment(invoiceId: string, paymentAmount: number): Promise<{
    isValid: boolean;
    error?: string;
    warnings?: string[];
  }> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        return { isValid: false, error: 'Invoice not found' };
      }

      // Check if invoice can accept payments
      if (invoice.status === 'cancelled') {
        return { isValid: false, error: 'Cannot record payment for cancelled invoice' };
      }

      if (invoice.status === 'draft') {
        return { 
          isValid: false, 
          error: 'Cannot record payment for draft invoice. Please send the invoice first.' 
        };
      }

      // Check payment amount
      if (paymentAmount <= 0) {
        return { isValid: false, error: 'Payment amount must be greater than zero' };
      }

      // Calculate current payment status
      const paymentSummary = await this.calculatePaymentSummary(invoiceId);
      
      if (paymentSummary.isFullyPaid) {
        return { 
          isValid: false, 
          error: 'Invoice is already fully paid' 
        };
      }

      const warnings: string[] = [];

      // Check for overpayment
      if (paymentAmount > paymentSummary.remainingBalance) {
        warnings.push(
          `Payment amount (${paymentAmount}) exceeds remaining balance (${paymentSummary.remainingBalance}). This will result in overpayment.`
        );
      }

      // Check for duplicate payments (if reference provided)
      // This would require additional logic to check payment references

      return {
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error('Error validating payment:', error);
      return { isValid: false, error: 'Failed to validate payment' };
    }
  }

  /**
   * Record payment for invoice with enhanced partial payment handling
   */
  async recordPayment(invoiceId: string, paymentData: {
    amount: number;
    paymentDate: Date;
    paymentMethod: Payment['paymentMethod'];
    reference?: string;
    notes?: string;
    sendConfirmationEmail?: boolean;
    allowOverpayment?: boolean;
  }): Promise<{ invoice: Invoice; payment: Payment; transactionId?: string; warnings?: string[] }> {
    try {
      // Validate payment
      const validation = await this.validatePayment(invoiceId, paymentData.amount);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check for overpayment if not explicitly allowed
      if (!paymentData.allowOverpayment && validation.warnings?.some(w => w.includes('overpayment'))) {
        throw new Error('Payment amount exceeds remaining balance. Set allowOverpayment to true to proceed.');
      }

      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Get current payment summary
      const paymentSummary = await this.calculatePaymentSummary(invoiceId);

      const batch = writeBatch(db);

      // Convert payment amount to PHP using real-time rates
      const conversionResult = await this.convertCurrency(paymentData.amount, invoice.currency);

      // Create payment record
      const paymentId = doc(collection(db, COLLECTIONS.PAYMENTS)).id;
      const payment: Omit<Payment, 'id'> = {
        invoiceId,
        amount: paymentData.amount,
        currency: invoice.currency,
        amountPHP: conversionResult.totalPHP,
        exchangeRate: conversionResult.exchangeRate,
        paymentDate: Timestamp.fromDate(paymentData.paymentDate),
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference,
        status: 'completed',
        notes: paymentData.notes,
        recordedAt: Timestamp.now(),
        recordedBy: this.userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: this.userId
      };

      // Add payment to batch
      const paymentRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
      batch.set(paymentRef, payment);

      // Calculate new totals after this payment
      const newTotalPaid = paymentSummary.totalPaid + paymentData.amount;
      const newRemainingBalance = Math.max(0, invoice.total - newTotalPaid);
      const isNowFullyPaid = newRemainingBalance === 0;
      const isNowPartiallyPaid = newTotalPaid > 0 && newRemainingBalance > 0;

      // Determine new invoice status
      let newStatus: Invoice['status'] = invoice.status;
      if (isNowFullyPaid) {
        newStatus = 'paid';
      } else if (isNowPartiallyPaid && invoice.status !== 'paid') {
        // Add partially_paid status if not already paid
        newStatus = invoice.status === 'overdue' ? 'overdue' : 'viewed'; // Keep overdue status if applicable
      }

      // Update invoice status with enhanced partial payment tracking
      const invoiceUpdates: Partial<Invoice> = {
        status: newStatus,
        paidAt: isNowFullyPaid ? Timestamp.fromDate(paymentData.paymentDate) : undefined,
        paymentRecordedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Add payment tracking fields
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
        paymentPercentage: invoice.total > 0 ? Math.round((newTotalPaid / invoice.total) * 10000) / 100 : 0
      };

      // Update invoice in batch
      const invoiceRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
      batch.update(invoiceRef, invoiceUpdates);

      // Create corresponding income transaction
      let transactionId: string | undefined;
      if (paymentData.amount > 0) {
        transactionId = doc(collection(db, COLLECTIONS.TRANSACTIONS)).id;
        const transaction = {
          type: 'income' as TransactionType,
          amount: paymentData.amount,
          currency: invoice.currency,
          amountPHP: payment.amountPHP!,
          phpEquivalent: payment.amountPHP!,
          exchangeRate: invoice.exchangeRate || 1,
          description: `Payment for Invoice ${invoice.invoiceNumber}`,
          date: Timestamp.fromDate(paymentData.paymentDate),
          category: 'Invoice Payment',
          clientId: invoice.clientId,
          clientName: invoice.clientName,
          paymentMethod: paymentData.paymentMethod,
          metadata: {
            invoiceId,
            invoiceNumber: invoice.invoiceNumber,
            paymentReference: paymentData.reference
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          userId: this.userId
        };

        const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);
        batch.set(transactionRef, transaction);

        // Link transaction to payment
        payment.transactionId = transactionId;
        batch.update(paymentRef, { transactionId });
      }

      // Execute batch
      await batch.commit();

      // Send payment confirmation email if requested
      if (paymentData.sendConfirmationEmail !== false) {
        try {
          await this.emailService.sendPaymentConfirmation(
            invoice,
            paymentData.amount,
            paymentData.paymentDate
          );
          console.log(`Payment confirmation email sent for invoice ${invoice.invoiceNumber}`);
        } catch (emailError) {
          console.warn('Payment recorded successfully, but email confirmation failed:', emailError);
          // Don't throw here as payment was successful
        }
      }

      // Return updated data with warnings
      const updatedInvoice = {
        ...invoice,
        ...invoiceUpdates
      } as Invoice;

      return {
        invoice: updatedInvoice,
        payment: { id: paymentId, ...payment } as Payment,
        transactionId,
        warnings: validation.warnings
      };

    } catch (error) {
      console.error('Error recording payment:', error);
      throw new Error(`Failed to record payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==================== EMAIL INTEGRATION METHODS ====================

  /**
   * Get email history for an invoice
   */
  async getInvoiceEmailHistory(invoiceId: string) {
    try {
      return await this.emailService.getEmailHistory(invoiceId);
    } catch (error) {
      console.error('Error getting invoice email history:', error);
      throw new Error('Failed to get invoice email history');
    }
  }

  /**
   * Update email status for invoice tracking
   */
  async updateEmailStatus(
    emailId: string,
    status: 'pending' | 'processing' | 'delivered' | 'failed' | 'bounced',
    metadata?: {
      deliveredAt?: Timestamp;
      openedAt?: Timestamp;
      errorMessage?: string;
    }
  ): Promise<void> {
    try {
      await this.emailService.updateEmailStatus(emailId, status, metadata);
    } catch (error) {
      console.error('Error updating email status:', error);
      throw new Error('Failed to update email status');
    }
  }

  // ==================== CALCULATION HELPERS ====================

  /**
   * Calculate line items with amounts
   */
  private calculateLineItems(lineItems: Omit<InvoiceLineItem, 'id' | 'amount'>[]): InvoiceLineItem[] {
    return lineItems.map((item, index) => ({
      id: `line-${index + 1}`,
      ...item,
      amount: item.quantity * item.rate
    }));
  }

  /**
   * Calculate invoice totals with BIR-compliant tax calculations
   */
  private calculateInvoiceTotals(
    lineItems: InvoiceLineItem[],
    taxRate: number,
    discount?: { type: 'percentage' | 'fixed'; value: number },
    options?: {
      isVatRegistered?: boolean;
      includeWithholdingTax?: boolean;
      clientType?: 'individual' | 'business';
    }
  ) {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    
    let discountAmount = 0;
    if (discount) {
      discountAmount = discount.type === 'percentage' 
        ? subtotal * (discount.value / 100)
        : discount.value;
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    // Enhanced tax calculations based on Philippine BIR requirements
    let taxAmount = 0;
    let withholdingTaxAmount = 0;
    const vatExclusiveAmount = discountedSubtotal;

    if (options?.isVatRegistered) {
      // VAT-registered: Add 12% VAT
      taxAmount = discountedSubtotal * (PHILIPPINES_VAT_RATE / 100);
    } else {
      // Use provided tax rate (could be percentage tax for VAT-exempt)
      taxAmount = discountedSubtotal * (taxRate / 100);
    }

    // Calculate withholding tax if applicable (for business clients)
    if (options?.includeWithholdingTax && options?.clientType === 'business') {
      withholdingTaxAmount = discountedSubtotal * (PHILIPPINES_WITHHOLDING_TAX_RATE / 100);
    }

    const total = discountedSubtotal + taxAmount;
    const netAmountDue = total - withholdingTaxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      withholdingTaxAmount,
      total,
      netAmountDue,
      vatExclusiveAmount,
      taxDetails: {
        isVatRegistered: options?.isVatRegistered || false,
        vatRate: options?.isVatRegistered ? PHILIPPINES_VAT_RATE : 0,
        withholdingTaxRate: options?.includeWithholdingTax ? PHILIPPINES_WITHHOLDING_TAX_RATE : 0,
        taxType: options?.isVatRegistered ? 'VAT' : taxRate > 0 ? 'Percentage Tax' : 'Tax Exempt'
      }
    };
  }

  /**
   * Convert currency to PHP using real-time exchange rates
   */
  private async convertCurrency(amount: number, currency: CurrencyCode): Promise<{
    totalPHP: number;
    exchangeRate: number;
  }> {
    if (currency === 'PHP') {
      return { totalPHP: amount, exchangeRate: 1 };
    }

    try {
      // Use real-time exchange rate service
      const conversion = await exchangeRateService.convertCurrency(amount, currency, 'PHP');
      return {
        totalPHP: conversion.convertedAmount,
        exchangeRate: conversion.rate
      };
    } catch (error) {
      console.error('Error converting currency in invoice service:', error);
      
      // Fallback to static rates if API fails
      const fallbackRates: Record<CurrencyCode, number> = {
        USD: 58.75,
        EUR: 63.20,
        PHP: 1
      };

      const rate = fallbackRates[currency];
      return {
        totalPHP: amount * rate,
        exchangeRate: rate
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get count of invoices this month
    const startOfMonth = new Date(year, now.getMonth(), 1);
    const endOfMonth = new Date(year, now.getMonth() + 1, 0);
    
    const monthlyInvoices = await this.getInvoices({
      dateFrom: startOfMonth,
      dateTo: endOfMonth
    });

    const invoiceCount = monthlyInvoices.length + 1;
    const paddedCount = String(invoiceCount).padStart(3, '0');
    
    return `INV-${year}-${month}-${paddedCount}`;
  }

  /**
   * Get client by ID
   */
  private async getClientById(clientId: string): Promise<Client | null> {
    try {
      const docRef = doc(db, COLLECTIONS.CLIENTS, clientId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Verify ownership
      if (data.userId !== this.userId) {
        return null;
      }

      return {
        id: docSnap.id,
        ...data
      } as Client;

    } catch (error) {
      console.error('Error getting client:', error);
      return null;
    }
  }

  /**
   * Get business information for invoice
   */
  private async getBusinessInfo() {
    // TODO: Get from user preferences/settings
    // For now, return default business info
    return {
      businessName: 'Your Business Name',
      email: 'business@example.com',
      phone: '+63 123 456 7890',
      address: {
        street: '123 Business Street',
        city: 'Manila',
        state: 'Metro Manila',
        postalCode: '1000',
        country: 'Philippines'
      },
      taxId: 'TIN: 123-456-789-000'
    };
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get invoice analytics
   */
  async getInvoiceAnalytics(period?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalInvoices: number;
    totalAmount: number;
    totalAmountPHP: number;
    paidInvoices: number;
    paidAmount: number;
    overdueInvoices: number;
    overdueAmount: number;
    statusBreakdown: Record<Invoice['status'], number>;
    currencyBreakdown: Record<CurrencyCode, { count: number; amount: number }>;
  }> {
    try {
      const invoices = await this.getInvoices(period ? {
        dateFrom: period.startDate,
        dateTo: period.endDate
      } : undefined);

      const analytics = {
        totalInvoices: invoices.length,
        totalAmount: 0,
        totalAmountPHP: 0,
        paidInvoices: 0,
        paidAmount: 0,
        overdueInvoices: 0,
        overdueAmount: 0,
        statusBreakdown: {
          draft: 0,
          sent: 0,
          viewed: 0,
          paid: 0,
          overdue: 0,
          cancelled: 0
        } as Record<Invoice['status'], number>,
        currencyBreakdown: {
          USD: { count: 0, amount: 0 },
          EUR: { count: 0, amount: 0 },
          PHP: { count: 0, amount: 0 }
        } as Record<CurrencyCode, { count: number; amount: number }>
      };

      const now = new Date();

      for (const invoice of invoices) {
        // Total amounts
        analytics.totalAmount += invoice.total;
        analytics.totalAmountPHP += invoice.totalPHP || invoice.total;

        // Status breakdown
        analytics.statusBreakdown[invoice.status]++;

        // Currency breakdown
        analytics.currencyBreakdown[invoice.currency].count++;
        analytics.currencyBreakdown[invoice.currency].amount += invoice.total;

        // Paid invoices
        if (invoice.status === 'paid') {
          analytics.paidInvoices++;
          analytics.paidAmount += invoice.total;
        }

        // Overdue invoices
        const dueDate = invoice.dueDate.toDate();
        if (invoice.status !== 'paid' && invoice.status !== 'cancelled' && dueDate < now) {
          analytics.overdueInvoices++;
          analytics.overdueAmount += invoice.total;
        }
      }

      return analytics;

    } catch (error) {
      console.error('Error getting invoice analytics:', error);
      throw new Error('Failed to get invoice analytics');
    }
  }

  /**
   * Calculate BIR-compliant tax analysis for an invoice
   */
  async calculateInvoiceTaxAnalysis(invoiceId: string): Promise<{
    invoice: Invoice;
    taxCalculation: any; // TaxCalculation from philippine-tax.service
    birCompliance: {
      isVatRegistered: boolean;
      requiresWithholdingTax: boolean;
      taxType: string;
      vatAmount: number;
      withholdingTaxAmount: number;
      netAmountDue: number;
    };
    recommendations: string[];
  }> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Calculate comprehensive tax using Philippine tax service
      const taxCalculation = await philippineTaxService.calculateTax({
        grossIncome: invoice.total,
        currency: invoice.currency,
        incomeType: 'professional', // Default to professional services
        isVatRegistered: invoice.total >= 3000000, // VAT registration threshold
        deductions: 0 // Invoices don't typically have deductions
      });

      // Determine BIR compliance requirements
      const isVatRegistered = invoice.total >= 3000000; // ₱3M threshold
      const requiresWithholdingTax = true; // Most professional services require withholding
      
      const birCompliance = {
        isVatRegistered,
        requiresWithholdingTax,
        taxType: isVatRegistered ? 'VAT (12%)' : 'Percentage Tax (3%)',
        vatAmount: taxCalculation.vatAmount,
        withholdingTaxAmount: taxCalculation.withholdingTax,
        netAmountDue: invoice.total - taxCalculation.withholdingTax
      };

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (!isVatRegistered && invoice.total > 2500000) {
        recommendations.push('Consider VAT registration as you approach the ₱3M threshold.');
      }
      
      if (requiresWithholdingTax) {
        recommendations.push('Include withholding tax details in your invoice for client compliance.');
      }
      
      if (taxCalculation.effectiveTaxRate > 15) {
        recommendations.push('High effective tax rate. Consider reviewing deductible expenses.');
      }

      recommendations.push('Ensure proper BIR receipt issuance upon payment.');
      recommendations.push('Keep detailed records for quarterly BIR filing.');

      return {
        invoice,
        taxCalculation,
        birCompliance,
        recommendations
      };

    } catch (error) {
      console.error('Error calculating invoice tax analysis:', error);
      throw new Error('Failed to calculate tax analysis');
    }
  }

  // ==================== TEMPLATE MANAGEMENT ====================

  /**
   * Get available invoice templates
   */
  async getInvoiceTemplates(): Promise<InvoiceTemplate[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.INVOICE_TEMPLATES),
        where('userId', '==', this.userId),
        orderBy('isDefault', 'desc'),
        orderBy('usageCount', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InvoiceTemplate[];

    } catch (error) {
      console.error('Error getting invoice templates:', error);
      throw new Error('Failed to get invoice templates');
    }
  }

  // ==================== STATIC HELPERS ====================

  /**
   * Get default payment terms options
   */
  static getPaymentTermsOptions(): readonly string[] {
    return PAYMENT_TERMS_OPTIONS;
  }

  /**
   * Get Philippines VAT rate
   */
  static getPhilippinesVATRate(): number {
    return PHILIPPINES_VAT_RATE;
  }

  /**
   * Get Philippines withholding tax rate
   */
  static getPhilippinesWithholdingTaxRate(): number {
    return PHILIPPINES_WITHHOLDING_TAX_RATE;
  }

  /**
   * Validate invoice data
   */
  static validateInvoiceData(data: InvoiceFormData): string[] {
    const errors: string[] = [];

    if (!data.clientId) {
      errors.push('Client is required');
    }

    if (!data.issueDate) {
      errors.push('Issue date is required');
    }

    if (!data.dueDate) {
      errors.push('Due date is required');
    }

    if (data.dueDate < data.issueDate) {
      errors.push('Due date must be after issue date');
    }

    if (!data.lineItems || data.lineItems.length === 0) {
      errors.push('At least one line item is required');
    }

    if (data.lineItems) {
      data.lineItems.forEach((item, index) => {
        if (!item.description.trim()) {
          errors.push(`Line item ${index + 1}: Description is required`);
        }
        if (item.quantity <= 0) {
          errors.push(`Line item ${index + 1}: Quantity must be greater than 0`);
        }
        if (item.rate <= 0) {
          errors.push(`Line item ${index + 1}: Rate must be greater than 0`);
        }
      });
    }

    if (data.taxRate < 0 || data.taxRate > 100) {
      errors.push('Tax rate must be between 0 and 100');
    }

    if (data.discount) {
      if (data.discount.value <= 0) {
        errors.push('Discount value must be greater than 0');
      }
      if (data.discount.type === 'percentage' && data.discount.value > 100) {
        errors.push('Percentage discount cannot exceed 100%');
      }
    }

    return errors;
  }
}

// ==================== EXPORT ====================

export default InvoiceService;

// Export utility functions
export {
  PHILIPPINES_VAT_RATE,
  PAYMENT_TERMS_OPTIONS,
  DEFAULT_TEMPLATES
};