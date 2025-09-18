# ACCOUNTALIST - Cursor Rules Documentation

This directory contains comprehensive documentation for the ACCOUNTALIST social accountability to-do app, designed to guide Cursor AI in understanding and developing the project.

## 📚 Documentation Overview

### [project-overview.md](project-overview.md)

**The North Star Document**

- Core vision: Social accountability through escalating shame notifications
- Primary goals: Viral growth, behavioral change, sustainable business model
- Success metrics: Technical validation, business validation, viral growth indicators
- Market positioning and competitive advantages

### [requirements.md](requirements.md)

**Functional & Technical Specifications**

- **Functional Requirements**: Core features from task management to escalation engine
- **Technical Requirements**: Performance, reliability, security, and scalability standards
- **Compliance Requirements**: GDPR, CAN-SPAM, TCPA, and platform policy compliance

### [project-structure.md](project-structure.md)

**System Architecture & Database Design**

- Next.js 15 App Router directory structure
- Database schema with users, tasks, contacts, escalations, receipts tables
- Data flow architecture for task lifecycle and escalation engine
- Row-Level Security (RLS) policies for multi-tenant privacy

### [tech-stack.md](tech-stack.md)

**Technology Choices & Justifications**

- **Core Stack**: Next.js 15, TypeScript, Tailwind CSS, Supabase
- **Communication**: Resend + React Email, Twilio SMS (future)
- **Background Jobs**: Vercel Edge Functions → Inngest migration path
- **Development Tools**: Testing framework, deployment pipeline, monitoring

### [features.md](features.md)

**Detailed Feature Specifications**

- **MVP Features**: Smart escalation system, task management, contact management, receipts dashboard
- **Premium Features**: Advanced accountability, group challenges, analytics
- **Social Features**: Community sharing, referral systems, viral growth mechanics
- Acceptance criteria and technical specifications for each feature

### [implementation.md](implementation.md)

**Development Approach & Guidelines**

- Coding standards with TypeScript and Next.js 15 best practices
- Database design patterns and security implementation
- Testing strategy (unit, integration, E2E) with code examples
- Performance optimization and deployment procedures

### [user-flow.md](user-flow.md)

**Complete User Journey Mapping**

- **Primary Journey**: Discovery → Onboarding → Task Execution → Habit Formation → Community → Premium
- **Key Touch Points**: "Pick Your Shame Contacts" ritual, escalation experience, receipts transparency
- **Edge Cases**: Contact consent failures, delivery issues, emergency cancellations
- Social sharing and viral growth mechanisms

## 🎯 Quick Reference

### Core Concept

ACCOUNTALIST transforms procrastination into productivity by escalating missed tasks to chosen contacts (friends, family, boss, ex) - creating real social consequences that drive follow-through.

### Key Differentiators

- **Real Stakes**: Social consequences vs meaningless gamification
- **Viral by Design**: Story-worthy experiences drive organic growth
- **Privacy-First**: Transparent consent and control systems
- **Reliability-Focused**: 99%+ escalation delivery success rate

### MVP Timeline

10-week roadmap from foundation setup to launch preparation:

- **Weeks 1-2**: Next.js + Supabase setup, authentication, basic UI
- **Weeks 3-4**: Task management, contact system, escalation policies
- **Weeks 5-6**: Escalation engine, React email templates, delivery pipeline
- **Weeks 7-8**: Viral onboarding, social sharing, mobile optimization
- **Weeks 9-10**: Premium features, reliability audit, launch preparation

### Technical Priorities

1. **Escalation System Reliability**: The core value proposition cannot fail
2. **Mobile-First Performance**: Sub-2-second load times for task management
3. **Privacy & Security**: GDPR compliance, RLS policies, encrypted data
4. **Viral UX**: Screenshot-ready design optimized for social sharing
5. **Scalable Architecture**: Migration path from MVP to enterprise scale

## 🚀 Development Quick Start

### Key Technologies

```bash
# Core stack
Next.js 15 + App Router + TypeScript + Tailwind CSS
Supabase (PostgreSQL + Auth + RLS)
Resend (React Email templates)
Vercel (Deployment + Edge Functions)

# Development setup
npm create next-app@latest accountalist --typescript --tailwind --app
npm install @supabase/supabase-js resend react-email
npm install -D @types/node jest playwright
```

### Critical Implementation Notes

- **Server Components First**: Use Client Components only when necessary
- **Type Safety**: Generate Supabase types, validate with Zod
- **Escalation Reliability**: Comprehensive error handling and retry logic
- **Privacy by Design**: RLS policies, consent management, audit trails
- **Performance Focus**: React.cache, Suspense boundaries, optimized queries

## 📊 Success Metrics

### Technical Validation

- 99%+ escalation delivery reliability
- 70%+ task completion rate improvement
- Sub-2-second mobile performance
- Complete audit trail transparency

### Business Validation

- 500+ beta users with verified shame contacts
- 80%+ user engagement with escalation system
- 20%+ free-to-paid conversion rate
- 1.5+ viral coefficient through sharing

---

**Status**: All documentation complete and ready for development. This rule set provides comprehensive guidance for building the MVP of ACCOUNTALIST with focus on reliability, viral growth, and user privacy.
