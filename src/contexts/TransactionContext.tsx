"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { 
  transactionService, 
  type TransactionCreateData, 
  type TransactionUpdateData,
  type TransactionSummary
} from '@/services/transaction.service';
import type { 
  Transaction, 
  TransactionFilters,
  TransactionType,
  CurrencyCode
} from '@/types/database.types';

// ============================================================================
// CONTEXT INTERFACES
// ============================================================================

export interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  summary: TransactionSummary | null;
  
  // CRUD Operations
  addTransaction: (transaction: TransactionCreateData) => Promise<void>;
  updateTransaction: (transaction: TransactionUpdateData) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  
  // Query Operations
  getTransactionsByType: (type: TransactionType) => Promise<Transaction[]>;
  getTransactionsByClient: (clientId: string) => Promise<Transaction[]>;
  getRecentTransactions: (limit?: number) => Promise<Transaction[]>;
  
  // Utility Functions
  getTransactionById: (transactionId: string) => Transaction | undefined;
  refreshTransactions: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  
  // Filtering and Search
  filterTransactions: (filters: TransactionFilters) => Transaction[];
  applyFilters: (filters: TransactionFilters) => void;
  clearFilters: () => void;
  currentFilters: TransactionFilters | null;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  // State Management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [currentFilters, setCurrentFilters] = useState<TransactionFilters | null>(null);

  // Dependencies
  const { user } = useAuth();
  const { toast } = useToast();

  // ============================================================================
  // DATA LOADING FUNCTIONS
  // ============================================================================

  /**
   * Load all transactions from Firestore
   */
  const loadTransactions = useCallback(async (filters?: TransactionFilters) => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await transactionService.getTransactions(user.uid, filters);
      if (result.success) {
        setTransactions(result.transactions);
      } else {
        setError(result.error || 'Failed to load transactions');
        toast({
          title: "Error Loading Transactions",
          description: result.error || 'Failed to load transactions',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = 'Failed to load transactions';
      setError(errorMessage);
      toast({
        title: "Error Loading Transactions",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  /**
   * Load transaction summary and analytics
   */
  const loadSummary = useCallback(async (filters?: TransactionFilters) => {
    if (!user?.uid) return;

    try {
      const result = await transactionService.getTransactionSummary(user.uid, filters);
      if (result.success && result.data) {
        setSummary(result.data);
      } else {
        console.error('Failed to load transaction summary:', result.error);
      }
    } catch (err) {
      console.error('Error loading transaction summary:', err);
    }
  }, [user?.uid]);

  // ============================================================================
  // INITIALIZATION AND SUBSCRIPTIONS
  // ============================================================================

  /**
   * Initialize transactions when user is available
   */
  useEffect(() => {
    if (user?.uid) {
      loadTransactions(currentFilters || undefined);
      loadSummary(currentFilters || undefined);
    } else {
      setTransactions([]);
      setSummary(null);
      setError(null);
    }
  }, [user?.uid, loadTransactions, loadSummary, currentFilters]);

  /**
   * Set up real-time subscription to transaction updates
   */
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = transactionService.subscribeToTransactions(
      user.uid,
      (updatedTransactions) => {
        setTransactions(updatedTransactions);
        setError(null);
        // Refresh summary when transactions update
        loadSummary(currentFilters || undefined);
      },
      currentFilters || undefined,
      (error) => {
        setError(error);
        toast({
          title: "Connection Error",
          description: error,
          variant: "destructive",
        });
      }
    );

    return unsubscribe;
  }, [user?.uid, currentFilters, loadSummary, toast]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Add a new transaction
   */
  const addTransaction = useCallback(async (transactionData: TransactionCreateData) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add transactions.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await transactionService.createTransaction(user.uid, transactionData);
      
      if (result.success) {
        toast({
          title: "Transaction Added",
          description: `${transactionData.type === 'income' ? 'Income' : 'Expense'} of ${transactionData.currency} ${transactionData.amount.toLocaleString()} has been recorded.`,
        });
        // Real-time subscription will update the state
      } else {
        toast({
          title: "Error Adding Transaction",
          description: result.error || 'Failed to add transaction',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error Adding Transaction",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.uid, toast]);

  /**
   * Update an existing transaction
   */
  const updateTransaction = useCallback(async (transactionData: TransactionUpdateData) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to update transactions.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await transactionService.updateTransaction(user.uid, transactionData);
      
      if (result.success) {
        toast({
          title: "Transaction Updated",
          description: "Transaction details have been updated successfully.",
        });
        // Real-time subscription will update the state
      } else {
        toast({
          title: "Error Updating Transaction",
          description: result.error || 'Failed to update transaction',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error Updating Transaction",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.uid, toast]);

  /**
   * Delete a transaction
   */
  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete transactions.",
        variant: "destructive",
      });
      return;
    }

    try {
      const transactionToDelete = transactions.find(t => t.id === transactionId);
      const result = await transactionService.deleteTransaction(user.uid, transactionId);
      
      if (result.success) {
        if (transactionToDelete) {
          toast({
            title: "Transaction Deleted",
            description: `${transactionToDelete.description} has been removed.`,
            variant: "destructive",
          });
        }
        // Real-time subscription will update the state
      } else {
        toast({
          title: "Error Deleting Transaction",
          description: result.error || 'Failed to delete transaction',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error Deleting Transaction",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.uid, transactions, toast]);

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Get transactions by type (income or expense)
   */
  const getTransactionsByType = useCallback(async (type: TransactionType): Promise<Transaction[]> => {
    if (!user?.uid) return [];

    try {
      const result = await transactionService.getTransactionsByType(user.uid, type);
      return result.success ? result.transactions : [];
    } catch (err) {
      console.error('Error fetching transactions by type:', err);
      return [];
    }
  }, [user?.uid]);

  /**
   * Get transactions for a specific client
   */
  const getTransactionsByClient = useCallback(async (clientId: string): Promise<Transaction[]> => {
    if (!user?.uid) return [];

    try {
      const result = await transactionService.getTransactionsByClient(user.uid, clientId);
      return result.success ? result.transactions : [];
    } catch (err) {
      console.error('Error fetching transactions by client:', err);
      return [];
    }
  }, [user?.uid]);

  /**
   * Get recent transactions
   */
  const getRecentTransactions = useCallback(async (limit: number = 10): Promise<Transaction[]> => {
    if (!user?.uid) return [];

    try {
      const result = await transactionService.getRecentTransactions(user.uid, limit);
      return result.success ? result.transactions : [];
    } catch (err) {
      console.error('Error fetching recent transactions:', err);
      return [];
    }
  }, [user?.uid]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get transaction by ID
   */
  const getTransactionById = useCallback((transactionId: string): Transaction | undefined => {
    return transactions.find(t => t.id === transactionId);
  }, [transactions]);

  /**
   * Refresh transactions manually
   */
  const refreshTransactions = useCallback(async () => {
    await loadTransactions(currentFilters || undefined);
  }, [loadTransactions, currentFilters]);

  /**
   * Refresh summary manually
   */
  const refreshSummary = useCallback(async () => {
    await loadSummary(currentFilters || undefined);
  }, [loadSummary, currentFilters]);

  // ============================================================================
  // FILTERING AND SEARCH
  // ============================================================================

  /**
   * Filter transactions client-side
   */
  const filterTransactions = useCallback((filters: TransactionFilters): Transaction[] => {
    return transactions.filter(transaction => {
      // Type filter
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }

      // Client filter
      if (filters.clientId && transaction.clientId !== filters.clientId) {
        return false;
      }

      // Category filter
      if (filters.categoryId && transaction.category !== filters.categoryId) {
        return false;
      }

      // Status filter
      if (filters.status && transaction.status !== filters.status) {
        return false;
      }

      // Currency filter
      if (filters.currency && transaction.currency !== filters.currency) {
        return false;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const transactionDate = transaction.date.toDate ? transaction.date.toDate() : transaction.date;
        
        if (filters.startDate) {
          const startDate = (filters.startDate as any).toDate ? (filters.startDate as any).toDate() : filters.startDate;
          if (transactionDate < startDate) {
            return false;
          }
        }
        
        if (filters.endDate) {
          const endDate = (filters.endDate as any).toDate ? (filters.endDate as any).toDate() : filters.endDate;
          if (transactionDate > endDate) {
            return false;
          }
        }
      }

      // Amount range filter
      if (filters.minAmount !== undefined && transaction.amount < filters.minAmount) {
        return false;
      }
      
      if (filters.maxAmount !== undefined && transaction.amount > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }, [transactions]);

  /**
   * Apply filters and reload data
   */
  const applyFilters = useCallback(async (filters: TransactionFilters) => {
    setCurrentFilters(filters);
    await loadTransactions(filters);
    await loadSummary(filters);
  }, [loadTransactions, loadSummary]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(async () => {
    setCurrentFilters(null);
    await loadTransactions();
    await loadSummary();
  }, [loadTransactions, loadSummary]);

  // ============================================================================
  // CONTEXT PROVIDER
  // ============================================================================

  const contextValue: TransactionContextType = {
    transactions,
    loading,
    error,
    summary,
    
    // CRUD Operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Query Operations
    getTransactionsByType,
    getTransactionsByClient,
    getRecentTransactions,
    
    // Utility Functions
    getTransactionById,
    refreshTransactions,
    refreshSummary,
    
    // Filtering and Search
    filterTransactions,
    applyFilters,
    clearFilters,
    currentFilters
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for income-specific operations
 */
export const useIncomeTransactions = () => {
  const { transactions, getTransactionsByType, filterTransactions } = useTransactions();
  
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  
  const getIncomeByClient = useCallback(async (clientId: string) => {
    const allIncome = await getTransactionsByType('income');
    return allIncome.filter(t => t.clientId === clientId);
  }, [getTransactionsByType]);

  const filterIncome = useCallback((filters: Omit<TransactionFilters, 'type'>) => {
    return filterTransactions({ ...filters, type: 'income' });
  }, [filterTransactions]);

  return {
    incomeTransactions,
    getIncomeByClient,
    filterIncome
  };
};

/**
 * Hook for expense-specific operations
 */
export const useExpenseTransactions = () => {
  const { transactions, getTransactionsByType, filterTransactions } = useTransactions();
  
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const getExpensesByCategory = useCallback((category: string) => {
    return expenseTransactions.filter(t => t.category === category);
  }, [expenseTransactions]);

  const filterExpenses = useCallback((filters: Omit<TransactionFilters, 'type'>) => {
    return filterTransactions({ ...filters, type: 'expense' });
  }, [filterTransactions]);

  return {
    expenseTransactions,
    getExpensesByCategory,
    filterExpenses
  };
};

/**
 * Hook for transaction analytics
 */
export const useTransactionAnalytics = () => {
  const { transactions, summary } = useTransactions();

  const getMonthlyTotals = useCallback((year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = transaction.date.toDate();
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.phpEquivalent, 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.phpEquivalent, 0);

    return {
      income,
      expenses,
      netProfit: income - expenses,
      transactionCount: monthlyTransactions.length
    };
  }, [transactions]);

  const getCategoryTotals = useCallback((type?: TransactionType) => {
    const filteredTransactions = type 
      ? transactions.filter(t => t.type === type)
      : transactions;

    const categoryTotals: Record<string, { total: number; count: number }> = {};

    filteredTransactions.forEach(transaction => {
      if (!categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] = { total: 0, count: 0 };
      }
      categoryTotals[transaction.category].total += transaction.phpEquivalent;
      categoryTotals[transaction.category].count += 1;
    });

    return categoryTotals;
  }, [transactions]);

  return {
    summary,
    getMonthlyTotals,
    getCategoryTotals
  };
};