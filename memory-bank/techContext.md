# Tech Context: Chaching Financial Management Application

## Technology Stack

### Core Framework
- **Next.js 15.2.3**: React framework with App Router for modern SSR/SSG
- **TypeScript 5.x**: Strict typing for robust code quality
- **React 18.3.1**: Component library with concurrent features
- **Node.js**: Runtime environment for server-side operations

### AI/ML Integration
- **Google Genkit 1.8.0**: AI application framework for structured AI workflows
- **@genkit-ai/googleai**: Google AI integration for Gemini models
- **@genkit-ai/next**: Next.js specific Genkit integrations
- **Gemini 2.0 Flash**: AI model for financial insights and predictions

### UI/UX Libraries
- **Tailwind CSS 3.4.1**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Shadcn/ui**: Pre-built component library built on Radix
- **Lucide React**: Icon library for consistent iconography
- **Recharts 2.15.1**: Chart library for financial data visualization

### Form Management
- **React Hook Form 7.54.2**: Performant form library
- **@hookform/resolvers 4.1.3**: Form validation resolvers
- **Zod 3.24.2**: Schema validation for TypeScript
- **React Day Picker 8.10.1**: Date picker component

### Development Tools
- **TypeScript ESLint**: Code linting and formatting
- **PostCSS 8.x**: CSS processing
- **Tailwind CSS Animate**: Animation utilities
- **Class Variance Authority**: Utility for conditional styling

## Development Setup

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Git for version control

### Installation Commands
```bash
npm install                    # Install dependencies
npm run dev                   # Start development server (port 9002)
npm run genkit:dev           # Start Genkit AI development server
npm run genkit:watch         # Watch mode for AI development
npm run build                # Production build
npm run start                # Start production server
npm run lint                 # Run ESLint
npm run typecheck            # TypeScript type checking
```

### Environment Configuration
- **Development Port**: 9002 (configured in [`package.json`](package.json:6))
- **Turbopack**: Enabled for faster development builds
- **AI Development**: Separate Genkit server for AI flow testing

## Project Structure

### Directory Organization
```
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (app)/          # Authenticated routes group
│   │   ├── globals.css     # Global styles and CSS variables
│   │   ├── layout.tsx      # Root layout with dark theme
│   │   └── page.tsx        # Landing/home page
│   ├── components/         # React components
│   │   ├── features/       # Feature-specific components
│   │   ├── layout/         # Layout components
│   │   └── ui/            # Reusable UI components (shadcn/ui)
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── ai/                # Google Genkit AI flows
│       ├── genkit.ts      # AI configuration
│       ├── dev.ts         # Development server setup
│       └── flows/         # AI flow definitions
├── docs/                  # Documentation
├── memory-bank/           # Development memory and context
└── config files          # Various configuration files
```

### Key Configuration Files
- **[`next.config.ts`](next.config.ts:1)**: Next.js configuration
- **[`tailwind.config.ts`](tailwind.config.ts:1)**: Tailwind CSS configuration
- **[`tsconfig.json`](tsconfig.json:1)**: TypeScript configuration
- **[`components.json`](components.json:1)**: Shadcn/ui component configuration
- **[`postcss.config.mjs`](postcss.config.mjs:1)**: PostCSS configuration

## Technical Constraints

### TypeScript Configuration
- **Strict Mode**: Enabled for maximum type safety
- **No Emit**: Type checking only, compilation handled by Next.js
- **Module Resolution**: Node.js style with path mapping
- **Target**: ES2022 for modern JavaScript features

### Styling Constraints
- **Dark Theme Default**: [`src/app/layout.tsx`](src/app/layout.tsx:27) sets `className="dark"`
- **CSS Variables**: Theming through CSS custom properties
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Accessibility**: WCAG compliance through Radix UI primitives

### AI Integration Constraints
- **Structured I/O**: All AI flows use Zod schemas for validation
- **Server-Side Execution**: AI flows run on server for security
- **Rate Limiting**: Consider API limits for Gemini model usage
- **Error Handling**: Graceful degradation when AI services unavailable

## Dependencies Analysis

### Core Dependencies
```json
{
  "next": "15.2.3",              // React framework
  "react": "^18.3.1",            // UI library
  "typescript": "^5",            // Type system
  "tailwindcss": "^3.4.1",      // CSS framework
  "genkit": "^1.8.0"             // AI framework
}
```

### UI/Component Dependencies
```json
{
  "@radix-ui/react-*": "^1.x",   // Accessible primitives
  "lucide-react": "^0.475.0",    // Icons
  "recharts": "^2.15.1",         // Charts
  "class-variance-authority": "^0.7.1" // Styling utilities
}
```

### Form/Validation Dependencies
```json
{
  "react-hook-form": "^7.54.2",  // Form management
  "zod": "^3.24.2",              // Schema validation
  "@hookform/resolvers": "^4.1.3" // Form validation bridge
}
```

### AI/ML Dependencies
```json
{
  "@genkit-ai/googleai": "^1.8.0",  // Google AI integration
  "@genkit-ai/next": "^1.8.0",      // Next.js AI integration
  "genkit-cli": "^1.8.0"            // Development tools
}
```

## Performance Considerations

### Bundle Size Optimization
- **Tree Shaking**: Enabled for unused code elimination
- **Code Splitting**: Route-based automatic splitting
- **Dynamic Imports**: Lazy loading for AI components
- **Image Optimization**: Next.js automatic image optimization

### Runtime Performance
- **Server Components**: Default for static content
- **Client Components**: Only for interactive elements
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: Future consideration for large client lists

### AI Performance
- **Caching**: Consider caching frequent AI responses
- **Streaming**: Potential for streaming AI responses
- **Batch Processing**: Group similar AI requests
- **Fallback Strategies**: Graceful degradation for AI failures

## Security Considerations

### Data Validation
- **Input Sanitization**: Zod schemas for all user inputs
- **Type Safety**: TypeScript strict mode prevents runtime errors
- **SQL Injection Prevention**: Type-safe database operations (future)
- **XSS Protection**: React's built-in XSS prevention

### API Security
- **Server-Side AI**: AI operations run on server, not client
- **Environment Variables**: Sensitive data in environment files
- **Rate Limiting**: Implement for AI API calls
- **Authentication**: Future implementation for user sessions

### Client-Side Security
- **Context Isolation**: Separate contexts for different data domains
- **State Immutability**: Prevent direct state mutations
- **Component Boundaries**: Clear separation of concerns
- **Error Boundaries**: Graceful error handling

## Deployment Strategy

### Build Process
1. **Type Checking**: `npm run typecheck` validates TypeScript
2. **Linting**: `npm run lint` ensures code quality
3. **Build**: `npm run build` creates optimized production bundle
4. **Static Analysis**: Next.js analyzes bundle for optimization

### Environment Configuration
- **Development**: Local development with hot reload
- **Staging**: Firebase App Hosting (configured in [`apphosting.yaml`](apphosting.yaml:1))
- **Production**: Firebase or Vercel deployment
- **AI Services**: Separate Genkit server deployment

### Monitoring and Observability
- **Error Tracking**: Consider Sentry or similar service
- **Performance Monitoring**: Web Vitals tracking
- **AI Usage Metrics**: Monitor AI API usage and costs
- **User Analytics**: Privacy-focused analytics implementation

## Future Technical Considerations

### Database Integration
- **Planned**: Firebase Firestore or PostgreSQL
- **Pattern**: Repository pattern for data access
- **Migrations**: Version-controlled schema changes
- **Backup Strategy**: Automated backup procedures

### Authentication System
- **Planned**: Firebase Auth or NextAuth.js
- **Features**: Social login, email verification, password reset
- **Authorization**: Role-based access control
- **Session Management**: Secure token handling

### API Architecture
- **Pattern**: REST API with Next.js API routes
- **Documentation**: OpenAPI/Swagger documentation
- **Versioning**: API versioning strategy
- **Testing**: API endpoint testing framework

## Implementation Decisions (NEW)

### Database Integration
- **Decision**: Firebase Firestore selected
- **Rationale**: Real-time capabilities, seamless Next.js integration, document-based storage
- **Implementation Timeline**: Week 1-2 (Sprint 1)
- **Schema**: User-scoped collections for data isolation
- **Backup Strategy**: Automatic Firebase backups with export capabilities

### Authentication System
- **Decision**: Firebase Auth selected
- **Features**: Email/password, social login ready, session management
- **Integration**: Unified with Firestore database
- **Implementation Timeline**: Week 2 (Sprint 1)
- **Security**: Built-in session management and token handling

### Development Framework (NEW)
- **Sprint Structure**: 2-week sprints, 8 total sprints
- **Story Points**: 147 total points across 30 user stories
- **Quality Gates**: Weekly reviews and phase completion checkpoints
- **Documentation Strategy**: Memory bank updates after each milestone

### Testing Strategy (NEW)
- **Unit Testing**: Jest + React Testing Library
- **Coverage Target**: >80% for all new code
- **Integration Testing**: API endpoint and database integration tests
- **End-to-End Testing**: Critical user workflows
- **Performance Testing**: Load testing for production readiness

### Deployment Strategy (NEW)
- **Platform**: Firebase App Hosting (recommended)
- **Environment**: Development → Staging → Production pipeline
- **CI/CD**: Automated testing and deployment
- **Monitoring**: Performance and error tracking integration

**Confidence Rating: 10/10 (Planning Complete)**