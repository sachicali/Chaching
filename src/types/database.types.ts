// Database Types - Chaching Financial Management Application
// This file contains all TypeScript interfaces for database entities

import { Timestamp } from 'firebase/firestore';

// ==================== UTILITY TYPES ====================

export type CurrencyCode = 'USD' | 'EUR' | 'PHP';
export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';
export type ClientStatus = 'prospect' | 'active' | 'inactive' | 'on_hold';
export type ClientType = 'individual' | 'company';
export type PaymentMethod = 'Bank Transfer' | 'PayPal' | 'Wise' | 'GCash' | 'Credit Card' | 'Cash' | 'Other';

// ==================== USER TYPES ====================

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  defaultCurrency: CurrencyCode;
  timezone: string;
  notifications: {
    email: boolean;
    browser: boolean;
    invoiceReminders: boolean;
    paymentAlerts: boolean;
  };
  theme: 'dark' | 'light';
}

// User Create/Update Types
export interface CreateUserData {
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
  preferences: {
    defaultCurrency: CurrencyCode;
    dateFormat: string;
    timeZone: string;
    theme: 'dark' | 'light';
    notifications: {
      email: boolean;
      push: boolean;
      weekly: boolean;
      invoiceReminders: boolean;
      goalUpdates: boolean;
      anomalyAlerts: boolean;
    };
    language: string;
  };
}

export interface UpdateUserData {
  name?: string;
  businessName?: string;
  phone?: string;
  preferences?: Partial<CreateUserData['preferences']>;
  updatedAt: Timestamp;
}

// ==================== CLIENT TYPES ====================

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: ClientAddress;
  
  // Financial Information
  monthlyEarnings?: number; // USD base currency
  totalEarningsUSD?: number;
  totalEarningsPHP?: number;
  paymentMedium?: 'Bank Transfer' | 'PayPal' | 'Wise' | 'GCash' | 'Credit Card' | 'Cash' | 'Other';
  
  // Business Information
  status: 'Active' | 'Prospect' | 'Inactive' | 'On Hold';
  tags?: string[];
  notes?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string; // Reference to the user who owns this client
}

export interface ClientAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Client Create/Update Types
export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: ClientAddress;
  type?: ClientType;
  status?: ClientStatus;
  avatarUrl?: string;
  notes?: string;
  paymentTerms?: string;
  preferredPaymentMethod?: PaymentMethod;
}

export interface UpdateClientData {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: ClientAddress;
  type?: ClientType;
  status?: ClientStatus;
  avatarUrl?: string;
  notes?: string;
  paymentTerms?: string;
  preferredPaymentMethod?: PaymentMethod;
}

// ==================== TRANSACTION TYPES ====================

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  amountPHP: number; // Converted amount in PHP
  phpEquivalent: number; // Alias for amountPHP for backward compatibility
  exchangeRate: number; // Rate used for conversion
  
  // Transaction Details
  description: string;
  date: Timestamp;
  category: string;
  categoryId?: string;
  
  // Client Association (for income)
  clientId?: string;
  clientName?: string;
  
  // Expense Details (for expenses)
  vendor?: string;
  paymentMethod?: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Digital Wallet';
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  
  // Status and Receipt
  status?: 'pending' | 'completed' | 'cancelled';
  receiptUrl?: string;
  
  // Tax Information
  isTaxDeductible?: boolean;
  taxCategory?: string;
  
  // Metadata for additional properties
  metadata?: {
    taxDeductible?: boolean;
    [key: string]: any;
  };
  
  // Attachments
  attachments?: TransactionAttachment[];
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
}

export interface TransactionAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Timestamp;
}

// Transaction Filters for Search and Reporting
export interface TransactionFilters {
  type?: TransactionType | 'all';
  currency?: CurrencyCode | 'all';
  clientId?: string;
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  startDate?: { toDate: () => Date } | Date; // Support both Firebase Timestamp-like and Date
  endDate?: { toDate: () => Date } | Date;   // Support both Firebase Timestamp-like and Date
  minAmount?: number;
  maxAmount?: number;
  status?: string;
  isTaxDeductible?: boolean;
  searchQuery?: string;
}

// Transaction Create/Update Types
export interface CreateTransactionData {
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  date: Date;
  description: string;
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

export interface UpdateTransactionData {
  id: string;
  type?: TransactionType;
  amount?: number;
  currency?: CurrencyCode;
  date?: Date;
  description?: string;
  category?: string;
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

// ==================== CATEGORY TYPES ====================

export interface Category {
  id: string;
  name: string;
  type: TransactionType | 'both';
  color: string;
  icon?: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  
  // Auto-categorization
  keywords: string[];
  rules?: CategoryRule[];
  
  // Tax Information
  isTaxDeductible?: boolean;
  taxCode?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
}

export interface CategoryRule {
  type: 'amount' | 'description' | 'vendor' | 'client';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string | number;
  confidence: number; // 0-100
}

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0-100 confidence score
  reason: string; // Why this category was suggested
  matchedRules?: CategoryRule[];
}

// ==================== INVOICE TYPES ====================

export interface Invoice {
  id: string;
  invoiceNumber: string;
  
  // Client Information
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: ClientAddress;
  
  // Invoice Details
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Timestamp;
  dueDate: Timestamp;
  currency: CurrencyCode;
  
  // Line Items
  lineItems: InvoiceLineItem[];
  
  // Calculations
  subtotal: number;
  taxRate: number; // Percentage (e.g., 12 for 12%)
  taxAmount: number;
  discount?: InvoiceDiscount;
  total: number;
  totalPHP?: number; // Converted amount if currency is not PHP
  exchangeRate?: number;
  
  // Payment Information
  paymentTerms: string; // e.g., "Net 30", "Due on receipt"
  paymentMethod?: string;
  paymentInstructions?: string;
  
  // Enhanced Payment Tracking
  totalPaid?: number; // Total amount paid across all payments
  remainingBalance?: number; // Remaining balance after all payments
  paymentPercentage?: number; // Percentage of invoice paid (0-100)
  
  // Business Information
  businessInfo: InvoiceBusinessInfo;
  
  // Template and Branding
  templateId?: string;
  logoUrl?: string;
  
  // Notes and References
  notes?: string;
  internalNotes?: string;
  poNumber?: string; // Purchase Order Number
  
  // Tracking
  sentAt?: Timestamp;
  viewedAt?: Timestamp;
  paidAt?: Timestamp;
  paymentRecordedAt?: Timestamp;
  
  // Reminders
  remindersSent: InvoiceReminder[];
  nextReminderDate?: Timestamp;
  
  // Recurring Invoice
  isRecurring?: boolean;
  recurringConfig?: RecurringInvoiceConfig;
  parentInvoiceId?: string; // For recurring invoices
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
  pdfUrl?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number; // Price per unit
  amount: number; // quantity * rate
  category?: string;
  categoryId?: string;
  
  // Tax Information
  isTaxable?: boolean;
  taxRate?: number;
  taxAmount?: number;
}

export interface InvoiceDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  amount: number; // Calculated discount amount
  description?: string;
}

export interface InvoiceBusinessInfo {
  businessName: string;
  email: string;
  phone?: string;
  website?: string;
  address?: ClientAddress;
  logoUrl?: string;

  // Tax Information
  taxId?: string; // TIN or VAT number
  businessRegistration?: string;
  
  // Banking Information
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  routingNumber?: string;
}

export interface InvoiceReminder {
  id: string;
  type: 'first' | 'second' | 'final' | 'custom';
  sentAt: Timestamp;
  subject: string;
  message: string;
  method: 'email' | 'sms';
}

export interface RecurringInvoiceConfig {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // Every X periods (e.g., every 2 months)
  startDate: Timestamp;
  endDate?: Timestamp;
  occurrences?: number; // Alternative to endDate
  
  // Automation Settings
  autoSend: boolean;
  sendDaysBefore: number; // Send X days before due date
  
  // Status
  isActive: boolean;
  lastGenerated?: Timestamp;
  nextGeneration: Timestamp;
}

// ==================== INVOICE TEMPLATE TYPES ====================

export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  
  // Template Configuration
  layout: 'modern' | 'classic' | 'minimal' | 'professional';
  colors: InvoiceTemplateColors;
  fonts: InvoiceTemplateFonts;
  
  // Default Values
  defaultPaymentTerms: string;
  defaultNotes?: string;
  defaultTaxRate: number;
  
  // Branding
  logoPosition: 'top-left' | 'top-right' | 'center';
  logoSize: 'small' | 'medium' | 'large';
  
  // Business Info Template
  businessInfoTemplate: InvoiceBusinessInfo;
  
  // Usage
  isDefault: boolean;
  usageCount: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
}

export interface InvoiceTemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

export interface InvoiceTemplateFonts {
  heading: string;
  body: string;
  size: 'small' | 'medium' | 'large';
}

export interface InvoiceTemplateFormData {
  name: string;
  description?: string;
  layout: 'modern' | 'classic' | 'minimal' | 'professional';
  colors: InvoiceTemplateColors;
  fonts: InvoiceTemplateFonts;
  defaultPaymentTerms: string;
  defaultNotes?: string;
  defaultTaxRate: number;
  logoPosition: 'top-left' | 'top-right' | 'center';
  logoSize: 'small' | 'medium' | 'large';
  businessInfoTemplate: InvoiceBusinessInfo;
}

// ==================== EMAIL AUTOMATION TYPES ====================

export type EmailStatus = 'pending' | 'processing' | 'delivered' | 'failed' | 'bounced';
export type EmailType = 'invoice' | 'reminder' | 'payment_confirmation' | 'marketing' | 'custom';
export type EmailPriority = 'low' | 'normal' | 'high';
export type ScheduledEmailStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface EmailTemplate {
  id: string;
  userId: string;
  templateType: string;
  name: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  isDefault: boolean;
  
  // Phase 2: Template Versioning
  version?: number;
  isActive?: boolean;
  parentTemplateId?: string; // For versioned templates
  
  // Phase 2: Template Performance Metrics
  performanceMetrics?: EmailTemplatePerformanceMetrics;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EmailTemplatePerformanceMetrics {
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bounceCount: number;
  
  // Calculated rates
  deliveryRate: number; // delivered / sent
  openRate: number; // opened / delivered
  clickRate: number; // clicked / delivered
  bounceRate: number; // bounced / sent
  
  lastUpdated: Timestamp;
}

export interface EmailTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  content: {
    subject: string;
    htmlContent?: string;
    textContent?: string;
  };
  isActive: boolean;
  performanceMetrics: EmailTemplatePerformanceMetrics;
  createdAt: Timestamp;
  createdBy: string;
}

export interface EmailAttachment {
  filename: string;
  path: string;
  contentType?: string;
}

export interface EmailData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  message: {
    subject: string;
    html?: string;
    text?: string;
    attachments?: EmailAttachment[];
  };
  template?: {
    name: string;
    data: Record<string, string>;
  };
}

export interface EmailHistory {
  id: string;
  userId: string;
  emailId: string;
  invoiceId?: string;
  recipientEmail: string;
  subject: string;
  templateType: string;
  templateId?: string;
  templateVersion?: number;
  status: EmailStatus;
  sentAt: Timestamp;
  deliveredAt?: Timestamp;
  openedAt?: Timestamp;
  clickedAt?: Timestamp;
  bouncedAt?: Timestamp;
  errorMessage?: string;
  attachments?: EmailAttachment[];
  
  // Phase 2: Enhanced tracking
  clientId?: string;
  emailType: EmailType;
  priority: EmailPriority;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== PHASE 2: SCHEDULED EMAIL TYPES ====================

export interface ScheduledEmail {
  id: string;
  userId: string;
  
  // Email Configuration
  emailType: EmailType;
  templateId: string;
  templateVersion?: number;
  
  // Recipients and Content
  recipientEmail: string;
  subject: string;
  emailData: EmailData;
  
  // Scheduling
  scheduledFor: Timestamp;
  timezone: string;
  priority: EmailPriority;
  
  // Status and Processing
  status: ScheduledEmailStatus;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: Timestamp;
  nextAttempt?: Timestamp;
  
  // Relationships
  invoiceId?: string;
  clientId?: string;
  campaignId?: string;
  
  // Error Handling
  errorMessage?: string;
  errorDetails?: {
    code: string;
    message: string;
    timestamp: Timestamp;
  }[];
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  processedAt?: Timestamp;
}

export interface EmailQueue {
  id: string;
  userId: string;
  scheduledEmailId: string;
  priority: EmailPriority;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  queuedAt: Timestamp;
  processedAt?: Timestamp;
  processingNode?: string; // For distributed processing
}

// ==================== PHASE 2: EMAIL ANALYTICS TYPES ====================

export interface EmailAnalytics {
  id: string;
  userId: string;
  emailHistoryId: string;
  
  // Email Identification
  emailType: EmailType;
  templateId: string;
  templateVersion?: number;
  recipientEmail: string;
  
  // Timing Analytics
  sentAt: Timestamp;
  deliveredAt?: Timestamp;
  openedAt?: Timestamp;
  firstOpenedAt?: Timestamp;
  lastOpenedAt?: Timestamp;
  clickedAt?: Timestamp;
  firstClickedAt?: Timestamp;
  lastClickedAt?: Timestamp;
  
  // Engagement Metrics
  openCount: number;
  clickCount: number;
  timesToOpen: number[];
  timesToClick: number[];
  
  // Device and Client Info
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  emailClient?: string;
  operatingSystem?: string;
  
  // Geographic Data
  country?: string;
  city?: string;
  ipAddress?: string;
  
  // Deliverability
  bounced: boolean;
  bounceReason?: string;
  bounceType?: 'hard' | 'soft';
  spamComplaint: boolean;
  unsubscribed: boolean;
  
  // Relationships
  invoiceId?: string;
  clientId?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EmailCampaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  
  // Campaign Configuration
  emailType: EmailType;
  templateId: string;
  templateVersion?: number;
  
  // Targeting
  recipientList: string[]; // Email addresses
  clientIds?: string[]; // Client IDs for targeted campaigns
  
  // Scheduling
  scheduledFor?: Timestamp;
  timezone: string;
  
  // Status
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'cancelled';
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  
  // Campaign Analytics
  analytics: {
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
    totalOpens: number;
    totalClicks: number;
    totalBounces: number;
    totalUnsubscribes: number;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface EmailReport {
  id: string;
  userId: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  
  // Report Period
  startDate: Timestamp;
  endDate: Timestamp;
  
  // Overall Metrics
  totalEmailsSent: number;
  totalEmailsDelivered: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  totalEmailsBounced: number;
  
  // Calculated Rates
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  
  // Breakdown by Email Type
  metricsByType: {
    [emailType in EmailType]?: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      deliveryRate: number;
      openRate: number;
      clickRate: number;
      bounceRate: number;
    };
  };
  
  // Template Performance
  topPerformingTemplates: Array<{
    templateId: string;
    templateName: string;
    sent: number;
    openRate: number;
    clickRate: number;
  }>;
  
  // Client Performance
  topEngagingClients: Array<{
    clientId: string;
    clientName: string;
    emailsSent: number;
    openRate: number;
    clickRate: number;
  }>;
  
  // Generated Data
  generatedAt: Timestamp;
  generatedBy: string;
}

// ==================== PAYMENT TYPES ====================

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: CurrencyCode;
  amountPHP?: number;
  exchangeRate?: number;
  
  // Payment Details
  paymentDate: Timestamp;
  paymentMethod: 'Bank Transfer' | 'PayPal' | 'Wise' | 'GCash' | 'Credit Card' | 'Cash' | 'Other';
  reference?: string; // Transaction reference or check number
  
  // Status
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Notes
  notes?: string;
  
  // Transaction Integration
  transactionId?: string; // Link to Transaction record
  
  // Metadata
  recordedAt: Timestamp;
  recordedBy: string; // User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
}

// ==================== REPORT TYPES ====================

export interface ReportMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  
  // Currency Breakdown
  currencyBreakdown: {
    [currency: string]: {
      income: number;
      expenses: number;
      net: number;
    };
  };
  
  // Period Comparison
  previousPeriod?: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    changePercentage: number;
  };
  
  // Client Metrics
  topClients: Array<{
    clientId: string;
    clientName: string;
    totalEarnings: number;
    percentage: number;
  }>;
  
  // Category Breakdown
  expensesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
  }>;
  
  // Tax Information
  taxableIncome: number;
  deductibleExpenses: number;
  estimatedTax: number;
}

// ==================== GOAL TYPES ====================

export interface FinancialGoal {
  id: string;
  title: string;
  description?: string;
  type: 'income' | 'savings' | 'expense_reduction' | 'client_acquisition' | 'custom';
  
  // Target
  targetAmount: number;
  currency: CurrencyCode;
  targetDate: Timestamp;
  
  // Progress
  currentAmount: number;
  progressPercentage: number;
  
  // Tracking
  trackingCategories?: string[]; // Category IDs to track for this goal
  trackingClients?: string[]; // Client IDs to track for this goal
  
  // Status
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  completedAt?: Timestamp;
  
  // Milestones
  milestones: GoalMilestone[];
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetAmount: number;
  targetDate: Timestamp;
  isCompleted: boolean;
  completedAt?: Timestamp;
}

// ==================== AUDIT TYPES ====================

export interface AuditLog {
  id: string;
  entityType: 'client' | 'transaction' | 'invoice' | 'category' | 'goal' | 'email' | 'template';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'send' | 'pay' | 'cancel' | 'schedule' | 'process';
  
  // Change Details
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  
  // Context
  reason?: string;
  metadata?: Record<string, any>;
  
  // Actor
  userId: string;
  userEmail: string;
  
  // Timestamp
  timestamp: Timestamp;
}

// ==================== FORM TYPES ====================

export interface InvoiceFormData {
  clientId: string;
  issueDate: Date;
  dueDate: Date;
  currency: CurrencyCode;
  lineItems: Omit<InvoiceLineItem, 'id' | 'amount'>[];
  paymentTerms: string;
  notes?: string;
  taxRate: number;
  discount?: Omit<InvoiceDiscount, 'amount'>;
  templateId?: string;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  description: string;
  date: Date;
  category: string;
  clientId?: string;
  vendor?: string;
  paymentMethod?: string;
  isTaxDeductible?: boolean;
}

export interface ScheduledEmailFormData {
  emailType: EmailType;
  templateId: string;
  recipientEmail: string;
  scheduledFor: Date;
  priority: EmailPriority;
  invoiceId?: string;
  clientId?: string;
  customSubject?: string;
  customVariables?: Record<string, string>;
}

export interface EmailCampaignFormData {
  name: string;
  description?: string;
  emailType: EmailType;
  templateId: string;
  recipientEmails: string[];
  clientIds?: string[];
  scheduledFor?: Date;
  timezone: string;
}