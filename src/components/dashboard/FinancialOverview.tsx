"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useTransactions, useTransactionAnalytics } from "@/contexts/TransactionContext";
import type { Transaction } from "@/types/database.types";
import { useMemo } from "react";

interface FinancialMetric {
  label: string;
  value: number;
  change: number;
  changePercent: string;
  trend: 'up' | 'down' | 'neutral';
}

interface FinancialOverviewProps {
  className?: string;
}

export function FinancialOverview({ className }: FinancialOverviewProps) {
  const { 
    transactions, 
    loading, 
    summary
  } = useTransactions();

  const { getMonthlyTotals } = useTransactionAnalytics();

  // Helper function to filter transactions by date range
  const getTransactionsByDateRange = (startDate: Date, endDate: Date): Transaction[] => {
    return transactions.filter(transaction => {
      const transactionDate = transaction.date.toDate();
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  const financialMetrics = useMemo(() => {
    if (!summary) return [];

    // Get current period (last 30 days) and previous period (30 days before that)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentPeriodTransactions = getTransactionsByDateRange(thirtyDaysAgo, now);
    const previousPeriodTransactions = getTransactionsByDateRange(sixtyDaysAgo, thirtyDaysAgo);

    // Calculate current period metrics
    const currentIncome = currentPeriodTransactions
      .filter((t: Transaction) => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + t.phpEquivalent, 0);
    
    const currentExpenses = currentPeriodTransactions
      .filter((t: Transaction) => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + t.phpEquivalent, 0);

    // Calculate previous period metrics
    const previousIncome = previousPeriodTransactions
      .filter((t: Transaction) => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + t.phpEquivalent, 0);
    
    const previousExpenses = previousPeriodTransactions
      .filter((t: Transaction) => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + t.phpEquivalent, 0);

    // Calculate changes
    const incomeChange = currentIncome - previousIncome;
    const expenseChange = currentExpenses - previousExpenses;
    const netProfitCurrent = currentIncome - currentExpenses;
    const netProfitPrevious = previousIncome - previousExpenses;
    const netProfitChange = netProfitCurrent - netProfitPrevious;
    
    // Calculate savings rate for current and previous periods
    const currentSavingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0;
    const previousSavingsRate = previousIncome > 0 ? ((previousIncome - previousExpenses) / previousIncome) * 100 : 0;
    const savingsRateChange = currentSavingsRate - previousSavingsRate;

    // Calculate percentage changes
    const getPercentageChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? "+∞%" : "0%";
      const percent = ((current - previous) / Math.abs(previous)) * 100;
      return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
    };

    const getTrend = (change: number): 'up' | 'down' | 'neutral' => {
      if (Math.abs(change) < 0.01) return 'neutral';
      return change > 0 ? 'up' : 'down';
    };

    const metrics: FinancialMetric[] = [
      {
        label: "Total Income",
        value: summary.totalIncome,
        change: incomeChange,
        changePercent: getPercentageChange(currentIncome, previousIncome),
        trend: getTrend(incomeChange)
      },
      {
        label: "Total Expenses",
        value: summary.totalExpenses,
        change: expenseChange,
        changePercent: getPercentageChange(currentExpenses, previousExpenses),
        trend: getTrend(expenseChange)
      },
      {
        label: "Net Profit",
        value: summary.netProfit,
        change: netProfitChange,
        changePercent: getPercentageChange(netProfitCurrent, netProfitPrevious),
        trend: getTrend(netProfitChange)
      },
      {
        label: "Savings Rate",
        value: currentSavingsRate,
        change: savingsRateChange,
        changePercent: `${savingsRateChange >= 0 ? '+' : ''}${savingsRateChange.toFixed(1)}%`,
        trend: getTrend(savingsRateChange)
      }
    ];

    return metrics;
  }, [summary, transactions]);

  const formatCurrency = (value: number): string => {
    return `₱${value.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeColor = (trend: 'up' | 'down' | 'neutral', isExpense: boolean = false): string => {
    if (trend === 'neutral') return 'text-muted-foreground';
    
    // For expenses, up is bad (red), down is good (green)
    if (isExpense) {
      return trend === 'up' ? 'text-destructive' : 'text-green-600';
    }
    
    // For income and profit, up is good (green), down is bad (red)
    return trend === 'up' ? 'text-green-600' : 'text-destructive';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'neutral') return null;
    return trend === 'up' ? TrendingUp : TrendingDown;
  };

  if (loading) {
    return (
      <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-4 ${className || ''}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-4 ${className || ''}`}>
      {financialMetrics.map((metric, index) => {
        const isExpense = metric.label === "Total Expenses";
        const TrendIcon = getTrendIcon(metric.trend);
        
        return (
          <Card key={metric.label} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {metric.label === "Savings Rate" 
                    ? formatPercentage(metric.value)
                    : formatCurrency(metric.value)
                  }
                </div>
                <div className={`flex items-center text-sm ${getChangeColor(metric.trend, isExpense)}`}>
                  {TrendIcon && <TrendIcon className="h-4 w-4 mr-1" />}
                  <span>{metric.changePercent}</span>
                  <span className="text-muted-foreground ml-1">vs last 30 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}