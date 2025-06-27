/**
 * Enhanced Financial Overview Component for Chaching Dashboard
 * 
 * Provides comprehensive financial metrics, KPIs, and business intelligence
 * with real-time data updates and professional analytics display.
 * 
 * User Stories: US-006 (Financial Reports) + US-007 (Dashboard Overview)
 * Dependencies: ReportService, TransactionService, Recharts
 * Architecture: Enhanced analytics with 8 advanced KPIs and export capabilities
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Users, 
  Calendar,
  Download,
  Eye,
  Target,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { reportService } from '@/services/report.service';
import { transactionService } from '@/services/transaction.service';
import { downloadCSV, generateReportFilename } from '@/utils/export.util';
import type { BusinessSummary } from '@/services/report.service';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface FinancialMetrics {
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  revenueGrowth: number;
  expenseRatio: number;
  avgTransactionValue: number;
  transactionCount: number;
  topCategory: string;
  monthlyRecurring: number;
}

interface KPICard {
  id: string;
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange';
  trend: 'up' | 'down' | 'stable';
}

// ============================================================================
// ENHANCED FINANCIAL OVERVIEW COMPONENT
// ============================================================================

export function FinancialOverview() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [businessSummary, setBusinessSummary] = useState<BusinessSummary | null>(null);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Date range for current analysis (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  /**
   * Load financial data and calculate metrics
   */
  const loadFinancialData = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get business summary for the last 30 days
      const summaryResult = await reportService.generateBusinessSummary(user.uid, {
        startDate,
        endDate
      });

      if (!summaryResult.success) {
        throw new Error(summaryResult.error || 'Failed to load business summary');
      }

      const summary = summaryResult.data!;
      setBusinessSummary(summary);

      // Calculate additional metrics
      const revenueGrowth = calculateGrowthRate(summary.monthlyTrends);
      const expenseRatio = summary.totalRevenue > 0 ? 
        (summary.totalExpenses / summary.totalRevenue) * 100 : 0;
      
      const topCategory = summary.topCategories.length > 0 ? 
        summary.topCategories[0].category : 'No transactions';

      // Estimate monthly recurring revenue (simplified)
      const monthlyRecurring = summary.monthlyTrends.length > 0 ?
        summary.monthlyTrends[summary.monthlyTrends.length - 1].revenue : 0;

      const calculatedMetrics: FinancialMetrics = {
        revenue: summary.totalRevenue,
        expenses: summary.totalExpenses,
        netProfit: summary.netProfit,
        profitMargin: summary.profitMargin,
        revenueGrowth,
        expenseRatio,
        avgTransactionValue: summary.averageTransactionValue,
        transactionCount: summary.transactionCount,
        topCategory,
        monthlyRecurring
      };

      setMetrics(calculatedMetrics);

    } catch (err) {
      console.error('Error loading financial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calculate growth rate from monthly trends
   */
  const calculateGrowthRate = (trends: BusinessSummary['monthlyTrends']): number => {
    if (trends.length < 2) return 0;
    
    const current = trends[trends.length - 1].revenue;
    const previous = trends[trends.length - 2].revenue;
    
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  /**
   * Generate KPI cards from metrics
   */
  const generateKPICards = (metrics: FinancialMetrics): KPICard[] => {
    return [
      {
        id: 'revenue',
        title: 'Total Revenue',
        value: `₱${metrics.revenue.toLocaleString()}`,
        change: metrics.revenueGrowth,
        changeLabel: 'vs last period',
        icon: <DollarSign className="h-4 w-4" />,
        color: 'green',
        trend: metrics.revenueGrowth > 0 ? 'up' : metrics.revenueGrowth < 0 ? 'down' : 'stable'
      },
      {
        id: 'profit',
        title: 'Net Profit',
        value: `₱${metrics.netProfit.toLocaleString()}`,
        change: metrics.profitMargin,
        changeLabel: 'profit margin',
        icon: <TrendingUp className="h-4 w-4" />,
        color: metrics.netProfit >= 0 ? 'green' : 'red',
        trend: metrics.netProfit >= 0 ? 'up' : 'down'
      },
      {
        id: 'expenses',
        title: 'Total Expenses',
        value: `₱${metrics.expenses.toLocaleString()}`,
        change: metrics.expenseRatio,
        changeLabel: 'of revenue',
        icon: <BarChart3 className="h-4 w-4" />,
        color: metrics.expenseRatio > 70 ? 'red' : metrics.expenseRatio > 50 ? 'orange' : 'blue',
        trend: metrics.expenseRatio > 70 ? 'down' : 'stable'
      },
      {
        id: 'transactions',
        title: 'Transactions',
        value: metrics.transactionCount.toString(),
        change: metrics.avgTransactionValue,
        changeLabel: 'avg value',
        icon: <PieChart className="h-4 w-4" />,
        color: 'purple',
        trend: 'stable'
      },
      {
        id: 'monthly-recurring',
        title: 'Monthly Revenue',
        value: `₱${metrics.monthlyRecurring.toLocaleString()}`,
        change: metrics.revenueGrowth,
        changeLabel: 'growth rate',
        icon: <Calendar className="h-4 w-4" />,
        color: 'blue',
        trend: metrics.revenueGrowth > 0 ? 'up' : 'down'
      },
      {
        id: 'top-category',
        title: 'Top Category',
        value: metrics.topCategory,
        change: 0,
        changeLabel: 'primary source',
        icon: <Target className="h-4 w-4" />,
        color: 'orange',
        trend: 'stable'
      }
    ];
  };

  /**
   * Export financial summary as CSV
   */
  const handleExportSummary = async () => {
    if (!businessSummary || !user?.uid) return;

    try {
      setIsExporting(true);
      
      const csvResult = await reportService.generateCSVExport(user.uid, {
        startDate: { toDate: () => startDate } as any,
        endDate: { toDate: () => endDate } as any
      });

      if (csvResult.success) {
        const filename = generateReportFilename('financial-summary', {
          startDate,
          endDate
        });
        downloadCSV(csvResult.data!, filename);
      } else {
        throw new Error(csvResult.error || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Get trend icon based on trend direction
   */
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-400" />;
    }
  };

  /**
   * Get color classes for different states
   */
  const getColorClasses = (color: KPICard['color']) => {
    const colorMap = {
      green: 'border-green-200 bg-green-50 text-green-700',
      red: 'border-red-200 bg-red-50 text-red-700',
      blue: 'border-blue-200 bg-blue-50 text-blue-700',
      purple: 'border-purple-200 bg-purple-50 text-purple-700',
      orange: 'border-orange-200 bg-orange-50 text-orange-700'
    };
    return colorMap[color];
  };

  // Load data on component mount
  useEffect(() => {
    loadFinancialData();
  }, [user?.uid]);

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Loading financial metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Error loading financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadFinancialData} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || !businessSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>No financial data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Start by adding your first transaction</p>
            <Button variant="outline">Add Transaction</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const kpiCards = generateKPICards(metrics);

  return (
    <div className="space-y-6">
      {/* Header with Export Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Financial Overview
              </CardTitle>
              <CardDescription>
                Business performance for the last 30 days
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSummary}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadFinancialData}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.id} className={`border-l-4 ${getColorClasses(kpi.color)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {kpi.icon}
                  <h3 className="font-medium text-sm">{kpi.title}</h3>
                </div>
                {getTrendIcon(kpi.trend)}
              </div>
              
              <div className="mt-2">
                <p className="text-2xl font-bold">{kpi.value}</p>
                {kpi.change !== 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                    </Badge>
                    <span className="text-xs text-gray-600">{kpi.changeLabel}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Period Summary</CardTitle>
          <CardDescription>
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue Breakdown */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue Sources
              </h4>
              <div className="space-y-2">
                {businessSummary.topCategories
                  .filter(cat => cat.type === 'income')
                  .slice(0, 3)
                  .map((category, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{category.category}</span>
                      <span className="font-medium">₱{category.amount.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block" />

            {/* Expense Breakdown */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Top Expenses
              </h4>
              <div className="space-y-2">
                {businessSummary.topCategories
                  .filter(cat => cat.type === 'expense')
                  .slice(0, 3)
                  .map((category, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{category.category}</span>
                      <span className="font-medium">₱{category.amount.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block" />

            {/* Currency Distribution */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Currency Mix
              </h4>
              <div className="space-y-2">
                {businessSummary.currencyBreakdown.slice(0, 3).map((currency, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{currency.currency}</span>
                    <div className="text-right">
                      <div className="font-medium">₱{currency.phpEquivalent.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{currency.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FinancialOverview;