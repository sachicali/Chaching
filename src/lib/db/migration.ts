/**
 * Database Migration Utilities
 * 
 * This file provides utilities for migrating mock data to Firebase Firestore.
 * It includes functions for data transformation, batch operations, and migration tracking.
 */

import { 
  writeBatch, 
  doc, 
  serverTimestamp,
  Timestamp,
  WriteBatch,
  DocumentReference
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  COLLECTIONS,
  USER_SUBCOLLECTIONS,
  FirestoreUser,
  FirestoreClient,
  FirestoreTransaction,
  FirestoreCategory,
  FirestoreInvoice,
  FirestorePayment,
  getUsersCollection,
  getClientsCollection,
  getTransactionsCollection,
  getCategoriesCollection,
  getInvoicesCollection,
  getPaymentsCollection,
  timestampNow,
  timestampFromDate
} from './collections';

// Batch size for Firestore operations (max 500)
const BATCH_SIZE = 450;

// Migration status tracking
export interface MigrationStatus {
  collection: string;
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  startedAt: Date;
  completedAt?: Date;
  errors: Array<{ id: string; error: string }>;
}

// Default categories for new users
export const DEFAULT_CATEGORIES = {
  income: [
    { name: 'Client Work', color: '#10B981', icon: '💼', description: 'Income from client projects' },
    { name: 'Consulting', color: '#3B82F6', icon: '🧑‍💼', description: 'Consulting and advisory services' },
    { name: 'Retainer', color: '#8B5CF6', icon: '📅', description: 'Monthly retainer fees' },
    { name: 'Other Income', color: '#6366F1', icon: '💰', description: 'Miscellaneous income' },
  ],
  expense: [
    { name: 'Software', color: '#EF4444', icon: '💻', description: 'Software subscriptions and tools' },
    { name: 'Hardware', color: '#F59E0B', icon: '🖥️', description: 'Computer equipment and devices' },
    { name: 'Office', color: '#F97316', icon: '🏢', description: 'Office supplies and rent' },
    { name: 'Marketing', color: '#EC4899', icon: '📢', description: 'Marketing and advertising' },
    { name: 'Travel', color: '#14B8A6', icon: '✈️', description: 'Business travel expenses' },
    { name: 'Education', color: '#06B6D4', icon: '📚', description: 'Courses and learning materials' },
    { name: 'Internet', color: '#84CC16', icon: '🌐', description: 'Internet and communication' },
    { name: 'Other Expenses', color: '#6B7280', icon: '📌', description: 'Miscellaneous expenses' },
  ]
};

/**
 * Creates default categories for a new user
 */
export async function createDefaultCategories(userId: string): Promise<void> {
  const batch = writeBatch(db);
  const categoriesRef = getClientsCollection(userId).parent.collection(USER_SUBCOLLECTIONS.CATEGORIES);
  
  let sortOrder = 0;
  
  // Add income categories
  for (const category of DEFAULT_CATEGORIES.income) {
    const categoryRef = doc(categoriesRef);
    batch.set(categoryRef, {
      id: categoryRef.id,
      userId,
      name: category.name,
      type: 'income',
      color: category.color,
      icon: category.icon,
      description: category.description,
      isDefault: true,
      sortOrder: sortOrder++,
      usageCount: 0,
      totalAmount: 0,
      isActive: true,
      createdAt: timestampNow(),
      updatedAt: timestampNow(),
    });
  }
  
  // Add expense categories
  for (const category of DEFAULT_CATEGORIES.expense) {
    const categoryRef = doc(categoriesRef);
    batch.set(categoryRef, {
      id: categoryRef.id,
      userId,
      name: category.name,
      type: 'expense',
      color: category.color,
      icon: category.icon,
      description: category.description,
      isDefault: true,
      sortOrder: sortOrder++,
      usageCount: 0,
      totalAmount: 0,
      isActive: true,
      createdAt: timestampNow(),
      updatedAt: timestampNow(),
    });
  }
  
  await batch.commit();
}

/**
 * Migrate user data from mock to Firestore
 */
export async function migrateUser(mockUser: any): Promise<FirestoreUser> {
  const userRef = doc(getUsersCollection(), mockUser.id);
  const firestoreUser: FirestoreUser = {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name || mockUser.displayName || 'User',
    businessName: mockUser.businessName,
    phone: mockUser.phone,
    preferences: {
      defaultCurrency: mockUser.preferences?.defaultCurrency || 'PHP',
      dateFormat: mockUser.preferences?.dateFormat || 'MM/dd/yyyy',
      timeZone: mockUser.preferences?.timeZone || 'Asia/Manila',
      theme: mockUser.preferences?.theme || 'dark',
      notifications: {
        email: mockUser.preferences?.notifications?.email ?? true,
        sms: mockUser.preferences?.notifications?.sms ?? false,
        push: mockUser.preferences?.notifications?.push ?? true,
        reminderDays: mockUser.preferences?.notifications?.reminderDays || [1, 3, 7],
      },
      language: mockUser.preferences?.language || 'en',
    },
    createdAt: mockUser.createdAt ? timestampFromDate(new Date(mockUser.createdAt)) : timestampNow(),
    updatedAt: timestampNow(),
  };
  
  await userRef.set(firestoreUser);
  return firestoreUser;
}

/**
 * Migrate clients data from mock to Firestore
 */
export async function migrateClients(userId: string, mockClients: any[]): Promise<MigrationStatus> {
  const status: MigrationStatus = {
    collection: 'clients',
    totalRecords: mockClients.length,
    migratedRecords: 0,
    failedRecords: 0,
    startedAt: new Date(),
    errors: [],
  };
  
  const clientsCollection = getClientsCollection(userId);
  let batch = writeBatch(db);
  let batchCount = 0;
  
  for (const mockClient of mockClients) {
    try {
      const clientRef = doc(clientsCollection, mockClient.id);
      const firestoreClient: FirestoreClient = {
        id: mockClient.id,
        userId,
        name: mockClient.name,
        email: mockClient.email,
        phone: mockClient.phone,
        company: mockClient.company,
        address: mockClient.address,
        type: mockClient.type || 'individual',
        status: mockClient.status || 'active',
        totalEarned: mockClient.totalEarned || 0,
        totalOwed: mockClient.totalOwed || 0,
        monthlyAverage: mockClient.monthlyAverage || 0,
        lastPaymentDate: mockClient.lastPaymentDate ? 
          timestampFromDate(new Date(mockClient.lastPaymentDate)) : undefined,
        preferredPaymentMethod: mockClient.preferredPaymentMethod,
        notes: mockClient.notes,
        tags: mockClient.tags || [],
        createdAt: mockClient.createdAt ? 
          timestampFromDate(new Date(mockClient.createdAt)) : timestampNow(),
        updatedAt: timestampNow(),
      };
      
      batch.set(clientRef, firestoreClient);
      batchCount++;
      
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
      
      status.migratedRecords++;
    } catch (error) {
      status.failedRecords++;
      status.errors.push({
        id: mockClient.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
  }
  
  status.completedAt = new Date();
  return status;
}

/**
 * Migrate transactions data from mock to Firestore
 */
export async function migrateTransactions(userId: string, mockTransactions: any[]): Promise<MigrationStatus> {
  const status: MigrationStatus = {
    collection: 'transactions',
    totalRecords: mockTransactions.length,
    migratedRecords: 0,
    failedRecords: 0,
    startedAt: new Date(),
    errors: [],
  };
  
  const transactionsCollection = getTransactionsCollection(userId);
  let batch = writeBatch(db);
  let batchCount = 0;
  
  for (const mockTx of mockTransactions) {
    try {
      const txRef = doc(transactionsCollection, mockTx.id);
      
      // Calculate PHP equivalent if needed
      let phpEquivalent = mockTx.amount;
      let exchangeRate = 1;
      
      if (mockTx.currency !== 'PHP') {
        // Use the exchange rates from the mock data or default rates
        const rates = { USD: 58.75, EUR: 63.50 };
        exchangeRate = rates[mockTx.currency as keyof typeof rates] || 1;
        phpEquivalent = mockTx.amount * exchangeRate;
      }
      
      const firestoreTx: FirestoreTransaction = {
        id: mockTx.id,
        userId,
        type: mockTx.type,
        amount: mockTx.amount,
        currency: mockTx.currency || 'PHP',
        phpEquivalent,
        exchangeRate,
        date: mockTx.date ? timestampFromDate(new Date(mockTx.date)) : timestampNow(),
        description: mockTx.description,
        category: mockTx.category,
        categoryId: mockTx.categoryId,
        clientId: mockTx.clientId,
        status: mockTx.status || 'completed',
        paymentMethod: mockTx.paymentMethod,
        receiptUrl: mockTx.receiptUrl,
        metadata: mockTx.metadata,
        createdAt: mockTx.createdAt ? 
          timestampFromDate(new Date(mockTx.createdAt)) : timestampNow(),
        updatedAt: timestampNow(),
      };
      
      batch.set(txRef, firestoreTx);
      batchCount++;
      
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
      
      status.migratedRecords++;
    } catch (error) {
      status.failedRecords++;
      status.errors.push({
        id: mockTx.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
  }
  
  status.completedAt = new Date();
  return status;
}

/**
 * Migrate invoices data from mock to Firestore
 */
export async function migrateInvoices(userId: string, mockInvoices: any[]): Promise<MigrationStatus> {
  const status: MigrationStatus = {
    collection: 'invoices',
    totalRecords: mockInvoices.length,
    migratedRecords: 0,
    failedRecords: 0,
    startedAt: new Date(),
    errors: [],
  };
  
  const invoicesCollection = getInvoicesCollection();
  let batch = writeBatch(db);
  let batchCount = 0;
  
  for (const mockInvoice of mockInvoices) {
    try {
      const invoiceRef = doc(invoicesCollection, mockInvoice.id);
      
      // Calculate totals in PHP if needed
      let totalPHP = mockInvoice.total;
      let exchangeRate = 1;
      
      if (mockInvoice.currency !== 'PHP') {
        const rates = { USD: 58.75, EUR: 63.50 };
        exchangeRate = rates[mockInvoice.currency as keyof typeof rates] || 1;
        totalPHP = mockInvoice.total * exchangeRate;
      }
      
      const firestoreInvoice: FirestoreInvoice = {
        id: mockInvoice.id,
        userId,
        invoiceNumber: mockInvoice.invoiceNumber,
        clientId: mockInvoice.clientId,
        clientName: mockInvoice.clientName,
        clientEmail: mockInvoice.clientEmail,
        clientCompany: mockInvoice.clientCompany,
        status: mockInvoice.status,
        issueDate: mockInvoice.issueDate ? 
          timestampFromDate(new Date(mockInvoice.issueDate)) : timestampNow(),
        dueDate: mockInvoice.dueDate ? 
          timestampFromDate(new Date(mockInvoice.dueDate)) : timestampNow(),
        currency: mockInvoice.currency || 'PHP',
        lineItems: mockInvoice.lineItems || [],
        subtotal: mockInvoice.subtotal || 0,
        taxRate: mockInvoice.taxRate || 0,
        taxAmount: mockInvoice.taxAmount || 0,
        discount: mockInvoice.discount,
        total: mockInvoice.total,
        totalPHP: mockInvoice.currency !== 'PHP' ? totalPHP : undefined,
        exchangeRate: mockInvoice.currency !== 'PHP' ? exchangeRate : undefined,
        paymentTerms: mockInvoice.paymentTerms || 'Net 30',
        businessInfo: mockInvoice.businessInfo || {
          name: 'My Business',
          email: 'business@example.com',
        },
        templateId: mockInvoice.templateId,
        pdfUrl: mockInvoice.pdfUrl,
        remindersSent: mockInvoice.remindersSent || [],
        sentAt: mockInvoice.sentAt ? 
          timestampFromDate(new Date(mockInvoice.sentAt)) : undefined,
        viewedAt: mockInvoice.viewedAt ? 
          timestampFromDate(new Date(mockInvoice.viewedAt)) : undefined,
        paidAt: mockInvoice.paidAt ? 
          timestampFromDate(new Date(mockInvoice.paidAt)) : undefined,
        notes: mockInvoice.notes,
        createdAt: mockInvoice.createdAt ? 
          timestampFromDate(new Date(mockInvoice.createdAt)) : timestampNow(),
        updatedAt: timestampNow(),
      };
      
      batch.set(invoiceRef, firestoreInvoice);
      batchCount++;
      
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
      
      status.migratedRecords++;
    } catch (error) {
      status.failedRecords++;
      status.errors.push({
        id: mockInvoice.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
  }
  
  status.completedAt = new Date();
  return status;
}

/**
 * Run a complete migration for a user
 */
export async function runUserMigration(
  userId: string, 
  mockData: {
    user?: any;
    clients?: any[];
    transactions?: any[];
    categories?: any[];
    invoices?: any[];
  }
): Promise<Record<string, MigrationStatus>> {
  const results: Record<string, MigrationStatus> = {};
  
  try {
    // Migrate user profile if provided
    if (mockData.user) {
      await migrateUser(mockData.user);
    }
    
    // Create default categories if none provided
    if (!mockData.categories || mockData.categories.length === 0) {
      await createDefaultCategories(userId);
    }
    
    // Migrate clients
    if (mockData.clients && mockData.clients.length > 0) {
      results.clients = await migrateClients(userId, mockData.clients);
    }
    
    // Migrate transactions
    if (mockData.transactions && mockData.transactions.length > 0) {
      results.transactions = await migrateTransactions(userId, mockData.transactions);
    }
    
    // Migrate invoices
    if (mockData.invoices && mockData.invoices.length > 0) {
      results.invoices = await migrateInvoices(userId, mockData.invoices);
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
  
  return results;
}

/**
 * Check if a user's data has been migrated
 */
export async function checkMigrationStatus(userId: string): Promise<{
  migrated: boolean;
  collections: Record<string, number>;
}> {
  const collections = {
    clients: 0,
    transactions: 0,
    categories: 0,
  };
  
  try {
    // Check each subcollection
    const clientsSnapshot = await getClientsCollection(userId).limit(1).get();
    collections.clients = clientsSnapshot.size;
    
    const transactionsSnapshot = await getTransactionsCollection(userId).limit(1).get();
    collections.transactions = transactionsSnapshot.size;
    
    const categoriesSnapshot = await getCategoriesCollection(userId).limit(1).get();
    collections.categories = categoriesSnapshot.size;
    
    const migrated = Object.values(collections).some(count => count > 0);
    
    return { migrated, collections };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return { migrated: false, collections };
  }
}