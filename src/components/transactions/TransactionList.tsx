"use client";

import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  MoreHorizontalIcon, 
  EditIcon, 
  TrashIcon, 
  ExternalLinkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FilterIcon,
  SearchIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useTransactions } from '@/contexts/TransactionContext';
import { useClients } from '@/contexts/ClientContext';
import type { Transaction, TransactionType, TransactionStatus } from '@/types/database.types';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT PROPS AND TYPES
// ============================================================================

interface TransactionListProps {
  transactions?: Transaction[];
  loading?: boolean;
  onEditTransaction?: (transaction: Transaction) => void;
  showFilters?: boolean;
  compactMode?: boolean;
  maxHeight?: string;
  className?: string;
}

type SortField = 'date' | 'amount' | 'description' | 'type' | 'category';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number, currency: string): string => {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    PHP: '₱'
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const getStatusBadgeVariant = (status: TransactionStatus) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getTypeBadgeVariant = (type: TransactionType) => {
  return type === 'income' ? 'default' : 'secondary';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TransactionList({
  transactions: externalTransactions,
  loading: externalLoading,
  onEditTransaction,
  showFilters = true,
  compactMode = false,
  maxHeight = '600px',
  className
}: TransactionListProps) {
  // Context
  const { 
    transactions: contextTransactions, 
    loading: contextLoading, 
    deleteTransaction 
  } = useTransactions();
  const { clients, getClientById } = useClients();

  // Use external transactions if provided, otherwise use context
  const transactions = externalTransactions || contextTransactions;
  const loading = externalLoading !== undefined ? externalLoading : contextLoading;

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');

  // ============================================================================
  // FILTERING AND SORTING
  // ============================================================================

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(lowercaseSearch) ||
        transaction.category.toLowerCase().includes(lowercaseSearch) ||
        (transaction.clientId && getClientById(transaction.clientId)?.name.toLowerCase().includes(lowercaseSearch))
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = a.date.toDate().getTime();
          bValue = b.date.toDate().getTime();
          break;
        case 'amount':
          aValue = a.phpEquivalent; // Sort by PHP equivalent for consistency
          bValue = b.phpEquivalent;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, typeFilter, statusFilter, sortField, sortDirection, getClientById]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, sortDirection]);

  const handleDeleteTransaction = useCallback(async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  }, [deleteTransaction]);

  const getSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ArrowUpIcon className="h-4 w-4" /> : 
      <ArrowDownIcon className="h-4 w-4" />;
  }, [sortField, sortDirection]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        <TableHead 
          className="cursor-pointer hover:bg-muted/50 select-none"
          onClick={() => handleSort('date')}
        >
          <div className="flex items-center gap-2">
            Date
            {getSortIcon('date')}
          </div>
        </TableHead>
        <TableHead 
          className="cursor-pointer hover:bg-muted/50 select-none"
          onClick={() => handleSort('type')}
        >
          <div className="flex items-center gap-2">
            Type
            {getSortIcon('type')}
          </div>
        </TableHead>
        <TableHead 
          className="cursor-pointer hover:bg-muted/50 select-none"
          onClick={() => handleSort('description')}
        >
          <div className="flex items-center gap-2">
            Description
            {getSortIcon('description')}
          </div>
        </TableHead>
        <TableHead 
          className="cursor-pointer hover:bg-muted/50 select-none"
          onClick={() => handleSort('category')}
        >
          <div className="flex items-center gap-2">
            Category
            {getSortIcon('category')}
          </div>
        </TableHead>
        <TableHead>Client</TableHead>
        <TableHead 
          className="cursor-pointer hover:bg-muted/50 select-none text-right"
          onClick={() => handleSort('amount')}
        >
          <div className="flex items-center justify-end gap-2">
            Amount
            {getSortIcon('amount')}
          </div>
        </TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="w-12"></TableHead>
      </TableRow>
    </TableHeader>
  );

  const renderTransactionRow = (transaction: Transaction) => {
    const client = transaction.clientId ? getClientById(transaction.clientId) : null;
    
    return (
      <TableRow key={transaction.id} className="hover:bg-muted/50">
        <TableCell className="font-medium">
          {format(transaction.date.toDate(), 'MMM dd, yyyy')}
        </TableCell>
        <TableCell>
          <Badge variant={getTypeBadgeVariant(transaction.type)}>
            {transaction.type === 'income' ? 'Income' : 'Expense'}
          </Badge>
        </TableCell>
        <TableCell>
          <div>
            <p className="font-medium">{transaction.description}</p>
            {transaction.metadata?.projectName && (
              <p className="text-sm text-muted-foreground">
                Project: {transaction.metadata.projectName}
              </p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm">{transaction.category}</span>
        </TableCell>
        <TableCell>
          {client ? (
            <div className="text-sm">
              <p className="font-medium">{client.name}</p>
              {client.company && (
                <p className="text-muted-foreground">{client.company}</p>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div>
            <p className="font-medium">
              {formatCurrency(transaction.amount, transaction.currency)}
            </p>
            {transaction.currency !== 'PHP' && (
              <p className="text-sm text-muted-foreground">
                ₱{transaction.phpEquivalent.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={getStatusBadgeVariant(transaction.status)}>
            {transaction.status}
          </Badge>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {onEditTransaction && (
                <DropdownMenuItem onClick={() => onEditTransaction(transaction)}>
                  <EditIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {transaction.receiptUrl && (
                <DropdownMenuItem asChild>
                  <a 
                    href={transaction.receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLinkIcon className="mr-2 h-4 w-4" />
                    View Receipt
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{transaction.description}"? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  const renderLoadingSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className={cn("pb-4", compactMode && "pb-2")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Transactions ({filteredAndSortedTransactions.length})
          </CardTitle>
          {showFilters && (
            <Button variant="outline" size="sm">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div 
          className="relative overflow-auto"
          style={{ maxHeight: compactMode ? '400px' : maxHeight }}
        >
          <Table>
            {renderTableHeader()}
            <TableBody>
              {loading ? (
                renderLoadingSkeleton()
              ) : filteredAndSortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? (
                        <div>
                          <p>No transactions match your filters.</p>
                          <Button 
                            variant="link" 
                            size="sm"
                            onClick={() => {
                              setSearchTerm('');
                              setTypeFilter('all');
                              setStatusFilter('all');
                            }}
                            className="mt-2"
                          >
                            Clear filters
                          </Button>
                        </div>
                      ) : (
                        <p>No transactions found. Add your first transaction to get started.</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTransactions.map(renderTransactionRow)
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}