"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer
} from 'recharts';
import { useTransactions, useTransactionAnalytics } from "@/contexts/TransactionContext";
import type { Transaction } from "@/types/database.types";
import { useMemo } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  netProfit: number;
}

interface RevenueChartProps {
  className?: string;
  showExpenses?: boolean;
  showNetProfit?: boolean;
  monthsToShow?: number;
}

const chartConfig = {
  income: { 
    label: "Income", 
    color: "hsl(var(--chart-2))" 
  },
  expenses: { 
    label: "Expenses", 
    color: "hsl(var(--chart-1))" 
  },
  netProfit: { 
    label: "Net Profit", 
    color: "hsl(var(--chart-3))" 
  }
};

export function RevenueChart({ 
  className, 
  showExpenses = true, 
  showNetProfit = false,
  monthsToShow = 6 
}: RevenueChartProps) {
  const { transactions, loading } = useTransactions();
  const { getMonthlyTotals } = useTransactionAnalytics();

  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const now = new Date();
    const data: MonthlyData[] = [];

    // Generate data for the last N months
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1; // getMonth() returns 0-11

      const monthlyData = getMonthlyTotals(year, month);
      
      data.push({
        month: targetDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: monthlyData.income,
        expenses: monthlyData.expenses,
        netProfit: monthlyData.netProfit
      });
    }

    return data;
  }, [transactions, getMonthlyTotals, monthsToShow]);

  const hasData = chartData.length > 0 && chartData.some(d => d.income > 0 || d.expenses > 0);

  const formatCurrency = (value: number): string => {
    return `₱${(value / 1000).toFixed(1)}k`;
  };

  const formatTooltipValue = (value: number): string => {
    return `₱${value.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  if (loading) {
    return (
      <Card className={cn(
        "relative overflow-hidden border-0 bg-gradient-to-br from-background/60 to-background/40",
        "backdrop-blur-xl shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 hover:scale-[1.01] transition-all duration-300",
        className
      )}>
        <div className="absolute inset-0 bg-gradient-to-r from-muted/20 to-muted/10" />
        <CardHeader className="relative z-10 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              Revenue Trends
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 flex justify-center items-center h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className={cn(
        "relative overflow-hidden border-0 bg-gradient-to-br from-background/60 to-background/40",
        "backdrop-blur-xl shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 hover:scale-[1.01] transition-all duration-300",
        className
      )}>
        <div className="absolute inset-0 bg-gradient-to-r from-muted/20 to-muted/10" />
        <CardHeader className="relative z-10 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              Revenue Trends
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 flex flex-col justify-center items-center h-[300px] text-center">
          <p className="text-muted-foreground/80 mb-6 font-medium">
            No revenue data to display for the chart.
          </p>
          <div className="flex gap-3">
            <Link href="/income">
              <Button className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200">
                Add Income
              </Button>
            </Link>
            <Link href="/expenses">
              <Button 
                variant="outline" 
                className="rounded-xl border-border/40 bg-background/50 backdrop-blur hover:bg-muted/50 hover:border-border/60 transition-all duration-200"
              >
                Add Expense
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden border-0 bg-gradient-to-br from-background/60 to-background/40",
      "backdrop-blur-xl shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 hover:scale-[1.01] transition-all duration-300",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-r from-muted/20 to-muted/10" />
      <CardHeader className="relative z-10 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Revenue Trends
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 p-6">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid 
                vertical={false} 
                stroke="hsl(var(--border))" 
                strokeDasharray="3 0" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={formatCurrency}
              />
              <ChartTooltip
                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  
                  return (
                    <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-xl p-3 shadow-2xl shadow-black/10">
                      <p className="font-bold text-foreground mb-2">{label}</p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div 
                            className="w-3 h-3 rounded-full shadow-sm" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-muted-foreground font-medium">{entry.name}:</span>
                          <span className="font-bold text-foreground">
                            {formatTooltipValue(entry.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              
              {/* Income Line */}
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="rgb(34, 197, 94)" 
                strokeWidth={3} 
                dot={false} 
                activeDot={{ r: 6, fill: "rgb(34, 197, 94)", strokeWidth: 2, stroke: "white" }} 
                name="Income"
              />
              
              {/* Expenses Line */}
              {showExpenses && (
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="rgb(239, 68, 68)" 
                  strokeWidth={3} 
                  dot={false} 
                  activeDot={{ r: 6, fill: "rgb(239, 68, 68)", strokeWidth: 2, stroke: "white" }} 
                  name="Expenses"
                />
              )}
              
              {/* Net Profit Line */}
              {showNetProfit && (
                <Line 
                  type="monotone" 
                  dataKey="netProfit" 
                  stroke="rgb(59, 130, 246)" 
                  strokeWidth={3} 
                  dot={false} 
                  activeDot={{ r: 6, fill: "rgb(59, 130, 246)", strokeWidth: 2, stroke: "white" }} 
                  name="Net Profit"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}