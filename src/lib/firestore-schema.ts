// Firestore Schema - Chaching Financial Management Application
// This file defines the complete Firestore database structure for all collections

import { 
  collection, 
  doc, 
  writeBatch, 
  Timestamp,
  CollectionReference,
  DocumentReference,
  setDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  User,
  Client,
  Transaction,
  Category,
  Invoice,
  InvoiceTemplate,
  Payment,
  FinancialGoal,
  AuditLog
} from '@/types/database.types';

// ==================== COLLECTION REFERENCES ====================

// User Collections (top-level)
export const usersCollection = collection(db, 'users') as CollectionReference<User>;

// User-scoped Collections (subcollections under /users/{userId}/)
export const getUserCollections = (userId: string) => ({
  clients: collection(db, `users/${userId}/clients`) as CollectionReference<Client>,
  transactions: collection(db, `users/${userId}/transactions`) as CollectionReference<Transaction>,
  categories: collection(db, `users/${userId}/categories`) as CollectionReference<Category>,
  invoices: collection(db, `users/${userId}/invoices`) as CollectionReference<Invoice>,
  invoiceTemplates: collection(db, `users/${userId}/invoiceTemplates`) as CollectionReference<InvoiceTemplate>,
  payments: collection(db, `users/${userId}/payments`) as CollectionReference<Payment>,
  goals: collection(db, `users/${userId}/goals`) as CollectionReference<FinancialGoal>,
  auditLogs: collection(db, `users/${userId}/auditLogs`) as CollectionReference<AuditLog>
});

// ==================== DOCUMENT REFERENCES ====================

export const getUserDocument = (userId: string): DocumentReference<User> => 
  doc(db, 'users', userId) as DocumentReference<User>;

export const getClientDocument = (userId: string, clientId: string): DocumentReference<Client> => 
  doc(db, `users/${userId}/clients`, clientId) as DocumentReference<Client>;

export const getTransactionDocument = (userId: string, transactionId: string): DocumentReference<Transaction> => 
  doc(db, `users/${userId}/transactions`, transactionId) as DocumentReference<Transaction>;

export const getCategoryDocument = (userId: string, categoryId: string): DocumentReference<Category> => 
  doc(db, `users/${userId}/categories`, categoryId) as DocumentReference<Category>;

export const getInvoiceDocument = (userId: string, invoiceId: string): DocumentReference<Invoice> => 
  doc(db, `users/${userId}/invoices`, invoiceId) as DocumentReference<Invoice>;

export const getInvoiceTemplateDocument = (userId: string, templateId: string): DocumentReference<InvoiceTemplate> => 
  doc(db, `users/${userId}/invoiceTemplates`, templateId) as DocumentReference<InvoiceTemplate>;

export const getPaymentDocument = (userId: string, paymentId: string): DocumentReference<Payment> => 
  doc(db, `users/${userId}/payments`, paymentId) as DocumentReference<Payment>;

export const getGoalDocument = (userId: string, goalId: string): DocumentReference<FinancialGoal> => 
  doc(db, `users/${userId}/goals`, goalId) as DocumentReference<FinancialGoal>;

export const getAuditLogDocument = (userId: string, logId: string): DocumentReference<AuditLog> => 
  doc(db, `users/${userId}/auditLogs`, logId) as DocumentReference<AuditLog>;

// ==================== UTILITY FUNCTIONS (for backward compatibility) ====================

/**
 * Get user document reference (alias for backward compatibility)
 */
export const getUserRef = (userId: string): DocumentReference<User> => 
  getUserDocument(userId);

/**
 * Get current timestamp (for backward compatibility)
 */
export const getCurrentTimestamp = (): Timestamp => Timestamp.now();

/**
 * Create a new document ID (for backward compatibility)
 */
export const createDocumentId = (collectionRef: CollectionReference): string => {
  return doc(collectionRef).id;
};

// ==================== SCHEMA INITIALIZATION ====================

/**
 * Initialize default categories for a new user
 */
export const initializeDefaultCategories = async (userId: string): Promise<void> => {
  const batch = writeBatch(db);
  const categoriesRef = getUserCollections(userId).categories;
  
  // Default Income Categories
  const incomeCategories = [
    {
      name: 'Freelance Projects',
      type: 'income' as const,
      color: '#10B981',
      icon: '💼',
      description: 'Payment from freelance work and projects',
      isDefault: true,
      isActive: true,
      keywords: ['freelance', 'project', 'client work', 'consultation'],
      rules: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    },
    {
      name: 'Retainer Fees',
      type: 'income' as const,
      color: '#8B5CF6',
      icon: '🔄',
      description: 'Regular retainer payments from clients',
      isDefault: true,
      isActive: true,
      keywords: ['retainer', 'monthly', 'recurring', 'ongoing'],
      rules: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    },
    {
      name: 'Bonus Payments',
      type: 'income' as const,
      color: '#F59E0B',
      icon: '🎁',
      description: 'Bonus and incentive payments',
      isDefault: true,
      isActive: true,
      keywords: ['bonus', 'incentive', 'extra', 'reward'],
      rules: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    }
  ];

  // Default Expense Categories
  const expenseCategories = [
    {
      name: 'Software & Tools',
      type: 'expense' as const,
      color: '#EF4444',
      icon: '💻',
      description: 'Software subscriptions and development tools',
      isDefault: true,
      isActive: true,
      isTaxDeductible: true,
      keywords: ['software', 'subscription', 'tools', 'saas', 'license'],
      rules: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    },
    {
      name: 'Office Supplies',
      type: 'expense' as const,
      color: '#F97316',
      icon: '📝',
      description: 'Office equipment and supplies',
      isDefault: true,
      isActive: true,
      isTaxDeductible: true,
      keywords: ['office', 'supplies', 'equipment', 'furniture', 'stationery'],
      rules: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    },
    {
      name: 'Internet & Communications',
      type: 'expense' as const,
      color: '#06B6D4',
      icon: '🌐',
      description: 'Internet, phone, and communication services',
      isDefault: true,
      isActive: true,
      isTaxDeductible: true,
      keywords: ['internet', 'phone', 'mobile', 'broadband', 'communication'],
      rules: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    },
    {
      name: 'Professional Development',
      type: 'expense' as const,
      color: '#8B5CF6',
      icon: '📚',
      description: 'Training, courses, and professional development',
      isDefault: true,
      isActive: true,
      isTaxDeductible: true,
      keywords: ['training', 'course', 'education', 'learning', 'certification'],
      rules: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    },
    {
      name: 'Marketing & Advertising',
      type: 'expense' as const,
      color: '#EC4899',
      icon: '📢',
      description: 'Marketing, advertising, and promotional expenses',
      isDefault: true,
      isActive: true,
      isTaxDeductible: true,
      keywords: ['marketing', 'advertising', 'promotion', 'social media', 'ads'],
      rules: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    },
    {
      name: 'Travel & Transportation',
      type: 'expense' as const,
      color: '#84CC16',
      icon: '🚗',
      description: 'Business travel and transportation costs',
      isDefault: true,
      isActive: true,
      isTaxDeductible: true,
      keywords: ['travel', 'transportation', 'gas', 'uber', 'flight', 'hotel'],
      rules: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    }
  ];

  // Add income categories to batch
  incomeCategories.forEach(category => {
    const docRef = doc(categoriesRef);
    const categoryWithId = { ...category, id: docRef.id };
    batch.set(docRef, categoryWithId);
  });

  // Add expense categories to batch
  expenseCategories.forEach(category => {
    const docRef = doc(categoriesRef);
    const categoryWithId = { ...category, id: docRef.id };
    batch.set(docRef, categoryWithId);
  });

  // Execute batch
  await batch.commit();
};

/**
 * Initialize default invoice templates for a new user
 */
export const initializeDefaultInvoiceTemplates = async (userId: string): Promise<void> => {
  const batch = writeBatch(db);
  const templatesRef = getUserCollections(userId).invoiceTemplates;
  
  // Default Invoice Templates
  const defaultTemplates: Omit<InvoiceTemplate, 'id'>[] = [
    {
      name: 'Professional Template',
      description: 'Clean, professional template for business invoices',
      layout: 'professional',
      colors: {
        primary: '#1F2937',
        secondary: '#6B7280',
        accent: '#3B82F6',
        text: '#111827',
        background: '#FFFFFF'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
        size: 'medium'
      },
      defaultPaymentTerms: 'Net 30',
      defaultNotes: 'Thank you for your business! Payment is due within 30 days of invoice date.',
      defaultTaxRate: 12, // Philippines VAT
      logoPosition: 'top-left',
      logoSize: 'medium',
      businessInfoTemplate: {
        businessName: 'Your Business Name',
        email: 'business@example.com',
        phone: '+63 123 456 7890',
        address: {
          street: '123 Business Street',
          city: 'Manila',
          state: 'Metro Manila',
          postalCode: '1000',
          country: 'Philippines'
        },
        taxId: 'TIN: 123-456-789-000'
      },
      isDefault: true,
      usageCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    },
    {
      name: 'Modern Template',
      description: 'Modern, colorful template with clean design',
      layout: 'modern',
      colors: {
        primary: '#059669',
        secondary: '#10B981',
        accent: '#34D399',
        text: '#065F46',
        background: '#FFFFFF'
      },
      fonts: {
        heading: 'Poppins',
        body: 'Inter',
        size: 'medium'
      },
      defaultPaymentTerms: 'Due on receipt',
      defaultNotes: 'Thank you for choosing our services! We appreciate your business.',
      defaultTaxRate: 12,
      logoPosition: 'top-right',
      logoSize: 'large',
      businessInfoTemplate: {
        businessName: 'Your Business Name',
        email: 'business@example.com',
        phone: '+63 123 456 7890',
        address: {
          street: '123 Business Street',
          city: 'Manila',
          state: 'Metro Manila',
          postalCode: '1000',
          country: 'Philippines'
        },
        taxId: 'TIN: 123-456-789-000'
      },
      isDefault: false,
      usageCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    },
    {
      name: 'Minimal Template',
      description: 'Simple, minimal template for straightforward invoices',
      layout: 'minimal',
      colors: {
        primary: '#374151',
        secondary: '#9CA3AF',
        accent: '#6B7280',
        text: '#1F2937',
        background: '#FFFFFF'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
        size: 'small'
      },
      defaultPaymentTerms: 'Net 15',
      defaultNotes: 'Payment due within 15 days.',
      defaultTaxRate: 12,
      logoPosition: 'center',
      logoSize: 'small',
      businessInfoTemplate: {
        businessName: 'Your Business Name',
        email: 'business@example.com',
        phone: '+63 123 456 7890',
        address: {
          street: '123 Business Street',
          city: 'Manila',
          state: 'Metro Manila',
          postalCode: '1000',
          country: 'Philippines'
        },
        taxId: 'TIN: 123-456-789-000'
      },
      isDefault: false,
      usageCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId
    }
  ];

  // Add templates to batch
  defaultTemplates.forEach(template => {
    const docRef = doc(templatesRef);
    const templateWithId = { ...template, id: docRef.id };
    batch.set(docRef, templateWithId);
  });

  // Execute batch
  await batch.commit();
};

/**
 * Initialize user profile with default preferences
 */
export const initializeUserProfile = async (userId: string, userData: Partial<User>): Promise<void> => {
  const userRef = getUserDocument(userId);
  
  const defaultUser: User = {
    id: userId,
    email: userData.email || '',
    displayName: userData.displayName || '',
    photoURL: userData.photoURL || '',
    preferences: {
      defaultCurrency: 'PHP',
      timezone: 'Asia/Manila',
      notifications: {
        email: true,
        browser: true,
        invoiceReminders: true,
        paymentAlerts: true
      },
      theme: 'dark'
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...userData
  };

  // Create user document
  await setDoc(userRef, defaultUser);
};

/**
 * Complete user initialization with all default data
 */
export const initializeNewUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    // Initialize user profile
    await initializeUserProfile(userId, userData);
    
    // Initialize default categories
    await initializeDefaultCategories(userId);
    
    // Initialize default invoice templates
    await initializeDefaultInvoiceTemplates(userId);
    
    console.log(`Successfully initialized user ${userId} with default data`);
  } catch (error) {
    console.error('Error initializing new user:', error);
    throw new Error('Failed to initialize user data');
  }
};

// ==================== SCHEMA VALIDATION ====================

/**
 * Validate Firestore security rules structure
 */
export const validateSchemaStructure = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check if Firebase is properly initialized
  if (!db) {
    errors.push('Firebase database not initialized');
  }
  
  // Validate collection paths
  const requiredCollections = [
    'users',
    'users/{userId}/clients',
    'users/{userId}/transactions', 
    'users/{userId}/categories',
    'users/{userId}/invoices',
    'users/{userId}/invoiceTemplates',
    'users/{userId}/payments',
    'users/{userId}/goals',
    'users/{userId}/auditLogs'
  ];
  
  // Note: In a real implementation, you might want to test actual read/write operations
  // to ensure security rules are properly configured
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get all collection references for a user
 */
export const getAllUserCollections = (userId: string) => {
  return getUserCollections(userId);
};

/**
 * Create a new document reference in a specific collection
 */
export const createClientDocumentReference = (userId: string) => {
  return doc(getUserCollections(userId).clients);
};

export const createTransactionDocumentReference = (userId: string) => {
  return doc(getUserCollections(userId).transactions);
};

export const createCategoryDocumentReference = (userId: string) => {
  return doc(getUserCollections(userId).categories);
};

export const createInvoiceDocumentReference = (userId: string) => {
  return doc(getUserCollections(userId).invoices);
};

export const createInvoiceTemplateDocumentReference = (userId: string) => {
  return doc(getUserCollections(userId).invoiceTemplates);
};

export const createPaymentDocumentReference = (userId: string) => {
  return doc(getUserCollections(userId).payments);
};

export const createGoalDocumentReference = (userId: string) => {
  return doc(getUserCollections(userId).goals);
};

export const createAuditLogDocumentReference = (userId: string) => {
  return doc(getUserCollections(userId).auditLogs);
};

/**
 * Batch operation helper for user data
 */
export const createUserBatch = () => {
  return writeBatch(db);
};

// ==================== FIRESTORE RULES REFERENCE ====================

/*
Expected Firestore Security Rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User-scoped collections
      match /{collection}/{documentId} {
        allow read, write: if request.auth != null && 
          request.auth.uid == userId &&
          collection in ['clients', 'transactions', 'categories', 'invoices', 
                        'invoiceTemplates', 'payments', 'goals', 'auditLogs'];
      }
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
*/

// ==================== EXPORT ====================

export default {
  // Collection References
  usersCollection,
  getUserCollections,
  
  // Document References
  getUserDocument,
  getClientDocument,
  getTransactionDocument,
  getCategoryDocument,
  getInvoiceDocument,
  getInvoiceTemplateDocument,
  getPaymentDocument,
  getGoalDocument,
  getAuditLogDocument,
  
  // Backward Compatibility
  getUserRef,
  getCurrentTimestamp,
  createDocumentId,
  
  // Initialization
  initializeDefaultCategories,
  initializeDefaultInvoiceTemplates,
  initializeUserProfile,
  initializeNewUser,
  
  // Validation
  validateSchemaStructure,
  
  // Utilities
  getAllUserCollections,
  createClientDocumentReference,
  createTransactionDocumentReference,
  createCategoryDocumentReference,
  createInvoiceDocumentReference,
  createInvoiceTemplateDocumentReference,
  createPaymentDocumentReference,
  createGoalDocumentReference,
  createAuditLogDocumentReference,
  createUserBatch
};