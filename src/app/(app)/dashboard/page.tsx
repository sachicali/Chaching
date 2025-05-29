
"use client"; 

import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react"; 
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"; 
import { 
  LineChart as RechartsActualLineChart,
  BarChart as RechartsActualBarChart,
  Bar,
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Line as RechartsLine 
} from 'recharts';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";


const chartConfig = {
  income: { label: "Income", color: "hsl(var(--chart-2))" }, 
  expenses: { label: "Expenses", color: "hsl(var(--chart-1))" }, 
} satisfies ChartConfig; 

const expenseBreakdownChartConfig = {
  value: { label: "Amount", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

interface DashboardState {
  totalIncome: number;
  totalIncomeChange: string; 
  totalExpenses: number;
  totalExpensesChange: string; 
  netSavings: number;
  netSavingsChange: string; 
  netProfit: number;
  netProfitChange: string; 
  incomeExpenseChartData: { month: string; income: number; expenses: number }[];
  expenseBreakdownData: { name: string; value: number }[];
}

const initialDashboardState: DashboardState = {
  totalIncome: 0,
  totalIncomeChange: "+0%",
  totalExpenses: 0,
  totalExpensesChange: "+0%",
  netSavings: 0,
  netSavingsChange: "+0%",
  netProfit: 0,
  netProfitChange: "+0%",
  incomeExpenseChartData: [],
  expenseBreakdownData: [],
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardState>(initialDashboardState);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      setDashboardData(initialDashboardState); 
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'text-positive';
    if (change.startsWith('-')) return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6 w-full flex flex-col flex-1"> 
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Emily</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Income</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <div className="text-3xl font-bold text-foreground">{formatCurrency(dashboardData.totalIncome)}</div>
                <p className={`text-sm ${getChangeColor(dashboardData.totalIncomeChange)}`}>{dashboardData.totalIncomeChange}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <div className="text-3xl font-bold text-foreground">{formatCurrency(dashboardData.totalExpenses)}</div>
                <p className={`text-sm ${getChangeColor(dashboardData.totalExpensesChange)}`}>{dashboardData.totalExpensesChange}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Savings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <div className="text-3xl font-bold text-foreground">{formatCurrency(dashboardData.netSavings)}</div>
                 <p className={`text-sm ${getChangeColor(dashboardData.netSavingsChange)}`}>{dashboardData.netSavingsChange}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <div className="text-3xl font-bold text-foreground">{formatCurrency(dashboardData.netProfit)}</div>
                <p className={`text-sm ${getChangeColor(dashboardData.netProfitChange)}`}>{dashboardData.netProfitChange}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 flex-1 min-h-0"> 
        <Card className="lg:col-span-2 flex flex-col"> 
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Income vs. Expenses</CardTitle>
          </CardHeader>
          <CardContent className="flex-1"> 
            {isLoading ? (
              <div className="flex justify-center items-center h-full"> 
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : dashboardData.incomeExpenseChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full"> 
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsActualLineChart data={dashboardData.incomeExpenseChartData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--muted))" strokeDasharray="3 0" />
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
                      tickFormatter={(value) => `${value/1000}k`} 
                    />
                    <ChartTooltip
                      cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "3 3" }}
                      content={<ChartTooltipContent indicator="line" nameKey="name" labelKey="month" hideIndicator />}
                      wrapperStyle={{ outline: "none" }}
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)" }}
                    />
                    <RechartsLine type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "var(--color-income)", strokeWidth:0 }} />
                     <RechartsLine type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "var(--color-expenses)", strokeWidth:0 }} />
                  </RechartsActualLineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-center text-muted-foreground">
                <p className="mb-4">No income or expense data to display for the chart.</p>
                 <div className="flex gap-2">
                  <Link href="/income" passHref>
                    <Button variant="outline">
                       Add Income
                    </Button>
                  </Link>
                  <Link href="/expenses" passHref>
                    <Button variant="outline">
                       Add Expense
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1 flex flex-col"> 
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex-1"> 
             {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : dashboardData.expenseBreakdownData.length > 0 ? (
              <ChartContainer config={expenseBreakdownChartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsActualBarChart data={dashboardData.expenseBreakdownData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--muted))" strokeDasharray="3 0" />
                    <XAxis 
                      dataKey="name" 
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
                      tickFormatter={(value) => `${value/1000}k`} 
                    />
                     <ChartTooltip
                        cursor={{ fill: "hsl(var(--border))" }}
                        content={<ChartTooltipContent indicator="dot" nameKey="name" hideIndicator />}
                        wrapperStyle={{ outline: "none" }}
                        contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)" }}
                      />
                    <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                  </RechartsActualBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
               <div className="flex flex-col justify-center items-center h-full text-center text-muted-foreground">
                <p className="mb-4">No expense breakdown data to display.</p>
                  <Link href="/expenses" passHref>
                    <Button variant="outline">
                       Add Expense
                    </Button>
                  </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
