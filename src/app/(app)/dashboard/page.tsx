"use client";

import { useAuth } from "@/contexts/AuthContext";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { AIInsightsWidget } from "@/components/dashboard/AIInsightsWidget";
import { SpendingAnomaliesWidget } from "@/components/dashboard/SpendingAnomaliesWidget";
import { IncomePredictionWidget } from "@/components/dashboard/IncomePredictionWidget";
import { SmartCategorizationWidget } from "@/components/dashboard/SmartCategorizationWidget";
import { Card } from "@/components/ui/card";
import { Target, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Development mode: Allow testing with mock user ID when not authenticated
  const isDevelopment = process.env.NODE_ENV === 'development';
  const testUserId = isDevelopment && !user ? 'dev-test-user-123' : user?.uid;
  const displayName = user?.displayName || user?.email?.split('@')[0] || (isDevelopment ? 'Demo User' : 'User');

  return (
    <div className="space-y-8">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {displayName}
          </p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <FinancialOverview />

      {/* Revenue Chart */}
      <RevenueChart 
        showExpenses={true}
        showNetProfit={false}
        monthsToShow={6}
      />

      {/* AI Intelligence */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              AI Financial Intelligence
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Advanced insights powered by machine learning
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">
              Powered by Gemini 2.0 Flash
            </p>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            {testUserId ? <AIInsightsWidget userId={testUserId} /> : <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />}
          </div>
          {testUserId ? <IncomePredictionWidget userId={testUserId} /> : <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />}
          {testUserId ? <SpendingAnomaliesWidget userId={testUserId} /> : <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />}
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {testUserId ? <SmartCategorizationWidget userId={testUserId} /> : <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />}
          <Card className="text-center p-8">
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  More AI Tools Coming Soon
                </h3>
                <p className="text-sm text-muted-foreground">
                  Advanced financial forecasting and business intelligence features
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Recent Activity
        </h2>
        <RecentTransactions 
          limit={10}
          showViewAll={true}
        />
      </div>
    </div>
  );
}