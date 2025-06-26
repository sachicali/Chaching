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
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-[300px] text-center text-muted-foreground">
          <p className="mb-4">No revenue data to display for the chart.</p>
          <div className="flex gap-2">
            <Link href="/income">
              <Button variant="outline">Add Income</Button>
            </Link>
            <Link href="/expenses">
              <Button variant="outline">Add Expense</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Revenue Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid 
                vertical={false} 
                stroke="hsl(var(--muted))" 
                strokeDasharray="3 0" 
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
                    <div className="bg-popover border border-border rounded-md p-3 shadow-md">
                      <p className="font-medium text-foreground mb-2">{label}</p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-muted-foreground">{entry.name}:</span>
                          <span className="font-medium text-foreground">
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
                stroke="var(--color-income)" 
                strokeWidth={3} 
                dot={false} 
                activeDot={{ r: 5, fill: "var(--color-income)", strokeWidth: 0 }} 
                name="Income"
              />
              
              {/* Expenses Line */}
              {showExpenses && (
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="var(--color-expenses)" 
                  strokeWidth={3} 
                  dot={false} 
                  activeDot={{ r: 5, fill: "var(--color-expenses)", strokeWidth: 0 }} 
                  name="Expenses"
                />
              )}
              
              {/* Net Profit Line */}
              {showNetProfit && (
                <Line 
                  type="monotone" 
                  dataKey="netProfit" 
                  stroke="var(--color-netProfit)" 
                  strokeWidth={3} 
                  dot={false} 
                  activeDot={{ r: 5, fill: "var(--color-netProfit)", strokeWidth: 0 }} 
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