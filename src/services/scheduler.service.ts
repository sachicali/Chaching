/**
 * Scheduler Service - Phase 2 Email Automation
 * 
 * Handles scheduled email sending, queue management, and retry logic.
 * Integrates with Firebase Firestore for persistence and EmailService for delivery.
 * 
 * Features:
 * - Email queue management with priority levels
 * - Retry logic for failed emails
 * - Scheduled email processing
 * - Background job scheduling
 * - Error handling and logging
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EmailService } from './email.service';
import type {
  ScheduledEmail,
  EmailQueue,
  ScheduledEmailStatus,
  EmailPriority,
  EmailType,
  EmailData,
  ScheduledEmailFormData,
  Invoice
} from '@/types/database.types';

export class SchedulerService {
  private emailService: EmailService;
  private readonly COLLECTIONS = {
    SCHEDULED_EMAILS: 'scheduledEmails',
    EMAIL_QUEUE: 'emailQueue'
  } as const;

  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [5, 15, 60]; // minutes
  private readonly PRIORITIES: Record<EmailPriority, number> = {
    high: 1,
    normal: 2,
    low: 3
  };

  constructor(userId: string) {
    this.emailService = new EmailService(userId);
  }

  // ==================== SCHEDULED EMAIL MANAGEMENT ====================

  /**
   * Schedule an email for future delivery
   */
  async scheduleEmail(
    userId: string,
    emailData: ScheduledEmailFormData,
    templateVariables?: Record<string, string>
  ): Promise<string> {
    try {
      const scheduledEmail: Omit<ScheduledEmail, 'id'> = {
        userId,
        emailType: emailData.emailType,
        templateId: emailData.templateId,
        recipientEmail: emailData.recipientEmail,
        subject: emailData.customSubject || '',
        emailData: {
          to: [emailData.recipientEmail],
          message: {
            subject: emailData.customSubject || '',
            html: '',
            text: ''
          },
          template: {
            name: emailData.templateId,
            data: templateVariables || {}
          }
        },
        scheduledFor: Timestamp.fromDate(emailData.scheduledFor),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        priority: emailData.priority,
        status: 'pending',
        retryCount: 0,
        maxRetries: this.MAX_RETRIES,
        invoiceId: emailData.invoiceId,
        clientId: emailData.clientId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(
        collection(db, this.COLLECTIONS.SCHEDULED_EMAILS),
        scheduledEmail
      );

      // Add to processing queue if scheduled for immediate processing
      const now = new Date();
      const scheduledTime = emailData.scheduledFor;
      
      if (scheduledTime <= now) {
        await this.addToQueue(docRef.id, emailData.priority);
      }

      return docRef.id;

    } catch (error) {
      console.error('Error scheduling email:', error);
      throw new Error(`Failed to schedule email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get scheduled emails for a user
   */
  async getScheduledEmails(
    userId: string,
    options: {
      status?: ScheduledEmailStatus;
      emailType?: EmailType;
      limit?: number;
    } = {}
  ): Promise<ScheduledEmail[]> {
    try {
      let q = query(
        collection(db, this.COLLECTIONS.SCHEDULED_EMAILS),
        where('userId', '==', userId),
        orderBy('scheduledFor', 'desc')
      );

      if (options.status) {
        q = query(q, where('status', '==', options.status));
      }

      if (options.emailType) {
        q = query(q, where('emailType', '==', options.emailType));
      }

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduledEmail[];

    } catch (error) {
      console.error('Error getting scheduled emails:', error);
      throw new Error('Failed to get scheduled emails');
    }
  }

  /**
   * Cancel a scheduled email
   */
  async cancelScheduledEmail(scheduledEmailId: string): Promise<void> {
    try {
      await updateDoc(
        doc(db, this.COLLECTIONS.SCHEDULED_EMAILS, scheduledEmailId),
        {
          status: 'cancelled',
          updatedAt: Timestamp.now()
        }
      );

      // Remove from queue if exists
      await this.removeFromQueue(scheduledEmailId);

    } catch (error) {
      console.error('Error cancelling scheduled email:', error);
      throw new Error('Failed to cancel scheduled email');
    }
  }

  /**
   * Update scheduled email
   */
  async updateScheduledEmail(
    scheduledEmailId: string,
    updates: Partial<ScheduledEmail>
  ): Promise<void> {
    try {
      await updateDoc(
        doc(db, this.COLLECTIONS.SCHEDULED_EMAILS, scheduledEmailId),
        {
          ...updates,
          updatedAt: Timestamp.now()
        }
      );

    } catch (error) {
      console.error('Error updating scheduled email:', error);
      throw new Error('Failed to update scheduled email');
    }
  }

  // ==================== QUEUE MANAGEMENT ====================

  /**
   * Add email to processing queue
   */
  private async addToQueue(
    scheduledEmailId: string,
    priority: EmailPriority
  ): Promise<void> {
    try {
      const queueItem: Omit<EmailQueue, 'id'> = {
        userId: '', // Will be set from scheduled email
        scheduledEmailId,
        priority,
        status: 'queued',
        queuedAt: Timestamp.now()
      };

      await addDoc(collection(db, this.COLLECTIONS.EMAIL_QUEUE), queueItem);

    } catch (error) {
      console.error('Error adding to queue:', error);
      throw new Error('Failed to add to queue');
    }
  }

  /**
   * Remove email from processing queue
   */
  private async removeFromQueue(scheduledEmailId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.EMAIL_QUEUE),
        where('scheduledEmailId', '==', scheduledEmailId)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

    } catch (error) {
      console.error('Error removing from queue:', error);
      // Don't throw here as this is cleanup
    }
  }

  /**
   * Process email queue (called by background job)
   */
  async processQueue(): Promise<{
    processed: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Get queued emails ordered by priority
      const q = query(
        collection(db, this.COLLECTIONS.EMAIL_QUEUE),
        where('status', '==', 'queued'),
        orderBy('priority'),
        orderBy('queuedAt'),
        limit(10) // Process max 10 emails per batch
      );

      const queueSnapshot = await getDocs(q);

      for (const queueDoc of queueSnapshot.docs) {
        const queueItem = queueDoc.data() as EmailQueue;

        try {
          await this.processQueuedEmail(queueItem.scheduledEmailId);
          results.processed++;

          // Remove from queue
          await deleteDoc(queueDoc.ref);

        } catch (error) {
          console.error(`Error processing queued email ${queueItem.scheduledEmailId}:`, error);
          results.failed++;
          results.errors.push(error instanceof Error ? error.message : 'Unknown error');

          // Update queue item status
          await updateDoc(queueDoc.ref, {
            status: 'failed',
            processedAt: Timestamp.now()
          });
        }
      }

    } catch (error) {
      console.error('Error processing queue:', error);
      results.errors.push(error instanceof Error ? error.message : 'Queue processing error');
    }

    return results;
  }

  /**
   * Process a single queued email
   */
  private async processQueuedEmail(scheduledEmailId: string): Promise<void> {
    try {
      // Get scheduled email details
      const scheduledEmailDoc = await getDoc(
        doc(db, this.COLLECTIONS.SCHEDULED_EMAILS, scheduledEmailId)
      );

      if (!scheduledEmailDoc.exists()) {
        throw new Error('Scheduled email not found');
      }

      const scheduledEmail = {
        id: scheduledEmailDoc.id,
        ...scheduledEmailDoc.data()
      } as ScheduledEmail;

      // Check if email is still pending and ready to send
      if (scheduledEmail.status !== 'pending') {
        return; // Already processed or cancelled
      }

      const now = new Date();
      const scheduledTime = scheduledEmail.scheduledFor.toDate();

      if (scheduledTime > now) {
        return; // Not yet time to send
      }

      // Update status to processing
      await this.updateScheduledEmail(scheduledEmailId, {
        status: 'processing',
        lastAttempt: Timestamp.now()
      });

      // Send the email
      await this.sendScheduledEmail(scheduledEmail);

      // Update status to sent
      await this.updateScheduledEmail(scheduledEmailId, {
        status: 'sent',
        processedAt: Timestamp.now()
      });

    } catch (error) {
      console.error(`Error processing scheduled email ${scheduledEmailId}:`, error);
      
      // Handle retry logic
      await this.handleEmailFailure(scheduledEmailId, error as Error);
      
      throw error;
    }
  }

  /**
   * Send a scheduled email
   */
  private async sendScheduledEmail(scheduledEmail: ScheduledEmail): Promise<void> {
    try {
      switch (scheduledEmail.emailType) {
        case 'invoice':
          if (!scheduledEmail.invoiceId) {
            throw new Error('Invoice ID required for invoice emails');
          }
          await this.sendScheduledInvoiceEmail(scheduledEmail);
          break;
          
        case 'reminder':
          if (!scheduledEmail.invoiceId) {
            throw new Error('Invoice ID required for reminder emails');
          }
          await this.sendScheduledReminderEmail(scheduledEmail);
          break;
          
        case 'payment_confirmation':
          if (!scheduledEmail.invoiceId) {
            throw new Error('Invoice ID required for payment confirmation emails');
          }
          await this.sendScheduledPaymentConfirmation(scheduledEmail);
          break;
          
        default:
          throw new Error(`Unsupported email type: ${scheduledEmail.emailType}`);
      }

    } catch (error) {
      console.error('Error sending scheduled email:', error);
      throw error;
    }
  }

  /**
   * Send scheduled invoice email
   */
  private async sendScheduledInvoiceEmail(scheduledEmail: ScheduledEmail): Promise<void> {
    // This would require getting the invoice data
    // For now, we'll create a placeholder implementation
    throw new Error('Scheduled invoice email sending not yet implemented');
  }

  /**
   * Send scheduled reminder email
   */
  private async sendScheduledReminderEmail(scheduledEmail: ScheduledEmail): Promise<void> {
    // This would require getting the invoice data and determining reminder type
    // For now, we'll create a placeholder implementation
    throw new Error('Scheduled reminder email sending not yet implemented');
  }

  /**
   * Send scheduled payment confirmation email
   */
  private async sendScheduledPaymentConfirmation(scheduledEmail: ScheduledEmail): Promise<void> {
    // This would require getting the invoice and payment data
    // For now, we'll create a placeholder implementation
    throw new Error('Scheduled payment confirmation sending not yet implemented');
  }

  // ==================== RETRY LOGIC ====================

  /**
   * Handle email sending failure with retry logic
   */
  private async handleEmailFailure(
    scheduledEmailId: string,
    error: Error
  ): Promise<void> {
    try {
      const scheduledEmailDoc = await getDoc(
        doc(db, this.COLLECTIONS.SCHEDULED_EMAILS, scheduledEmailId)
      );

      if (!scheduledEmailDoc.exists()) {
        return;
      }

      const scheduledEmail = {
        id: scheduledEmailDoc.id,
        ...scheduledEmailDoc.data()
      } as ScheduledEmail;

      const newRetryCount = scheduledEmail.retryCount + 1;

      if (newRetryCount >= scheduledEmail.maxRetries) {
        // Max retries reached, mark as failed
        await this.updateScheduledEmail(scheduledEmailId, {
          status: 'failed',
          errorMessage: error.message,
          errorDetails: [
            ...(scheduledEmail.errorDetails || []),
            {
              code: 'MAX_RETRIES_EXCEEDED',
              message: error.message,
              timestamp: Timestamp.now()
            }
          ]
        });
      } else {
        // Schedule retry
        const retryDelay = this.RETRY_DELAYS[newRetryCount - 1] || 60; // Default to 60 minutes
        const nextAttempt = new Date();
        nextAttempt.setMinutes(nextAttempt.getMinutes() + retryDelay);

        await this.updateScheduledEmail(scheduledEmailId, {
          status: 'pending',
          retryCount: newRetryCount,
          nextAttempt: Timestamp.fromDate(nextAttempt),
          errorMessage: error.message,
          errorDetails: [
            ...(scheduledEmail.errorDetails || []),
            {
              code: 'RETRY_SCHEDULED',
              message: error.message,
              timestamp: Timestamp.now()
            }
          ]
        });

        // Add back to queue for retry
        await this.addToQueue(scheduledEmailId, scheduledEmail.priority);
      }

    } catch (retryError) {
      console.error('Error handling email failure:', retryError);
      // Mark as failed if we can't even handle the retry
      await this.updateScheduledEmail(scheduledEmailId, {
        status: 'failed',
        errorMessage: `Retry handling failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
      });
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    queued: number;
    processing: number;
    failed: number;
    byPriority: Record<EmailPriority, number>;
  }> {
    try {
      const q = query(collection(db, this.COLLECTIONS.EMAIL_QUEUE));
      const querySnapshot = await getDocs(q);

      const stats = {
        queued: 0,
        processing: 0,
        failed: 0,
        byPriority: {
          high: 0,
          normal: 0,
          low: 0
        } as Record<EmailPriority, number>
      };

      querySnapshot.docs.forEach(doc => {
        const queueItem = doc.data() as EmailQueue;
        
        switch (queueItem.status) {
          case 'queued':
            stats.queued++;
            break;
          case 'processing':
            stats.processing++;
            break;
          case 'failed':
            stats.failed++;
            break;
        }

        stats.byPriority[queueItem.priority]++;
      });

      return stats;

    } catch (error) {
      console.error('Error getting queue stats:', error);
      throw new Error('Failed to get queue statistics');
    }
  }

  /**
   * Clean up old processed queue items
   */
  async cleanupQueue(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const q = query(
        collection(db, this.COLLECTIONS.EMAIL_QUEUE),
        where('status', 'in', ['completed', 'failed']),
        where('processedAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return querySnapshot.size;

    } catch (error) {
      console.error('Error cleaning up queue:', error);
      throw new Error('Failed to cleanup queue');
    }
  }

  /**
   * Get scheduled emails ready for processing
   */
  async getEmailsReadyForProcessing(): Promise<string[]> {
    try {
      const now = Timestamp.now();
      
      const q = query(
        collection(db, this.COLLECTIONS.SCHEDULED_EMAILS),
        where('status', '==', 'pending'),
        where('scheduledFor', '<=', now)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.id);

    } catch (error) {
      console.error('Error getting emails ready for processing:', error);
      throw new Error('Failed to get emails ready for processing');
    }
  }
}

// ==================== EXPORT ====================

export default SchedulerService;

// Export utility functions for background job processing
export {
  // Export constants for external use
  type ScheduledEmail,
  type EmailQueue,
  type ScheduledEmailStatus,
  type EmailPriority
};