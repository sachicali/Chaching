"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/contexts/TransactionContext";
import { useClients } from "@/contexts/ClientContext";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { AIInsightsWidget } from "@/components/dashboard/AIInsightsWidget";
import { SpendingAnomaliesWidget } from "@/components/dashboard/SpendingAnomaliesWidget";
import { IncomePredictionWidget } from "@/components/dashboard/IncomePredictionWidget";
import { SmartCategorizationWidget } from "@/components/dashboard/SmartCategorizationWidget";
import { WelcomePanel } from "@/components/dashboard/WelcomePanel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Sparkles, Plus, TrendingUp, TrendingDown, Users, FileText, BarChart3, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { transactions, summary } = useTransactions();
  const { clients } = useClients();
  const [hasData, setHasData] = useState(false);
  
  // Development mode: Allow testing with mock user ID when not authenticated
  const isDevelopment = process.env.NODE_ENV === 'development';
  const testUserId = isDevelopment && !user ? 'dev-test-user-123' : user?.uid;
  const displayName = user?.displayName || user?.email?.split('@')[0] || (isDevelopment ? 'Demo User' : 'User');

  // Determine if user has data
  useEffect(() => {
    const hasTransactions = transactions && transactions.length > 0;
    const hasClients = clients && clients.length > 0;
    const hasAnyData = hasTransactions || hasClients;
    setHasData(hasAnyData);
  }, [transactions, clients]);

  // Calculate completed steps for onboarding
  const completedSteps = {
    accountCreated: true, // They're logged in
    addedIncome: transactions?.some(t => t.type === 'income') || false,
    addedExpense: transactions?.some(t => t.type === 'expense') || false,
    categorizedTransaction: transactions?.some(t => t.category && t.category !== 'other') || false,
    addedClient: clients?.length > 0,
  };

  const isNewUser = !hasData || Object.values(completedSteps).filter(Boolean).length <= 1;

  return (
    <div className="relative min-h-screen">
      <div className="space-y-8 pb-20">
        {/* Header - Always visible */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              {isNewUser ? `Welcome to ChaChing, ${displayName}!` : `Welcome back, ${displayName}`}
            </p>
          </div>
        </div>

        {/* Show Welcome Panel for new users */}
        {isNewUser && (
          <WelcomePanel
            userName={displayName}
            completedSteps={completedSteps}
            onGetStarted={() => router.push('/clients')}
            onAddIncome={() => router.push('/income')}
            onAddExpense={() => router.push('/expenses')}
          />
        )}

        {/* Financial Overview Cards */}
        <div className="space-y-4">
          {!isNewUser && <FinancialOverview />}
          
          {isNewUser && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Empty state cards */}
              <Card className="group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-foreground">₱0.00</p>
                      <p className="text-xs text-muted-foreground">No income yet</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs hover:text-primary"
                      onClick={() => router.push('/income')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add your first income
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-foreground">₱0.00</p>
                      <p className="text-xs text-muted-foreground">No expenses yet</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <TrendingDown className="h-6 w-6 text-destructive" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs hover:text-primary"
                      onClick={() => router.push('/expenses')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Track an expense
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Active Clients</p>
                      <p className="text-2xl font-bold text-foreground">0</p>
                      <p className="text-xs text-muted-foreground">No clients yet</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs hover:text-primary"
                      onClick={() => router.push('/clients')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add a client
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Pending Invoices</p>
                      <p className="text-2xl font-bold text-foreground">0</p>
                      <p className="text-xs text-muted-foreground">No invoices yet</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs hover:text-primary"
                      onClick={() => router.push('/invoices')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create an invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        {!isNewUser && (
          <RevenueChart 
            showExpenses={true}
            showNetProfit={false}
            monthsToShow={6}
          />
        )}

        {/* Empty State Chart for new users */}
        {isNewUser && (
          <Card className="p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Revenue Trends Will Appear Here
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Once you start tracking income and expenses, you'll see beautiful charts showing your financial trends over time.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <Button
                  onClick={() => router.push('/income')}
                  variant="outline"
                  size="sm"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Add Income
                </Button>
                <Button
                  onClick={() => router.push('/expenses')}
                  variant="outline"
                  size="sm"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* AI Intelligence */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                AI Financial Intelligence
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isNewUser ? "Unlock powerful insights as you add data" : "Advanced insights powered by machine learning"}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium">
                Powered by Gemini 2.0 Flash
              </p>
            </div>
          </div>
          
          {!isNewUser && (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
              <div className="xl:col-span-2">
                {testUserId ? <AIInsightsWidget userId={testUserId} /> : <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />}
              </div>
              {testUserId ? <IncomePredictionWidget userId={testUserId} /> : <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />}
              {testUserId ? <SpendingAnomaliesWidget userId={testUserId} /> : <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />}
            </div>
          )}

          {isNewUser && (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
              {/* Empty state AI cards */}
              <Card className="xl:col-span-2 group">
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        AI Insights Await
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Add at least 5 transactions to unlock AI-powered financial insights
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group">
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Income Predictions
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Track income for 30 days to enable predictions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group">
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Anomaly Detection
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Requires transaction history to detect patterns
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {!isNewUser && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Recent Activity
            </h2>
            <RecentTransactions 
              limit={10}
              showViewAll={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}