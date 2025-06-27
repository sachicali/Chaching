// Template Service - Chaching Financial Management Application
// This service handles all template-related operations for invoices and emails.

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
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { 
  InvoiceTemplate, 
  InvoiceTemplateFormData,
  EmailTemplate
} from '@/types/database.types';

const COLLECTIONS = {
  INVOICE_TEMPLATES: 'invoiceTemplates',
  EMAIL_TEMPLATES: 'emailTemplates'
} as const;

export class TemplateService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ==================== INVOICE TEMPLATE OPERATIONS ====================

  /**
   * Create a new invoice template
   */
  async createInvoiceTemplate(data: InvoiceTemplateFormData): Promise<InvoiceTemplate> {
    try {
      const templateData: Omit<InvoiceTemplate, 'id'> = {
        ...data,
        isDefault: false,
        usageCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: this.userId,
      };

      const docRef = await addDoc(
        collection(db, `users/${this.userId}/${COLLECTIONS.INVOICE_TEMPLATES}`),
        templateData
      );

      return {
        id: docRef.id,
        ...templateData,
      } as InvoiceTemplate;
    } catch (error) {
      console.error('Error creating invoice template:', error);
      throw new Error('Failed to create invoice template');
    }
  }

  /**
   * Get invoice template by ID
   */
  async getInvoiceTemplateById(templateId: string): Promise<InvoiceTemplate | null> {
    try {
      const docRef = doc(db, `users/${this.userId}/${COLLECTIONS.INVOICE_TEMPLATES}`, templateId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as InvoiceTemplate;
    } catch (error) {
      console.error('Error getting invoice template:', error);
      throw new Error('Failed to get invoice template');
    }
  }

  /**
   * Get all invoice templates for the user
   */
  async getInvoiceTemplates(): Promise<InvoiceTemplate[]> {
    try {
      const q = query(
        collection(db, `users/${this.userId}/${COLLECTIONS.INVOICE_TEMPLATES}`),
        orderBy('isDefault', 'desc'),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as InvoiceTemplate[];
    } catch (error) {
      console.error('Error getting invoice templates:', error);
      throw new Error('Failed to get invoice templates');
    }
  }

  /**
   * Update invoice template
   */
  async updateInvoiceTemplate(templateId: string, updates: Partial<InvoiceTemplateFormData>): Promise<InvoiceTemplate> {
    try {
      const existingTemplate = await this.getInvoiceTemplateById(templateId);
      if (!existingTemplate) {
        throw new Error('Invoice template not found');
      }

      const allowedUpdates: Partial<InvoiceTemplate> = { ...updates };
      allowedUpdates.updatedAt = Timestamp.now();

      const docRef = doc(db, `users/${this.userId}/${COLLECTIONS.INVOICE_TEMPLATES}`, templateId);
      await updateDoc(docRef, allowedUpdates);

      return {
        ...existingTemplate,
        ...allowedUpdates,
      } as InvoiceTemplate;
    } catch (error) {
      console.error('Error updating invoice template:', error);
      throw new Error('Failed to update invoice template');
    }
  }

  /**
   * Delete invoice template
   */
  async deleteInvoiceTemplate(templateId: string): Promise<void> {
    try {
      const template = await this.getInvoiceTemplateById(templateId);
      if (!template) {
        throw new Error('Invoice template not found');
      }
      if (template.isDefault) {
        throw new Error('Cannot delete a default template.');
      }

      const docRef = doc(db, `users/${this.userId}/${COLLECTIONS.INVOICE_TEMPLATES}`, templateId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting invoice template:', error);
      throw new Error('Failed to delete invoice template');
    }
  }

  /**
   * Set an invoice template as the default
   */
  async setDefaultInvoiceTemplate(templateId: string): Promise<void> {
    try {
      const templates = await this.getInvoiceTemplates();
      const batch = writeBatch(db);

      for (const template of templates) {
        const docRef = doc(db, `users/${this.userId}/${COLLECTIONS.INVOICE_TEMPLATES}`, template.id);
        if (template.id === templateId) {
          batch.update(docRef, { isDefault: true });
        } else if (template.isDefault) {
          batch.update(docRef, { isDefault: false });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error setting default invoice template:', error);
      throw new Error('Failed to set default invoice template');
    }
  }

  // ==================== EMAIL TEMPLATE OPERATIONS ====================

  /**
   * Create a new email template
   */
  async createEmailTemplate(data: {
    templateType: string;
    name: string;
    subject: string;
    htmlContent?: string;
    textContent?: string;
  }): Promise<EmailTemplate> {
    try {
      const templateData: Omit<EmailTemplate, 'id'> = {
        ...data,
        userId: this.userId,
        isDefault: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(
        collection(db, COLLECTIONS.EMAIL_TEMPLATES),
        templateData
      );

      return {
        id: docRef.id,
        ...templateData,
      } as EmailTemplate;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw new Error('Failed to create email template');
    }
  }

  /**
   * Get email template by ID
   */
  async getEmailTemplateById(templateId: string): Promise<EmailTemplate | null> {
    try {
      const docRef = doc(db, COLLECTIONS.EMAIL_TEMPLATES, templateId);
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
        ...data,
      } as EmailTemplate;
    } catch (error) {
      console.error('Error getting email template:', error);
      throw new Error('Failed to get email template');
    }
  }

  /**
   * Get email template by type
   */
  async getEmailTemplateByType(templateType: string): Promise<EmailTemplate | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.EMAIL_TEMPLATES),
        where('userId', '==', this.userId),
        where('templateType', '==', templateType),
        orderBy('isDefault', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as EmailTemplate;
    } catch (error) {
      console.error('Error getting email template by type:', error);
      return null;
    }
  }

  /**
   * Get all email templates for the user
   */
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.EMAIL_TEMPLATES),
        where('userId', '==', this.userId),
        orderBy('templateType', 'asc'),
        orderBy('isDefault', 'desc'),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailTemplate[];
    } catch (error) {
      console.error('Error getting email templates:', error);
      throw new Error('Failed to get email templates');
    }
  }

  /**
   * Update email template
   */
  async updateEmailTemplate(
    templateId: string, 
    updates: Partial<{
      name: string;
      subject: string;
      htmlContent: string;
      textContent: string;
    }>
  ): Promise<EmailTemplate> {
    try {
      const existingTemplate = await this.getEmailTemplateById(templateId);
      if (!existingTemplate) {
        throw new Error('Email template not found');
      }

      const allowedUpdates: Partial<EmailTemplate> = { ...updates };
      allowedUpdates.updatedAt = Timestamp.now();

      const docRef = doc(db, COLLECTIONS.EMAIL_TEMPLATES, templateId);
      await updateDoc(docRef, allowedUpdates);

      return {
        ...existingTemplate,
        ...allowedUpdates,
      } as EmailTemplate;
    } catch (error) {
      console.error('Error updating email template:', error);
      throw new Error('Failed to update email template');
    }
  }

  /**
   * Delete email template
   */
  async deleteEmailTemplate(templateId: string): Promise<void> {
    try {
      const template = await this.getEmailTemplateById(templateId);
      if (!template) {
        throw new Error('Email template not found');
      }
      if (template.isDefault) {
        throw new Error('Cannot delete a default email template.');
      }

      const docRef = doc(db, COLLECTIONS.EMAIL_TEMPLATES, templateId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting email template:', error);
      throw new Error('Failed to delete email template');
    }
  }

  /**
   * Set an email template as the default for its type
   */
  async setDefaultEmailTemplate(templateId: string): Promise<void> {
    try {
      const targetTemplate = await this.getEmailTemplateById(templateId);
      if (!targetTemplate) {
        throw new Error('Email template not found');
      }

      // Get all templates of the same type
      const q = query(
        collection(db, COLLECTIONS.EMAIL_TEMPLATES),
        where('userId', '==', this.userId),
        where('templateType', '==', targetTemplate.templateType)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      // Update all templates of this type
      for (const docSnapshot of querySnapshot.docs) {
        const docRef = doc(db, COLLECTIONS.EMAIL_TEMPLATES, docSnapshot.id);
        if (docSnapshot.id === templateId) {
          batch.update(docRef, { isDefault: true, updatedAt: Timestamp.now() });
        } else {
          batch.update(docRef, { isDefault: false, updatedAt: Timestamp.now() });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error setting default email template:', error);
      throw new Error('Failed to set default email template');
    }
  }

  // ==================== LEGACY COMPATIBILITY METHODS ====================

  /**
   * Legacy method for backward compatibility - maps to getInvoiceTemplateById
   */
  async getTemplateById(templateId: string): Promise<InvoiceTemplate | null> {
    return this.getInvoiceTemplateById(templateId);
  }

  /**
   * Legacy method for backward compatibility - maps to getInvoiceTemplates
   */
  async getTemplates(): Promise<InvoiceTemplate[]> {
    return this.getInvoiceTemplates();
  }

  /**
   * Legacy method for backward compatibility - maps to updateInvoiceTemplate
   */
  async updateTemplate(templateId: string, updates: Partial<InvoiceTemplateFormData>): Promise<InvoiceTemplate> {
    return this.updateInvoiceTemplate(templateId, updates);
  }

  /**
   * Legacy method for backward compatibility - maps to deleteInvoiceTemplate
   */
  async deleteTemplate(templateId: string): Promise<void> {
    return this.deleteInvoiceTemplate(templateId);
  }

  /**
   * Legacy method for backward compatibility - maps to setDefaultInvoiceTemplate
   */
  async setDefaultTemplate(templateId: string): Promise<void> {
    return this.setDefaultInvoiceTemplate(templateId);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Initialize default email templates for a new user
   */
  async initializeDefaultEmailTemplates(): Promise<void> {
    try {
      const existingTemplates = await this.getEmailTemplates();
      
      // Check if user already has templates
      if (existingTemplates.length > 0) {
        return;
      }

      const defaultTemplates = [
        {
          templateType: 'invoice_new',
          name: 'New Invoice Email',
          subject: 'Invoice {{invoiceNumber}} from {{businessName}}',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #7851A9;">Invoice {{invoiceNumber}}</h2>
              <p>Dear {{clientName}},</p>
              <p>Please find attached your invoice {{invoiceNumber}} for the amount of <strong>{{currency}} {{total}}</strong>.</p>
              <p>Payment is due by <strong>{{dueDate}}</strong>.</p>
              <p>Thank you for your business!</p>
              <br>
              <p>Best regards,<br>
              {{businessName}}</p>
            </div>
          `,
          textContent: `Invoice {{invoiceNumber}}

Dear {{clientName}},

Please find attached your invoice {{invoiceNumber}} for the amount of {{currency}} {{total}}.

Payment is due by {{dueDate}}.

Thank you for your business!

Best regards,
{{businessName}}`
        },
        {
          templateType: 'invoice_reminder',
          name: 'Payment Reminder',
          subject: 'Payment Reminder - Invoice {{invoiceNumber}}',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #F59E0B;">Payment Reminder</h2>
              <p>Dear {{clientName}},</p>
              <p>This is a friendly reminder that payment for Invoice {{invoiceNumber}} is now due.</p>
              <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Amount Due:</strong> {{currency}} {{total}}</p>
                <p><strong>Due Date:</strong> {{dueDate}}</p>
              </div>
              <p>If you have already made payment, please disregard this reminder.</p>
              <p>Thank you for your prompt attention to this matter.</p>
              <br>
              <p>Best regards,<br>
              {{businessName}}</p>
            </div>
          `,
          textContent: `Payment Reminder

Dear {{clientName}},

This is a friendly reminder that payment for Invoice {{invoiceNumber}} is now due.

Amount Due: {{currency}} {{total}}
Due Date: {{dueDate}}

If you have already made payment, please disregard this reminder.

Thank you for your prompt attention to this matter.

Best regards,
{{businessName}}`
        },
        {
          templateType: 'payment_confirmation',
          name: 'Payment Confirmation',
          subject: 'Payment Received - Invoice {{invoiceNumber}}',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10B981;">Payment Confirmation</h2>
              <p>Dear {{clientName}},</p>
              <p>Thank you! We have received your payment for Invoice {{invoiceNumber}}.</p>
              <div style="background-color: #ECFDF5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Payment Amount:</strong> {{currency}} {{paymentAmount}}</p>
                <p><strong>Payment Date:</strong> {{paymentDate}}</p>
              </div>
              <p>We appreciate your business and prompt payment.</p>
              <br>
              <p>Best regards,<br>
              {{businessName}}</p>
            </div>
          `,
          textContent: `Payment Confirmation

Dear {{clientName}},

Thank you! We have received your payment for Invoice {{invoiceNumber}}.

Payment Amount: {{currency}} {{paymentAmount}}
Payment Date: {{paymentDate}}

We appreciate your business and prompt payment.

Best regards,
{{businessName}}`
        }
      ];

      // Create default templates
      for (const templateData of defaultTemplates) {
        await this.createEmailTemplate({
          ...templateData,
        });
      }

      console.log('Default email templates initialized successfully');
    } catch (error) {
      console.error('Error initializing default email templates:', error);
      // Don't throw here as this is optional initialization
    }
  }

  /**
   * Get template counts by type
   */
  async getTemplateCounts(): Promise<{
    invoiceTemplates: number;
    emailTemplates: number;
    emailTemplatesByType: Record<string, number>;
  }> {
    try {
      const [invoiceTemplates, emailTemplates] = await Promise.all([
        this.getInvoiceTemplates(),
        this.getEmailTemplates()
      ]);

      const emailTemplatesByType: Record<string, number> = {};
      emailTemplates.forEach(template => {
        emailTemplatesByType[template.templateType] = (emailTemplatesByType[template.templateType] || 0) + 1;
      });

      return {
        invoiceTemplates: invoiceTemplates.length,
        emailTemplates: emailTemplates.length,
        emailTemplatesByType
      };
    } catch (error) {
      console.error('Error getting template counts:', error);
      throw new Error('Failed to get template counts');
    }
  }
}

export default TemplateService;