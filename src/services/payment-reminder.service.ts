/**
 * Payment Reminder Service - Enhanced Automation with Late Fees
 * 
 * Provides sophisticated payment reminder automation with late fee calculations,
 * escalation logic, and comprehensive tracking. Integrates with email service
 * and scheduler for automated delivery.
 * 
 * Features:
 * - Multi-level reminder escalation (gentle → firm → final → legal)
 * - Automatic late fee calculations with configurable rates
 * - Smart reminder scheduling based on payment terms
 * - Grace period handling for different client types
 * - Automated reminder pause on partial payments
 * - Comprehensive reminder analytics and reporting
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EmailService from './email.service';
import type { 
  Invoice,
  Client,
  CurrencyCode,
  EmailPriority
} from '@/types/database.types';

// ==================== CONSTANTS ====================

const COLLECTIONS = {
  INVOICES: 'invoices',
  CLIENTS: 'clients',
  PAYMENT_REMINDERS: 'paymentReminders',
  LATE_FEES: 'lateFees'
} as const;

// Default reminder schedule (days after due date)
const DEFAULT_REMINDER_SCHEDULE = {
  GENTLE: [1, 3, 7], // 1, 3, and 7 days after due date
  FIRM: [14, 21], // 2 and 3 weeks after due date
  FINAL: [30, 45], // 1 and 1.5 months after due date
  LEGAL: [60] // 2 months after due date
};

// Late fee configuration
const LATE_FEE_CONFIG = {
  GRACE_PERIOD_DAYS: 3, // Grace period before late fees apply
  DAILY_RATE: 0.02, // 2% per day (annualized ~7.3%)
  FLAT_FEE_THRESHOLD: 1000, // Minimum amount for flat fee
  FLAT_FEE_AMOUNT: 50, // Flat late fee for small amounts
  MAX_LATE_FEE_PERCENTAGE: 0.25, // Maximum 25% of invoice amount
  COMPOUND_INTEREST: false // Whether to compound late fees
};

// ==================== TYPES ====================

export type ReminderLevel = 'gentle' | 'firm' | 'final' | 'legal';
export type ReminderStatus = 'scheduled' | 'sent' | 'failed' | 'cancelled';
export type LateFeeType = 'percentage' | 'flat' | 'daily' | 'compound';

export interface PaymentReminder {
  id: string;
  invoiceId: string;
  userId: string;
  clientId: string;
  
  // Reminder details
  level: ReminderLevel;
  scheduledDate: Timestamp;
  sentDate?: Timestamp;
  status: ReminderStatus;
  
  // Email details
  emailId?: string;
  subject: string;
  templateType: string;
  recipientEmail: string;
  ccEmails?: string[];
  
  // Late fee information
  lateFeeAmount?: number;
  lateFeePercentage?: number;
  daysPastDue: number;
  
  // Tracking
  openedAt?: Timestamp;
  clickedAt?: Timestamp;
  responseReceived?: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LateFee {
  id: string;
  invoiceId: string;
  userId: string;
  
  // Fee calculation
  type: LateFeeType;
  rate: number; // Percentage or flat amount
  baseAmount: number; // Original invoice amount
  calculatedAmount: number; // Calculated late fee
  maxAmount?: number; // Maximum fee cap
  
  // Timeline
  startDate: Timestamp; // When late fees started accruing
  calculationDate: Timestamp; // When this fee was calculated
  daysPastDue: number;
  gracePeriodUsed: boolean;
  
  // Status
  isActive: boolean;
  isWaived: boolean;
  waivedReason?: string;
  waivedBy?: string;
  waivedAt?: Timestamp;
  
  // Payment tracking
  isPaid: boolean;
  paidAmount?: number;
  paidAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReminderConfig {
  // Schedule configuration
  schedule: Record<ReminderLevel, number[]>;
  gracePeriodDays: number;
  maxReminders: number;
  
  // Late fee configuration
  lateFeeEnabled: boolean;
  lateFeeType: LateFeeType;
  lateFeeRate: number;
  flatFeeAmount?: number;
  maxLateFeePercentage: number;
  compoundInterest: boolean;
  
  // Client-specific overrides
  clientOverrides: Map<string, Partial<ReminderConfig>>;
  
  // Template configuration
  emailTemplates: Record<ReminderLevel, string>;
  
  // Automation settings
  autoSendEnabled: boolean;
  pauseOnPartialPayment: boolean;
  skipWeekendsAndHolidays: boolean;
}

export interface ReminderAnalytics {
  totalReminders: number;
  remindersByLevel: Record<ReminderLevel, number>;
  remindersByStatus: Record<ReminderStatus, number>;
  
  // Effectiveness metrics
  paymentRate: number; // Percentage of invoices paid after reminders
  averagePaymentDelay: number; // Average days to payment after reminder
  responseRate: number; // Percentage of reminders that got responses
  
  // Late fee metrics
  totalLateFees: number;
  lateFeesByType: Record<LateFeeType, number>;
  averageLateFee: number;
  lateFeeCollectionRate: number;
  
  // Time analysis
  bestReminderDay: string; // Day of week with highest response rate
  bestReminderTime: number; // Hour of day with highest response rate
  
  // Client analysis
  clientsWithMostReminders: { clientId: string; clientName: string; count: number }[];
  clientsWithHighestLateFees: { clientId: string; clientName: string; amount: number }[];
}

// ==================== PAYMENT REMINDER SERVICE ====================

export class PaymentReminderService {
  private userId: string;
  private emailService: EmailService;
  private config: ReminderConfig;

  constructor(userId: string, config?: Partial<ReminderConfig>) {
    this.userId = userId;
    this.emailService = new EmailService(userId);
    this.config = {
      schedule: DEFAULT_REMINDER_SCHEDULE,
      gracePeriodDays: LATE_FEE_CONFIG.GRACE_PERIOD_DAYS,
      maxReminders: 10,
      lateFeeEnabled: true,
      lateFeeType: 'daily',
      lateFeeRate: LATE_FEE_CONFIG.DAILY_RATE,
      maxLateFeePercentage: LATE_FEE_CONFIG.MAX_LATE_FEE_PERCENTAGE,
      compoundInterest: LATE_FEE_CONFIG.COMPOUND_INTEREST,
      clientOverrides: new Map(),
      emailTemplates: {
        gentle: 'PAYMENT_REMINDER_GENTLE',
        firm: 'PAYMENT_REMINDER_FIRM',
        final: 'PAYMENT_REMINDER_FINAL',
        legal: 'PAYMENT_REMINDER_LEGAL'
      },
      autoSendEnabled: true,
      pauseOnPartialPayment: true,
      skipWeekendsAndHolidays: true,
      ...config
    };
  }

  // ==================== REMINDER SCHEDULING ====================

  /**
   * Schedule automated reminders for an invoice
   */
  async scheduleReminders(invoiceId: string): Promise<PaymentReminder[]> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Don't schedule for draft or paid invoices
      if (invoice.status === 'draft' || invoice.status === 'paid') {
        return [];
      }

      const client = await this.getClientById(invoice.clientId);
      const clientConfig = this.getClientConfig(invoice.clientId);
      
      const reminders: PaymentReminder[] = [];
      const dueDate = invoice.dueDate.toDate();

      // Schedule reminders for each level
      for (const [level, days] of Object.entries(clientConfig.schedule)) {
        for (const dayOffset of days) {
          const scheduledDate = new Date(dueDate);
          scheduledDate.setDate(scheduledDate.getDate() + dayOffset);

          // Skip weekends if configured
          if (clientConfig.skipWeekendsAndHolidays) {
            scheduledDate = this.adjustForBusinessDays(scheduledDate);
          }

          // Calculate late fee for this reminder
          const lateFeeInfo = await this.calculateLateFee(invoice, dayOffset);

          const reminder: Omit<PaymentReminder, 'id'> = {
            invoiceId,
            userId: this.userId,
            clientId: invoice.clientId,
            level: level as ReminderLevel,
            scheduledDate: Timestamp.fromDate(scheduledDate),
            status: 'scheduled',
            subject: this.generateReminderSubject(level as ReminderLevel, invoice, dayOffset),
            templateType: clientConfig.emailTemplates[level as ReminderLevel],
            recipientEmail: invoice.clientEmail,
            ccEmails: client?.ccEmails,
            lateFeeAmount: lateFeeInfo.amount,
            lateFeePercentage: lateFeeInfo.percentage,
            daysPastDue: dayOffset,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };

          const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENT_REMINDERS), reminder);
          reminders.push({ id: docRef.id, ...reminder } as PaymentReminder);
        }
      }

      return reminders;

    } catch (error) {
      console.error('Error scheduling reminders:', error);
      throw new Error('Failed to schedule payment reminders');
    }
  }

  /**
   * Process due reminders (called by scheduler)
   */
  async processDueReminders(): Promise<{
    sent: number;
    failed: number;
    skipped: number;
  }> {
    try {
      const now = new Date();
      const results = { sent: 0, failed: 0, skipped: 0 };

      // Get reminders due for sending
      const dueReminders = await this.getDueReminders(now);

      for (const reminder of dueReminders) {
        try {
          // Check if invoice is still eligible for reminders
          const invoice = await this.getInvoiceById(reminder.invoiceId);
          if (!invoice || invoice.status === 'paid' || invoice.status === 'cancelled') {
            await this.cancelReminder(reminder.id, 'Invoice status changed');
            results.skipped++;
            continue;
          }

          // Check if partial payment was made and config says to pause
          if (this.config.pauseOnPartialPayment && invoice.totalPaid && invoice.totalPaid > 0) {
            await this.pauseReminder(reminder.id, 'Partial payment received');
            results.skipped++;
            continue;
          }

          // Send the reminder
          await this.sendReminder(reminder);
          results.sent++;

        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error);
          await this.markReminderFailed(reminder.id, error instanceof Error ? error.message : 'Unknown error');
          results.failed++;
        }
      }

      return results;

    } catch (error) {
      console.error('Error processing due reminders:', error);
      throw new Error('Failed to process due reminders');
    }
  }

  /**
   * Send individual reminder
   */
  private async sendReminder(reminder: PaymentReminder): Promise<void> {
    try {
      const invoice = await this.getInvoiceById(reminder.invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Calculate current late fee
      const currentLateFee = await this.calculateLateFee(invoice, reminder.daysPastDue);
      
      // Send email
      const emailResult = await this.emailService.sendReminderEmail(invoice, reminder.level);

      // Update reminder status
      await updateDoc(doc(db, COLLECTIONS.PAYMENT_REMINDERS, reminder.id), {
        status: 'sent',
        sentDate: Timestamp.now(),
        emailId: emailResult.emailId,
        lateFeeAmount: currentLateFee.amount,
        lateFeePercentage: currentLateFee.percentage,
        updatedAt: Timestamp.now()
      });

      // Create or update late fee record
      if (currentLateFee.amount > 0) {
        await this.createOrUpdateLateFee(invoice, currentLateFee);
      }

      console.log(`Reminder sent for invoice ${invoice.invoiceNumber}, level: ${reminder.level}`);

    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }

  // ==================== LATE FEE CALCULATIONS ====================

  /**
   * Calculate late fee for an invoice
   */
  async calculateLateFee(invoice: Invoice, daysPastDue: number): Promise<{
    amount: number;
    percentage: number;
    type: LateFeeType;
    breakdown: string;
  }> {
    try {
      const clientConfig = this.getClientConfig(invoice.clientId);
      
      if (!clientConfig.lateFeeEnabled || daysPastDue <= clientConfig.gracePeriodDays) {
        return { amount: 0, percentage: 0, type: 'flat', breakdown: 'Within grace period' };
      }

      const baseAmount = invoice.total;
      let lateFeeAmount = 0;
      let breakdown = '';

      switch (clientConfig.lateFeeType) {
        case 'flat':
          lateFeeAmount = clientConfig.flatFeeAmount || LATE_FEE_CONFIG.FLAT_FEE_AMOUNT;
          breakdown = `Flat fee: ${this.formatCurrency(lateFeeAmount, invoice.currency)}`;
          break;

        case 'percentage':
          lateFeeAmount = baseAmount * (clientConfig.lateFeeRate / 100);
          breakdown = `${clientConfig.lateFeeRate}% of invoice amount`;
          break;

        case 'daily':
          const dailyRate = clientConfig.lateFeeRate / 100;
          const effectiveDays = daysPastDue - clientConfig.gracePeriodDays;
          lateFeeAmount = baseAmount * dailyRate * effectiveDays;
          breakdown = `${clientConfig.lateFeeRate}% daily for ${effectiveDays} days`;
          break;

        case 'compound':
          const compoundRate = clientConfig.lateFeeRate / 100;
          const effectiveCompoundDays = daysPastDue - clientConfig.gracePeriodDays;
          lateFeeAmount = baseAmount * (Math.pow(1 + compoundRate, effectiveCompoundDays) - 1);
          breakdown = `${clientConfig.lateFeeRate}% compound daily for ${effectiveCompoundDays} days`;
          break;

        default:
          lateFeeAmount = 0;
          breakdown = 'No late fee configured';
      }

      // Apply maximum late fee cap
      const maxLateFee = baseAmount * clientConfig.maxLateFeePercentage;
      if (lateFeeAmount > maxLateFee) {
        lateFeeAmount = maxLateFee;
        breakdown += ` (capped at ${clientConfig.maxLateFeePercentage * 100}%)`;
      }

      // Convert to invoice currency if needed
      if (invoice.currency !== 'PHP') {
        // TODO: Replace with real-time API integration in production
        const exchangeRates: Record<CurrencyCode, number> = {
          PHP: 1.00,
          USD: 58.75,
          EUR: 63.50
        };
        // Convert from PHP to target currency
        const phpToTargetRate = 1 / exchangeRates[invoice.currency];
        lateFeeAmount = lateFeeAmount * phpToTargetRate;
      }

      const percentage = baseAmount > 0 ? (lateFeeAmount / baseAmount) * 100 : 0;

      return {
        amount: Math.round(lateFeeAmount * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
        type: clientConfig.lateFeeType,
        breakdown
      };

    } catch (error) {
      console.error('Error calculating late fee:', error);
      return { amount: 0, percentage: 0, type: 'flat', breakdown: 'Calculation error' };
    }
  }

  /**
   * Create or update late fee record
   */
  private async createOrUpdateLateFee(invoice: Invoice, lateFeeInfo: any): Promise<void> {
    try {
      // Check if late fee already exists
      const existingLateFees = await getDocs(
        query(
          collection(db, COLLECTIONS.LATE_FEES),
          where('invoiceId', '==', invoice.id),
          where('userId', '==', this.userId),
          where('isActive', '==', true)
        )
      );

      const now = Timestamp.now();
      const daysPastDue = Math.floor((now.toMillis() - invoice.dueDate.toMillis()) / (1000 * 60 * 60 * 24));

      if (existingLateFees.empty) {
        // Create new late fee record
        const lateFee: Omit<LateFee, 'id'> = {
          invoiceId: invoice.id,
          userId: this.userId,
          type: lateFeeInfo.type,
          rate: this.config.lateFeeRate,
          baseAmount: invoice.total,
          calculatedAmount: lateFeeInfo.amount,
          maxAmount: invoice.total * this.config.maxLateFeePercentage,
          startDate: invoice.dueDate,
          calculationDate: now,
          daysPastDue,
          gracePeriodUsed: daysPastDue <= this.config.gracePeriodDays,
          isActive: true,
          isWaived: false,
          isPaid: false,
          createdAt: now,
          updatedAt: now
        };

        await addDoc(collection(db, COLLECTIONS.LATE_FEES), lateFee);
      } else {
        // Update existing late fee
        const existingDoc = existingLateFees.docs[0];
        await updateDoc(existingDoc.ref, {
          calculatedAmount: lateFeeInfo.amount,
          calculationDate: now,
          daysPastDue,
          updatedAt: now
        });
      }

    } catch (error) {
      console.error('Error creating/updating late fee:', error);
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get client-specific configuration
   */
  private getClientConfig(clientId: string): ReminderConfig {
    const override = this.config.clientOverrides.get(clientId);
    return { ...this.config, ...override };
  }

  /**
   * Generate reminder subject line
   */
  private generateReminderSubject(level: ReminderLevel, invoice: Invoice, daysPastDue: number): string {
    const baseSubject = `Payment Reminder: Invoice ${invoice.invoiceNumber}`;
    
    switch (level) {
      case 'gentle':
        return `${baseSubject} - Friendly Reminder`;
      case 'firm':
        return `${baseSubject} - Payment Past Due (${daysPastDue} days)`;
      case 'final':
        return `${baseSubject} - FINAL NOTICE (${daysPastDue} days overdue)`;
      case 'legal':
        return `${baseSubject} - LEGAL ACTION PENDING (${daysPastDue} days overdue)`;
      default:
        return baseSubject;
    }
  }

  /**
   * Adjust date for business days
   */
  private adjustForBusinessDays(date: Date): Date {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) { // Sunday
      date.setDate(date.getDate() + 1);
    } else if (dayOfWeek === 6) { // Saturday
      date.setDate(date.getDate() + 2);
    }
    return date;
  }

  /**
   * Format currency amount
   */
  private formatCurrency(amount: number, currency: CurrencyCode): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get due reminders
   */
  private async getDueReminders(currentDate: Date): Promise<PaymentReminder[]> {
    const q = query(
      collection(db, COLLECTIONS.PAYMENT_REMINDERS),
      where('userId', '==', this.userId),
      where('status', '==', 'scheduled'),
      where('scheduledDate', '<=', Timestamp.fromDate(currentDate)),
      orderBy('scheduledDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PaymentReminder[];
  }

  /**
   * Cancel reminder
   */
  private async cancelReminder(reminderId: string, reason: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.PAYMENT_REMINDERS, reminderId), {
      status: 'cancelled',
      updatedAt: Timestamp.now(),
      cancellationReason: reason
    });
  }

  /**
   * Pause reminder
   */
  private async pauseReminder(reminderId: string, reason: string): Promise<void> {
    // For now, we'll cancel the reminder. In a more sophisticated system,
    // we might reschedule it for a later date
    await this.cancelReminder(reminderId, `Paused: ${reason}`);
  }

  /**
   * Mark reminder as failed
   */
  private async markReminderFailed(reminderId: string, error: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.PAYMENT_REMINDERS, reminderId), {
      status: 'failed',
      updatedAt: Timestamp.now(),
      errorMessage: error
    });
  }

  /**
   * Get invoice by ID (simplified)
   */
  private async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    // This would typically call the InvoiceService
    // Simplified for this implementation
    try {
      const docRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId === this.userId) {
        return { id: docSnap.id, ...docSnap.data() } as Invoice;
      }
      return null;
    } catch (error) {
      console.error('Error getting invoice:', error);
      return null;
    }
  }

  /**
   * Get client by ID (simplified)
   */
  private async getClientById(clientId: string): Promise<Client | null> {
    try {
      const docRef = doc(db, COLLECTIONS.CLIENTS, clientId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId === this.userId) {
        return { id: docSnap.id, ...docSnap.data() } as Client;
      }
      return null;
    } catch (error) {
      console.error('Error getting client:', error);
      return null;
    }
  }
}

// ==================== SINGLETON FACTORY ====================

export const paymentReminderService = (userId: string, config?: Partial<ReminderConfig>) => 
  new PaymentReminderService(userId, config);

export default PaymentReminderService;