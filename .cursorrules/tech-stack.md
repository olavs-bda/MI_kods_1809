# ACCOUNTALIST - Technology Stack & Architecture Decisions

## Core Technology Stack

### Frontend Framework: Next.js 15 with App Router

**Why Next.js 15:**

- **App Router Architecture**: Latest routing system optimized for Server Components and streaming
- **Server Components by Default**: Optimal performance for receipts dashboard and task lists
- **Built-in Optimization**: Image optimization, font loading, and automatic code splitting
- **Vercel Integration**: Seamless deployment with edge functions for escalation scheduling
- **TypeScript Support**: First-class TypeScript integration for type-safe development
- **React 19 Features**: Latest React features including Server Actions for form handling

**Key Benefits:**

- Server-side rendering reduces initial page load times critical for mobile users
- Server Components minimize JavaScript bundle size for better mobile performance
- Streaming UI enables progressive loading of task lists and receipts data
- API routes provide serverless backend functionality without separate infrastructure

### Database & Backend: Supabase (PostgreSQL)

**Why Supabase:**

- **Integrated Authentication**: Built-in auth with JWT tokens and Row-Level Security (RLS)
- **Real-time Capabilities**: Live updates for task status and escalation notifications
- **PostgreSQL Power**: Full SQL database with ACID compliance and complex queries
- **Row-Level Security**: Multi-tenant data isolation critical for privacy and security
- **Automatic API Generation**: RESTful API and GraphQL endpoints auto-generated from schema
- **Built-in Storage**: File storage for user avatars and future attachment features

**Database Architecture:**

- **RLS Policies**: Ensure users can only access their own tasks, contacts, and escalations
- **Database Triggers**: Automatic timestamp updates and data validation
- **Indexing Strategy**: Optimized indexes for escalation scheduling and task queries
- **JSONB Fields**: Flexible storage for escalation policies and user preferences

### Authentication: Supabase Auth

**Why Supabase Auth:**

- **Integrated Solution**: Seamless integration with database RLS policies
- **Multiple Providers**: Email/password with future social login support
- **JWT Tokens**: Secure session management with automatic refresh
- **Password Security**: Industry-standard hashing and security policies
- **Session Management**: Automatic session handling across client and server components

### Styling Framework: Tailwind CSS + shadcn/ui

**Why Tailwind CSS:**

- **Rapid Development**: Utility-first approach enables fast UI iteration
- **Mobile-First**: Responsive design optimized for mobile task management
- **Performance**: Automatic purging eliminates unused CSS for optimal bundle size
- **Consistency**: Design system approach ensures consistent visual language
- **Viral-Ready UI**: Clean, screenshot-worthy design optimized for social sharing

**Why shadcn/ui:**

- **Modern Components**: Pre-built components following React best practices
- **Customizable**: Full control over component styling and behavior
- **Accessibility**: WCAG-compliant components out of the box
- **TypeScript**: Full TypeScript support for type-safe component usage

### Type Safety: TypeScript

**Why TypeScript:**

- **Escalation System Reliability**: Type safety critical for escalation scheduling accuracy
- **Database Type Safety**: Generated types from Supabase schema prevent data errors
- **Better Developer Experience**: IDE support with autocomplete and error detection
- **Refactoring Safety**: Large codebase refactoring with confidence
- **Team Collaboration**: Clear interfaces and contracts for team development

## Communication & Notification Stack

### Email Service: Resend + React Email

**Why Resend:**

- **Developer Experience**: Modern API designed for React applications
- **React Email Integration**: Create email templates as React components
- **Delivery Reliability**: High deliverability rates with reputation management
- **Webhook Support**: Real-time delivery confirmations for receipts tracking
- **Template Management**: Version control for email templates in codebase

**React Email Benefits:**

- **Component-Based**: Reusable email components with props for personalization
- **Preview System**: Visual email template development and testing
- **Cross-Client Compatibility**: Ensures emails render correctly across all email clients

### SMS Service: Twilio (Future Integration)

**Why Twilio:**

- **Reliability**: Industry-leading SMS delivery and global coverage
- **Status Callbacks**: Real-time delivery confirmations for receipts system
- **Compliance**: Built-in compliance with TCPA and international regulations
- **Scalability**: Handle high-volume SMS delivery for growing user base
- **API Quality**: Comprehensive API with excellent documentation and SDKs

### Backup Email: SendGrid (Fallback)

**Why SendGrid Fallback:**

- **Reliability**: Dual-provider approach ensures 99%+ delivery success
- **Global Infrastructure**: Worldwide delivery infrastructure for international users
- **Reputation Management**: Separate IP reputation for critical escalation messages
- **Analytics**: Detailed delivery analytics and bounce handling

## Background Job Processing

### Vercel Edge Functions (MVP)

**Why Edge Functions:**

- **Vercel Integration**: Native integration with Next.js deployment
- **Global Distribution**: Run escalation checks from locations closest to users
- **Serverless Architecture**: No infrastructure management required
- **Cost Effective**: Pay-per-execution model for MVP scale
- **TypeScript Support**: Same language and tooling as main application

### Planned Migration: Inngest (Scale)

**Why Inngest for Scale:**

- **Reliability**: Built specifically for critical background job processing
- **Retry Logic**: Sophisticated retry mechanisms with exponential backoff
- **Observability**: Complete visibility into job execution and failure handling
- **Type Safety**: TypeScript-first approach with type-safe job definitions
- **Scalability**: Handle millions of escalation jobs without performance degradation

## Development & Deployment Tools

### Version Control: Git + GitHub

- **Branch Protection**: Prevent direct pushes to main branch
- **Pull Request Reviews**: Code review process for quality assurance
- **GitHub Actions**: CI/CD pipeline for automated testing and deployment
- **Issue Tracking**: Project management and bug tracking integration

### Code Quality Tools

- **ESLint**: Code linting with Next.js and TypeScript rules
- **Prettier**: Consistent code formatting across team
- **Husky**: Git hooks for pre-commit code quality checks
- **lint-staged**: Run linters only on staged files for performance

### Testing Framework

- **Jest**: Unit testing for utility functions and business logic
- **React Testing Library**: Component testing with user interaction focus
- **Playwright**: End-to-end testing for critical user flows
- **MSW**: Mock Service Worker for API testing without backend dependencies

### Deployment: Vercel

**Why Vercel:**

- **Next.js Optimization**: Built specifically for Next.js applications
- **Global CDN**: Edge network for optimal performance worldwide
- **Preview Deployments**: Automatic deployments for every pull request
- **Analytics**: Performance monitoring and user analytics
- **Environment Management**: Secure handling of environment variables and secrets

## Monitoring & Analytics

### Performance Monitoring

- **Vercel Analytics**: Core web vitals and performance metrics
- **Sentry**: Error tracking and performance monitoring
- **Uptime Monitoring**: Service uptime alerts for critical functionality

### Business Analytics

- **PostHog**: Privacy-first analytics for user behavior tracking
- **Custom Dashboard**: Supabase-based dashboard for business metrics
- **A/B Testing**: Experiment framework for optimization testing

## Security & Compliance

### Data Security

- **Encryption at Rest**: All sensitive data encrypted in Supabase
- **TLS 1.3**: Encrypted data transmission with modern TLS
- **JWT Security**: Secure session management with token rotation
- **Input Validation**: Comprehensive validation using Zod schemas

### Privacy Compliance

- **GDPR Ready**: Data export and deletion capabilities
- **Consent Management**: Granular consent tracking for contacts
- **Privacy by Design**: Minimal data collection with clear purposes
- **Audit Logging**: Track all sensitive operations for compliance

## Technology Migration Strategy

### MVP Phase (Weeks 1-6)

- **Focus**: Development velocity and feature completeness
- **Stack**: Next.js + Supabase + Resend + Vercel Edge Functions
- **Goal**: Prove core escalation system reliability

### Growth Phase (Post-MVP)

- **Inngest Integration**: Migrate escalation scheduling for enterprise reliability
- **SMS Integration**: Add Twilio for multi-channel escalation
- **Advanced Analytics**: Implement comprehensive user behavior tracking
- **Mobile App**: React Native app sharing core business logic

### Scale Phase (6+ Months)

- **Infrastructure Options**: Evaluate Railway, Fly.io, or AWS for complex requirements
- **Database Scaling**: Implement read replicas and connection pooling
- **Message Queue**: Advanced queue system for high-volume message processing
- **Enterprise Features**: Multi-tenant architecture and admin dashboards

## Development Environment Setup

### Required Tools

- **Node.js 18+**: Latest LTS version for Next.js 15 compatibility
- **npm/yarn**: Package manager with lockfile for reproducible builds
- **Docker**: Local development environment and testing consistency
- **Supabase CLI**: Database migrations and local development

### Environment Variables

```bash
# Authentication
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email Services
RESEND_API_KEY=
SENDGRID_API_KEY=

# SMS (Future)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
SENTRY_DSN=
```

### Local Development Commands

```bash
# Start development server
npm run dev

# Run database migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/database.ts

# Run tests
npm run test
npm run test:e2e

# Build for production
npm run build
```

This technology stack provides a solid foundation for the ACCOUNTALIST MVP while maintaining clear migration paths for scaling to enterprise reliability and feature requirements.
