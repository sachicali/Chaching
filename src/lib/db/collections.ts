/**
 * Firebase Firestore Collection References
 * 
 * This file defines the collection structure and references for the Chaching platform.
 * It provides typed collection references and helper functions for database operations.
 */

import { 
  collection, 
  CollectionReference, 
  DocumentData,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Root Collections (shared across users)
export const COLLECTIONS = {
  USERS: 'users',
  EMAIL_HISTORY: 'emailHistory',
  EMAIL_ANALYTICS: 'emailAnalytics', 
  EMAIL_TEMPLATES: 'emailTemplates',
  EXCHANGE_RATES: 'exchangeRates',
  MAIL: 'mail', // Firebase Extensions mail collection
} as const;

// Sub-collections under users (user-isolated data)
export const USER_SUBCOLLECTIONS = {
  CLIENTS: 'clients',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  INVOICES: 'invoices',
  INVOICE_TEMPLATES: 'invoiceTemplates',
  PAYMENTS: 'payments',
  GOALS: 'goals',
  AUDIT_LOGS: 'auditLogs',
} as const;

// Type definitions for collections
export interface FirestoreUser {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
  preferences: {
    defaultCurrency: 'PHP' | 'USD' | 'EUR';
    dateFormat: string;
    timeZone: string;
    theme: 'dark' | 'light';
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      reminderDays: number[];
    };
    language: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreClient {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  type: 'individual' | 'company';
  status: 'prospect' | 'active' | 'inactive';
  // Denormalized financial summaries
  totalEarned: number;
  totalOwed: number;
  monthlyAverage: number;
  lastPaymentDate?: Timestamp;
  preferredPaymentMethod?: string;
  notes?: string;
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreTransaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  currency: 'PHP' | 'USD' | 'EUR';
  phpEquivalent: number;
  exchangeRate: number;
  date: Timestamp;
  description: string;
  category: string;
  categoryId?: string;
  clientId?: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod?: string;
  receiptUrl?: string;
  metadata?: {
    invoiceId?: string;
    taxDeductible?: boolean;
    tags?: string[];
    notes?: string;
    recurring?: boolean;
    recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreCategory {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  description?: string;
  isDefault: boolean;
  parentCategoryId?: string;
  sortOrder: number;
  // Usage statistics (denormalized)
  usageCount: number;
  totalAmount: number;
  lastUsedAt?: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreInvoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientId: string;
  // Denormalized client info
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Timestamp;
  dueDate: Timestamp;
  currency: 'PHP' | 'USD' | 'EUR';
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  };
  total: number;
  totalPHP?: number;
  exchangeRate?: number;
  paymentTerms: string;
  businessInfo: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxId?: string;
    logo?: string;
  };
  templateId?: string;
  pdfUrl?: string;
  remindersSent: Array<{
    sentAt: Timestamp;
    level: number;
    emailHistoryId?: string;
  }>;
  sentAt?: Timestamp;
  viewedAt?: Timestamp;
  paidAt?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestorePayment {
  id: string;
  userId: string;
  invoiceId: string;
  amount: number;
  currency: 'PHP' | 'USD' | 'EUR';
  amountPHP?: number;
  exchangeRate?: number;
  paymentDate: Timestamp;
  paymentMethod: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  processorResponse?: any;
  recordedBy: string;
  recordedAt: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreEmailHistory {
  id: string;
  userId: string;
  emailId: string;
  invoiceId?: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  templateType: string;
  templateId?: string;
  status: 'pending' | 'processing' | 'delivered' | 'failed' | 'bounced';
  sentAt: Timestamp;
  deliveredAt?: Timestamp;
  openedAt?: Timestamp;
  clickedAt?: Timestamp;
  bouncedAt?: Timestamp;
  attachments?: Array<{
    filename: string;
    size: number;
    type: string;
    url?: string;
  }>;
  metadata?: any;
  error?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreExchangeRate {
  id: string;
  date: string; // YYYY-MM-DD
  base: string;
  rates: Record<string, number>;
  source: string;
  fetchedAt: Timestamp;
  createdAt: Timestamp;
}

// Helper functions to get typed collection references
export function getUsersCollection(): CollectionReference<FirestoreUser> {
  return collection(db, COLLECTIONS.USERS) as CollectionReference<FirestoreUser>;
}

export function getClientsCollection(userId: string): CollectionReference<FirestoreClient> {
  return collection(
    db, 
    COLLECTIONS.USERS, 
    userId, 
    USER_SUBCOLLECTIONS.CLIENTS
  ) as CollectionReference<FirestoreClient>;
}

export function getTransactionsCollection(userId: string): CollectionReference<FirestoreTransaction> {
  return collection(
    db, 
    COLLECTIONS.USERS, 
    userId, 
    USER_SUBCOLLECTIONS.TRANSACTIONS
  ) as CollectionReference<FirestoreTransaction>;
}

export function getCategoriesCollection(userId: string): CollectionReference<FirestoreCategory> {
  return collection(
    db, 
    COLLECTIONS.USERS, 
    userId, 
    USER_SUBCOLLECTIONS.CATEGORIES
  ) as CollectionReference<FirestoreCategory>;
}

export function getInvoicesCollection(userId: string): CollectionReference<FirestoreInvoice> {
  return collection(
    db, 
    COLLECTIONS.USERS, 
    userId, 
    USER_SUBCOLLECTIONS.INVOICES
  ) as CollectionReference<FirestoreInvoice>;
}

export function getPaymentsCollection(userId: string): CollectionReference<FirestorePayment> {
  return collection(
    db, 
    COLLECTIONS.USERS, 
    userId, 
    USER_SUBCOLLECTIONS.PAYMENTS
  ) as CollectionReference<FirestorePayment>;
}

export function getGoalsCollection(userId: string): CollectionReference<any> {
  return collection(
    db, 
    COLLECTIONS.USERS, 
    userId, 
    USER_SUBCOLLECTIONS.GOALS
  ) as CollectionReference<any>;
}

export function getEmailHistoryCollection(): CollectionReference<FirestoreEmailHistory> {
  return collection(db, COLLECTIONS.EMAIL_HISTORY) as CollectionReference<FirestoreEmailHistory>;
}

export function getExchangeRatesCollection(): CollectionReference<FirestoreExchangeRate> {
  return collection(db, COLLECTIONS.EXCHANGE_RATES) as CollectionReference<FirestoreExchangeRate>;
}

// Timestamp helpers
export const timestampNow = () => Timestamp.now();
export const timestampFromDate = (date: Date) => Timestamp.fromDate(date);
export const dateFromTimestamp = (timestamp: Timestamp) => timestamp.toDate();