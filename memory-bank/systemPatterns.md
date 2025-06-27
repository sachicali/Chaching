# System Patterns: Chaching Financial Management Application

## Architecture Overview

### Application Architecture
**Pattern**: Next.js App Router with Client-Side State Management  
**Structure**: Single-page application with nested routing and AI integration  
**Philosophy**: Component-driven architecture with clear separation of concerns

```
├── src/app/                 # Next.js App Router pages
│   ├── (app)/              # Authenticated app routes
│   ├── layout.tsx          # Root layout with dark theme
│   └── globals.css         # Global styles and CSS variables
├── src/components/         # Reusable UI components
│   ├── features/           # Feature-specific components
│   ├── layout/             # Layout components (sidebar, navigation)
│   └── ui/                 # Shadcn/ui base components
├── src/contexts/           # React Context providers
├── src/ai/                 # Google Genkit AI flows and prompts
├── src/services/           # Business logic services
└── src/lib/                # Utility functions and helpers
```

## Key Technical Decisions

### 1. Next.js App Router Architecture
**Decision**: Use App Router over Pages Router
**Rationale**: Better TypeScript support, nested layouts, and streaming capabilities
**Implementation**:
- Route groups `(app)` for authenticated sections
- Shared layouts for consistent navigation
- Server components for performance where possible

### 2. AI Integration Pattern
**Decision**: Google Genkit with flow-based architecture
**Pattern**: Prompt definitions with structured input/output schemas
**Files**:
- [`src/ai/flows/generate-financial-insights.ts`](src/ai/flows/generate-financial-insights.ts:1)
- [`src/ai/flows/predict-income.ts`](src/ai/flows/predict-income.ts:1)
- [`src/ai/flows/detect-spending-anomalies.ts`](src/ai/flows/detect-spending-anomalies.ts:1)
- [`src/ai/flows/generate-weekly-summary.ts`](src/ai/flows/generate-weekly-summary.ts:1)

**Schema Pattern**: Zod validation for AI input/output
```typescript
const FinancialInsightsInputSchema = z.object({
  income: z.number().describe('Total income for the period.'),
  expenses: z.number().describe('Total expenses for the period.'),
  // ... structured data definitions
});
```

### 3. Database and Authentication Strategy
**Decision**: Firebase ecosystem for unified data and auth
**Rationale**: Seamless integration, real-time capabilities, reduced complexity
**Implementation**:
- **Database**: Firebase Firestore for document-based storage
- **Authentication**: Firebase Auth for user management
- **Integration**: Single SDK for both services

**Data Architecture Pattern**:
```typescript
// User-scoped data architecture
interface DatabaseSchema {
  users: {
    [userId: string]: UserProfile;
  };
  userClients: {
    [userId: string]: {
      [clientId: string]: Client;
    };
  };
  userTransactions: {
    [userId: string]: {
      [transactionId: string]: Transaction;
    };
  };
}
```

### 4. State Management Strategy
**Decision**: React Context for client data, local state for UI
**Pattern**: Single context provider for complex domain objects
**Enhancement**: Authentication-aware context providers
**Implementation**: [`src/contexts/ClientContext.tsx`](src/contexts/ClientContext.tsx:1)

**Enhanced Context Pattern**:
```typescript
interface AuthenticatedContextType {
  user: User | null;
  isAuthenticated: boolean;
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (updatedClient: Client) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  getClientById: (clientId: string) => Client | undefined;
}
```

### 5. Sprint-Based Development Pattern
**Decision**: 2-week sprint cycles with clear deliverables
**Pattern**: Story point estimation with velocity tracking
**Framework**: 8 sprints across 4 phases with quality gates
**Implementation**: Weekly reviews and continuous documentation updates

### 6. Expense Categorization Pattern (ENHANCED)
**Decision**: Auto-categorization engine with ML-style confidence scoring
**Pattern**: Smart categorization with 19 professional default categories
**Implementation**: Rule-based pattern matching with confidence metrics
**Files**: [`src/services/category.service.ts`](src/services/category.service.ts:1), [`src/contexts/CategoryContext.tsx`](src/contexts/CategoryContext.tsx:1)

**Categorization Engine Pattern**:
```typescript
interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0-100 confidence score
  reason: string; // Why this category was suggested
}

const suggestCategory = (description: string, amount: number): CategorySuggestion => {
  // ML-style pattern matching with confidence scoring
  // Professional categories optimized for freelancers
};
```

### 7. Invoice Management Architecture Pattern (PRODUCTION-READY)
**Decision**: Complete invoice lifecycle management with professional UI components
**Pattern**: Service-Context-Component architecture for complex invoice workflows
**Implementation**: React Hook Form + Zod validation with real-time calculations
**Files**:
- [`src/services/invoice.service.ts`](src/services/invoice.service.ts:1) - Business logic layer
- [`src/contexts/InvoiceContext.tsx`](src/contexts/InvoiceContext.tsx:1) - State management
- [`src/components/invoices/InvoiceForm.tsx`](src/components/invoices/InvoiceForm.tsx:1) - Creation UI
- [`src/components/invoices/InvoiceDetail.tsx`](src/components/invoices/InvoiceDetail.tsx:1) - Viewing UI
- [`src/components/invoices/PaymentForm.tsx`](src/components/invoices/PaymentForm.tsx:1) - Payment recording
- [`src/app/(app)/invoices/page.tsx`](src/app/(app)/invoices/page.tsx:1) - Management dashboard

**Invoice Component Architecture Pattern**:
```typescript
// Professional invoice form with dynamic calculations
interface InvoiceFormData {
  clientId: string;
  number: string;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  total: number;
  notes?: string;
  terms?: string;
}

// Real-time calculation pattern for invoice totals
const calculateInvoiceTotals = (items: InvoiceItem[], taxRate: number, discount: Discount) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const discountAmount = calculateDiscount(subtotal, discount);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;
  return { subtotal, discountAmount, taxAmount, total };
};
```

**Payment Recording Pattern**:
```typescript
interface PaymentData {
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'paypal' | 'gcash' | 'other';
  referenceNumber?: string;
  notes?: string;
}

// Automatic invoice status updates based on payment amount
const recordPayment = async (paymentData: PaymentData) => {
  const invoice = await getInvoice(paymentData.invoiceId);
  const totalPaid = invoice.totalPaid + paymentData.amount;
  const status = determineInvoiceStatus(totalPaid, invoice.total);
  await updateInvoiceStatus(paymentData.invoiceId, status, totalPaid);
};
```

### 8. Email Automation System Architecture (NEW - COMPLETE)

#### 8.1 Email Service Foundation Pattern (Phase 1)
**Decision**: Firebase Extensions integration for reliable email delivery
**Pattern**: Service composition with template-based email generation
**Implementation**: [`src/services/email.service.ts`](src/services/email.service.ts:1) - Core email service
**Files**: 
- [`src/services/template.service.ts`](src/services/template.service.ts:1) - Unified template management
- [`src/types/database.types.ts`](src/types/database.types.ts:1) - Enhanced with email types

**Email Service Pattern**:
```typescript
interface EmailServicePattern {
  // Template-based email generation
  sendInvoiceEmail(invoice: Invoice, options: EmailOptions): Promise<EmailResult>;
  sendReminderEmail(invoice: Invoice, reminderType: ReminderType): Promise<EmailResult>;
  sendPaymentConfirmation(invoice: Invoice, payment: PaymentData): Promise<EmailResult>;
  
  // Email history and tracking
  getEmailHistory(invoiceId: string): Promise<EmailHistory[]>;
  updateEmailStatus(emailId: string, status: EmailStatus): Promise<void>;
}
```

#### 8.2 Scheduled Email System Pattern (Phase 2)
**Decision**: Queue-based scheduling with priority management and retry logic
**Pattern**: Background job processing with comprehensive error handling
**Implementation**: [`src/services/scheduler.service.ts`](src/services/scheduler.service.ts:1) - 525 lines
**Architecture**: Priority-based queue system with exponential backoff

**Scheduler Service Pattern**:
```typescript
interface SchedulerServicePattern {
  // Email scheduling and queue management
  scheduleEmail(emailData: ScheduledEmailFormData): Promise<string>;
  getScheduledEmails(userId: string, options: QueryOptions): Promise<ScheduledEmail[]>;
  cancelScheduledEmail(scheduledEmailId: string): Promise<void>;
  
  // Queue processing and management
  processQueue(): Promise<QueueProcessingResult>;
  getQueueStats(): Promise<QueueStatistics>;
  cleanupQueue(olderThanDays: number): Promise<number>;
}

// Priority-based queue processing
interface QueueProcessingPattern {
  priorities: 'high' | 'normal' | 'low';
  retryLogic: ExponentialBackoff; // 5min, 15min, 60min
  maxRetries: 3;
  batchSize: 10; // Process max 10 emails per batch
}
```

#### 8.3 Email Analytics System Pattern (Phase 2)
**Decision**: Real-time engagement tracking with comprehensive analytics
**Pattern**: Event-driven analytics with automated reporting
**Implementation**: [`src/services/email-analytics.service.ts`](src/services/email-analytics.service.ts:1) - 698 lines
**Architecture**: Real-time event tracking with batch aggregation

**Analytics Service Pattern**:
```typescript
interface AnalyticsServicePattern {
  // Real-time event tracking
  recordEmailAnalytics(data: EmailEventData): Promise<string>;
  recordOpen(emailHistoryId: string, metadata: EventMetadata): Promise<void>;
  recordClick(emailHistoryId: string, metadata: EventMetadata): Promise<void>;
  recordBounce(emailHistoryId: string, bounceData: BounceData): Promise<void>;
  
  // Performance metrics and reporting
  getOverallMetrics(dateRange?: DateRange): Promise<PerformanceMetrics>;
  getTemplateMetrics(templateId: string): Promise<TemplatePerformanceMetrics>;
  generateReport(reportType: ReportType, dateRange: DateRange): Promise<string>;
}

// Analytics data aggregation pattern
interface AnalyticsAggregationPattern {
  realTimeEvents: ['open', 'click', 'bounce', 'spam', 'unsubscribe'];
  metricsCalculation: {
    deliveryRate: '(delivered / sent) * 100';
    openRate: '(opened / delivered) * 100';
    clickRate: '(clicked / delivered) * 100';
    bounceRate: '(bounced / sent) * 100';
  };
  reportGeneration: ['daily', 'weekly', 'monthly', 'custom'];
}
```

#### 8.4 Advanced Template Features Pattern (Phase 2)
**Decision**: Template versioning with A/B testing capabilities
**Pattern**: Version-controlled templates with performance tracking
**Enhancement**: [`src/types/database.types.ts`](src/types/database.types.ts:1) - Template versioning types

**Template Versioning Pattern**:
```typescript
interface TemplateVersioningPattern {
  // Template version management
  versions: EmailTemplateVersion[];
  performanceTracking: TemplatePerformanceMetrics;
  abTesting: {
    variants: TemplateVariant[];
    splitPercentage: number;
    performanceComparison: VariantComparison;
  };
}

// A/B testing implementation
interface ABTestingPattern {
  createVariant(templateId: string, variant: TemplateVariant): Promise<string>;
  assignVariant(emailData: EmailData): TemplateVariant;
  trackVariantPerformance(variantId: string, metrics: PerformanceData): Promise<void>;
  determineWinner(testId: string): Promise<WinnerAnalysis>;
}
```

### 9. Email Service Ecosystem Architecture (COMPLETE)

**Service Composition Pattern**:
```typescript
// Email service ecosystem with clear separation of concerns
interface EmailEcosystemPattern {
  emailService: {
    purpose: 'Core email sending and template management';
    responsibilities: ['Email delivery', 'Template processing', 'Basic tracking'];
    integration: 'Firebase Extensions for reliable delivery';
  };
  
  schedulerService: {
    purpose: 'Scheduled email processing and queue management';
    responsibilities: ['Email scheduling', 'Queue processing', 'Retry logic'];
    integration: 'Background job processing with priority management';
  };
  
  emailAnalyticsService: {
    purpose: 'Email performance tracking and analytics';
    responsibilities: ['Event tracking', 'Metrics calculation', 'Report generation'];
    integration: 'Real-time analytics with automated reporting';
  };
}
```

**Database Schema Extensions**:
```typescript
// Email automation database collections
interface EmailDatabaseSchema {
  emailHistory: EmailHistory[];      // Complete email audit trail
  emailTemplates: EmailTemplate[];   // Template management with versioning
  scheduledEmails: ScheduledEmail[];  // Queue-based scheduling system
  emailQueue: EmailQueue[];          // Priority-based processing queue
  emailAnalytics: EmailAnalytics[];  // Comprehensive engagement tracking
  emailReports: EmailReport[];       // Automated reporting system
  emailCampaigns: EmailCampaign[];   // Campaign management and analytics
}
```

### 10. Component Organization Pattern
**Decision**: Feature-based component grouping with shared UI layer
**Structure**:
- `components/ui/` - Radix UI + Tailwind base components
- `components/layout/` - Navigation and structural components
- `components/features/` - Business logic components
- `components/invoices/` - Invoice-specific components with email integration

## Design Patterns in Use

### 1. Compound Component Pattern
**Usage**: Complex UI components like client management interface  
**Example**: [`src/app/(app)/clients/page.tsx`](src/app/(app)/clients/page.tsx:1) - Master-detail view with tabs

### 2. Provider Pattern
**Usage**: Client data management and toast notifications  
**Implementation**: Context providers wrapping app sections  
**Files**: [`src/contexts/ClientContext.tsx`](src/contexts/ClientContext.tsx:1)

### 3. Render Props / Custom Hooks
**Usage**: Reusable UI logic like mobile detection  
**Files**: [`src/hooks/use-mobile.tsx`](src/hooks/use-mobile.tsx:1), [`src/hooks/use-toast.ts`](src/hooks/use-toast.ts:1)

### 4. Factory Pattern
**Usage**: AI flow creation with consistent structure  
**Pattern**: `ai.defineFlow()` and `ai.definePrompt()` for standardized AI interactions

### 5. Service Composition Pattern (ENHANCED)
**Usage**: Email automation service ecosystem
**Pattern**: Clean integration between EmailService, SchedulerService, and EmailAnalyticsService
**Implementation**: Each service maintains clear boundaries while sharing common interfaces

### 6. Queue Processing Pattern (NEW)
**Usage**: Background email processing with priority management
**Pattern**: Priority-based queue with exponential backoff retry logic
**Implementation**: Batch processing with comprehensive error handling

### 7. Event-Driven Analytics Pattern (NEW)
**Usage**: Real-time email engagement tracking
**Pattern**: Event capture with aggregated metrics calculation
**Implementation**: Real-time tracking with automated report generation

## Component Relationships

### Layout Hierarchy
```
RootLayout (dark theme, fonts)
├── AppLayout (authenticated routes)
│   ├── AppSidebar (navigation)
│   ├── QuickAddButton (floating action)
│   └── Page Content
│       ├── Dashboard (overview)
│       ├── Clients (master-detail)
│       ├── Income/Expenses (forms)
│       ├── Invoices (with email automation)
│       └── AI Features (insights, predictions)
```

### Data Flow Architecture
```
User Interaction
    ↓
React Component
    ↓
Context/State Update
    ↓ (if email automation needed)
Email Service Ecosystem
    ├── EmailService (immediate sending)
    ├── SchedulerService (scheduled sending)
    └── EmailAnalyticsService (tracking)
    ↓ (if AI needed)
Genkit Flow Execution
    ↓
AI Response Processing
    ↓
UI State Update
    ↓
Component Re-render
```

### Email Service Ecosystem Flow
```
Email Request
    ↓
EmailService (template processing, immediate delivery)
    ↓ (if scheduled)
SchedulerService (queue management, retry logic)
    ↓ (tracking enabled)
EmailAnalyticsService (event tracking, metrics)
    ↓
Database Updates (history, analytics, reports)
    ↓
UI Feedback (status updates, analytics display)
```

### Client Management Architecture
**Pattern**: Master-detail with tabbed interface  
**Components**:
- Client list (sidebar with search/filter)
- Client detail view (tabbed: overview, financials, invoices, activity)
- CRUD operations through context
- Real-time search and selection state
- Email history integration for client communications

## Styling Architecture

### Design System Pattern
**Foundation**: Tailwind CSS with CSS variables for theming  
**Components**: Radix UI primitives with custom styling  
**Theme**: Dark-first with CSS custom properties

**CSS Variables Pattern**:
```css
:root {
  --background: 224 71.4% 4.1%;
  --foreground: 210 20% 98%;
  --primary: 263.4 70% 50.4%;
  /* ... */
}
```

### Component Styling Strategy
1. **Base Components**: Styled with `cn()` utility for conditional classes
2. **Layout Components**: Flexbox and Grid with responsive breakpoints
3. **Interactive States**: Hover/focus/active states with CSS variables
4. **Dark Theme**: Default configuration with light theme optional

## Data Modeling Patterns

### Client Entity Model
```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  monthlyEarnings?: number; // USD base currency
  totalEarningsUSD?: number;
  paymentMedium?: string;
  status?: string;
  // ... additional fields
}
```

### Email Entity Models (NEW)
```typescript
// Core email entities with comprehensive tracking
interface EmailEntityModels {
  EmailHistory: {
    id: string;
    userId: string;
    invoiceId?: string;
    clientId?: string;
    emailType: EmailType;
    templateId: string;
    recipientEmail: string;
    subject: string;
    status: EmailStatus;
    sentAt: Timestamp;
    deliveredAt?: Timestamp;
    openedAt?: Timestamp;
    clickedAt?: Timestamp;
    attachments?: EmailAttachment[];
  };
  
  ScheduledEmail: {
    id: string;
    userId: string;
    emailType: EmailType;
    templateId: string;
    scheduledFor: Timestamp;
    priority: EmailPriority;
    status: ScheduledEmailStatus;
    retryCount: number;
    maxRetries: number;
    errorDetails?: ErrorDetail[];
  };
  
  EmailAnalytics: {
    id: string;
    userId: string;
    emailHistoryId: string;
    openCount: number;
    clickCount: number;
    timesToOpen: number[];
    timesToClick: number[];
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    country?: string;
    city?: string;
  };
}
```

### Currency Handling Pattern
**Strategy**: Store in USD, display in multiple currencies  
**Exchange Rate**: Static rate (₱58.75 = $1.00) with future API integration  
**Display**: Format functions for consistent currency presentation

### Form Validation Pattern
**Library**: React Hook Form + Zod schemas  
**Pattern**: Client-side validation with TypeScript integration  
**Error Handling**: Toast notifications for user feedback

## AI Integration Patterns

### Flow Definition Pattern
```typescript
const generateFinancialInsightsFlow = ai.defineFlow(
  {
    name: 'generateFinancialInsightsFlow',
    inputSchema: FinancialInsightsInputSchema,
    outputSchema: FinancialInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
```

### Prompt Engineering Pattern
- Structured input/output with Zod schemas
- Descriptive field documentation for AI context
- JSON output formatting for consistent parsing
- Handlebars templating for dynamic content

## Security Patterns

### Input Validation
- Zod schemas for all form inputs
- Email validation for client contacts
- Numeric range validation for financial amounts
- SQL injection prevention through type safety

### State Management Security
- Immutable state updates
- Context isolation for sensitive data
- No direct DOM manipulation
- TypeScript strict mode enforcement

### Email Security (NEW)
- User-scoped email operations with proper authentication
- Email address validation throughout the email automation system
- Secure queue processing with user isolation
- Privacy protection in analytics data collection

## Performance Patterns

### Code Splitting
- Route-based splitting with Next.js App Router
- Component lazy loading for large features
- AI flows loaded on-demand
- Email service modules loaded as needed

### Rendering Optimization
- Server components where possible
- Client components only for interactivity
- Memoization for expensive calculations
- Virtual scrolling for large client lists (future)

### Email System Performance (NEW)
- **Queue Processing**: Batch processing for high-volume email sending
- **Analytics Aggregation**: Efficient data aggregation for large datasets
- **Caching Strategy**: Template caching and analytics result caching
- **Background Processing**: Non-blocking email processing with queue management

**Confidence Rating: 10/10** - Complete email automation system architecture with production-ready patterns for scheduling, analytics, and advanced template management.