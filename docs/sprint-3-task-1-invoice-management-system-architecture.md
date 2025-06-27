# Sprint 3 Task 1: Invoice Management System Architecture Design

## Executive Summary

**Task**: Sprint 3 Task 1 - Invoice Management System Implementation  
**User Story**: US-005 Invoice Management (8 story points)  
**Sprint Goal**: Complete invoice management foundation with CRUD operations, status tracking, and seamless integration  
**Target Timeline**: Week 1-2 of Sprint 3  
**Dependencies**: TransactionService, ClientService, CategoryService (all completed)

## Project Context

### Current State Analysis
- **Sprint 2**: ✅ COMPLETED with 100% success (10/10 points)
- **Foundation Ready**: Complete transaction management, client system, financial reporting, and expense categorization
- **Architecture Patterns**: Established service layer patterns with Firebase Firestore
- **Integration Points**: Proven integration between TransactionService ↔ ClientService ↔ ReportService

### Target Deliverables
1. **Complete Invoice Data Model** with strong TypeScript typing
2. **InvoiceService** following established service layer patterns
3. **InvoiceContext** for state management and real-time updates
4. **Database Schema** with user-scoped collections and security rules
5. **Component Architecture** ready for UI implementation
6. **Integration Points** with existing transaction and client systems
7. **Philippines Tax Compliance** calculations and support

---

## 1. Data Architecture Design

### Core Invoice Entity

```typescript
/**
 * Invoice Entity - Complete data model for invoice management
 * Extends existing database.types.ts patterns with comprehensive invoice support
 */
export interface Invoice {
  // Primary Identifiers
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string; // Auto-generated: INV-YYYY-NNNN format
  
  // Invoice Metadata
  title?: string;
  description?: string;
  
  // Financial Calculations
  subtotal: number;
  taxRate: number; // Decimal (0.12 for 12% Philippines VAT)
  taxAmount: number; // Calculated: subtotal * taxRate
  discountRate?: number; // Optional discount percentage
  discountAmount?: number; // Calculated discount amount
  totalAmount: number; // Final total after tax and discount
  
  // Multi-Currency Support
  currency: CurrencyCode; // USD, EUR, PHP
  phpEquivalent: number; // Converted amount at transaction time
  exchangeRate: number; // Rate used for conversion
  
  // Line Items and Services
  items: InvoiceLineItem[];
  
  // Dates and Timeline
  issueDate: Timestamp;
  dueDate: Timestamp;
  sentAt?: Timestamp; // When invoice was sent to client
  viewedAt?: Timestamp; // When client first viewed invoice
  paidAt?: Timestamp; // When payment was received
  
  // Status Management
  status: InvoiceStatus;
  
  // Payment Information
  paymentTerms: string; // "Net 30", "Due on Receipt", "Net 15", etc.
  paymentInstructions?: string; // Bank details, payment methods
  
  // Integration References
  linkedTransactionId?: string; // Links to Transaction when paid
  templateId?: string; // Reference to invoice template used
  
  // File Management
  pdfUrl?: string; // URL to generated PDF invoice
  
  // Audit Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Invoice Line Item - Individual services/products on invoice
 */
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number; // Calculated: quantity * unitPrice
  category?: string; // Links to existing CategoryService
  taxable: boolean; // Whether this item is subject to tax
}

/**
 * Invoice Status Enum - Complete lifecycle management
 */
export type InvoiceStatus = 
  | 'draft'     // Being created/edited
  | 'sent'      // Sent to client
  | 'viewed'    // Client has viewed the invoice
  | 'paid'      // Payment received
  | 'overdue'   // Past due date without payment
  | 'cancelled'; // Invoice cancelled

/**
 * Invoice Creation Data - Input for creating new invoices
 */
export interface InvoiceCreateData {
  clientId: string;
  title?: string;
  description?: string;
  items: Omit<InvoiceLineItem, 'id' | 'total'>[]; // Auto-calculate totals
  currency: CurrencyCode;
  dueDate: Date;
  taxRate: number;
  discountRate?: number;
  paymentTerms: string;
  paymentInstructions?: string;
  templateId?: string;
}

/**
 * Invoice Update Data - Partial updates with ID requirement
 */
export interface InvoiceUpdateData extends Partial<InvoiceCreateData> {
  id: string;
  status?: InvoiceStatus;
}

/**
 * Invoice Filters - Query filtering options
 */
export interface InvoiceFilters {
  clientId?: string;
  status?: InvoiceStatus;
  startDate?: Timestamp; // Issue date range
  endDate?: Timestamp;
  minAmount?: number;
  maxAmount?: number;
  overdue?: boolean; // Filter for overdue invoices
  currency?: CurrencyCode;
  search?: string; // Search in invoice number, description, client name
}

/**
 * Invoice Analytics - Business intelligence data
 */
export interface InvoiceAnalytics {
  // Summary Metrics
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  pendingAmount: number;
  
  // Performance Metrics
  averagePaymentTime: number; // Days from sent to paid
  averageInvoiceValue: number;
  
  // Status Breakdown
  statusBreakdown: {
    [status in InvoiceStatus]: {
      count: number;
      amount: number;
      percentage: number;
    };
  };
  
  // Client Analysis
  clientBreakdown: Array<{
    clientId: string;
    clientName: string;
    invoiceCount: number;
    totalAmount: number;
    paidAmount: number;
    averagePaymentTime: number;
  }>;
  
  // Time-based Analysis
  monthlyTrends: Array<{
    month: string;
    invoiceCount: number;
    totalAmount: number;
    paidAmount: number;
  }>;
}
```

### Supporting Calculation Types

```typescript
/**
 * Invoice Calculation Result - For tax and total calculations
 */
export interface InvoiceCalculation {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  lineItemTotals: number[];
}

/**
 * Payment Information - For invoice payment processing
 */
export interface InvoicePayment {
  invoiceId: string;
  amount: number;
  currency: CurrencyCode;
  paymentDate: Date;
  paymentMethod?: PaymentMethod;
  transactionId?: string; // If creating linked transaction
  notes?: string;
}
```

---

## 2. Service Layer Architecture

### InvoiceService Class Design

Following the established patterns from TransactionService and ClientService:

```typescript
/**
 * Invoice Service - Comprehensive invoice management
 * File: src/services/invoice.service.ts
 * 
 * Provides complete CRUD operations, status management, and business logic
 * for invoice lifecycle management with seamless integration to existing systems.
 */

export interface InvoiceServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface InvoiceListResult {
  success: boolean;
  invoices: Invoice[];
  error?: string;
}

class InvoiceService {
  private activeSubscriptions: Map<string, Unsubscribe> = new Map();

  // ============================================================================
  // CORE CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new invoice with automatic calculations
   */
  async createInvoice(
    userId: string, 
    invoiceData: InvoiceCreateData
  ): Promise<InvoiceServiceResult<Invoice>>

  /**
   * Get a specific invoice by ID
   */
  async getInvoice(
    userId: string, 
    invoiceId: string
  ): Promise<InvoiceServiceResult<Invoice>>

  /**
   * Get all invoices with optional filtering
   */
  async getInvoices(
    userId: string, 
    filters?: InvoiceFilters
  ): Promise<InvoiceListResult>

  /**
   * Update an existing invoice with recalculations
   */
  async updateInvoice(
    userId: string, 
    invoiceData: InvoiceUpdateData
  ): Promise<InvoiceServiceResult<Invoice>>

  /**
   * Delete an invoice (soft delete for audit trail)
   */
  async deleteInvoice(
    userId: string, 
    invoiceId: string
  ): Promise<InvoiceServiceResult<void>>

  // ============================================================================
  // STATUS MANAGEMENT OPERATIONS
  // ============================================================================

  /**
   * Send invoice to client (draft → sent)
   */
  async sendInvoice(
    userId: string, 
    invoiceId: string,
    options?: { sendEmail?: boolean; emailMessage?: string }
  ): Promise<InvoiceServiceResult<Invoice>>

  /**
   * Mark invoice as viewed by client (sent → viewed)
   */
  async markInvoiceViewed(
    userId: string, 
    invoiceId: string
  ): Promise<InvoiceServiceResult<Invoice>>

  /**
   * Mark invoice as paid and optionally create transaction
   */
  async markInvoicePaid(
    userId: string, 
    invoiceId: string,
    paymentData?: InvoicePayment
  ): Promise<InvoiceServiceResult<Invoice>>

  /**
   * Mark invoice as overdue (automatic via scheduled job)
   */
  async markInvoiceOverdue(
    userId: string, 
    invoiceId: string
  ): Promise<InvoiceServiceResult<Invoice>>

  /**
   * Cancel an invoice
   */
  async cancelInvoice(
    userId: string, 
    invoiceId: string,
    reason?: string
  ): Promise<InvoiceServiceResult<Invoice>>

  // ============================================================================
  // SPECIALIZED QUERY OPERATIONS
  // ============================================================================

  /**
   * Get all invoices for a specific client
   */
  async getInvoicesByClient(
    userId: string, 
    clientId: string
  ): Promise<InvoiceListResult>

  /**
   * Get all overdue invoices
   */
  async getOverdueInvoices(
    userId: string
  ): Promise<InvoiceListResult>

  /**
   * Get pending invoices (sent/viewed but not paid)
   */
  async getPendingInvoices(
    userId: string
  ): Promise<InvoiceListResult>

  /**
   * Get recent invoices with limit
   */
  async getRecentInvoices(
    userId: string, 
    limit?: number
  ): Promise<InvoiceListResult>

  // ============================================================================
  // BUSINESS LOGIC OPERATIONS
  // ============================================================================

  /**
   * Generate unique invoice number
   */
  async generateInvoiceNumber(
    userId: string
  ): Promise<string>

  /**
   * Calculate invoice totals with tax and discount
   */
  async calculateInvoiceTotals(
    items: InvoiceLineItem[],
    taxRate: number,
    discountRate?: number
  ): Promise<InvoiceCalculation>

  /**
   * Duplicate an existing invoice as draft
   */
  async duplicateInvoice(
    userId: string, 
    invoiceId: string,
    modifications?: Partial<InvoiceCreateData>
  ): Promise<InvoiceServiceResult<Invoice>>

  /**
   * Convert quote/estimate to invoice
   */
  async convertToInvoice(
    userId: string, 
    sourceId: string,
    type: 'quote' | 'estimate'
  ): Promise<InvoiceServiceResult<Invoice>>

  // ============================================================================
  // INTEGRATION OPERATIONS
  // ============================================================================

  /**
   * Create income transaction from paid invoice
   */
  async createTransactionFromInvoice(
    userId: string, 
    invoiceId: string,
    paymentData?: Partial<TransactionCreateData>
  ): Promise<InvoiceServiceResult<Transaction>>

  /**
   * Link existing transaction to invoice
   */
  async linkInvoiceToTransaction(
    userId: string, 
    invoiceId: string, 
    transactionId: string
  ): Promise<InvoiceServiceResult<void>>

  /**
   * Update client financial totals when invoice status changes
   */
  async updateClientFinancials(
    userId: string, 
    clientId: string, 
    invoiceId: string,
    oldStatus: InvoiceStatus,
    newStatus: InvoiceStatus
  ): Promise<InvoiceServiceResult<void>>

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  /**
   * Get comprehensive invoice analytics
   */
  async getInvoiceAnalytics(
    userId: string, 
    filters?: InvoiceFilters
  ): Promise<InvoiceServiceResult<InvoiceAnalytics>>

  /**
   * Get invoice aging report
   */
  async getInvoiceAgingReport(
    userId: string
  ): Promise<InvoiceServiceResult<InvoiceAgingReport>>

  /**
   * Get client payment history analysis
   */
  async getClientPaymentAnalysis(
    userId: string, 
    clientId: string
  ): Promise<InvoiceServiceResult<ClientPaymentAnalysis>>

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to invoice updates with filters
   */
  subscribeToInvoices(
    userId: string,
    callback: (invoices: Invoice[]) => void,
    filters?: InvoiceFilters,
    onError?: (error: string) => void
  ): Unsubscribe

  /**
   * Subscribe to specific invoice updates
   */
  subscribeToInvoice(
    userId: string,
    invoiceId: string,
    callback: (invoice: Invoice | null) => void,
    onError?: (error: string) => void
  ): Unsubscribe

  /**
   * Subscribe to invoice analytics updates
   */
  subscribeToInvoiceAnalytics(
    userId: string,
    callback: (analytics: InvoiceAnalytics) => void,
    filters?: InvoiceFilters,
    onError?: (error: string) => void
  ): Unsubscribe

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Validate invoice data before operations
   */
  private validateInvoiceData(invoiceData: InvoiceCreateData | InvoiceUpdateData): ValidationResult

  /**
   * Calculate exchange rate and PHP equivalent
   */
  private calculateCurrencyConversion(amount: number, currency: CurrencyCode): CurrencyConversion

  /**
   * Handle Firestore errors with user-friendly messages
   */
  private handleFirestoreError(error: unknown): string

  /**
   * Clean up all active subscriptions
   */
  cleanup(): void
}

// Export singleton instance
export const invoiceService = new InvoiceService();
```

### Key Integration Points

#### 1. TransactionService Integration
```typescript
// When invoice is marked paid, automatically create income transaction
async markInvoicePaid(userId: string, invoiceId: string, paymentData?: InvoicePayment) {
  // Update invoice status
  const invoice = await this.updateInvoice(userId, {
    id: invoiceId,
    status: 'paid',
    paidAt: getCurrentTimestamp()
  });

  // Create corresponding transaction
  if (invoice.success && invoice.data) {
    await transactionService.createTransaction(userId, {
      amount: invoice.data.totalAmount,
      currency: invoice.data.currency,
      type: 'income',
      date: paymentData?.paymentDate || new Date(),
      description: `Payment for Invoice ${invoice.data.invoiceNumber}`,
      category: 'Invoice Payment',
      clientId: invoice.data.clientId,
      paymentMethod: paymentData?.paymentMethod,
      metadata: {
        invoiceId: invoice.data.id,
        invoiceNumber: invoice.data.invoiceNumber
      }
    });
  }
}
```

#### 2. ClientService Integration
```typescript
// Update client financial totals when invoice status changes
async updateClientFinancials(userId: string, clientId: string, invoiceId: string, oldStatus: InvoiceStatus, newStatus: InvoiceStatus) {
  const invoice = await this.getInvoice(userId, invoiceId);
  if (!invoice.success || !invoice.data) return;

  const client = await clientService.getClient(userId, clientId);
  if (!client.success || !client.data) return;

  let totalOwedDelta = 0;
  let totalEarnedDelta = 0;

  // Calculate changes based on status transition
  if (oldStatus === 'draft' && ['sent', 'viewed'].includes(newStatus)) {
    totalOwedDelta = invoice.data.totalAmount; // Client now owes this amount
  } else if (['sent', 'viewed'].includes(oldStatus) && newStatus === 'paid') {
    totalOwedDelta = -invoice.data.totalAmount; // Client no longer owes
    totalEarnedDelta = invoice.data.phpEquivalent; // Add to total earned
  }

  // Update client financials
  if (totalOwedDelta !== 0 || totalEarnedDelta !== 0) {
    await clientService.updateClientFinancials(userId, clientId, {
      totalOwed: client.data.totalOwed + totalOwedDelta,
      totalEarned: client.data.totalEarned + totalEarnedDelta,
      lastPaymentDate: newStatus === 'paid' ? getCurrentTimestamp() : client.data.lastPaymentDate
    });
  }
}
```

#### 3. CategoryService Integration
```typescript
// Invoice line items can use existing categories for better reporting
async createInvoice(userId: string, invoiceData: InvoiceCreateData) {
  // Validate categories exist in user's category system
  for (const item of invoiceData.items) {
    if (item.category) {
      const categoryExists = await categoryService.getCategoryByName(userId, item.category);
      if (!categoryExists.success) {
        // Auto-create category or suggest existing ones
        await categoryService.createCategory(userId, {
          name: item.category,
          type: 'income',
          color: '#3B82F6',
          icon: 'invoice',
          isDefault: false
        });
      }
    }
  }
  
  // Continue with invoice creation...
}
```

---

## 3. Database Schema Design

### Firestore Collections Structure

Following the established user-scoped pattern from existing services:

```typescript
/**
 * Firestore Schema Extensions for Invoice Management
 * File: src/lib/firestore-schema.ts (additions)
 */

// ============================================================================
// COLLECTION REFERENCES
// ============================================================================

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
 * Get pending invoices (sent but not paid)
 */
export const getPendingInvoicesQuery = (userId: string) => {
  return query(
    getUserInvoicesRef(userId),
    where('status', 'in', ['sent', 'viewed']),
    orderBy('dueDate', 'asc')
  );
};

/**
 * Get overdue invoices
 */
export const getOverdueInvoicesQuery = (userId: string) => {
  const today = Timestamp.now();
  return query(
    getUserInvoicesRef(userId),
    where('status', '!=', 'paid'),
    where('status', '!=', 'cancelled'),
    where('dueDate', '<', today),
    orderBy('dueDate', 'asc')
  );
};

/**
 * Get invoices by client
 */
export const getInvoicesByClientQuery = (userId: string, clientId: string) => {
  return query(
    getUserInvoicesRef(userId),
    where('clientId', '==', clientId),
    orderBy('issueDate', 'desc')
  );
};

/**
 * Get invoices by status
 */
export const getInvoicesByStatusQuery = (userId: string, status: InvoiceStatus) => {
  return query(
    getUserInvoicesRef(userId),
    where('status', '==', status),
    orderBy('issueDate', 'desc')
  );
};

/**
 * Get recent invoices
 */
export const getRecentInvoicesQuery = (userId: string, limitCount: number = 10) => {
  return query(
    getUserInvoicesRef(userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
};

/**
 * Get invoices by date range
 */
export const getInvoicesByDateRangeQuery = (
  userId: string, 
  startDate: Timestamp, 
  endDate: Timestamp
) => {
  return query(
    getUserInvoicesRef(userId),
    where('issueDate', '>=', startDate),
    where('issueDate', '<=', endDate),
    orderBy('issueDate', 'desc')
  );
};

/**
 * Get invoices by amount range
 */
export const getInvoicesByAmountRangeQuery = (
  userId: string, 
  minAmount: number, 
  maxAmount: number
) => {
  return query(
    getUserInvoicesRef(userId),
    where('totalAmount', '>=', minAmount),
    where('totalAmount', '<=', maxAmount),
    orderBy('totalAmount', 'desc')
  );
};
```

### Enhanced Database Types

```typescript
/**
 * Database Type Extensions
 * File: src/types/database.types.ts (additions)
 */

// Add invoice-related types to existing type system

export type CreateInvoiceData = Omit<Invoice, 'id' | 'userId' | 'invoiceNumber' | 'phpEquivalent' | 'exchangeRate' | 'subtotal' | 'taxAmount' | 'totalAmount' | 'createdAt' | 'updatedAt'>;

export type UpdateInvoiceData = Partial<Omit<Invoice, 'id' | 'userId' | 'createdAt'>> & { 
  updatedAt: Timestamp 
};

// Extend existing filters
export interface InvoiceFilters extends BaseFilters {
  clientId?: string;
  status?: InvoiceStatus;
  startDate?: Timestamp;
  endDate?: Timestamp;
  minAmount?: number;
  maxAmount?: number;
  overdue?: boolean;
  currency?: CurrencyCode;
  search?: string;
}

// Analytics interfaces
export interface InvoiceAgingReport {
  current: { count: number; amount: number };      // Not due yet
  overdue1to30: { count: number; amount: number }; // 1-30 days overdue
  overdue31to60: { count: number; amount: number }; // 31-60 days overdue
  overdue61to90: { count: number; amount: number }; // 61-90 days overdue
  overdue90plus: { count: number; amount: number }; // 90+ days overdue
}

export interface ClientPaymentAnalysis {
  clientId: string;
  clientName: string;
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  averagePaymentTime: number; // Days
  paymentReliability: 'excellent' | 'good' | 'fair' | 'poor';
  paymentHistory: Array<{
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    issueDate: Timestamp;
    dueDate: Timestamp;
    paidDate?: Timestamp;
    daysToPayment?: number;
    status: InvoiceStatus;
  }>;
}
```

### Security Rules Enhancement

```javascript
/**
 * Enhanced Firestore Security Rules
 * File: firestore.rules (additions)
 */

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Existing user rules...
      
      // Invoice collection security
      match /invoices/{invoiceId} {
        // Basic read/write permissions for authenticated user
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Create invoice - ensure user ID matches and required fields present
        allow create: if request.auth != null && 
          request.auth.uid == userId && 
          request.resource.data.userId == userId &&
          request.resource.data.clientId is string &&
          request.resource.data.items is list &&
          request.resource.data.items.size() > 0;
        
        // Update invoice - preserve user ID and audit fields
        allow update: if request.auth != null && 
          request.auth.uid == userId && 
          resource.data.userId == userId &&
          request.resource.data.userId == userId;
          
        // Delete invoice - only allow soft delete by setting status
        allow delete: if request.auth != null && 
          request.auth.uid == userId && 
          resource.data.userId == userId;
          
        // Prevent unauthorized status changes (business rule enforcement)
        allow update: if request.auth != null && 
          request.auth.uid == userId &&
          // Draft can become sent
          (resource.data.status == 'draft' && request.resource.data.status == 'sent') ||
          // Sent can become viewed or paid
          (resource.data.status == 'sent' && request.resource.data.status in ['viewed', 'paid']) ||
          // Viewed can become paid
          (resource.data.status == 'viewed' && request.resource.data.status == 'paid') ||
          // Any status can become cancelled (except paid)
          (resource.data.status != 'paid' && request.resource.data.status == 'cancelled') ||
          // Overdue marking (system operation)
          (request.resource.data.status == 'overdue');
      }
    }
  }
}
```

---

## 4. State Management Architecture

### InvoiceContext Design

Following the established pattern from TransactionContext and ClientContext:

```typescript
/**
 * Invoice Context - Global state management for invoices
 * File: src/contexts/InvoiceContext.tsx
 */

export interface InvoiceContextType {
  // State
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  analytics: InvoiceAnalytics | null;
  currentFilters: InvoiceFilters | null;

  // CRUD Operations
  createInvoice: (invoice: InvoiceCreateData) => Promise<void>;
  updateInvoice: (invoice: InvoiceUpdateData) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  duplicateInvoice: (invoiceId: string, modifications?: Partial<InvoiceCreateData>) => Promise<void>;

  // Status Management
  sendInvoice: (invoiceId: string, options?: { sendEmail?: boolean }) => Promise<void>;
  markInvoiceViewed: (invoiceId: string) => Promise<void>;
  markInvoicePaid: (invoiceId: string, paymentData?: InvoicePayment) => Promise<void>;
  cancelInvoice: (invoiceId: string, reason?: string) => Promise<void>;

  // Query Operations
  getInvoicesByClient: (clientId: string) => Promise<Invoice[]>;
  getOverdueInvoices: () => Promise<Invoice[]>;
  getPendingInvoices: () => Promise<Invoice[]>;
  getRecentInvoices: (limit?: number) => Promise<Invoice[]>;

  // Utility Functions
  getInvoiceById: (invoiceId: string) => Invoice | undefined;
  generateInvoiceNumber: () => Promise<string>;
  calculateInvoiceTotals: (items: InvoiceLineItem[], taxRate: number, discountRate?: number) => Promise<InvoiceCalculation>;
  refreshInvoices: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;

  // Filtering and Search
  filterInvoices: (filters: InvoiceFilters) => Invoice[];
  applyFilters: (filters: InvoiceFilters) => void;
  clearFilters: () => void;
  searchInvoices: (searchTerm: string) => Invoice[];

  // Integration Helpers
  createTransactionFromInvoice: (invoiceId: string) => Promise<void>;
  linkToTransaction: (invoiceId: string, transactionId: string) => Promise<void>;
}

export const InvoiceProvider = ({ children }: { children: ReactNode }) => {
  // State management following TransactionContext pattern
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<InvoiceAnalytics | null>(null);
  const [currentFilters, setCurrentFilters] = useState<InvoiceFilters | null>(null);

  // Dependencies
  const { user } = useAuth();
  const { toast } = useToast();
  const { clients } = useClients();
  const { addTransaction } = useTransactions();

  // Implementation follows established patterns...
};

// Custom hooks for specialized invoice operations
export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
};

export const useInvoiceAnalytics = () => {
  const { analytics, refreshAnalytics } = useInvoices();
  // Specialized analytics operations
};

export const useOverdueInvoices = () => {
  const { invoices, getOverdueInvoices } = useInvoices();
  // Specialized overdue invoice operations
};
```

### Integration with Existing Contexts

```typescript
/**
 * Context Integration Points
 */

// 1. Client Integration
const { clients, getClientById } = useClients();
const { createInvoice } = useInvoices();

const handleCreateInvoiceForClient = async (clientId: string) => {
  const client = getClientById(clientId);
  if (client) {
    await createInvoice({
      clientId,
      items: [/* default items */],
      currency: 'PHP',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      taxRate: 0.12, // 12% Philippines VAT
      paymentTerms: 'Net 30'
    });
  }
};

// 2. Transaction Integration
const { addTransaction } = useTransactions();
const { markInvoicePaid } = useInvoices();

const handleInvoicePayment = async (invoiceId: string, paymentData: InvoicePayment) => {
  // Mark invoice as paid (will auto-create transaction)
  await markInvoicePaid(invoiceId, paymentData);
  
  // Optional: Additional transaction processing
  toast({
    title: "Invoice Paid",
    description: "Payment has been recorded and transaction created.",
  });
};

// 3. Category Integration
const { categories } = useCategories();
const { calculateInvoiceTotals } = useInvoices();

const handleLineItemCategoryChange = async (itemIndex: number, categoryName: string) => {
  // Update line item with category from existing category system
  const updatedItems = [...items];
  updatedItems[itemIndex].category = categoryName;
  
  // Recalculate totals
  const calculation = await calculateInvoiceTotals(updatedItems, taxRate, discountRate);
  // Update UI with new calculations
};
```

---

## 5. Component Architecture

### Page Structure

```
src/app/(app)/invoices/
├── page.tsx                     # Invoice dashboard (list view)
├── create/
│   └── page.tsx                # Invoice creation form
├── [invoiceId]/
│   ├── page.tsx                # Invoice detail/edit view
│   ├── edit/
│   │   └── page.tsx            # Edit mode
│   └── preview/
│       └── page.tsx            # Invoice preview (for PDF generation)
└── analytics/
    └── page.tsx                # Invoice analytics dashboard
```

### Component Hierarchy

```
src/components/invoices/
├── InvoiceList.tsx              # Main invoice list with filters
├── InvoiceCard.tsx              # Individual invoice card component
├── InvoiceForm.tsx              # Create/edit invoice form
├── InvoicePreview.tsx           # Invoice preview component
├── InvoiceStatusBadge.tsx       # Status indicator component
├── InvoiceActions.tsx           # Action buttons (send, mark paid, etc.)
├── InvoiceLineItems.tsx         # Line item management component
├── InvoiceCalculator.tsx        # Tax and discount calculation component
├── InvoiceFilters.tsx           # Filter interface component
├── InvoiceAnalytics.tsx         # Analytics dashboard component
├── InvoiceAgingReport.tsx       # Aging report component
├── QuickInvoiceActions.tsx      # Quick action menu
├── InvoiceNumberGenerator.tsx   # Invoice number display/generation
├── InvoicePaymentForm.tsx       # Payment recording form
├── InvoiceEmailForm.tsx         # Email sending form
└── InvoiceExportOptions.tsx     # Export and download options
```

### Key Component Specifications

#### 1. InvoiceList.tsx
```typescript
interface InvoiceListProps {
  filters?: InvoiceFilters;
  viewMode?: 'card' | 'table';
  selectable?: boolean;
  onInvoiceSelect?: (invoice: Invoice) => void;
  onStatusChange?: (invoiceId: string, newStatus: InvoiceStatus) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  filters,
  viewMode = 'card',
  selectable = false,
  onInvoiceSelect,
  onStatusChange
}) => {
  // Implementation with real-time updates, pagination, and actions
};
```

#### 2. InvoiceForm.tsx
```typescript
interface InvoiceFormProps {
  invoice?: Invoice; // For editing existing invoice
  clientId?: string; // Pre-select client
  onSave?: (invoice: Invoice) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit' | 'duplicate';
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  clientId,
  onSave,
  onCancel,
  mode = 'create'
}) => {
  // Comprehensive form with line items, calculations, and validation
};
```

#### 3. InvoiceLineItems.tsx
```typescript
interface InvoiceLineItemsProps {
  items: InvoiceLineItem[];
  onItemsChange: (items: InvoiceLineItem[]) => void;
  taxRate: number;
  currency: CurrencyCode;
  readOnly?: boolean;
}

export const InvoiceLineItems: React.FC<InvoiceLineItemsProps> = ({
  items,
  onItemsChange,
  taxRate,
  currency,
  readOnly = false
}) => {
  // Dynamic line item management with real-time calculations
};
```

### Integration with Existing Components

#### 1. Enhanced QuickActions Component
```typescript
// Extend existing src/components/dashboard/QuickActions.tsx
const invoiceActions = [
  {
    title: "Create Invoice",
    description: "Generate new client invoice",
    icon: FileText,
    href: "/invoices/create",
    color: "from-purple-400 to-purple-600"
  },
  {
    title: "Send Reminders",
    description: "Send overdue payment reminders",
    icon: Bell,
    onClick: handleSendReminders,
    color: "from-orange-400 to-orange-600"
  }
];
```

#### 2. Dashboard Integration
```typescript
// Add to existing dashboard components
export const InvoiceSummaryCard = () => {
  const { analytics } = useInvoiceAnalytics();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">₱{analytics?.pendingAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-red-600">₱{analytics?.overdueAmount.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 6. Philippines Tax Compliance

### Tax Calculation Engine

```typescript
/**
 * Philippines Tax Calculator for Invoice System
 * File: src/utils/philippines-tax.util.ts
 */

export interface PhilippinesTaxConfig {
  vatRate: number; // 12% standard VAT rate
  withholdingTaxRates: {
    professional: number; // 10% for professional services
    business: number; // 5% for business services
  };
  exemptionThreshold: number; // VAT exemption threshold
  quarterlyDeadlines: Date[]; // BIR quarterly deadlines
}

export class PhilippinesTaxCalculator {
  private config: PhilippinesTaxConfig = {
    vatRate: 0.12,
    withholdingTaxRates: {
      professional: 0.10,
      business: 0.05
    },
    exemptionThreshold: 3000000, // ₱3M annual threshold
    quarterlyDeadlines: [
      new Date(2024, 3, 15), // Q1 - April 15
      new Date(2024, 6, 15), // Q2 - July 15
      new Date(2024, 9, 15), // Q3 - October 15
      new Date(2024, 0, 31), // Q4 - January 31 (next year)
    ]
  };

  /**
   * Calculate VAT for invoice amount
   */
  calculateVAT(amount: number, isVATExempt: boolean = false): number {
    if (isVATExempt) return 0;
    return amount * this.config.vatRate;
  }

  /**
   * Calculate withholding tax based on client type
   */
  calculateWithholdingTax(amount: number, clientType: 'individual' | 'business'): number {
    const rate = clientType === 'individual' 
      ? this.config.withholdingTaxRates.professional
      : this.config.withholdingTaxRates.business;
    
    return amount * rate;
  }

  /**
   * Generate comprehensive tax breakdown for invoice
   */
  generateTaxBreakdown(invoice: Invoice, clientType: 'individual' | 'business'): TaxBreakdown {
    const subtotal = invoice.subtotal;
    const vatAmount = this.calculateVAT(subtotal);
    const withholdingTax = this.calculateWithholdingTax(subtotal, clientType);
    
    return {
      subtotal,
      vatAmount,
      withholdingTax,
      netAmount: subtotal + vatAmount - withholdingTax,
      grossAmount: subtotal + vatAmount,
      effectiveTaxRate: (vatAmount - withholdingTax) / subtotal
    };
  }

  /**
   * Check if business is VAT-exempt based on annual revenue
   */
  isVATExempt(annualRevenue: number): boolean {
    return annualRevenue < this.config.exemptionThreshold;
  }
}

export interface TaxBreakdown {
  subtotal: number;
  vatAmount: number;
  withholdingTax: number;
  netAmount: number; // What client actually pays
  grossAmount: number; // Before withholding
  effectiveTaxRate: number;
}
```

### Integration with ReportService

```typescript
/**
 * Enhanced ReportService for Invoice Tax Reporting
 * File: src/services/report.service.ts (additions)
 */

export interface InvoiceTaxReport {
  period: {
    startDate: Date;
    endDate: Date;
    quarter: number;
    year: number;
  };
  summary: {
    totalSales: number;
    totalVAT: number;
    totalWithholdingTax: number;
    netIncome: number;
  };
  invoiceBreakdown: Array<{
    invoiceNumber: string;
    clientName: string;
    issueDate: Date;
    amount: number;
    vatAmount: number;
    withholdingTax: number;
    netAmount: number;
  }>;
  birCompliance: {
    form2550M: boolean; // Monthly VAT return
    form1601C: boolean; // Quarterly income tax return
    nextDeadline: Date;
  };
}

// Add to existing ReportService class
async generateInvoiceTaxReport(
  userId: string, 
  quarter: number, 
  year: number
): Promise<ServiceResult<InvoiceTaxReport>> {
  // Generate BIR-compliant tax reports from invoice data
}
```

---

## 7. Implementation Timeline

### Week 1: Core Foundation (Days 1-3)

#### Day 1: Data Model and Service Setup
- [ ] Implement Invoice interface in `src/types/database.types.ts`
- [ ] Create InvoiceService class in `src/services/invoice.service.ts`
- [ ] Add Firestore schema extensions in `src/lib/firestore-schema.ts`
- [ ] Update security rules for invoice collections

#### Day 2: Basic CRUD Operations
- [ ] Implement core CRUD methods in InvoiceService
- [ ] Add invoice number generation logic
- [ ] Create invoice calculation utilities
- [ ] Add basic error handling and validation

#### Day 3: InvoiceContext Implementation
- [ ] Create InvoiceContext in `src/contexts/InvoiceContext.tsx`
- [ ] Implement state management patterns
- [ ] Add real-time subscription support
- [ ] Integrate with existing AuthContext

### Week 1: UI Foundation (Days 4-5)

#### Day 4: Core Components
- [ ] Create InvoiceList component
- [ ] Implement InvoiceCard component
- [ ] Build InvoiceStatusBadge component
- [ ] Add basic filtering interface

#### Day 5: Form Components
- [ ] Implement InvoiceForm component
- [ ] Create InvoiceLineItems management
- [ ] Add InvoiceCalculator component
- [ ] Build client selection integration

### Week 2: Advanced Features (Days 6-10)

#### Day 6: Status Management
- [ ] Implement invoice status workflows
- [ ] Add send/mark paid functionality
- [ ] Create payment recording forms
- [ ] Add status change notifications

#### Day 7: Integration Points
- [ ] Integrate with TransactionService
- [ ] Connect with ClientService
- [ ] Add CategoryService integration
- [ ] Implement automatic financial updates

#### Day 8: Analytics and Reporting
- [ ] Create InvoiceAnalytics component
- [ ] Implement aging report functionality
- [ ] Add client payment analysis
- [ ] Build analytics dashboard

#### Day 9: Philippines Tax Features
- [ ] Implement tax calculation engine
- [ ] Add VAT and withholding tax support
- [ ] Create tax compliance reports
- [ ] Integrate with existing ReportService

#### Day 10: Polish and Testing
- [ ] Add comprehensive error handling
- [ ] Implement loading states and transitions
- [ ] Add accessibility features
- [ ] Conduct integration testing

---

## 8. Quality Assurance Standards

### TypeScript Compliance
- [ ] 100% strong typing with no `any` types
- [ ] Comprehensive interface definitions
- [ ] Zod schema validation for all inputs
- [ ] Type guards for runtime validation

### Testing Requirements
- [ ] Unit tests for InvoiceService methods
- [ ] Integration tests for database operations
- [ ] Component testing for form validation
- [ ] End-to-end tests for invoice workflows

### Performance Standards
- [ ] Invoice list loads in <2 seconds
- [ ] Real-time updates with <500ms latency
- [ ] Calculations complete in <100ms
- [ ] PDF generation in <5 seconds (future)

### Security Compliance
- [ ] User-scoped data access only
- [ ] Input sanitization and validation
- [ ] Secure file handling for receipts
- [ ] Audit trail for all changes

---

## 9. Success Metrics

### Functional Metrics
- [ ] Complete invoice CRUD operations
- [ ] Automatic financial integration
- [ ] Real-time status updates
- [ ] Philippines tax compliance

### Performance Metrics
- [ ] Sub-2-second page load times
- [ ] 100% uptime for invoice operations
- [ ] Zero data loss incidents
- [ ] Accurate calculations (100% tested)

### User Experience Metrics
- [ ] Intuitive invoice creation workflow
- [ ] Clear status tracking and updates
- [ ] Professional invoice presentation
- [ ] Seamless client integration

### Business Value Metrics
- [ ] Reduced manual invoice processing time
- [ ] Improved payment tracking accuracy
- [ ] Enhanced tax compliance reporting
- [ ] Integrated financial workflows

---

## 10. Future Enhancement Roadmap

### Sprint 3 Task 2: PDF Generation (US-016)
- Professional invoice PDF templates
- Custom branding and styling
- Email delivery integration
- Print-ready formatting

### Sprint 3 Task 3: Payment Integration (US-017)
- Online payment processing
- Payment gateway integration
- Automatic payment reconciliation
- Payment reminder automation

### Advanced Features (Future Sprints)
- Recurring invoice automation
- Multi-template support
- Advanced analytics and forecasting
- Client portal for invoice viewing

---

## Confidence Rating: 9/10

This architecture design provides:
- ✅ Complete alignment with existing service patterns
- ✅ Seamless integration with current transaction and client systems
- ✅ 100% TypeScript type safety
- ✅ Comprehensive business logic for invoice lifecycle
- ✅ Philippines tax compliance features
- ✅ Scalable component architecture
- ✅ Real-time data synchronization
- ✅ Enterprise-grade error handling and validation

**Ready for immediate implementation following this architecture specification.**

The 1-point deduction accounts for potential edge cases in Philippines tax regulations that may require consultation with local tax professionals during implementation.

---

*This architecture document serves as the complete technical specification for Sprint 3 Task 1 implementation, ensuring consistency with established patterns and seamless integration with the existing Chaching financial management platform.*