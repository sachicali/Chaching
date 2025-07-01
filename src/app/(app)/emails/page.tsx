/**
 * Email Hub - Phase 1 Email Management UI
 * 
 * Central dashboard for email automation management, providing overview
 * of email performance, quick actions, and status monitoring.
 * 
 * User Stories: Email Management UI Phase 1
 * Dependencies: EmailContext, existing UI patterns, Phase 2 email services
 * Architecture: Following FinancialOverview patterns with email-specific features
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  Clock, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Eye,
  RefreshCw,
  Plus,
  BarChart3,
  Zap
} from 'lucide-react';
import { useEmail } from '@/contexts/EmailContext';

// ============================================================================
// EMAIL HUB DASHBOARD COMPONENT
// ============================================================================

export default function EmailHubPage() {
  const {
    performanceMetrics,
    queueStats,
    emailHistory,
    scheduledEmails,
    loading,
    error,
    refreshData
  } = useEmail();

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Hub</h1>
            <p className="text-muted-foreground">Loading email management dashboard...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Hub</h1>
            <p className="text-muted-foreground">Email management dashboard</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refreshData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Email Hub
          </h1>
          <p className="text-muted-foreground">
            Manage your email automation and monitor performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Quick Send
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium text-sm">Total Sent</h3>
              </div>
              <TrendingUp className="h-3 w-3 text-green-500" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">
                {performanceMetrics?.totalSent ?? 0}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {performanceMetrics?.deliveryRate.toFixed(1) ?? 0}%
                </Badge>
                <span className="text-xs text-gray-600">delivery rate</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open Rate */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <h3 className="font-medium text-sm">Open Rate</h3>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">
                {performanceMetrics?.openRate.toFixed(1) ?? 0}%
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {performanceMetrics?.totalOpened ?? 0}
                </Badge>
                <span className="text-xs text-gray-600">total opens</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Click Rate */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <h3 className="font-medium text-sm">Click Rate</h3>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">
                {performanceMetrics?.clickRate.toFixed(1) ?? 0}%
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {performanceMetrics?.totalClicked ?? 0}
                </Badge>
                <span className="text-xs text-gray-600">total clicks</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Status */}
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <h3 className="font-medium text-sm">Queue Status</h3>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">
                {queueStats?.queued ?? 0}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {queueStats?.processing ?? 0}
                </Badge>
                <span className="text-xs text-gray-600">processing</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common email operations and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Send Invoice Email
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Schedule Email
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Send Payment Reminder
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Recent Email Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest email sends and opens
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailHistory.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No email activity yet</p>
                <Button size="sm" variant="outline">
                  Send Your First Email
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {emailHistory.slice(0, 5).map((email) => (
                  <div key={email.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm truncate">
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-600">
                        To: {email.recipientEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={email.status === 'delivered' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {email.status}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">
                        {email.sentAt.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Emails */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Emails
            </CardTitle>
            <CardDescription>
              Upcoming scheduled email sends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledEmails.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No scheduled emails</p>
                <Button size="sm" variant="outline">
                  Schedule an Email
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledEmails.slice(0, 5).map((email) => (
                  <div key={email.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm truncate">
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-600">
                        To: {email.recipientEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={email.status === 'pending' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {email.status}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">
                        {email.scheduledFor.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Overview
          </CardTitle>
          <CardDescription>
            Email performance metrics for the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Delivery Performance */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Send className="h-4 w-4" />
                Delivery Performance
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Delivered</span>
                  <span className="font-medium">{performanceMetrics?.totalDelivered ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bounced</span>
                  <span className="font-medium">{performanceMetrics?.totalBounced ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rate</span>
                  <span className="font-medium">{performanceMetrics?.deliveryRate.toFixed(1) ?? 0}%</span>
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Engagement Metrics
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Opens</span>
                  <span className="font-medium">{performanceMetrics?.totalOpened ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Clicks</span>
                  <span className="font-medium">{performanceMetrics?.totalClicked ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Engagement</span>
                  <span className="font-medium">
                    {((performanceMetrics?.totalOpened ?? 0) + (performanceMetrics?.totalClicked ?? 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Queue Health */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Queue Health
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-medium">{queueStats?.queued ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Processing</span>
                  <span className="font-medium">{queueStats?.processing ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed</span>
                  <span className="font-medium text-red-600">{queueStats?.failed ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}