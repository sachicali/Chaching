/**
 * Email Analytics Service - Phase 2 Email Automation
 * 
 * Handles email performance tracking, analytics collection, and reporting.
 * Integrates with Firebase Firestore for data persistence and aggregation.
 * 
 * Features:
 * - Email delivery analytics and performance metrics
 * - Template performance tracking
 * - Campaign analytics and reporting
 * - Real-time metrics aggregation
 * - Email engagement tracking
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  EmailAnalytics,
  EmailHistory,
  EmailReport,
  EmailCampaign,
  EmailTemplatePerformanceMetrics,
  EmailType,
  EmailPriority
} from '@/types/database.types';

export class EmailAnalyticsService {
  private readonly COLLECTIONS = {
    EMAIL_ANALYTICS: 'emailAnalytics',
    EMAIL_HISTORY: 'emailHistory',
    EMAIL_REPORTS: 'emailReports',
    EMAIL_CAMPAIGNS: 'emailCampaigns',
    EMAIL_TEMPLATES: 'emailTemplates'
  } as const;

  constructor(private userId: string) {}

  // ==================== ANALYTICS TRACKING ====================

  /**
   * Record email analytics data
   */
  async recordEmailAnalytics(data: {
    emailHistoryId: string;
    emailType: EmailType;
    templateId: string;
    templateVersion?: number;
    recipientEmail: string;
    sentAt: Timestamp;
    invoiceId?: string;
    clientId?: string;
    userAgent?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    country?: string;
    city?: string;
  }): Promise<string> {
    try {
      const analyticsData: Omit<EmailAnalytics, 'id'> = {
        userId: this.userId,
        emailHistoryId: data.emailHistoryId,
        emailType: data.emailType,
        templateId: data.templateId,
        templateVersion: data.templateVersion,
        recipientEmail: data.recipientEmail,
        sentAt: data.sentAt,
        openCount: 0,
        clickCount: 0,
        timesToOpen: [],
        timesToClick: [],
        bounced: false,
        spamComplaint: false,
        unsubscribed: false,
        userAgent: data.userAgent,
        deviceType: data.deviceType,
        country: data.country,
        city: data.city,
        invoiceId: data.invoiceId,
        clientId: data.clientId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(
        collection(db, this.COLLECTIONS.EMAIL_ANALYTICS),
        analyticsData
      );

      return docRef.id;

    } catch (error) {
      console.error('Error recording email analytics:', error);
      throw new Error(`Failed to record email analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Record email delivery event
   */
  async recordDelivery(emailHistoryId: string, deliveredAt: Timestamp): Promise<void> {
    try {
      await this.updateEmailAnalytics(emailHistoryId, {
        deliveredAt,
        updatedAt: Timestamp.now()
      });

    } catch (error) {
      console.error('Error recording email delivery:', error);
      throw new Error('Failed to record email delivery');
    }
  }

  /**
   * Record email open event
   */
  async recordOpen(
    emailHistoryId: string,
    openedAt: Timestamp,
    metadata?: {
      userAgent?: string;
      deviceType?: 'desktop' | 'mobile' | 'tablet';
      country?: string;
      city?: string;
    }
  ): Promise<void> {
    try {
      const analytics = await this.getEmailAnalytics(emailHistoryId);
      if (!analytics) {
        console.warn(`Analytics not found for email ${emailHistoryId}`);
        return;
      }

      const timeToOpen = openedAt.toMillis() - analytics.sentAt.toMillis();
      const isFirstOpen = !analytics.firstOpenedAt;

      const updateData: Partial<EmailAnalytics> = {
        openedAt,
        openCount: analytics.openCount + 1,
        timesToOpen: [...analytics.timesToOpen, timeToOpen],
        updatedAt: Timestamp.now()
      };

      if (isFirstOpen) {
        updateData.firstOpenedAt = openedAt;
      }

      updateData.lastOpenedAt = openedAt;

      if (metadata) {
        updateData.userAgent = metadata.userAgent || analytics.userAgent;
        updateData.deviceType = metadata.deviceType || analytics.deviceType;
        updateData.country = metadata.country || analytics.country;
        updateData.city = metadata.city || analytics.city;
      }

      await this.updateEmailAnalytics(emailHistoryId, updateData);

      // Update template performance metrics
      await this.updateTemplateMetrics(analytics.templateId, 'open');

    } catch (error) {
      console.error('Error recording email open:', error);
      throw new Error('Failed to record email open');
    }
  }

  /**
   * Record email click event
   */
  async recordClick(
    emailHistoryId: string,
    clickedAt: Timestamp,
    metadata?: {
      userAgent?: string;
      deviceType?: 'desktop' | 'mobile' | 'tablet';
      country?: string;
      city?: string;
    }
  ): Promise<void> {
    try {
      const analytics = await this.getEmailAnalytics(emailHistoryId);
      if (!analytics) {
        console.warn(`Analytics not found for email ${emailHistoryId}`);
        return;
      }

      const timeToClick = clickedAt.toMillis() - analytics.sentAt.toMillis();
      const isFirstClick = !analytics.firstClickedAt;

      const updateData: Partial<EmailAnalytics> = {
        clickedAt,
        clickCount: analytics.clickCount + 1,
        timesToClick: [...analytics.timesToClick, timeToClick],
        updatedAt: Timestamp.now()
      };

      if (isFirstClick) {
        updateData.firstClickedAt = clickedAt;
      }

      updateData.lastClickedAt = clickedAt;

      if (metadata) {
        updateData.userAgent = metadata.userAgent || analytics.userAgent;
        updateData.deviceType = metadata.deviceType || analytics.deviceType;
        updateData.country = metadata.country || analytics.country;
        updateData.city = metadata.city || analytics.city;
      }

      await this.updateEmailAnalytics(emailHistoryId, updateData);

      // Update template performance metrics
      await this.updateTemplateMetrics(analytics.templateId, 'click');

    } catch (error) {
      console.error('Error recording email click:', error);
      throw new Error('Failed to record email click');
    }
  }

  /**
   * Record email bounce event
   */
  async recordBounce(
    emailHistoryId: string,
    bounceReason: string,
    bounceType: 'hard' | 'soft'
  ): Promise<void> {
    try {
      await this.updateEmailAnalytics(emailHistoryId, {
        bounced: true,
        bounceReason,
        bounceType,
        updatedAt: Timestamp.now()
      });

      // Update template performance metrics
      const analytics = await this.getEmailAnalytics(emailHistoryId);
      if (analytics) {
        await this.updateTemplateMetrics(analytics.templateId, 'bounce');
      }

    } catch (error) {
      console.error('Error recording email bounce:', error);
      throw new Error('Failed to record email bounce');
    }
  }

  /**
   * Record spam complaint event
   */
  async recordSpamComplaint(emailHistoryId: string): Promise<void> {
    try {
      await this.updateEmailAnalytics(emailHistoryId, {
        spamComplaint: true,
        updatedAt: Timestamp.now()
      });

    } catch (error) {
      console.error('Error recording spam complaint:', error);
      throw new Error('Failed to record spam complaint');
    }
  }

  /**
   * Record unsubscribe event
   */
  async recordUnsubscribe(emailHistoryId: string): Promise<void> {
    try {
      await this.updateEmailAnalytics(emailHistoryId, {
        unsubscribed: true,
        updatedAt: Timestamp.now()
      });

    } catch (error) {
      console.error('Error recording unsubscribe:', error);
      throw new Error('Failed to record unsubscribe');
    }
  }

  // ==================== ANALYTICS RETRIEVAL ====================

  /**
   * Get email analytics by email history ID
   */
  async getEmailAnalytics(emailHistoryId: string): Promise<EmailAnalytics | null> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.EMAIL_ANALYTICS),
        where('userId', '==', this.userId),
        where('emailHistoryId', '==', emailHistoryId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as EmailAnalytics;

    } catch (error) {
      console.error('Error getting email analytics:', error);
      throw new Error('Failed to get email analytics');
    }
  }

  /**
   * Get analytics for multiple emails
   */
  async getEmailAnalyticsBatch(emailHistoryIds: string[]): Promise<EmailAnalytics[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.EMAIL_ANALYTICS),
        where('userId', '==', this.userId),
        where('emailHistoryId', 'in', emailHistoryIds.slice(0, 10)) // Firestore limit
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailAnalytics[];

    } catch (error) {
      console.error('Error getting email analytics batch:', error);
      throw new Error('Failed to get email analytics batch');
    }
  }

  // ==================== PERFORMANCE METRICS ====================

  /**
   * Get overall email performance metrics
   */
  async getOverallMetrics(
    dateRange?: {
      startDate: Date;
      endDate: Date;
    }
  ): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  }> {
    try {
      let q = query(
        collection(db, this.COLLECTIONS.EMAIL_ANALYTICS),
        where('userId', '==', this.userId)
      );

      if (dateRange) {
        q = query(
          q,
          where('sentAt', '>=', Timestamp.fromDate(dateRange.startDate)),
          where('sentAt', '<=', Timestamp.fromDate(dateRange.endDate))
        );
      }

      const querySnapshot = await getDocs(q);
      const analytics = querySnapshot.docs.map(doc => doc.data() as EmailAnalytics);

      const totalSent = analytics.length;
      const totalDelivered = analytics.filter(a => a.deliveredAt).length;
      const totalOpened = analytics.filter(a => a.openCount > 0).length;
      const totalClicked = analytics.filter(a => a.clickCount > 0).length;
      const totalBounced = analytics.filter(a => a.bounced).length;

      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
      const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
      const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

      return {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalBounced,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100
      };

    } catch (error) {
      console.error('Error getting overall metrics:', error);
      throw new Error('Failed to get overall metrics');
    }
  }

  /**
   * Get metrics by email type
   */
  async getMetricsByEmailType(): Promise<Record<EmailType, {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  }>> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.EMAIL_ANALYTICS),
        where('userId', '==', this.userId)
      );

      const querySnapshot = await getDocs(q);
      const analytics = querySnapshot.docs.map(doc => doc.data() as EmailAnalytics);

      const metricsByType: Record<string, any> = {};

      // Group by email type
      analytics.forEach(a => {
        if (!metricsByType[a.emailType]) {
          metricsByType[a.emailType] = {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0
          };
        }

        const metrics = metricsByType[a.emailType];
        metrics.sent++;
        if (a.deliveredAt) metrics.delivered++;
        if (a.openCount > 0) metrics.opened++;
        if (a.clickCount > 0) metrics.clicked++;
        if (a.bounced) metrics.bounced++;
      });

      // Calculate rates
      Object.keys(metricsByType).forEach(type => {
        const metrics = metricsByType[type];
        metrics.deliveryRate = metrics.sent > 0 ? (metrics.delivered / metrics.sent) * 100 : 0;
        metrics.openRate = metrics.delivered > 0 ? (metrics.opened / metrics.delivered) * 100 : 0;
        metrics.clickRate = metrics.delivered > 0 ? (metrics.clicked / metrics.delivered) * 100 : 0;
        metrics.bounceRate = metrics.sent > 0 ? (metrics.bounced / metrics.sent) * 100 : 0;
      });

      return metricsByType as Record<EmailType, any>;

    } catch (error) {
      console.error('Error getting metrics by email type:', error);
      throw new Error('Failed to get metrics by email type');
    }
  }

  /**
   * Get template performance metrics
   */
  async getTemplateMetrics(templateId: string): Promise<EmailTemplatePerformanceMetrics | null> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.EMAIL_ANALYTICS),
        where('userId', '==', this.userId),
        where('templateId', '==', templateId)
      );

      const querySnapshot = await getDocs(q);
      const analytics = querySnapshot.docs.map(doc => doc.data() as EmailAnalytics);

      if (analytics.length === 0) {
        return null;
      }

      const sentCount = analytics.length;
      const deliveredCount = analytics.filter(a => a.deliveredAt).length;
      const openedCount = analytics.filter(a => a.openCount > 0).length;
      const clickedCount = analytics.filter(a => a.clickCount > 0).length;
      const bounceCount = analytics.filter(a => a.bounced).length;

      const deliveryRate = sentCount > 0 ? (deliveredCount / sentCount) * 100 : 0;
      const openRate = deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0;
      const clickRate = deliveredCount > 0 ? (clickedCount / deliveredCount) * 100 : 0;
      const bounceRate = sentCount > 0 ? (bounceCount / sentCount) * 100 : 0;

      return {
        sentCount,
        deliveredCount,
        openedCount,
        clickedCount,
        bounceCount,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        lastUpdated: Timestamp.now()
      };

    } catch (error) {
      console.error('Error getting template metrics:', error);
      throw new Error('Failed to get template metrics');
    }
  }

  // ==================== REPORTING ====================

  /**
   * Generate email report
   */
  async generateReport(
    reportType: 'daily' | 'weekly' | 'monthly' | 'custom',
    dateRange: {
      startDate: Date;
      endDate: Date;
    }
  ): Promise<string> {
    try {
      const overallMetrics = await this.getOverallMetrics(dateRange);
      const metricsByType = await this.getMetricsByEmailType();
      
      // Get top performing templates
      const topTemplates = await this.getTopPerformingTemplates(5);
      
      // Get top engaging clients (if available)
      const topClients = await this.getTopEngagingClients(5);

      const reportData: Omit<EmailReport, 'id'> = {
        userId: this.userId,
        reportType,
        startDate: Timestamp.fromDate(dateRange.startDate),
        endDate: Timestamp.fromDate(dateRange.endDate),
        totalEmailsSent: overallMetrics.totalSent,
        totalEmailsDelivered: overallMetrics.totalDelivered,
        totalEmailsOpened: overallMetrics.totalOpened,
        totalEmailsClicked: overallMetrics.totalClicked,
        totalEmailsBounced: overallMetrics.totalBounced,
        deliveryRate: overallMetrics.deliveryRate,
        openRate: overallMetrics.openRate,
        clickRate: overallMetrics.clickRate,
        bounceRate: overallMetrics.bounceRate,
        metricsByType,
        topPerformingTemplates: topTemplates,
        topEngagingClients: topClients,
        generatedAt: Timestamp.now(),
        generatedBy: this.userId
      };

      const docRef = await addDoc(
        collection(db, this.COLLECTIONS.EMAIL_REPORTS),
        reportData
      );

      return docRef.id;

    } catch (error) {
      console.error('Error generating email report:', error);
      throw new Error('Failed to generate email report');
    }
  }

  /**
   * Get top performing templates
   */
  async getTopPerformingTemplates(limit: number = 5): Promise<Array<{
    templateId: string;
    templateName: string;
    sent: number;
    openRate: number;
    clickRate: number;
  }>> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.EMAIL_ANALYTICS),
        where('userId', '==', this.userId)
      );

      const querySnapshot = await getDocs(q);
      const analytics = querySnapshot.docs.map(doc => doc.data() as EmailAnalytics);

      // Group by template
      const templateStats: Record<string, {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
      }> = {};

      analytics.forEach(a => {
        if (!templateStats[a.templateId]) {
          templateStats[a.templateId] = {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0
          };
        }

        const stats = templateStats[a.templateId];
        stats.sent++;
        if (a.deliveredAt) stats.delivered++;
        if (a.openCount > 0) stats.opened++;
        if (a.clickCount > 0) stats.clicked++;
      });

      // Calculate rates and sort
      const templateMetrics = Object.entries(templateStats)
        .map(([templateId, stats]) => ({
          templateId,
          templateName: `Template ${templateId}`, // Would need to fetch actual name
          sent: stats.sent,
          openRate: stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0,
          clickRate: stats.delivered > 0 ? (stats.clicked / stats.delivered) * 100 : 0
        }))
        .sort((a, b) => b.openRate - a.openRate)
        .slice(0, limit);

      return templateMetrics;

    } catch (error) {
      console.error('Error getting top performing templates:', error);
      return [];
    }
  }

  /**
   * Get top engaging clients
   */
  async getTopEngagingClients(limit: number = 5): Promise<Array<{
    clientId: string;
    clientName: string;
    emailsSent: number;
    openRate: number;
    clickRate: number;
  }>> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.EMAIL_ANALYTICS),
        where('userId', '==', this.userId),
        where('clientId', '!=', null)
      );

      const querySnapshot = await getDocs(q);
      const analytics = querySnapshot.docs.map(doc => doc.data() as EmailAnalytics)
        .filter(a => a.clientId); // Only include emails with client ID

      // Group by client
      const clientStats: Record<string, {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
      }> = {};

      analytics.forEach(a => {
        if (!a.clientId || !clientStats[a.clientId]) {
          if (a.clientId) {
            clientStats[a.clientId] = {
              sent: 0,
              delivered: 0,
              opened: 0,
              clicked: 0
            };
          }
        }

        if (a.clientId) {
          const stats = clientStats[a.clientId];
          stats.sent++;
          if (a.deliveredAt) stats.delivered++;
          if (a.openCount > 0) stats.opened++;
          if (a.clickCount > 0) stats.clicked++;
        }
      });

      // Calculate rates and sort
      const clientMetrics = Object.entries(clientStats)
        .map(([clientId, stats]) => ({
          clientId,
          clientName: `Client ${clientId}`, // Would need to fetch actual name
          emailsSent: stats.sent,
          openRate: stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0,
          clickRate: stats.delivered > 0 ? (stats.clicked / stats.delivered) * 100 : 0
        }))
        .sort((a, b) => b.openRate - a.openRate)
        .slice(0, limit);

      return clientMetrics;

    } catch (error) {
      console.error('Error getting top engaging clients:', error);
      return [];
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Update email analytics record
   */
  private async updateEmailAnalytics(
    emailHistoryId: string,
    updates: Partial<EmailAnalytics>
  ): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.EMAIL_ANALYTICS),
        where('userId', '==', this.userId),
        where('emailHistoryId', '==', emailHistoryId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        await updateDoc(doc.ref, updates);
      }

    } catch (error) {
      console.error('Error updating email analytics:', error);
      throw new Error('Failed to update email analytics');
    }
  }

  /**
   * Update template performance metrics
   */
  private async updateTemplateMetrics(
    templateId: string,
    eventType: 'open' | 'click' | 'bounce'
  ): Promise<void> {
    try {
      // This would update the template's performance metrics
      // Implementation depends on how templates are stored
      console.log(`Template ${templateId} ${eventType} event recorded`);

    } catch (error) {
      console.error('Error updating template metrics:', error);
      // Don't throw here as this is a secondary operation
    }
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldAnalytics(olderThanDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const q = query(
        collection(db, this.COLLECTIONS.EMAIL_ANALYTICS),
        where('userId', '==', this.userId),
        where('sentAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return querySnapshot.size;

    } catch (error) {
      console.error('Error cleaning up old analytics:', error);
      throw new Error('Failed to cleanup old analytics');
    }
  }
}

// ==================== EXPORT ====================

export default EmailAnalyticsService;

// Export types for external use
export type {
  EmailAnalytics,
  EmailReport,
  EmailTemplatePerformanceMetrics
};