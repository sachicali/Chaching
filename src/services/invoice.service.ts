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

// Philippines tax rate (12% VAT)
const PHILIPPINES_TAX_RATE = 12;

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
   * Record payment for invoice with email confirmation
   */
  async recordPayment(invoiceId: string, paymentData: {
    amount: number;
    paymentDate: Date;
    paymentMethod: Payment['paymentMethod'];
    reference?: string;
    notes?: string;
    sendConfirmationEmail?: boolean;
  }): Promise<{ invoice: Invoice; payment: Payment; transactionId?: string }> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const batch = writeBatch(db);

      // Create payment record
      const paymentId = doc(collection(db, COLLECTIONS.PAYMENTS)).id;
      const payment: Omit<Payment, 'id'> = {
        invoiceId,
        amount: paymentData.amount,
        currency: invoice.currency,
        amountPHP: invoice.currency !== 'PHP' && invoice.exchangeRate 
          ? paymentData.amount * invoice.exchangeRate 
          : paymentData.amount,
        exchangeRate: invoice.exchangeRate,
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

      // Update invoice status
      const invoiceUpdates: Partial<Invoice> = {
        status: paymentData.amount >= invoice.total ? 'paid' : invoice.status,
        paidAt: paymentData.amount >= invoice.total ? Timestamp.fromDate(paymentData.paymentDate) : undefined,
        paymentRecordedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
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

      // Return updated data
      const updatedInvoice = {
        ...invoice,
        ...invoiceUpdates
      } as Invoice;

      return {
        invoice: updatedInvoice,
        payment: { id: paymentId, ...payment } as Payment,
        transactionId
      };

    } catch (error) {
      console.error('Error recording payment:', error);
      throw new Error('Failed to record payment');
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
   * Calculate invoice totals
   */
  private calculateInvoiceTotals(
    lineItems: InvoiceLineItem[],
    taxRate: number,
    discount?: { type: 'percentage' | 'fixed'; value: number }
  ) {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    
    let discountAmount = 0;
    if (discount) {
      discountAmount = discount.type === 'percentage' 
        ? subtotal * (discount.value / 100)
        : discount.value;
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = discountedSubtotal * (taxRate / 100);
    const total = discountedSubtotal + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  }

  /**
   * Convert currency to PHP if needed
   */
  private async convertCurrency(amount: number, currency: CurrencyCode): Promise<{
    totalPHP: number;
    exchangeRate: number;
  }> {
    if (currency === 'PHP') {
      return { totalPHP: amount, exchangeRate: 1 };
    }

    // TODO: Implement real-time exchange rate API
    // For now, using static rates as per existing codebase
    const exchangeRates: Record<CurrencyCode, number> = {
      USD: 58.75,
      EUR: 63.20,
      PHP: 1
    };

    const rate = exchangeRates[currency];
    return {
      totalPHP: amount * rate,
      exchangeRate: rate
    };
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
   * Get Philippines tax rate
   */
  static getPhilippinesTaxRate(): number {
    return PHILIPPINES_TAX_RATE;
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
  PHILIPPINES_TAX_RATE,
  PAYMENT_TERMS_OPTIONS,
  DEFAULT_TEMPLATES
};