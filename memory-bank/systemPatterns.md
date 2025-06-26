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

### 3. Database and Authentication Strategy (NEW)
**Decision**: Firebase ecosystem for unified data and auth
**Rationale**: Seamless integration, real-time capabilities, reduced complexity
**Implementation Plan**:
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

### 5. Sprint-Based Development Pattern (NEW)
**Decision**: 2-week sprint cycles with clear deliverables
**Pattern**: Story point estimation with velocity tracking
**Framework**: 8 sprints across 4 phases with quality gates
**Implementation**: Weekly reviews and continuous documentation updates

### 6. Component Organization Pattern
**Decision**: Feature-based component grouping with shared UI layer
**Structure**:
- `components/ui/` - Radix UI + Tailwind base components
- `components/layout/` - Navigation and structural components
- `components/features/` - Business logic components

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
│       └── AI Features (insights, predictions)
```

### Data Flow Architecture
```
User Interaction
    ↓
React Component
    ↓
Context/State Update
    ↓ (if AI needed)
Genkit Flow Execution
    ↓
AI Response Processing
    ↓
UI State Update
    ↓
Component Re-render
```

### Client Management Architecture
**Pattern**: Master-detail with tabbed interface  
**Components**:
- Client list (sidebar with search/filter)
- Client detail view (tabbed: overview, financials, invoices, activity)
- CRUD operations through context
- Real-time search and selection state

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

## Performance Patterns

### Code Splitting
- Route-based splitting with Next.js App Router
- Component lazy loading for large features
- AI flows loaded on-demand

### Rendering Optimization
- Server components where possible
- Client components only for interactivity
- Memoization for expensive calculations
- Virtual scrolling for large client lists (future)

**Confidence Rating: 9/10**