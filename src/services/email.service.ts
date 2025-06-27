// Email Service - Chaching Financial Management Application
// This service handles email automation with Firebase Extensions integration and PDF attachments

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { 
  Invoice, 
  EmailTemplate, 
  EmailHistory,
  EmailStatus,
  EmailAttachment,
  EmailData 
} from '@/types/database.types';

// ==================== CONSTANTS ====================

const COLLECTIONS = {
  MAIL: 'mail',
  EMAIL_TEMPLATES: 'emailTemplates',
  EMAIL_HISTORY: 'emailHistory'
} as const;

// Default email templates
const DEFAULT_EMAIL_TEMPLATES = {
  INVOICE_NEW: 'invoice_new',
  INVOICE_REMINDER: 'invoice_reminder', 
  INVOICE_OVERDUE: 'invoice_overdue',
  PAYMENT_CONFIRMATION: 'payment_confirmation'
} as const;

// Email delivery status tracking
const EMAIL_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  DELIVERED: 'delivered',
  FAILED: 'failed',
  BOUNCED: 'bounced'
} as const;

// ==================== EMAIL SERVICE ====================

export class EmailService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ==================== CORE EMAIL OPERATIONS ====================

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(
    invoice: Invoice,
    options: {
      templateType?: keyof typeof DEFAULT_EMAIL_TEMPLATES;
      customSubject?: string;
      customMessage?: string;
      recipientEmail?: string;
      ccEmails?: string[];
      bccEmails?: string[];
    } = {}
  ): Promise<{ emailId: string; status: EmailStatus }> {
    try {
      // Validate invoice has PDF
      if (!invoice.pdfUrl) {
        throw new Error('Invoice PDF must be generated before sending email');
      }

      // Get recipient email
      const recipientEmail = options.recipientEmail || invoice.clientEmail;
      if (!recipientEmail) {
        throw new Error('Recipient email is required');
      }

      // Get email template
      const templateType = options.templateType || 'INVOICE_NEW';
      const emailTemplate = await this.getEmailTemplate(templateType);
      
      // Generate email content
      const emailContent = await this.generateEmailContent(invoice, emailTemplate, {
        customSubject: options.customSubject,
        customMessage: options.customMessage
      });

      // Prepare attachment
      const attachment: EmailAttachment = {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        path: invoice.pdfUrl,
        contentType: 'application/pdf'
      };

      // Create email data for Firebase Extension
      const emailData: EmailData = {
        to: [recipientEmail],
        cc: options.ccEmails || [],
        bcc: options.bccEmails || [],
        message: {
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          attachments: [attachment]
        },
        template: {
          name: templateType,
          data: {
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.clientName,
            businessName: invoice.businessInfo.businessName,
            total: invoice.total.toFixed(2),
            currency: invoice.currency,
            dueDate: invoice.dueDate.toDate().toLocaleDateString(),
            invoiceUrl: invoice.pdfUrl
          }
        }
      };

      // Add metadata for tracking
      const mailDocument = {
        ...emailData,
        userId: this.userId,
        invoiceId: invoice.id,
        status: EMAIL_STATUS.PENDING,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Send to Firebase mail collection (triggers Extension)
      const mailRef = await addDoc(collection(db, COLLECTIONS.MAIL), mailDocument);
      
      // Create email history record
      await this.createEmailHistory({
        emailId: mailRef.id,
        invoiceId: invoice.id,
        recipientEmail,
        subject: emailContent.subject,
        templateType,
        status: EMAIL_STATUS.PENDING,
        sentAt: Timestamp.now(),
        attachments: [attachment]
      });

      return {
        emailId: mailRef.id,
        status: EMAIL_STATUS.PENDING as EmailStatus
      };

    } catch (error) {
      console.error('Error sending invoice email:', error);
      throw new Error(`Failed to send invoice email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send reminder email for overdue invoice
   */
  async sendReminderEmail(
    invoice: Invoice,
    reminderType: 'gentle' | 'firm' | 'final' = 'gentle'
  ): Promise<{ emailId: string; status: EmailStatus }> {
    try {
      const templateType = reminderType === 'final' 
        ? 'INVOICE_OVERDUE' 
        : 'INVOICE_REMINDER';

      const result = await this.sendInvoiceEmail(invoice, {
        templateType: templateType as keyof typeof DEFAULT_EMAIL_TEMPLATES,
        customSubject: this.generateReminderSubject(invoice, reminderType)
      });

      // Update invoice reminder tracking
      const reminderData = {
        type: reminderType,
        sentAt: Timestamp.now(),
        emailId: result.emailId
      };

      // This would be handled by InvoiceService, but we track here for completeness
      console.log(`Reminder sent for invoice ${invoice.invoiceNumber}:`, reminderData);

      return result;

    } catch (error) {
      console.error('Error sending reminder email:', error);
      throw new Error(`Failed to send reminder email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    invoice: Invoice,
    paymentAmount: number,
    paymentDate: Date
  ): Promise<{ emailId: string; status: EmailStatus }> {
    try {
      const emailTemplate = await this.getEmailTemplate('PAYMENT_CONFIRMATION');
      
      const emailContent = await this.generateEmailContent(invoice, emailTemplate, {
        customVariables: {
          paymentAmount: paymentAmount.toFixed(2),
          paymentDate: paymentDate.toLocaleDateString(),
          remainingBalance: Math.max(0, invoice.total - paymentAmount).toFixed(2)
        }
      });

      const emailData: EmailData = {
        to: [invoice.clientEmail],
        message: {
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        },
        template: {
          name: 'PAYMENT_CONFIRMATION',
          data: {
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.clientName,
            businessName: invoice.businessInfo.businessName,
            paymentAmount: paymentAmount.toFixed(2),
            paymentDate: paymentDate.toLocaleDateString()
          }
        }
      };

      const mailDocument = {
        ...emailData,
        userId: this.userId,
        invoiceId: invoice.id,
        status: EMAIL_STATUS.PENDING,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const mailRef = await addDoc(collection(db, COLLECTIONS.MAIL), mailDocument);
      
      await this.createEmailHistory({
        emailId: mailRef.id,
        invoiceId: invoice.id,
        recipientEmail: invoice.clientEmail,
        subject: emailContent.subject,
        templateType: 'PAYMENT_CONFIRMATION',
        status: EMAIL_STATUS.PENDING,
        sentAt: Timestamp.now()
      });

      return {
        emailId: mailRef.id,
        status: EMAIL_STATUS.PENDING as EmailStatus
      };

    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      throw new Error(`Failed to send payment confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==================== EMAIL TEMPLATE OPERATIONS ====================

  /**
   * Get email template by type
   */
  private async getEmailTemplate(templateType: string): Promise<EmailTemplate | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.EMAIL_TEMPLATES),
        where('userId', '==', this.userId),
        where('templateType', '==', templateType)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return this.getDefaultEmailTemplate(templateType);
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as EmailTemplate;

    } catch (error) {
      console.error('Error getting email template:', error);
      return this.getDefaultEmailTemplate(templateType);
    }
  }

  /**
   * Get default email template for fallback
   */
  private getDefaultEmailTemplate(templateType: string): EmailTemplate {
    const defaultTemplates: Record<string, EmailTemplate> = {
      INVOICE_NEW: {
        id: 'default-invoice-new',
        userId: this.userId,
        templateType: 'INVOICE_NEW',
        name: 'New Invoice',
        subject: 'Invoice {{invoiceNumber}} from {{businessName}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Invoice {{invoiceNumber}}</h2>
            <p>Dear {{clientName}},</p>
            <p>Please find attached your invoice {{invoiceNumber}} for the amount of {{currency}} {{total}}.</p>
            <p>Payment is due by {{dueDate}}.</p>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>{{businessName}}</p>
          </div>
        `,
        textContent: `Invoice {{invoiceNumber}}\n\nDear {{clientName}},\n\nPlease find attached your invoice {{invoiceNumber}} for the amount of {{currency}} {{total}}.\n\nPayment is due by {{dueDate}}.\n\nThank you for your business!\n\nBest regards,\n{{businessName}}`,
        isDefault: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      INVOICE_REMINDER: {
        id: 'default-invoice-reminder',
        userId: this.userId,
        templateType: 'INVOICE_REMINDER',
        name: 'Payment Reminder',
        subject: 'Payment Reminder - Invoice {{invoiceNumber}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Reminder</h2>
            <p>Dear {{clientName}},</p>
            <p>This is a friendly reminder that payment for Invoice {{invoiceNumber}} is now due.</p>
            <p><strong>Amount Due:</strong> {{currency}} {{total}}</p>
            <p><strong>Due Date:</strong> {{dueDate}}</p>
            <p>If you have already made payment, please disregard this reminder.</p>
            <p>Thank you for your prompt attention to this matter.</p>
            <p>Best regards,<br>{{businessName}}</p>
          </div>
        `,
        textContent: `Payment Reminder\n\nDear {{clientName}},\n\nThis is a friendly reminder that payment for Invoice {{invoiceNumber}} is now due.\n\nAmount Due: {{currency}} {{total}}\nDue Date: {{dueDate}}\n\nIf you have already made payment, please disregard this reminder.\n\nThank you for your prompt attention to this matter.\n\nBest regards,\n{{businessName}}`,
        isDefault: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      PAYMENT_CONFIRMATION: {
        id: 'default-payment-confirmation',
        userId: this.userId,
        templateType: 'PAYMENT_CONFIRMATION',
        name: 'Payment Confirmation',
        subject: 'Payment Received - Invoice {{invoiceNumber}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Confirmation</h2>
            <p>Dear {{clientName}},</p>
            <p>Thank you! We have received your payment for Invoice {{invoiceNumber}}.</p>
            <p><strong>Payment Amount:</strong> {{currency}} {{paymentAmount}}</p>
            <p><strong>Payment Date:</strong> {{paymentDate}}</p>
            <p>We appreciate your business and prompt payment.</p>
            <p>Best regards,<br>{{businessName}}</p>
          </div>
        `,
        textContent: `Payment Confirmation\n\nDear {{clientName}},\n\nThank you! We have received your payment for Invoice {{invoiceNumber}}.\n\nPayment Amount: {{currency}} {{paymentAmount}}\nPayment Date: {{paymentDate}}\n\nWe appreciate your business and prompt payment.\n\nBest regards,\n{{businessName}}`,
        isDefault: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    };

    return defaultTemplates[templateType] || defaultTemplates.INVOICE_NEW;
  }

  // ==================== EMAIL CONTENT GENERATION ====================

  /**
   * Generate email content from template
   */
  private async generateEmailContent(
    invoice: Invoice,
    template: EmailTemplate | null,
    options: {
      customSubject?: string;
      customMessage?: string;
      customVariables?: Record<string, string>;
    } = {}
  ): Promise<{ subject: string; html: string; text: string }> {
    const actualTemplate = template || this.getDefaultEmailTemplate('INVOICE_NEW');
    
    // Template variables
    const variables = {
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      businessName: invoice.businessInfo.businessName,
      total: invoice.total.toFixed(2),
      currency: invoice.currency,
      dueDate: invoice.dueDate.toDate().toLocaleDateString(),
      issueDate: invoice.issueDate.toDate().toLocaleDateString(),
      ...options.customVariables
    };

    // Replace template variables
    const subject = options.customSubject || this.replaceVariables(actualTemplate.subject, variables);
    const html = options.customMessage || this.replaceVariables(actualTemplate.htmlContent || '', variables);
    const text = this.replaceVariables(actualTemplate.textContent || '', variables);

    return { subject, html, text };
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });

    return result;
  }

  /**
   * Generate reminder subject based on type
   */
  private generateReminderSubject(invoice: Invoice, reminderType: string): string {
    const baseSubject = `Invoice ${invoice.invoiceNumber}`;
    
    switch (reminderType) {
      case 'gentle':
        return `Friendly Reminder - ${baseSubject}`;
      case 'firm': 
        return `Payment Reminder - ${baseSubject}`;
      case 'final':
        return `URGENT: Final Notice - ${baseSubject}`;
      default:
        return `Payment Reminder - ${baseSubject}`;
    }
  }

  // ==================== EMAIL HISTORY TRACKING ====================

  /**
   * Create email history record
   */
  private async createEmailHistory(data: {
    emailId: string;
    invoiceId: string;
    recipientEmail: string;
    subject: string;
    templateType: string;
    status: EmailStatus;
    sentAt: Timestamp;
    attachments?: EmailAttachment[];
  }): Promise<void> {
    try {
      const historyData: Omit<EmailHistory, 'id'> = {
        ...data,
        userId: this.userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, COLLECTIONS.EMAIL_HISTORY), historyData);
    } catch (error) {
      console.error('Error creating email history:', error);
      // Don't throw here to avoid breaking email send flow
    }
  }

  /**
   * Get email history for invoice
   */
  async getEmailHistory(invoiceId: string): Promise<EmailHistory[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.EMAIL_HISTORY),
        where('userId', '==', this.userId),
        where('invoiceId', '==', invoiceId),
        orderBy('sentAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailHistory[];

    } catch (error) {
      console.error('Error getting email history:', error);
      throw new Error('Failed to get email history');
    }
  }

  /**
   * Update email status (called by Firebase Extension or webhooks)
   */
  async updateEmailStatus(
    emailId: string, 
    status: EmailStatus,
    metadata?: {
      deliveredAt?: Timestamp;
      openedAt?: Timestamp;
      errorMessage?: string;
    }
  ): Promise<void> {
    try {
      const updateData: Record<string, Timestamp | string | EmailStatus> = {
        status,
        updatedAt: Timestamp.now()
      };

      if (metadata?.deliveredAt) {
        updateData.deliveredAt = metadata.deliveredAt;
      }
      if (metadata?.openedAt) {
        updateData.openedAt = metadata.openedAt;
      }
      if (metadata?.errorMessage) {
        updateData.errorMessage = metadata.errorMessage;
      }

      // Update mail collection document
      await updateDoc(doc(db, COLLECTIONS.MAIL, emailId), updateData);

      // Update email history
      const historyQuery = query(
        collection(db, COLLECTIONS.EMAIL_HISTORY),
        where('emailId', '==', emailId)
      );
      
      const historySnapshot = await getDocs(historyQuery);
      
      if (!historySnapshot.empty) {
        const historyDoc = historySnapshot.docs[0];
        await updateDoc(historyDoc.ref, updateData);
      }

    } catch (error) {
      console.error('Error updating email status:', error);
      throw new Error('Failed to update email status');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Validate email address format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get supported email template types
   */
  static getEmailTemplateTypes(): readonly string[] {
    return Object.values(DEFAULT_EMAIL_TEMPLATES);
  }

  /**
   * Get email status options
   */
  static getEmailStatuses(): readonly string[] {
    return Object.values(EMAIL_STATUS);
  }
}

// ==================== EXPORT ====================

export default EmailService;

// Export utility constants
export {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_STATUS
};