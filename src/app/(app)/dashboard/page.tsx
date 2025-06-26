"use client";

import { useAuth } from "@/contexts/AuthContext";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 w-full flex flex-col flex-1">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.displayName || user?.email || 'User'}
        </p>
      </div>

      {/* Financial Overview Cards */}
      <FinancialOverview />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RevenueChart 
            showExpenses={true}
            showNetProfit={false}
            monthsToShow={6}
          />
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-1">
        {/* Recent Transactions - Full width */}
        <RecentTransactions 
          limit={10}
          showViewAll={true}
        />
      </div>
    </div>
  );
}