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

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { cn } from '@/lib/utils';
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
  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, []);

  /**
   * Load financial data and calculate metrics
   */
  const loadFinancialData = useCallback(async () => {
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
  }, [user?.uid, startDate, endDate]);

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
        trend: metrics.revenueGrowth > 0 ? 'up' : metrics.revenueGrowth < 0 ? 'down' : 'stable'
      },
      {
        id: 'profit',
        title: 'Net Profit',
        value: `₱${metrics.netProfit.toLocaleString()}`,
        change: metrics.profitMargin,
        changeLabel: 'profit margin',
        icon: <TrendingUp className="h-4 w-4" />,
        trend: metrics.netProfit >= 0 ? 'up' : 'down'
      },
      {
        id: 'expenses',
        title: 'Total Expenses',
        value: `₱${metrics.expenses.toLocaleString()}`,
        change: metrics.expenseRatio,
        changeLabel: 'of revenue',
        icon: <BarChart3 className="h-4 w-4" />,
        trend: metrics.expenseRatio > 70 ? 'down' : 'stable'
      },
      {
        id: 'transactions',
        title: 'Transactions',
        value: metrics.transactionCount.toString(),
        change: metrics.avgTransactionValue,
        changeLabel: 'avg value',
        icon: <PieChart className="h-4 w-4" />,
        trend: 'stable'
      },
      {
        id: 'monthly-recurring',
        title: 'Monthly Revenue',
        value: `₱${metrics.monthlyRecurring.toLocaleString()}`,
        change: metrics.revenueGrowth,
        changeLabel: 'growth rate',
        icon: <Calendar className="h-4 w-4" />,
        trend: metrics.revenueGrowth > 0 ? 'up' : 'down'
      },
      {
        id: 'top-category',
        title: 'Top Category',
        value: metrics.topCategory,
        change: 0,
        changeLabel: 'primary source',
        icon: <Target className="h-4 w-4" />,
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
        return <TrendingUp className="h-3 w-3 text-success" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />;
    }
  };


  // Load data on component mount
  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-6 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadFinancialData} variant="outline">
            Try Again
          </Button>
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
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Financial Overview
          </h2>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Business performance for the last 30 days
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSummary}
            disabled={isExporting}
            className="hover:bg-muted/50"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadFinancialData}
            className="hover:bg-muted/50"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Clean KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => (
          <Card 
            key={kpi.id} 
            className="group cursor-pointer animate-fade-in-up"
            style={{ animationDelay: `${kpiCards.indexOf(kpi) * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center transition-all duration-200 group-hover:bg-primary/10">
                  <div className="text-muted-foreground group-hover:text-primary transition-colors duration-200">
                    {kpi.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider truncate">
                    {kpi.title}
                  </h3>
                </div>
                <div className="flex items-center">
                  {getTrendIcon(kpi.trend)}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xl font-bold text-foreground">
                  {kpi.value}
                </p>
                {kpi.change !== 0 && (
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs px-2 py-0.5",
                        kpi.trend === 'up' && "bg-success/10 text-success border-success/20",
                        kpi.trend === 'down' && "bg-destructive/10 text-destructive border-destructive/20",
                        kpi.trend === 'stable' && "bg-muted text-muted-foreground"
                      )}
                    >
                      {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                    </Badge>
                    <span className="text-xs text-muted-foreground/60">
                      {kpi.changeLabel}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Statistics */}
      <Card className="hover:shadow-lg hover:shadow-black/10 hover:scale-[1.01] transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Period Summary
          </CardTitle>
          <CardDescription>
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Sources */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Revenue Sources
              </h4>
              <div className="space-y-2">
                {businessSummary.topCategories
                  .filter(cat => cat.type === 'income')
                  .slice(0, 3)
                  .map((category, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                      <span className="text-sm text-muted-foreground">
                        {category.category}
                      </span>
                      <span className="font-medium text-foreground">
                        ₱{category.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Expenses */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Top Expenses
              </h4>
              <div className="space-y-2">
                {businessSummary.topCategories
                  .filter(cat => cat.type === 'expense')
                  .slice(0, 3)
                  .map((category, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                      <span className="text-sm text-muted-foreground">
                        {category.category}
                      </span>
                      <span className="font-medium text-foreground">
                        ₱{category.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Currency Distribution */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Currency Mix
              </h4>
              <div className="space-y-2">
                {businessSummary.currencyBreakdown.slice(0, 3).map((currency, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm text-muted-foreground">
                      {currency.currency}
                    </span>
                    <div className="text-right">
                      <div className="font-medium text-foreground">
                        ₱{currency.phpEquivalent.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground/60">
                        {currency.percentage.toFixed(1)}%
                      </div>
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