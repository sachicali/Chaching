
"use client"; 

import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalTracker } from "@/components/features/goal-tracker";
import { BarChart, LineChart as LineChartIcon, TrendingUp, TrendingDown, ListChecks, Activity, Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"; 
import { 
  LineChart as RechartsActualLineChart,
  Bar, 
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const fetchedIncome = 45231.89;
      const fetchedExpenses = 23150.50;
      const net = fetchedIncome - fetchedExpenses;

      setDashboardData({
        totalIncome: fetchedIncome,
        totalIncomeChange: "+20.1% from last month",
        totalExpenses: fetchedExpenses,
        totalExpensesChange: "+12.5% from last month",
        netSavings: net,
        netSavingsTargetGap: 7918.61,
        incomeExpenseChartData: [
          { month: 'Jan', income: 4000, expenses: 2400 },
          { month: 'Feb', income: 3000, expenses: 1398 },
          { month: 'Mar', income: 2000, expenses: 5800 },
          { month: 'Apr', income: 2780, expenses: 3908 },
          { month: 'May', income: 1890, expenses: 4800 },
          { month: 'Jun', income: 2390, expenses: 3800 },
        ],
        recentTransactions: [
          { id: 'txn1', date: '2024-07-28', description: 'Client Project Alpha Payment', type: 'income', amount: 2500.00 },
          { id: 'txn2', date: '2024-07-27', description: 'Monthly Software Subscription', type: 'expense', amount: 49.99 },
          { id: 'txn3', date: '2024-07-26', description: 'Office Supplies Purchase', type: 'expense', amount: 120.50 },
          { id: 'txn4', date: '2024-07-25', description: 'Consulting Gig - Phase 1', type: 'income', amount: 1800.00 },
          { id: 'txn5', date: '2024-07-24', description: 'Internet Bill', type: 'expense', amount: 75.00 },
        ]
      });
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
              <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          {/* GoalTrackers remain as their data is specific to each goal instance */}
          <GoalTracker goalName="New Equipment" targetAmount={100000} currentAmount={65000} />
          <GoalTracker goalName="Vacation Fund" targetAmount={50000} currentAmount={15000} />
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
