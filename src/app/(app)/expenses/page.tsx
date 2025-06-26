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
import { useTransactions, useExpenseTransactions, useTransactionAnalytics } from '@/contexts/TransactionContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import type { TransactionFilters as TFilters } from '@/types/database.types';

// ============================================================================
// EXPENSE SUMMARY COMPONENT
// ============================================================================

function ExpenseSummaryCards() {
  const { summary } = useTransactionAnalytics();
  const { expenseTransactions } = useExpenseTransactions();

  // Calculate current month expenses
  const currentMonth = new Date();
  const currentMonthExpenses = expenseTransactions.filter(expense => {
    const expenseDate = expense.date.toDate();
    return expenseDate.getMonth() === currentMonth.getMonth() &&
           expenseDate.getFullYear() === currentMonth.getFullYear();
  });

  const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.phpEquivalent, 0);

  // Calculate average monthly expenses (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentExpenses = expenseTransactions.filter(expense => 
    expense.date.toDate() >= sixMonthsAgo
  );
  
  const avgMonthlyExpenses = recentExpenses.length > 0 
    ? recentExpenses.reduce((sum, expense) => sum + expense.phpEquivalent, 0) / 6
    : 0;

  // Get top expense categories
  const categoryTotals: Record<string, number> = {};
  expenseTransactions.forEach(expense => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.phpEquivalent;
  });

  const topCategory = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₱{summary?.totalExpenses.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }) || '0.00'}
          </div>
          <p className="text-xs text-muted-foreground">
            All time expenses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₱{currentMonthTotal.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {currentMonthExpenses.length} transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Monthly</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₱{avgMonthlyExpenses.toLocaleString('en-PH', {
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
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-ellipsis overflow-hidden">
            {topCategory ? topCategory[0] : 'None'}
          </div>
          <p className="text-xs text-muted-foreground">
            {topCategory ? `₱${topCategory[1].toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}` : 'No expenses yet'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// EXPENSE ANALYTICS COMPONENT
// ============================================================================

function ExpenseAnalytics() {
  const { getCategoryTotals } = useTransactionAnalytics();
  const expenseCategoryTotals = getCategoryTotals('expense');

  const categoryData = Object.entries(expenseCategoryTotals)
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: 0 // Will be calculated
    }))
    .sort((a, b) => b.total - a.total);

  const totalExpenses = categoryData.reduce((sum, item) => sum + item.total, 0);
  
  // Calculate percentages
  categoryData.forEach(item => {
    item.percentage = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Categories</CardTitle>
        <CardDescription>
          Breakdown of expenses by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        {categoryData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No expense data available
          </div>
        ) : (
          <div className="space-y-4">
            {categoryData.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${(index * 360) / categoryData.length}, 70%, 50%)` 
                    }}
                  />
                  <span className="font-medium">{item.category}</span>
                  <span className="text-sm text-muted-foreground">
                    ({item.count} {item.count === 1 ? 'transaction' : 'transactions'})
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
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
  );
}

// ============================================================================
// MAIN EXPENSES PAGE COMPONENT
// ============================================================================

function ExpensesPageContent() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState<TFilters>({ type: 'expense' });
  
  const { transactions, loading } = useTransactions();
  const { filterExpenses } = useExpenseTransactions();

  // Filter transactions to show only expenses
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const filteredExpenses = filterExpenses(filters);

  const handleFiltersChange = (newFilters: TFilters) => {
    setFilters({ ...newFilters, type: 'expense' }); // Always maintain expense type
  };

  const handleRemoveFilter = (key: keyof TFilters) => {
    if (key === 'type') return; // Don't allow removing type filter
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
  };

  const handleClearAllFilters = () => {
    setFilters({ type: 'expense' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage your business expenses
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a new business expense with details and categorization.
              </DialogDescription>
            </DialogHeader>
            <TransactionForm
              type="expense"
              onSuccess={() => setShowAddDialog(false)}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <ExpenseSummaryCards />

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
            transactions={Object.keys(filters).length > 1 ? filteredExpenses : expenseTransactions}
            loading={loading}
            showFilters={false}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <ExpenseAnalytics />
            
            {/* Additional analytics can be added here */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>
                  Expense trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Monthly trend chart coming soon
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// EXPORTED PAGE COMPONENT
// ============================================================================

export default function ExpensesPage() {
  return (
    <TransactionProvider>
      <ExpensesPageContent />
    </TransactionProvider>
  );
}
