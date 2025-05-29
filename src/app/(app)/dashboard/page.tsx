
"use client"; 

import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart as LineChartIcon, TrendingUp, TrendingDown, ListChecks, Activity, Loader2, PlusCircle, Target } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"; 
import { 
  LineChart as RechartsActualLineChart,
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Line as RechartsLine 
} from 'recharts';
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const chartConfig = {
  income: { label: "Income", color: "hsl(var(--chart-2))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig; 

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
}

interface DashboardState {
  totalIncome: number;
  totalIncomeChange: string;
  totalExpenses: number;
  totalExpensesChange: string;
  netSavings: number;
  netSavingsTargetGap: number;
  incomeExpenseChartData: { month: string; income: number; expenses: number }[];
  recentTransactions: Transaction[];
}

const initialDashboardState: DashboardState = {
  totalIncome: 0,
  totalIncomeChange: "+0%",
  totalExpenses: 0,
  totalExpensesChange: "+0%",
  netSavings: 0,
  netSavingsTargetGap: 0,
  incomeExpenseChartData: [],
  recentTransactions: [],
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardState>(initialDashboardState);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Simulate API call - in a real app, this would fetch data
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      // Set to initial (empty) state after "fetch"
      setDashboardData(initialDashboardState); 
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <div className="text-2xl font-bold">₱{dashboardData.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">{dashboardData.totalIncomeChange}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-destructive" />
            ) : (
              <>
                <div className="text-2xl font-bold">₱{dashboardData.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">{dashboardData.totalExpensesChange}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <ListChecks className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            ) : (
              <>
                <div className="text-2xl font-bold">₱{dashboardData.netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">Gap: ₱{dashboardData.netSavingsTargetGap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to target</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChartIcon className="mr-2 h-5 w-5 text-primary" /> 
              Income vs. Expenses
            </CardTitle>
            <CardDescription>Monthly overview of your income and expenses.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[300px] h-[40vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : dashboardData.incomeExpenseChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="min-h-[300px] h-[40vh] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsActualLineChart data={dashboardData.incomeExpenseChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `₱${value/1000}k`} />
                    <Tooltip
                      content={<ChartTooltipContent indicator="line" />}
                      cursor={{ stroke: "hsl(var(--accent))", strokeWidth: 2, strokeDasharray: "3 3" }}
                      wrapperStyle={{ outline: "none" }}
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)" }}
                    />
                    <Legend content={<ChartLegendContent />} />
                    <RechartsLine type="monotone" dataKey="income" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-2))", r: 4 }} activeDot={{ r: 6 }} />
                    <RechartsLine type="monotone" dataKey="expenses" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-1))", r: 4 }} activeDot={{ r: 6 }} />
                  </RechartsActualLineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex flex-col justify-center items-center min-h-[300px] h-[40vh] text-center text-muted-foreground">
                <p className="mb-4">No income or expense data to display.</p>
                <div className="flex gap-2">
                  <Link href="/income" passHref>
                    <Button variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Income
                    </Button>
                  </Link>
                  <Link href="/expenses" passHref>
                    <Button variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-6">
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Financial Goals</CardTitle>
              <CardDescription>Track your progress towards financial goals.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center py-10">
              <Target className="h-12 w-12 text-primary mb-4" />
              <p className="text-lg font-semibold text-foreground mb-2">Ready to Hit Your Targets?</p>
              <p className="text-muted-foreground mb-4">Define your financial goals and watch your progress.</p>
              <Link href="/goals" passHref>
                <Button variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Set a New Goal
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-3">
                Manage all goals on the <Link href="/goals" className="underline hover:text-primary">Goals page</Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5 text-primary" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Your latest income and expense activities.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
          ) : dashboardData.recentTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'} 
                             className={transaction.type === 'income' ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30'}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}₱{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>No recent transactions found.</p>
              <p className="text-xs">Connect your accounts or add transactions manually.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
