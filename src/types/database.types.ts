/**
 * Database Type Definitions for Chaching Financial Management Platform
 * 
 * This file contains all TypeScript interface definitions for Firestore database entities.
 * All types are strongly typed with NO 'any', 'unknown', or 'undefined' types allowed.
 * 
 * Architecture: User-scoped data models with complete type safety
 * Dependencies: Firebase Firestore Timestamp types
 * 
 * Type Categories:
 * - Core Entity Types (User, Client, Transaction, etc.)
 * - Enum Types for controlled values
 * - Utility Types for common patterns
 * - Database Operation Types
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// BASE TYPES AND ENUMS
// ============================================================================

/**
 * Supported currencies in the platform
 */
export type CurrencyCode = 'USD' | 'EUR' | 'PHP';

/**
 * Transaction types
 */
export type TransactionType = 'income' | 'expense';

/**
 * Transaction status values
 */
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

/**
 * Client types
 */
export type ClientType = 'individual' | 'business';

/**
 * Client status values
 */
export type ClientStatus = 'active' | 'prospect' | 'inactive' | 'archived';

/**
 * Goal status values
 */
export type GoalStatus = 'active' | 'completed' | 'paused';

/**
 * Goal categories
 */
export type GoalCategory = 'income' | 'savings' | 'expense_reduction' | 'client_acquisition' | 'custom';

/**
 * Invoice status values
 */
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

/**
 * Document categories
 */
export type DocumentCategory = 'contract' | 'receipt' | 'invoice' | 'tax_document' | 'other';

/**
 * Payment methods
 */
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'paypal' | 'gcash' | 'cash' | 'crypto' | 'other';

// ============================================================================
// CORE ENTITY INTERFACES
// ============================================================================

/**
 * User Profile Entity
 * Represents authenticated user with preferences and profile data
 */
export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  businessName?: string;
  address?: string;
  phone?: string;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * User Preferences Configuration
 */
export interface UserPreferences {
  defaultCurrency: CurrencyCode;
  dateFormat: string;
  timeZone: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  language: string;
}

/**
 * Notification Settings
 */
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  weekly: boolean;
  invoiceReminders: boolean;
  goalUpdates: boolean;
  anomalyAlerts: boolean;
}

/**
 * Client Entity
 * Represents freelancer's clients with contact and financial information
 */
export interface Client {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  type: ClientType;
  status: ClientStatus;
  avatarUrl?: string;
  notes?: string;
  paymentTerms?: string;
  preferredPaymentMethod?: PaymentMethod;
  // Financial summary fields (calculated)
  totalEarned: number;
  totalOwed: number;
  monthlyAverage: number;
  lastPaymentDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Transaction Entity
 * Represents all financial transactions (income and expenses)
 */
export interface Transaction {
  id: string;
  userId: string;
  clientId?: string; // Optional - expenses may not have associated client
  amount: number;
  currency: CurrencyCode;
  phpEquivalent: number; // Amount converted to PHP at time of transaction
  exchangeRate: number; // Exchange rate used for conversion
  date: Timestamp;
  description: string;
  type: TransactionType;
  category: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  receiptUrl?: string; // URL to uploaded receipt/invoice
  metadata?: TransactionMetadata;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Transaction Metadata
 * Additional flexible data for transactions
 */
export interface TransactionMetadata {
  invoiceId?: string; // Reference to invoice if income from invoice
  recurringId?: string; // Reference to recurring transaction pattern
  tags?: string[]; // Custom tags for categorization
  taxDeductible?: boolean; // For expense tracking
  projectName?: string; // Project/job reference
  notes?: string; // Additional notes
}

/**
 * Financial Goal Entity
 * Represents user's financial goals and progress tracking
 */
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  targetDate: Timestamp;
  category: GoalCategory;
  status: GoalStatus;
  priority: 'low' | 'medium' | 'high';
  autoTracking: boolean; // Whether progress is automatically calculated
  trackingRules?: GoalTrackingRules;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Goal Tracking Rules
 * Rules for automatic goal progress calculation
 */
export interface GoalTrackingRules {
  includeClients?: string[]; // Client IDs to include in tracking
  includeCategories?: string[]; // Transaction categories to include
  excludeCategories?: string[]; // Transaction categories to exclude
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
}

/**
 * Invoice Entity
 * Represents invoices sent to clients
 */
export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  title?: string;
  description?: string;
  amount: number;
  currency: CurrencyCode;
  phpEquivalent: number;
  exchangeRate: number;
  issueDate: Timestamp;
  dueDate: Timestamp;
  status: InvoiceStatus;
  items: InvoiceItem[];
  taxRate?: number;
  taxAmount?: number;
  discountRate?: number;
  discountAmount?: number;
  notes?: string;
  pdfUrl?: string; // URL to generated PDF
  paymentInstructions?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidAt?: Timestamp;
}

/**
 * Invoice Line Item
 */
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

/**
 * Document Entity
 * Represents uploaded business documents
 */
export interface Document {
  id: string;
  userId: string;
  clientId?: string; // Optional association with client
  filename: string;
  originalFilename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  description?: string;
  tags?: string[];
  uploadDate: Timestamp;
  metadata?: DocumentMetadata;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Document Metadata
 * Additional document information
 */
export interface DocumentMetadata {
  extractedText?: string; // OCR extracted text
  invoiceId?: string; // Reference to related invoice
  transactionId?: string; // Reference to related transaction
  taxYear?: number; // For tax documents
  isConfidential?: boolean;
}

// ============================================================================
// UTILITY AND DERIVED TYPES
// ============================================================================

/**
 * Database entity creation types (without id, timestamps)
 */
export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateClientData = Omit<Client, 'id' | 'userId' | 'totalEarned' | 'totalOwed' | 'monthlyAverage' | 'createdAt' | 'updatedAt'>;
export type CreateTransactionData = Omit<Transaction, 'id' | 'userId' | 'phpEquivalent' | 'exchangeRate' | 'createdAt' | 'updatedAt'>;
export type CreateGoalData = Omit<Goal, 'id' | 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt'>;
export type CreateInvoiceData = Omit<Invoice, 'id' | 'userId' | 'phpEquivalent' | 'exchangeRate' | 'createdAt' | 'updatedAt' | 'paidAt'>;
export type CreateDocumentData = Omit<Document, 'id' | 'userId' | 'uploadDate' | 'createdAt' | 'updatedAt'>;

/**
 * Database entity update types (partial data)
 */
export type UpdateUserData = Partial<Omit<User, 'id' | 'createdAt'>> & { updatedAt: Timestamp };
export type UpdateClientData = Partial<Omit<Client, 'id' | 'userId' | 'createdAt'>> & { updatedAt: Timestamp };
export type UpdateTransactionData = Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>> & { updatedAt: Timestamp };
export type UpdateGoalData = Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>> & { updatedAt: Timestamp };
export type UpdateInvoiceData = Partial<Omit<Invoice, 'id' | 'userId' | 'createdAt'>> & { updatedAt: Timestamp };
export type UpdateDocumentData = Partial<Omit<Document, 'id' | 'userId' | 'uploadDate' | 'createdAt'>> & { updatedAt: Timestamp };

/**
 * Query filter types
 */
export interface TransactionFilters {
  clientId?: string;
  type?: TransactionType;
  category?: string;
  status?: TransactionStatus;
  currency?: CurrencyCode;
  startDate?: Timestamp;
  endDate?: Timestamp;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: PaymentMethod;
}

export interface ClientFilters {
  status?: ClientStatus;
  type?: ClientType;
  paymentMethod?: PaymentMethod;
  search?: string; // Search in name, email, company
}

export interface InvoiceFilters {
  clientId?: string;
  status?: InvoiceStatus;
  startDate?: Timestamp;
  endDate?: Timestamp;
  minAmount?: number;
  maxAmount?: number;
  overdue?: boolean;
}

/**
 * Analytics and summary types
 */
export interface TransactionAnalytics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  averageTransaction: number;
  topCategories: CategorySummary[];
  monthlyTrends: MonthlyTrend[];
  currencyBreakdown: CurrencyBreakdown[];
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  netProfit: number;
  transactionCount: number;
}

export interface CurrencyBreakdown {
  currency: CurrencyCode;
  amount: number;
  phpEquivalent: number;
  percentage: number;
}

export interface ClientSummary {
  client: Client;
  totalEarned: number;
  totalOwed: number;
  lastPayment?: Transaction;
  upcomingInvoices: Invoice[];
  paymentHistory: Transaction[];
  profitMargin?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Timestamp;
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Database operation result
 */
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  operation: 'create' | 'read' | 'update' | 'delete';
}

// ============================================================================
// VALIDATION SCHEMAS (Type-safe)
// ============================================================================

/**
 * Required field validators
 */
export interface RequiredFields {
  User: (keyof CreateUserData)[];
  Client: (keyof CreateClientData)[];
  Transaction: (keyof CreateTransactionData)[];
  Goal: (keyof CreateGoalData)[];
  Invoice: (keyof CreateInvoiceData)[];
  Document: (keyof CreateDocumentData)[];
}

/**
 * Field validation rules
 */
export interface ValidationRules {
  email: RegExp;
  phone: RegExp;
  currency: CurrencyCode[];
  transactionType: TransactionType[];
  clientStatus: ClientStatus[];
  goalStatus: GoalStatus[];
  invoiceStatus: InvoiceStatus[];
}

// ============================================================================
// EXPORT TYPE GUARDS
// ============================================================================

/**
 * Type guard functions for runtime type checking
 */
export const isValidCurrencyCode = (currency: string): currency is CurrencyCode => {
  return ['USD', 'EUR', 'PHP'].includes(currency);
};

export const isValidTransactionType = (type: string): type is TransactionType => {
  return ['income', 'expense'].includes(type);
};

export const isValidClientStatus = (status: string): status is ClientStatus => {
  return ['active', 'prospect', 'inactive', 'archived'].includes(status);
};

export const isValidGoalStatus = (status: string): status is GoalStatus => {
  return ['active', 'completed', 'paused'].includes(status);
};

export const isValidInvoiceStatus = (status: string): status is InvoiceStatus => {
  return ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'].includes(status);
};

/**
 * Type Safety Notes:
 * 
 * 1. All interfaces use strong typing with no 'any' types
 * 2. Enums are implemented as union types for better TypeScript integration
 * 3. Optional fields are explicitly marked with '?'
 * 4. Database timestamps use Firebase Timestamp type
 * 5. Currency amounts are stored as numbers (consider decimal.js for precision in production)
 * 6. All entities include audit fields (createdAt, updatedAt)
 * 7. User scoping is enforced through userId fields in all entities
 * 8. Type guards provide runtime validation for API boundaries
 */