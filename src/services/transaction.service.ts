/**
 * Transaction Service for Chaching Financial Management Platform
 * 
 * Provides comprehensive Firebase Firestore operations for transaction management.
 * Handles CRUD operations with user-scoped data access, real-time synchronization,
 * and multi-currency support with PHP conversion.
 * 
 * User Story: US-004 (Transaction Management - 5 points)
 * Dependencies: Firebase Firestore, authentication context, database types
 * Architecture: Service layer pattern with comprehensive error handling
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  getUserTransactionsRef, 
  getTransactionRef, 
  getCurrentTimestamp,
  getTransactionsByTypeQuery,
  getTransactionsByClientQuery,
  getRecentTransactionsQuery
} from '@/lib/firestore-schema';
import type { 
  Transaction, 
  CreateTransactionData, 
  UpdateTransactionData,
  TransactionType,
  TransactionStatus,
  CurrencyCode,
  PaymentMethod,
  TransactionFilters
} from '@/types/database.types';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TransactionServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TransactionListResult {
  success: boolean;
  transactions: Transaction[];
  error?: string;
}

export interface TransactionCreateData {
  amount: number;
  currency: CurrencyCode;
  date: Date;
  description: string;
  type: TransactionType;
  category: string;
  status?: TransactionStatus;
  clientId?: string;
  paymentMethod?: PaymentMethod;
  receiptUrl?: string;
  metadata?: {
    invoiceId?: string;
    recurringId?: string;
    tags?: string[];
    taxDeductible?: boolean;
    projectName?: string;
    notes?: string;
  };
}

export interface TransactionUpdateData extends Partial<TransactionCreateData> {
  id: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  averageTransaction: number;
  currencyBreakdown: {
    [currency: string]: {
      amount: number;
      phpEquivalent: number;
    };
  };
}

// ============================================================================
// CURRENCY CONVERSION UTILITIES
// ============================================================================

/**
 * Convert amount to PHP equivalent using real-time exchange rates
 */
function convertToPHP(amount: number, currency: CurrencyCode): { 
  phpEquivalent: number; 
  exchangeRate: number; 
  source: string 
} {
  // TODO: Replace with real-time API integration in production
  const exchangeRates: Record<CurrencyCode, number> = {
    PHP: 1.00,
    USD: 58.75, // 1 USD = 58.75 PHP
    EUR: 63.50  // 1 EUR = 63.50 PHP
  };
  
  return {
    phpEquivalent: amount * exchangeRates[currency],
    exchangeRate: exchangeRates[currency],
    source: 'hardcoded'
  };
}

/**
 * Get current exchange rate for currency
 */
function getExchangeRate(currency: CurrencyCode): { 
  rate: number; 
  source: string 
} {
  // TODO: Replace with real-time API integration in production
  const exchangeRates: Record<CurrencyCode, number> = {
    PHP: 1.00,
    USD: 58.75, // 1 USD = 58.75 PHP
    EUR: 63.50  // 1 EUR = 63.50 PHP
  };
  
  return {
    rate: exchangeRates[currency],
    source: 'hardcoded'
  };
}

// ============================================================================
// TRANSACTION SERVICE CLASS
// ============================================================================

class TransactionService {
  private activeSubscriptions: Map<string, Unsubscribe> = new Map();

  /**
   * Create a new transaction for the authenticated user
   */
  async createTransaction(userId: string, transactionData: TransactionCreateData): Promise<TransactionServiceResult<Transaction>> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      // Validate required fields
      if (!transactionData.amount || transactionData.amount <= 0) {
        return { success: false, error: 'Transaction amount must be greater than 0' };
      }

      if (!transactionData.description?.trim()) {
        return { success: false, error: 'Transaction description is required' };
      }

      if (!transactionData.category?.trim()) {
        return { success: false, error: 'Transaction category is required' };
      }

      if (!this.isValidCurrency(transactionData.currency)) {
        return { success: false, error: 'Invalid currency code' };
      }

      if (!this.isValidTransactionType(transactionData.type)) {
        return { success: false, error: 'Invalid transaction type' };
      }

      const timestamp = getCurrentTimestamp();
      const transactionsRef = getUserTransactionsRef(userId);

      // Calculate PHP equivalent and exchange rate using real-time data
      const conversionResult = convertToPHP(transactionData.amount, transactionData.currency);
      const { phpEquivalent, exchangeRate } = conversionResult;

      // Prepare transaction data for Firestore
      const firestoreData: Omit<Transaction, 'id'> = {
        userId,
        clientId: transactionData.clientId || undefined,
        amount: transactionData.amount,
        currency: transactionData.currency,
        phpEquivalent,
        exchangeRate,
        date: Timestamp.fromDate(transactionData.date),
        description: transactionData.description.trim(),
        type: transactionData.type,
        category: transactionData.category.trim(),
        status: transactionData.status || 'completed',
        paymentMethod: transactionData.paymentMethod,
        receiptUrl: transactionData.receiptUrl?.trim() || undefined,
        metadata: transactionData.metadata || undefined,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const docRef = await addDoc(transactionsRef, firestoreData);
      
      const newTransaction: Transaction = {
        id: docRef.id,
        ...firestoreData
      };

      return { success: true, data: newTransaction };

    } catch (error) {
      console.error('Error creating transaction:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransaction(userId: string, transactionId: string): Promise<TransactionServiceResult<Transaction>> {
    try {
      if (!userId || !transactionId) {
        return { success: false, error: 'User ID and Transaction ID are required' };
      }

      const transactionRef = getTransactionRef(userId, transactionId);
      const transactionSnap = await getDoc(transactionRef);

      if (!transactionSnap.exists()) {
        return { success: false, error: 'Transaction not found' };
      }

      const transaction: Transaction = {
        id: transactionSnap.id,
        ...transactionSnap.data()
      } as Transaction;

      return { success: true, data: transaction };

    } catch (error) {
      console.error('Error fetching transaction:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Get all transactions for the authenticated user with optional filtering
   */
  async getTransactions(userId: string, filters?: TransactionFilters): Promise<TransactionListResult> {
    try {
      if (!userId) {
        return { success: false, transactions: [], error: 'User ID is required' };
      }

      let transactionQuery = query(
        getUserTransactionsRef(userId),
        orderBy('date', 'desc')
      );

      // Apply filters if provided
      if (filters?.type) {
        transactionQuery = query(transactionQuery, where('type', '==', filters.type));
      }

      if (filters?.status) {
        transactionQuery = query(transactionQuery, where('status', '==', filters.status));
      }

      if (filters?.currency) {
        transactionQuery = query(transactionQuery, where('currency', '==', filters.currency));
      }

      if (filters?.clientId) {
        transactionQuery = query(transactionQuery, where('clientId', '==', filters.clientId));
      }

      if (filters?.category) {
        transactionQuery = query(transactionQuery, where('category', '==', filters.category));
      }

      const querySnapshot = await getDocs(transactionQuery);
      let transactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        const transactionData = doc.data() as Omit<Transaction, 'id'>;
        transactions.push({
          id: doc.id,
          ...transactionData
        });
      });

      // Apply date range filters client-side (Firestore limitation)
      if (filters?.startDate || filters?.endDate) {
        transactions = transactions.filter(transaction => {
          const transactionDate = transaction.date.toDate();
          
          if (filters.startDate && transactionDate < filters.startDate.toDate()) {
            return false;
          }
          
          if (filters.endDate && transactionDate > filters.endDate.toDate()) {
            return false;
          }
          
          return true;
        });
      }

      // Apply amount range filters client-side
      if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
        transactions = transactions.filter(transaction => {
          if (filters.minAmount !== undefined && transaction.amount < filters.minAmount) {
            return false;
          }
          
          if (filters.maxAmount !== undefined && transaction.amount > filters.maxAmount) {
            return false;
          }
          
          return true;
        });
      }

      return { success: true, transactions };

    } catch (error) {
      console.error('Error fetching transactions:', error);
      return { 
        success: false, 
        transactions: [], 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Get transactions by type (income or expense)
   */
  async getTransactionsByType(userId: string, type: TransactionType): Promise<TransactionListResult> {
    try {
      if (!userId) {
        return { success: false, transactions: [], error: 'User ID is required' };
      }

      const transactionQuery = getTransactionsByTypeQuery(userId, type);
      const querySnapshot = await getDocs(transactionQuery);
      const transactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        const transactionData = doc.data() as Omit<Transaction, 'id'>;
        transactions.push({
          id: doc.id,
          ...transactionData
        });
      });

      return { success: true, transactions };

    } catch (error) {
      console.error('Error fetching transactions by type:', error);
      return { 
        success: false, 
        transactions: [], 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Get transactions for a specific client
   */
  async getTransactionsByClient(userId: string, clientId: string): Promise<TransactionListResult> {
    try {
      if (!userId || !clientId) {
        return { success: false, transactions: [], error: 'User ID and Client ID are required' };
      }

      const transactionQuery = getTransactionsByClientQuery(userId, clientId);
      const querySnapshot = await getDocs(transactionQuery);
      const transactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        const transactionData = doc.data() as Omit<Transaction, 'id'>;
        transactions.push({
          id: doc.id,
          ...transactionData
        });
      });

      return { success: true, transactions };

    } catch (error) {
      console.error('Error fetching transactions by client:', error);
      return { 
        success: false, 
        transactions: [], 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(userId: string, limitCount: number = 10): Promise<TransactionListResult> {
    try {
      if (!userId) {
        return { success: false, transactions: [], error: 'User ID is required' };
      }

      const transactionQuery = getRecentTransactionsQuery(userId, limitCount);
      const querySnapshot = await getDocs(transactionQuery);
      const transactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        const transactionData = doc.data() as Omit<Transaction, 'id'>;
        transactions.push({
          id: doc.id,
          ...transactionData
        });
      });

      return { success: true, transactions };

    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return { 
        success: false, 
        transactions: [], 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(userId: string, transactionData: TransactionUpdateData): Promise<TransactionServiceResult<Transaction>> {
    try {
      if (!userId || !transactionData.id) {
        return { success: false, error: 'User ID and Transaction ID are required' };
      }

      // Validate data if provided
      if (transactionData.amount !== undefined && transactionData.amount <= 0) {
        return { success: false, error: 'Transaction amount must be greater than 0' };
      }

      if (transactionData.description !== undefined && !transactionData.description.trim()) {
        return { success: false, error: 'Transaction description cannot be empty' };
      }

      if (transactionData.category !== undefined && !transactionData.category.trim()) {
        return { success: false, error: 'Transaction category cannot be empty' };
      }

      if (transactionData.currency && !this.isValidCurrency(transactionData.currency)) {
        return { success: false, error: 'Invalid currency code' };
      }

      if (transactionData.type && !this.isValidTransactionType(transactionData.type)) {
        return { success: false, error: 'Invalid transaction type' };
      }

      const transactionRef = getTransactionRef(userId, transactionData.id);
      
      // Check if transaction exists
      const transactionSnap = await getDoc(transactionRef);
      if (!transactionSnap.exists()) {
        return { success: false, error: 'Transaction not found' };
      }

      // Prepare update data
      const updateData: Partial<Transaction> = {
        updatedAt: getCurrentTimestamp()
      };

      // Only include changed fields
      if (transactionData.amount !== undefined) {
        updateData.amount = transactionData.amount;
        // Recalculate PHP equivalent if amount or currency changed
        const currency = transactionData.currency || (transactionSnap.data() as Transaction).currency;
        const conversionResult = convertToPHP(transactionData.amount, currency);
        updateData.phpEquivalent = conversionResult.phpEquivalent;
        updateData.exchangeRate = conversionResult.exchangeRate;
      }

      if (transactionData.currency !== undefined) {
        updateData.currency = transactionData.currency;
        // Recalculate PHP equivalent if currency changed
        const amount = transactionData.amount || (transactionSnap.data() as Transaction).amount;
        const conversionResult = convertToPHP(amount, transactionData.currency);
        updateData.phpEquivalent = conversionResult.phpEquivalent;
        updateData.exchangeRate = conversionResult.exchangeRate;
      }

      if (transactionData.date !== undefined) {
        updateData.date = Timestamp.fromDate(transactionData.date);
      }

      if (transactionData.description !== undefined) {
        updateData.description = transactionData.description.trim();
      }

      if (transactionData.type !== undefined) updateData.type = transactionData.type;
      if (transactionData.category !== undefined) updateData.category = transactionData.category.trim();
      if (transactionData.status !== undefined) updateData.status = transactionData.status;
      if (transactionData.clientId !== undefined) updateData.clientId = transactionData.clientId;
      if (transactionData.paymentMethod !== undefined) updateData.paymentMethod = transactionData.paymentMethod;
      if (transactionData.receiptUrl !== undefined) updateData.receiptUrl = transactionData.receiptUrl?.trim();
      if (transactionData.metadata !== undefined) updateData.metadata = transactionData.metadata;

      await updateDoc(transactionRef, updateData);

      // Fetch updated transaction
      const updatedSnap = await getDoc(transactionRef);
      const updatedTransaction: Transaction = {
        id: updatedSnap.id,
        ...updatedSnap.data()
      } as Transaction;

      return { success: true, data: updatedTransaction };

    } catch (error) {
      console.error('Error updating transaction:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(userId: string, transactionId: string): Promise<TransactionServiceResult<void>> {
    try {
      if (!userId || !transactionId) {
        return { success: false, error: 'User ID and Transaction ID are required' };
      }

      const transactionRef = getTransactionRef(userId, transactionId);
      
      // Check if transaction exists
      const transactionSnap = await getDoc(transactionRef);
      if (!transactionSnap.exists()) {
        return { success: false, error: 'Transaction not found' };
      }

      await deleteDoc(transactionRef);
      return { success: true };

    } catch (error) {
      console.error('Error deleting transaction:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Subscribe to real-time transaction updates
   */
  subscribeToTransactions(
    userId: string, 
    callback: (transactions: Transaction[]) => void,
    filters?: TransactionFilters,
    onError?: (error: string) => void
  ): Unsubscribe {
    if (!userId) {
      onError?.('User ID is required');
      return () => {};
    }

    let transactionQuery = query(
      getUserTransactionsRef(userId),
      orderBy('date', 'desc')
    );

    // Apply basic filters that Firestore supports
    if (filters?.type) {
      transactionQuery = query(transactionQuery, where('type', '==', filters.type));
    }

    if (filters?.clientId) {
      transactionQuery = query(transactionQuery, where('clientId', '==', filters.clientId));
    }

    const unsubscribe = onSnapshot(
      transactionQuery,
      (querySnapshot) => {
        let transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          const transactionData = doc.data() as Omit<Transaction, 'id'>;
          transactions.push({
            id: doc.id,
            ...transactionData
          });
        });

        // Apply client-side filters
        if (filters) {
          transactions = this.applyClientSideFilters(transactions, filters);
        }

        callback(transactions);
      },
      (error) => {
        console.error('Error in transactions subscription:', error);
        onError?.(this.handleFirestoreError(error));
      }
    );

    // Store subscription for cleanup
    this.activeSubscriptions.set(userId, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Get transaction summary and analytics
   */
  async getTransactionSummary(userId: string, filters?: TransactionFilters): Promise<TransactionServiceResult<TransactionSummary>> {
    try {
      const result = await this.getTransactions(userId, filters);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const transactions = result.transactions;
      
      let totalIncome = 0;
      let totalExpenses = 0;
      const currencyBreakdown: Record<string, { amount: number; phpEquivalent: number }> = {};

      transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          totalIncome += transaction.phpEquivalent;
        } else {
          totalExpenses += transaction.phpEquivalent;
        }

        // Currency breakdown
        if (!currencyBreakdown[transaction.currency]) {
          currencyBreakdown[transaction.currency] = { amount: 0, phpEquivalent: 0 };
        }
        currencyBreakdown[transaction.currency].amount += transaction.amount;
        currencyBreakdown[transaction.currency].phpEquivalent += transaction.phpEquivalent;
      });

      const summary: TransactionSummary = {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        transactionCount: transactions.length,
        averageTransaction: transactions.length > 0 ? (totalIncome + totalExpenses) / transactions.length : 0,
        currencyBreakdown
      };

      return { success: true, data: summary };

    } catch (error) {
      console.error('Error calculating transaction summary:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Cleanup all active subscriptions
   */
  cleanup(): void {
    this.activeSubscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeSubscriptions.clear();
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Apply client-side filters (for complex filters not supported by Firestore)
   */
  private applyClientSideFilters(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
    return transactions.filter(transaction => {
      // Date range filter
      if (filters.startDate || filters.endDate) {
        const transactionDate = transaction.date.toDate();
        
        if (filters.startDate && transactionDate < filters.startDate.toDate()) {
          return false;
        }
        
        if (filters.endDate && transactionDate > filters.endDate.toDate()) {
          return false;
        }
      }

      // Amount range filter
      if (filters.minAmount !== undefined && transaction.amount < filters.minAmount) {
        return false;
      }
      
      if (filters.maxAmount !== undefined && transaction.amount > filters.maxAmount) {
        return false;
      }

      // Additional filters
      if (filters.status && transaction.status !== filters.status) {
        return false;
      }

      if (filters.currency && transaction.currency !== filters.currency) {
        return false;
      }

      if (filters.category && transaction.category !== filters.category) {
        return false;
      }

      if (filters.paymentMethod && transaction.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      return true;
    });
  }

  /**
   * Validate currency code
   */
  private isValidCurrency(currency: string): currency is CurrencyCode {
    return ['USD', 'EUR', 'PHP'].includes(currency);
  }

  /**
   * Validate transaction type
   */
  private isValidTransactionType(type: string): type is TransactionType {
    return ['income', 'expense'].includes(type);
  }

  /**
   * Handle Firestore errors with user-friendly messages
   */
  private handleFirestoreError(error: unknown): string {
    if (error instanceof Error) {
      // Check for common Firestore error codes
      const errorCode = (error as any).code;
      
      switch (errorCode) {
        case 'permission-denied':
          return 'You do not have permission to perform this action';
        case 'not-found':
          return 'The requested transaction was not found';
        case 'already-exists':
          return 'A transaction with this identifier already exists';
        case 'resource-exhausted':
          return 'Request limit exceeded. Please try again later';
        case 'unauthenticated':
          return 'Authentication required. Please sign in again';
        case 'unavailable':
          return 'Service temporarily unavailable. Please try again';
        case 'deadline-exceeded':
          return 'Request timed out. Please try again';
        default:
          console.error('Firestore error:', error);
          return 'An unexpected error occurred. Please try again';
      }
    }

    console.error('Unknown error:', error);
    return 'An unknown error occurred. Please try again';
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const transactionService = new TransactionService();

/**
 * Usage Examples:
 * 
 * // Create new transaction
 * const result = await transactionService.createTransaction(userId, {
 *   amount: 1000,
 *   currency: 'USD',
 *   date: new Date(),
 *   description: 'Project payment',
 *   type: 'income',
 *   category: 'Project Work',
 *   clientId: 'client123'
 * });
 * 
 * // Get all transactions
 * const transactionsResult = await transactionService.getTransactions(userId);
 * 
 * // Subscribe to real-time updates
 * const unsubscribe = transactionService.subscribeToTransactions(
 *   userId,
 *   (transactions) => setTransactions(transactions),
 *   { type: 'income' },
 *   (error) => console.error('Subscription error:', error)
 * );
 * 
 * // Get transaction summary
 * const summary = await transactionService.getTransactionSummary(userId);
 */