"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { EmailService } from '@/services/email.service';
import { EmailAnalyticsService } from '@/services/email-analytics.service';
import { SchedulerService } from '@/services/scheduler.service';
import type { 
  EmailTemplate, 
  EmailHistory, 
  ScheduledEmail,
  EmailAnalytics,
  ScheduledEmailStatus,
  EmailPriority,
  EmailType
} from '@/types/database.types';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface QueueStatistics {
  queued: number;
  processing: number;
  failed: number;
  byPriority: Record<EmailPriority, number>;
}

interface PerformanceMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface EmailContextType {
  // State
  emailTemplates: EmailTemplate[];
  emailHistory: EmailHistory[];
  scheduledEmails: ScheduledEmail[];
  queueStats: QueueStatistics | null;
  performanceMetrics: PerformanceMetrics | null;
  loading: boolean;
  error: string | null;

  // Email Operations
  sendQuickEmail: (data: QuickEmailData) => Promise<void>;
  scheduleEmail: (data: ScheduledEmailData) => Promise<void>;
  
  // Template Management
  getEmailTemplates: () => Promise<void>;
  
  // Analytics & Reporting
  getPerformanceMetrics: (dateRange?: DateRange) => Promise<void>;
  getQueueStatistics: () => Promise<void>;
  
  // History & Tracking
  getEmailHistory: (options?: EmailHistoryOptions) => Promise<void>;
  getScheduledEmails: () => Promise<void>;
  
  // Utility
  refreshData: () => Promise<void>;
}

interface QuickEmailData {
  to: string;
  subject: string;
  message: string;
  templateId?: string;
  priority?: EmailPriority;
}

interface ScheduledEmailData {
  to: string;
  subject: string;
  message: string;
  templateId?: string;
  scheduledFor: Date;
  priority?: EmailPriority;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface EmailHistoryOptions {
  limit?: number;
  offset?: number;
  emailType?: EmailType;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// EMAIL CONTEXT
// ============================================================================

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailProvider = ({ children }: { children: ReactNode }) => {
  // State Management
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStatistics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dependencies
  const { user } = useAuth();
  const { toast } = useToast();

  // Service Instances
  const emailService = user?.uid ? new EmailService(user.uid) : null;
  const analyticsService = user?.uid ? new EmailAnalyticsService(user.uid) : null;
  const schedulerService = user?.uid ? new SchedulerService(user.uid) : null;

  // ============================================================================
  // EMAIL OPERATIONS
  // ============================================================================

  /**
   * Send a quick email immediately
   */
  const sendQuickEmail = useCallback(async (data: QuickEmailData) => {
    if (!user?.uid || !emailService) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to send emails.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For Phase 1, we'll use a basic email sending approach
      // This would typically integrate with a more comprehensive email sending system
      
      toast({
        title: "Email Sending",
        description: `Sending email to ${data.to}...`,
      });

      // Simulate email sending for Phase 1
      // In a real implementation, this would call the email service
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Email Sent",
        description: `Email successfully sent to ${data.to}`,
      });

      // Refresh email history
      await getEmailHistory();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
      setError(errorMessage);
      toast({
        title: "Error Sending Email",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.uid, emailService, toast]);

  /**
   * Schedule an email for later delivery
   */
  const scheduleEmail = useCallback(async (data: ScheduledEmailData) => {
    if (!user?.uid || !schedulerService) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to schedule emails.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const scheduledEmailData = {
        emailType: 'custom' as EmailType,
        templateId: data.templateId || 'default',
        recipientEmail: data.to,
        scheduledFor: data.scheduledFor,
        priority: data.priority || 'normal',
        customSubject: data.subject
      };

      const result = await schedulerService.scheduleEmail(user.uid, scheduledEmailData);

      if (result) {
        toast({
          title: "Email Scheduled",
          description: `Email scheduled for ${data.scheduledFor.toLocaleString()}`,
        });

        // Refresh scheduled emails
        await getScheduledEmails();
      } else {
        throw new Error('Failed to schedule email');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule email';
      setError(errorMessage);
      toast({
        title: "Error Scheduling Email",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.uid, schedulerService, toast]);

  // ============================================================================
  // DATA LOADING OPERATIONS
  // ============================================================================

  /**
   * Load email templates
   */
  const getEmailTemplates = useCallback(async () => {
    if (!user?.uid) return;

    try {
      // For Phase 1, we'll use mock data
      // In a real implementation, this would call the template service
      const mockTemplates: EmailTemplate[] = [
        {
          id: 'invoice-new',
          userId: user.uid,
          templateType: 'INVOICE_NEW',
          name: 'New Invoice',
          subject: 'Invoice {{invoiceNumber}} from {{businessName}}',
          htmlContent: '<p>Please find your invoice attached.</p>',
          textContent: 'Please find your invoice attached.',
          isDefault: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        }
      ];

      setEmailTemplates(mockTemplates);
      
    } catch (err) {
      console.error('Error loading email templates:', err);
      setError('Failed to load email templates');
    }
  }, [user?.uid]);

  /**
   * Get performance metrics
   */
  const getPerformanceMetrics = useCallback(async (dateRange?: DateRange) => {
    if (!user?.uid || !analyticsService) return;

    try {
      setLoading(true);

      const endDate = dateRange?.endDate || new Date();
      const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const metrics = await analyticsService.getOverallMetrics({
        startDate,
        endDate
      });

      setPerformanceMetrics(metrics);

    } catch (err) {
      console.error('Error loading performance metrics:', err);
      setError('Failed to load performance metrics');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, analyticsService]);

  /**
   * Get queue statistics
   */
  const getQueueStatistics = useCallback(async () => {
    if (!user?.uid || !schedulerService) return;

    try {
      const stats = await schedulerService.getQueueStats();
      setQueueStats(stats);

    } catch (err) {
      console.error('Error loading queue statistics:', err);
      setError('Failed to load queue statistics');
    }
  }, [user?.uid, schedulerService]);

  /**
   * Get email history
   */
  const getEmailHistory = useCallback(async (options?: EmailHistoryOptions) => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // For Phase 1, use mock data
      // In a real implementation, this would call the email service
      const mockHistory: EmailHistory[] = [
        {
          id: 'history-1',
          userId: user.uid,
          emailId: 'email-1',
          invoiceId: 'invoice-1',
          recipientEmail: 'client@example.com',
          subject: 'Invoice INV-001 from Chaching Business',
          templateType: 'INVOICE_NEW',
          templateId: 'invoice-new',
          status: 'delivered',
          sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000) as any,
          deliveredAt: new Date(Date.now() - 23 * 60 * 60 * 1000) as any,
          emailType: 'invoice',
          priority: 'normal',
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        }
      ];

      setEmailHistory(mockHistory);

    } catch (err) {
      console.error('Error loading email history:', err);
      setError('Failed to load email history');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  /**
   * Get scheduled emails
   */
  const getScheduledEmails = useCallback(async () => {
    if (!user?.uid || !schedulerService) return;

    try {
      const result = await schedulerService.getScheduledEmails(user.uid, {
        limit: 50
      });

      setScheduledEmails(result);

    } catch (err) {
      console.error('Error loading scheduled emails:', err);
      setError('Failed to load scheduled emails');
    }
  }, [user?.uid, schedulerService]);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    await Promise.all([
      getEmailTemplates(),
      getEmailHistory(),
      getScheduledEmails(),
      getPerformanceMetrics(),
      getQueueStatistics()
    ]);
  }, [getEmailTemplates, getEmailHistory, getScheduledEmails, getPerformanceMetrics, getQueueStatistics]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  // Initialize data when user is available
  useEffect(() => {
    if (user?.uid) {
      refreshData();
    } else {
      // Clear data when user is not available
      setEmailTemplates([]);
      setEmailHistory([]);
      setScheduledEmails([]);
      setQueueStats(null);
      setPerformanceMetrics(null);
      setError(null);
    }
  }, [user?.uid, refreshData]);

  // ============================================================================
  // CONTEXT PROVIDER
  // ============================================================================

  return (
    <EmailContext.Provider value={{
      // State
      emailTemplates,
      emailHistory,
      scheduledEmails,
      queueStats,
      performanceMetrics,
      loading,
      error,

      // Email Operations
      sendQuickEmail,
      scheduleEmail,

      // Data Operations
      getEmailTemplates,
      getPerformanceMetrics,
      getQueueStatistics,
      getEmailHistory,
      getScheduledEmails,
      refreshData
    }}>
      {children}
    </EmailContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
};

export default EmailProvider;