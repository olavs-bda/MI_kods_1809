# ACCOUNTALIST - Project Structure & System Architecture

## Overall System Architecture

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Server        │ │    Client       │ │     API         ││
│  │  Components     │ │  Components     │ │    Routes       ││
│  │                 │ │                 │ │                 ││
│  │ • Task Lists    │ │ • Task Forms    │ │ • Task CRUD     ││
│  │ • Receipts      │ │ • Contact Mgmt  │ │ • Escalations   ││
│  │ • Analytics     │ │ • Real-time UI  │ │ • Notifications ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Database      │ │      Auth       │ │   Real-time     ││
│  │  (PostgreSQL)   │ │                 │ │  Subscriptions  ││
│  │                 │ │ • User Auth     │ │                 ││
│  │ • RLS Policies  │ │ • Session Mgmt  │ │ • Live Updates  ││
│  │ • Triggers      │ │ • JWT Tokens    │ │ • Notifications ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services Integration                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │     Resend      │ │     Twilio      │ │    Vercel       ││
│  │   Email API     │ │    SMS API      │ │  Edge Functions ││
│  │                 │ │                 │ │                 ││
│  │ • React Email   │ │ • SMS Delivery  │ │ • Cron Jobs     ││
│  │ • Templates     │ │ • Delivery      │ │ • Escalation    ││
│  │ • Webhooks      │ │ • Confirmations │ │ • Scheduler     ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

### Next.js 15 App Router Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              # Login page
│   │   ├── register/
│   │   │   └── page.tsx              # Registration page
│   │   └── layout.tsx                # Auth layout
│   ├── (dashboard)/
│   │   ├── tasks/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Individual task view
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Task creation
│   │   │   └── page.tsx              # Task list
│   │   ├── contacts/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Contact management
│   │   │   └── page.tsx              # Contacts list
│   │   ├── receipts/
│   │   │   └── page.tsx              # Escalation history
│   │   ├── settings/
│   │   │   └── page.tsx              # User preferences
│   │   └── layout.tsx                # Dashboard layout
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/route.ts     # Auth callbacks
│   │   ├── tasks/
│   │   │   ├── [id]/route.ts         # Task CRUD operations
│   │   │   └── route.ts              # Task list operations
│   │   ├── contacts/
│   │   │   ├── [id]/route.ts         # Contact management
│   │   │   ├── verify/route.ts       # Contact verification
│   │   │   └── route.ts              # Contact operations
│   │   ├── escalations/
│   │   │   ├── schedule/route.ts     # Escalation scheduling
│   │   │   ├── deliver/route.ts      # Message delivery
│   │   │   └── webhook/route.ts      # Delivery confirmations
│   │   └── cron/
│   │       └── escalation-check/route.ts # Scheduled escalation checks
│   ├── onboarding/
│   │   ├── contacts/
│   │   │   └── page.tsx              # Shame contact selection
│   │   ├── first-task/
│   │   │   └── page.tsx              # First task creation
│   │   └── page.tsx                  # Welcome flow
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout
│   ├── loading.tsx                   # Global loading UI
│   ├── error.tsx                     # Global error UI
│   └── page.tsx                      # Landing page
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   ├── TaskForm.tsx
│   │   ├── TaskCard.tsx
│   │   └── EscalationSettings.tsx
│   ├── contacts/
│   │   ├── ContactList.tsx
│   │   ├── ContactForm.tsx
│   │   └── ContactVerification.tsx
│   ├── receipts/
│   │   ├── ReceiptsDashboard.tsx
│   │   └── EscalationHistory.tsx
│   └── layout/
│       ├── Navigation.tsx
│       ├── Sidebar.tsx
│       └── Header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Supabase client config
│   │   ├── server.ts                 # Server-side Supabase
│   │   └── types.ts                  # Database types
│   ├── email/
│   │   ├── resend.ts                 # Resend configuration
│   │   └── templates/                # React email templates
│   │       ├── escalation-gentle.tsx
│   │       ├── escalation-moderate.tsx
│   │       └── escalation-shame.tsx
│   ├── sms/
│   │   └── twilio.ts                 # Twilio SMS integration
│   ├── escalation/
│   │   ├── scheduler.ts              # Escalation scheduling logic
│   │   ├── delivery.ts               # Message delivery system
│   │   └── templates.ts              # Message template engine
│   └── utils/
│       ├── validation.ts             # Input validation schemas
│       ├── auth.ts                   # Authentication helpers
│       └── date.ts                   # Date/time utilities
├── types/
│   ├── database.ts                   # Supabase generated types
│   ├── escalation.ts                 # Escalation system types
│   └── user.ts                       # User-related types
└── middleware.ts                     # Next.js middleware for auth
```

## Database Schema Design

### Core Tables

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'enterprise')),
  escalation_preferences JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tasks Table

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  escalation_policy JSONB NOT NULL, -- Escalation configuration
  stakes_level INTEGER DEFAULT 1 CHECK (stakes_level BETWEEN 1 AND 3),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Contacts Table

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('friend', 'partner', 'parent', 'sibling', 'boss', 'colleague', 'ex', 'other')),
  escalation_tier INTEGER NOT NULL CHECK (escalation_tier BETWEEN 1 AND 3),
  consent_status TEXT DEFAULT 'pending' CHECK (consent_status IN ('pending', 'verified', 'declined', 'revoked')),
  consent_token TEXT UNIQUE,
  consent_verified_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Escalations Table

```sql
CREATE TABLE escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  escalation_tier INTEGER NOT NULL CHECK (escalation_tier BETWEEN 1 AND 3),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'delivered', 'failed', 'cancelled')),
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms', 'push')),
  message_content TEXT,
  delivery_id TEXT, -- External provider message ID
  delivered_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Receipts Table

```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escalation_id UUID REFERENCES escalations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'resend', 'twilio', etc.
  provider_message_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'sent', 'delivered', 'bounced', 'opened', etc.
  event_data JSONB,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Critical indexes for escalation system performance
CREATE INDEX idx_tasks_due_date_status ON tasks(due_date, status) WHERE status = 'pending';
CREATE INDEX idx_escalations_scheduled_status ON escalations(scheduled_for, status) WHERE status = 'scheduled';
CREATE INDEX idx_escalations_task_tier ON escalations(task_id, escalation_tier);
CREATE INDEX idx_contacts_user_tier ON contacts(user_id, escalation_tier) WHERE consent_status = 'verified';
CREATE INDEX idx_receipts_escalation_event ON receipts(escalation_id, event_type);
```

### Row-Level Security (RLS) Policies

```sql
-- Users can only access their own data
CREATE POLICY user_isolation ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY task_isolation ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY contact_isolation ON contacts FOR ALL USING (auth.uid() = user_id);

-- Escalations and receipts inherit user access through task/contact relationships
CREATE POLICY escalation_access ON escalations FOR ALL USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = escalations.task_id AND tasks.user_id = auth.uid())
);
```

## Data Flow Architecture

### Task Lifecycle Flow

1. **Task Creation**: User creates task with deadline and escalation policy
2. **Contact Assignment**: System validates contacts have verified consent
3. **Escalation Scheduling**: Background scheduler creates escalation jobs based on due date
4. **Overdue Detection**: Cron job checks for overdue tasks every minute
5. **Escalation Execution**: Message delivery system sends notifications to assigned contacts
6. **Receipt Tracking**: Webhooks record delivery confirmations and failures
7. **Completion Handling**: Task completion cancels all pending escalations

### Escalation Engine Flow

1. **Trigger Detection**: Scheduled job identifies overdue tasks
2. **Contact Selection**: System selects appropriate contacts based on escalation tier
3. **Message Generation**: Template engine creates personalized messages
4. **Multi-channel Delivery**: Parallel delivery via email, SMS with fallback logic
5. **Delivery Confirmation**: Receipt tracking via provider webhooks
6. **Retry Logic**: Failed deliveries trigger exponential backoff retry system
7. **Audit Trail**: Complete escalation history stored for receipts dashboard

### Real-time Updates Flow

1. **User Actions**: Client components trigger optimistic UI updates
2. **Server Actions**: Next.js server actions handle data mutations
3. **Database Changes**: Supabase triggers real-time subscriptions
4. **UI Synchronization**: Client receives real-time updates for immediate consistency
5. **Error Recovery**: Failed operations trigger rollback and error state handling
