"use client";

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import TransactionForm from '@/components/transactions/TransactionForm';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionFilters, { ActiveFiltersDisplay } from '@/components/transactions/TransactionFilters';
import { useTransactions, useIncomeTransactions, useTransactionAnalytics } from '@/contexts/TransactionContext';
import { useClients } from '@/contexts/ClientContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import type { TransactionFilters as TFilters } from '@/types/database.types';

// ============================================================================
// INCOME SUMMARY COMPONENT
// ============================================================================

function IncomeSummaryCards() {
  const { summary } = useTransactionAnalytics();
  const { incomeTransactions } = useIncomeTransactions();

  // Calculate current month income
  const currentMonth = new Date();
  const currentMonthIncome = incomeTransactions.filter(income => {
    const incomeDate = income.date.toDate();
    return incomeDate.getMonth() === currentMonth.getMonth() &&
           incomeDate.getFullYear() === currentMonth.getFullYear();
  });

  const currentMonthTotal = currentMonthIncome.reduce((sum, income) => sum + income.phpEquivalent, 0);

  // Calculate average monthly income (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentIncome = incomeTransactions.filter(income => 
    income.date.toDate() >= sixMonthsAgo
  );
  
  const avgMonthlyIncome = recentIncome.length > 0 
    ? recentIncome.reduce((sum, income) => sum + income.phpEquivalent, 0) / 6
    : 0;

  // Get top income sources (clients)
  const clientTotals: Record<string, number> = {};
  incomeTransactions.forEach(income => {
    if (income.clientId) {
      clientTotals[income.clientId] = (clientTotals[income.clientId] || 0) + income.phpEquivalent;
    }
  });

  const topClientId = Object.entries(clientTotals)
    .sort(([,a], [,b]) => b - a)[0]?.[0];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₱{summary?.totalIncome.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }) || '0.00'}
          </div>
          <p className="text-xs text-muted-foreground">
            All time income
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₱{currentMonthTotal.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {currentMonthIncome.length} transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Monthly</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₱{avgMonthlyIncome.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Last 6 months average
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Client</CardTitle>
        </CardHeader>
        <CardContent>
          <TopClientDisplay clientId={topClientId} />
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for top client display
function TopClientDisplay({ clientId }: { clientId?: string }) {
  const { getClientById } = useClients();
  const { incomeTransactions } = useIncomeTransactions();

  if (!clientId) {
    return (
      <>
        <div className="text-2xl font-bold">None</div>
        <p className="text-xs text-muted-foreground">No client income yet</p>
      </>
    );
  }

  const client = getClientById(clientId);
  const clientIncome = incomeTransactions
    .filter(income => income.clientId === clientId)
    .reduce((sum, income) => sum + income.phpEquivalent, 0);

  return (
    <>
      <div className="text-lg font-bold text-ellipsis overflow-hidden">
        {client?.name || 'Unknown Client'}
      </div>
      <p className="text-xs text-muted-foreground">
        ₱{clientIncome.toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </p>
    </>
  );
}

// ============================================================================
// INCOME ANALYTICS COMPONENT
// ============================================================================

function IncomeAnalytics() {
  const { getCategoryTotals } = useTransactionAnalytics();
  const { getClientById } = useClients();
  const { incomeTransactions } = useIncomeTransactions();
  
  const incomeCategoryTotals = getCategoryTotals('income');

  const categoryData = Object.entries(incomeCategoryTotals)
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: 0 // Will be calculated
    }))
    .sort((a, b) => b.total - a.total);

  const totalIncome = categoryData.reduce((sum, item) => sum + item.total, 0);
  
  // Calculate percentages
  categoryData.forEach(item => {
    item.percentage = totalIncome > 0 ? (item.total / totalIncome) * 100 : 0;
  });

  // Client breakdown
  const clientTotals: Record<string, { total: number; count: number; name: string }> = {};
  incomeTransactions.forEach(income => {
    if (income.clientId) {
      const client = getClientById(income.clientId);
      if (!clientTotals[income.clientId]) {
        clientTotals[income.clientId] = {
          total: 0,
          count: 0,
          name: client?.name || 'Unknown Client'
        };
      }
      clientTotals[income.clientId].total += income.phpEquivalent;
      clientTotals[income.clientId].count += 1;
    }
  });

  const clientData = Object.entries(clientTotals)
    .map(([clientId, data]) => ({
      clientId,
      ...data,
      percentage: totalIncome > 0 ? (data.total / totalIncome) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // Top 5 clients

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Income Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Income Categories</CardTitle>
          <CardDescription>
            Breakdown of income by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No income data available
            </div>
          ) : (
            <div className="space-y-4">
              {categoryData.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: `hsl(${120 + (index * 60)}, 70%, 50%)` // Green-based colors
                      }}
                    />
                    <span className="font-medium">{item.category}</span>
                    <span className="text-sm text-muted-foreground">
                      ({item.count} {item.count === 1 ? 'transaction' : 'transactions'})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      ₱{item.total.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clients</CardTitle>
          <CardDescription>
            Highest earning clients by total income
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No client income data available
            </div>
          ) : (
            <div className="space-y-4">
              {clientData.map((item, index) => (
                <div key={item.clientId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: `hsl(${200 + (index * 40)}, 70%, 50%)` // Blue-based colors
                      }}
                    />
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({item.count} {item.count === 1 ? 'payment' : 'payments'})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      ₱{item.total.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN INCOME PAGE COMPONENT
// ============================================================================

function IncomePageContent() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState<TFilters>({ type: 'income' });
  
  const { transactions, loading } = useTransactions();
  const { filterIncome } = useIncomeTransactions();

  // Filter transactions to show only income
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const filteredIncome = filterIncome(filters);

  const handleFiltersChange = (newFilters: TFilters) => {
    setFilters({ ...newFilters, type: 'income' }); // Always maintain income type
  };

  const handleRemoveFilter = (key: keyof TFilters) => {
    if (key === 'type') return; // Don't allow removing type filter
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
  };

  const handleClearAllFilters = () => {
    setFilters({ type: 'income' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Income</h1>
          <p className="text-muted-foreground">
            Track and manage your income from clients and projects
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Income</DialogTitle>
              <DialogDescription>
                Record new income from clients, projects, or other sources.
              </DialogDescription>
            </DialogHeader>
            <TransactionForm
              type="income"
              onSuccess={() => setShowAddDialog(false)}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <IncomeSummaryCards />

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <ActiveFiltersDisplay
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
            />
            <TransactionFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearAllFilters}
              showAsSheet
            />
          </div>

          {/* Transaction List */}
          <TransactionList
            transactions={Object.keys(filters).length > 1 ? filteredIncome : incomeTransactions}
            loading={loading}
            showFilters={false}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <IncomeAnalytics />
          
          {/* Additional analytics placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Income Trends</CardTitle>
              <CardDescription>
                Monthly income trends and growth analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Income trend chart coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// EXPORTED PAGE COMPONENT
// ============================================================================

export default function IncomePage() {
  return (
    <TransactionProvider>
      <IncomePageContent />
    </TransactionProvider>
  );
}
