"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransactions } from "@/contexts/TransactionContext";
import type { Transaction } from "@/types/database.types";
import { useMemo } from "react";
import { Loader2, ListChecks, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RecentTransactionsProps {
  className?: string;
  limit?: number;
  showViewAll?: boolean;
}

export function RecentTransactions({ 
  className, 
  limit = 5, 
  showViewAll = true 
}: RecentTransactionsProps) {
  const { transactions, loading } = useTransactions();

  const recentTransactions = useMemo(() => {
    if (!transactions.length) return [];

    // Sort by date (most recent first) and take the specified limit
    return [...transactions]
      .sort((a, b) => b.date.toMillis() - a.date.toMillis())
      .slice(0, limit);
  }, [transactions, limit]);

  const formatCurrency = (value: number): string => {
    return `₱${value.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (date: any): string => {
    if (!date || !date.toDate) return '';
    return date.toDate().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTransactionIcon = (type: string) => {
    return type === 'income' ? ArrowUpRight : ArrowDownRight;
  };

  const getTransactionColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-destructive';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!recentTransactions.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-[300px] text-center text-muted-foreground p-6">
          <ListChecks className="h-12 w-12 mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
          <p className="mb-4 text-sm">Start by adding your first income or expense transaction.</p>
          <div className="flex gap-2">
            <Link href="/income">
              <Button variant="outline" size="sm">Add Income</Button>
            </Link>
            <Link href="/expenses">
              <Button variant="outline" size="sm">Add Expense</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
        {showViewAll && (
          <Link href="/income">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTransactions.map((transaction: Transaction) => {
              const TransactionIcon = getTransactionIcon(transaction.type);
              
              return (
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                        : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                    )}>
                      <TransactionIcon className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">
                        {transaction.description}
                      </div>
                      {transaction.category && (
                        <div className="text-xs text-muted-foreground">
                          {transaction.category}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className={cn(
                        "font-semibold",
                        getTransactionColor(transaction.type)
                      )}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.phpEquivalent)}
                      </div>
                      {transaction.currency !== 'PHP' && (
                        <div className="text-xs text-muted-foreground">
                          {transaction.currency} {transaction.amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {/* Mobile-friendly date display */}
        <div className="sm:hidden mt-4 space-y-2">
          {recentTransactions.map((transaction: Transaction) => (
            <div key={`${transaction.id}-mobile`} className="text-xs text-muted-foreground border-t pt-2">
              <span className="font-medium">{transaction.description}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(transaction.date)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}