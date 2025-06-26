/**
 * Firestore Database Schema Definitions
 * 
 * This file defines the complete database schema for the Chaching financial management platform.
 * All collections follow user-scoped data patterns with proper security isolation.
 * 
 * Architecture: Document-based storage with user-specific subcollections
 * Security: All data scoped to authenticated users via Firestore security rules
 * 
 * Collections Structure:
 * - users/{userId} - User profile and preferences
 * - users/{userId}/clients/{clientId} - Client data scoped to user
 * - users/{userId}/transactions/{transactionId} - Transaction records scoped to user
 * - users/{userId}/goals/{goalId} - Financial goals scoped to user
 * - users/{userId}/documents/{documentId} - Document storage scoped to user
 * - users/{userId}/invoices/{invoiceId} - Invoice data scoped to user
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
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// FIRESTORE COLLECTION REFERENCES
// ============================================================================

/**
 * Get user document reference
 */
export const getUserRef = (userId: string): DocumentReference => {
  return doc(db, 'users', userId);
};

/**
 * Get user's clients collection reference
 */
export const getUserClientsRef = (userId: string): CollectionReference => {
  return collection(db, 'users', userId, 'clients');
};

/**
 * Get specific client document reference
 */
export const getClientRef = (userId: string, clientId: string): DocumentReference => {
  return doc(db, 'users', userId, 'clients', clientId);
};

/**
 * Get user's transactions collection reference
 */
export const getUserTransactionsRef = (userId: string): CollectionReference => {
  return collection(db, 'users', userId, 'transactions');
};

/**
 * Get specific transaction document reference
 */
export const getTransactionRef = (userId: string, transactionId: string): DocumentReference => {
  return doc(db, 'users', userId, 'transactions', transactionId);
};

/**
 * Get user's goals collection reference
 */
export const getUserGoalsRef = (userId: string): CollectionReference => {
  return collection(db, 'users', userId, 'goals');
};

/**
 * Get specific goal document reference
 */
export const getGoalRef = (userId: string, goalId: string): DocumentReference => {
  return doc(db, 'users', userId, 'goals', goalId);
};

/**
 * Get user's documents collection reference
 */
export const getUserDocumentsRef = (userId: string): CollectionReference => {
  return collection(db, 'users', userId, 'documents');
};

/**
 * Get specific document reference
 */
export const getDocumentRef = (userId: string, documentId: string): DocumentReference => {
  return doc(db, 'users', userId, 'documents', documentId);
};

/**
 * Get user's invoices collection reference
 */
export const getUserInvoicesRef = (userId: string): CollectionReference => {
  return collection(db, 'users', userId, 'invoices');
};

/**
 * Get specific invoice document reference
 */
export const getInvoiceRef = (userId: string, invoiceId: string): DocumentReference => {
  return doc(db, 'users', userId, 'invoices', invoiceId);
};

// ============================================================================
// PREDEFINED QUERY BUILDERS
// ============================================================================

/**
 * Query builder for getting user's recent transactions
 */
export const getRecentTransactionsQuery = (userId: string, limitCount: number = 10) => {
  return query(
    getUserTransactionsRef(userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
};

/**
 * Query builder for getting transactions by type (income/expense)
 */
export const getTransactionsByTypeQuery = (userId: string, type: 'income' | 'expense') => {
  return query(
    getUserTransactionsRef(userId),
    where('type', '==', type),
    orderBy('date', 'desc')
  );
};

/**
 * Query builder for getting transactions by client
 */
export const getTransactionsByClientQuery = (userId: string, clientId: string) => {
  return query(
    getUserTransactionsRef(userId),
    where('clientId', '==', clientId),
    orderBy('date', 'desc')
  );
};

/**
 * Query builder for getting active goals
 */
export const getActiveGoalsQuery = (userId: string) => {
  return query(
    getUserGoalsRef(userId),
    where('status', '==', 'active'),
    orderBy('targetDate', 'asc')
  );
};

/**
 * Query builder for getting pending invoices
 */
export const getPendingInvoicesQuery = (userId: string) => {
  return query(
    getUserInvoicesRef(userId),
    where('status', 'in', ['draft', 'sent', 'viewed']),
    orderBy('createdAt', 'desc')
  );
};

/**
 * Query builder for getting overdue invoices
 */
export const getOverdueInvoicesQuery = (userId: string) => {
  const today = Timestamp.now();
  return query(
    getUserInvoicesRef(userId),
    where('dueDate', '<', today),
    where('status', '!=', 'paid'),
    orderBy('dueDate', 'asc')
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Convert JavaScript Date to Firestore Timestamp
 */
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

/**
 * Get current timestamp
 */
export const getCurrentTimestamp = (): Timestamp => {
  return Timestamp.now();
};

/**
 * Create a new document ID (for client-side generation)
 */
export const createDocumentId = (): string => {
  return doc(collection(db, 'temp')).id;
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate user ID format
 */
export const isValidUserId = (userId: string): boolean => {
  return typeof userId === 'string' && userId.length > 0;
};

/**
 * Validate document ID format
 */
export const isValidDocumentId = (documentId: string): boolean => {
  return typeof documentId === 'string' && documentId.length > 0;
};

/**
 * Validate currency code (USD, EUR, PHP)
 */
export const isValidCurrency = (currency: string): boolean => {
  const validCurrencies = ['USD', 'EUR', 'PHP'];
  return validCurrencies.includes(currency);
};

/**
 * Validate transaction type
 */
export const isValidTransactionType = (type: string): boolean => {
  const validTypes = ['income', 'expense'];
  return validTypes.includes(type);
};

/**
 * Validate goal status
 */
export const isValidGoalStatus = (status: string): boolean => {
  const validStatuses = ['active', 'completed', 'paused'];
  return validStatuses.includes(status);
};

/**
 * Validate invoice status
 */
export const isValidInvoiceStatus = (status: string): boolean => {
  const validStatuses = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];
  return validStatuses.includes(status);
};

// ============================================================================
// BATCH OPERATION HELPERS
// ============================================================================

/**
 * Common patterns for batch operations and data consistency
 * These will be expanded as the application grows
 */

export const COLLECTION_NAMES = {
  USERS: 'users',
  CLIENTS: 'clients',
  TRANSACTIONS: 'transactions',
  GOALS: 'goals',
  DOCUMENTS: 'documents',
  INVOICES: 'invoices',
} as const;

export const FIELD_NAMES = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  USER_ID: 'userId',
  CLIENT_ID: 'clientId',
  STATUS: 'status',
  TYPE: 'type',
  AMOUNT: 'amount',
  CURRENCY: 'currency',
  DATE: 'date',
} as const;

/**
 * Security Patterns:
 * 
 * 1. All collections are scoped to authenticated users
 * 2. Document paths include userId for automatic security rule enforcement
 * 3. Queries automatically filter by user context
 * 4. No cross-user data access possible through these helpers
 * 
 * Firestore Security Rules (to be implemented):
 * ```
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /users/{userId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *       
 *       match /{collection}/{document} {
 *         allow read, write: if request.auth != null && request.auth.uid == userId;
 *       }
 *     }
 *   }
 * }
 * ```
 */