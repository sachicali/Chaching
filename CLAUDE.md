# Chaching - AI-Powered Financial Management Platform

## Project Overview
**Chaching** is a comprehensive financial management platform designed specifically for freelancers and consultants. Built with Next.js 15+, TypeScript, Firebase, and Google Genkit AI, it provides sophisticated tools for managing multiple clients, tracking income and expenses, and gaining AI-powered insights into financial health.

**Current Status**: ~25% complete with solid foundation requiring database persistence and advanced features implementation.

## Technology Stack
- **Frontend**: Next.js 15.2.3 with App Router, React 18, TypeScript
- **UI Framework**: Tailwind CSS + Radix UI (shadcn/ui components)
- **AI Platform**: Google Genkit with Gemini 2.0 Flash
- **Backend**: Firebase (Firestore, Auth, Functions, Storage)
- **Package Manager**: Bun (preferred over npm)
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form + Zod validation
- **PDF Generation**: @react-pdf/renderer for invoices
- **State Management**: React Context API

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Protected app routes
│   │   ├── dashboard/     # Main dashboard
│   │   ├── clients/       # Client management
│   │   ├── transactions/  # Income/expense tracking (via income/ and expenses/)
│   │   ├── invoices/      # Invoice generation
│   │   ├── emails/        # Email automation
│   │   ├── reports/       # Financial reports
│   │   └── settings/      # User settings
│   └── page.tsx           # Landing page
├── components/            # Reusable React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   ├── invoices/         # Invoice-related components
│   ├── transactions/     # Transaction management
│   └── ui/               # shadcn/ui base components
├── contexts/             # React Context providers
├── services/             # Backend service layer
├── ai/                   # Google Genkit AI flows
│   └── flows/           # AI processing flows
├── lib/                  # Utility libraries
├── types/               # TypeScript type definitions
└── utils/               # Helper utilities
```

## Key Features
- **Client Management**: Comprehensive client relationship tracking
- **Multi-Currency Support**: USD, EUR, PHP with PHP as primary display
- **AI-Powered Insights**: Financial analysis, income prediction, anomaly detection
- **Invoice Generation**: Professional PDF invoices with customizable templates
- **Email Automation**: Automated invoice sending and payment reminders
- **Transaction Tracking**: Detailed income and expense management
- **Financial Analytics**: Charts, reports, and trend analysis
- **Goal Tracking**: Financial goal setting and progress monitoring
- **Dark Theme**: Professional dark-first UI design

## Development Commands
```bash
# Development
bun run dev              # Start development server (port 9002)
bun run build           # Build for production
bun run start           # Start production server
bun run lint            # Run ESLint
bun run typecheck       # Run TypeScript compiler check

# AI Development
bun run genkit:dev      # Start Genkit development server
bun run genkit:watch    # Start Genkit with file watching
```

## Current Development Priorities
1. **Database Migration**: Transition from mock data to Firebase Firestore
2. **Authentication System**: Implement Firebase Auth with proper security rules
3. **Service Layer**: Complete backend service implementations
4. **AI Integration**: Enhance Genkit flows for financial insights
5. **Real-time Features**: Implement live data synchronization
6. **Mobile Optimization**: Responsive design improvements

## Critical Technical Debt
- **No Data Persistence**: Currently using mock data, needs Firebase integration
- **Missing Authentication**: Auth system partially implemented
- **Incomplete Services**: Service layer needs full CRUD operations
- **Currency API**: Needs real-time exchange rate integration

## Target Users
- **Primary**: Filipino freelancers and independent consultants
- **Secondary**: Small agencies and service providers
- **Geography**: Philippines-focused with international client support
- **Currency**: PHP primary, USD/EUR secondary

## AI Capabilities (Google Genkit)
- **Financial Insights**: Automated financial health analysis
- **Income Prediction**: ML-based revenue forecasting
- **Spending Anomalies**: Unusual expense pattern detection
- **Weekly Summaries**: AI-generated financial reports
- **Smart Categorization**: Automatic transaction categorization

## Firebase Schema
- **Users**: User profiles and preferences
- **Clients**: Client information and relationship data
- **Transactions**: Income and expense records with multi-currency support
- **Invoices**: Invoice generation and tracking
- **Categories**: Transaction categorization system
- **Goals**: Financial goal tracking
- **Email Templates**: Automated email system

## Development Guidelines
- Use TypeScript strict mode for all code
- Follow shadcn/ui patterns for consistent UI
- Implement proper error boundaries and loading states
- Ensure responsive design for mobile compatibility
- Use React Hook Form + Zod for all form validation
- Implement proper Firebase security rules
- Use bun for package management and script execution
- Follow existing code patterns and component structure

## Environment Setup
- Node.js 18+ (recommended with bun)
- Firebase CLI for backend development
- Genkit CLI for AI development
- TypeScript 5+ for type checking

## Current Swarm Configuration
The project uses Claude Swarm (`fintech-dev-swarm.yml`) with specialized roles:
- **Lead Architect**: Overall coordination and architectural decisions
- **Frontend Specialist**: React components and UI/UX (src/components/, src/app/)
- **Backend Specialist**: Firebase integration and services (src/services/, database)
- **AI Specialist**: Genkit flows and financial intelligence (src/ai/)
- **Business Logic Specialist**: Invoices, emails, and workflows

Start the development team: `claude-swarm fintech-dev-swarm.yml`