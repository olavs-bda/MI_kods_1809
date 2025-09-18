# ACCOUNTALIST - Implementation Guide & Development Approach

## Development Methodology & Approach

### Agile Development with Reliability Focus

**Philosophy**: Build fast, but never compromise on escalation system reliability. The core value proposition depends on 99%+ notification delivery success.

**Sprint Structure**:

- **2-week sprints** aligned with weekly milestone deliveries from MVP roadmap
- **Daily standups** focused on escalation system reliability and user testing feedback
- **Weekly demos** with emphasis on viral-ready features and user experience
- **Retrospectives** focused on technical reliability and user feedback integration

### Reliability-First Development Principles

1. **Escalation System is Sacred**: Never deploy changes that could affect notification delivery
2. **Test Before Deploy**: All escalation-related code requires comprehensive testing
3. **Graceful Degradation**: System continues functioning even when non-critical features fail
4. **Audit Everything**: Complete logging for all escalation attempts and deliveries
5. **User Safety First**: Privacy and consent mechanisms are non-negotiable requirements

---

## Coding Standards & Guidelines

### TypeScript Standards

```typescript
// Use strict TypeScript configuration
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}

// Database types generated from Supabase
import { Database } from '@/types/database'
type Task = Database['public']['Tables']['tasks']['Row']
type Escalation = Database['public']['Tables']['escalations']['Row']

// Escalation system interfaces
interface EscalationPolicy {
  tiers: EscalationTier[]
  timing: EscalationTiming
  contacts: ContactAssignment[]
}

interface EscalationTier {
  level: 1 | 2 | 3
  delayMinutes: number
  messageTemplate: string
  deliveryMethods: ('email' | 'sms' | 'push')[]
}
```

### Next.js 15 App Router Conventions

```typescript
// Server Components by default - no "use client" unless necessary
export default async function TasksPage() {
  const tasks = await getTasks(); // Server-side data fetching
  return <TaskList tasks={tasks} />;
}

// Client Components only when needed
("use client");
export default function TaskForm({ onSubmit }: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Client-side interactions only
}

// Server Actions for mutations
("use server");
export async function createTask(taskData: TaskInput) {
  const supabase = createServerClient();
  // Server-side database operations
}
```

### File Naming Conventions

- **Components**: PascalCase (`TaskList.tsx`, `EscalationSettings.tsx`)
- **Pages**: lowercase (`page.tsx`, `layout.tsx`, `loading.tsx`)
- **API Routes**: lowercase (`route.ts` in appropriate folders)
- **Utilities**: camelCase (`validation.ts`, `escalationEngine.ts`)
- **Types**: PascalCase (`TaskTypes.ts`, `EscalationTypes.ts`)

### Component Architecture Standards

```typescript
// Props interface at top of file
interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => Promise<void>;
  onEdit?: (taskId: string) => void;
  showEscalationStatus?: boolean;
}

// Component with proper TypeScript
export default function TaskCard({
  task,
  onComplete,
  onEdit,
  showEscalationStatus = true,
}: TaskCardProps) {
  // Component logic
  return <div className="task-card">{/* JSX with proper accessibility */}</div>;
}
```

---

## Database Design & Management

### Supabase Schema Management

```sql
-- Migration naming: YYYYMMDD_HHMMSS_description.sql
-- Example: 20241201_143000_create_escalations_table.sql

-- Always include proper indexes for performance
CREATE INDEX CONCURRENTLY idx_tasks_due_status
ON tasks(due_date, status)
WHERE status = 'pending';

-- RLS policies for security
CREATE POLICY user_tasks ON tasks
FOR ALL USING (auth.uid() = user_id);

-- Database triggers for automation
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Data Access Patterns

```typescript
// Create typed Supabase client
export const createServerClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// Repository pattern for data access
export class TaskRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getTasksWithEscalations(
    userId: string
  ): Promise<TaskWithEscalations[]> {
    const { data, error } = await this.supabase
      .from("tasks")
      .select(
        `
        *,
        escalations (
          id,
          status,
          scheduled_for,
          contact:contacts(name, relationship_type)
        )
      `
      )
      .eq("user_id", userId)
      .order("due_date", { ascending: true });

    if (error) throw new DatabaseError(error.message);
    return data;
  }
}
```

### Database Migration Strategy

1. **Always use transactions** for multi-table changes
2. **Create indexes concurrently** to avoid blocking
3. **Test migrations** on staging data before production
4. **Backup before major changes** with point-in-time recovery
5. **Monitor performance** after schema changes

---

## API Design & Integration

### RESTful API Standards

```typescript
// API route structure: app/api/[resource]/[id]/route.ts

// GET /api/tasks - List user's tasks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    // Implementation with proper error handling
    const tasks = await taskRepository.getTasks(userId, { status, priority });

    return NextResponse.json({ data: tasks, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks", success: false },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create new task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = taskCreateSchema.parse(body);

    const task = await taskRepository.create(validatedData);

    // Trigger escalation scheduling
    await scheduleEscalations(task);

    return NextResponse.json({ data: task, success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors, success: false },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### External Service Integration

```typescript
// Resend Email Service
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEscalationEmail(
    to: string,
    escalation: EscalationData
  ): Promise<EmailDeliveryResult> {
    try {
      const { data } = await this.resend.emails.send({
        from: "AccountaList <escalations@accountalist.com>",
        to,
        subject: this.generateSubject(escalation),
        react: EscalationEmailTemplate({ escalation }),
        headers: {
          "X-Escalation-ID": escalation.id,
          "X-Task-ID": escalation.taskId,
        },
      });

      // Record delivery attempt
      await this.recordDelivery(escalation.id, "sent", data.id);

      return { success: true, messageId: data.id };
    } catch (error) {
      await this.recordDelivery(escalation.id, "failed", null, error.message);
      throw new EmailDeliveryError(error);
    }
  }
}
```

### Webhook Handling

```typescript
// Webhook for email delivery confirmations
export async function POST(request: Request) {
  const signature = request.headers.get("resend-signature");
  const body = await request.text();

  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  // Update escalation delivery status
  await updateEscalationStatus(
    event.data.headers["X-Escalation-ID"],
    event.type, // 'email.delivered', 'email.bounced', etc.
    event.data
  );

  return NextResponse.json({ received: true });
}
```

---

## Security Implementation

### Authentication & Authorization

```typescript
// Middleware for protected routes
export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

// Row-Level Security enforcement
export async function getUserTasks(userId: string) {
  const supabase = createServerClient();

  // RLS automatically filters by user_id
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId); // Redundant but explicit

  if (error) throw new DatabaseError(error.message);
  return data;
}
```

### Input Validation with Zod

```typescript
import { z } from "zod";

// Task creation validation
export const taskCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  due_date: z.string().datetime("Invalid due date"),
  priority: z.number().int().min(1).max(3),
  escalation_policy: z.object({
    tiers: z.array(escalationTierSchema),
    contacts: z.array(z.string().uuid()),
  }),
});

// Contact verification schema
export const contactVerifySchema = z.object({
  token: z.string().uuid(),
  consent: z.boolean(),
  preferences: z
    .object({
      email_allowed: z.boolean().default(true),
      sms_allowed: z.boolean().default(false),
      time_restrictions: z.string().optional(),
    })
    .optional(),
});
```

### Privacy & Data Protection

```typescript
// GDPR compliance utilities
export class PrivacyService {
  static async exportUserData(userId: string): Promise<UserDataExport> {
    // Compile all user data across tables
    const userData = {
      user: await getUserProfile(userId),
      tasks: await getUserTasks(userId),
      contacts: await getUserContacts(userId),
      escalations: await getUserEscalations(userId),
      receipts: await getUserReceipts(userId),
    };

    return userData;
  }

  static async deleteUserData(userId: string): Promise<void> {
    // Cascade delete with audit logging
    await supabase.rpc("delete_user_cascade", { user_id: userId });

    // Log deletion for compliance
    await auditLogger.log("user_deleted", { userId, timestamp: new Date() });
  }
}
```

---

## Testing Strategy

### Testing Pyramid Structure

```
    /\
   /  \
  /Unit\     70% - Fast, isolated unit tests
 /______\
 \  E2E  /    20% - Integration and component tests
  \____/
   /UI\      10% - End-to-end critical path tests
  /____\
```

### Unit Testing with Jest

```typescript
// __tests__/escalation-engine.test.ts
import { EscalationEngine } from "@/lib/escalation/engine";
import { mockTask, mockContacts } from "@/test/fixtures";

describe("EscalationEngine", () => {
  let engine: EscalationEngine;

  beforeEach(() => {
    engine = new EscalationEngine();
    jest.clearAllMocks();
  });

  it("should schedule correct escalation tiers", async () => {
    const task = mockTask({ due_date: "2024-01-01T12:00:00Z" });
    const escalations = await engine.scheduleEscalations(task);

    expect(escalations).toHaveLength(3);
    expect(escalations[0].scheduled_for).toBe("2024-01-01T12:15:00Z");
    expect(escalations[1].scheduled_for).toBe("2024-01-01T13:00:00Z");
    expect(escalations[2].scheduled_for).toBe("2024-01-01T16:00:00Z");
  });

  it("should handle timezone conversion correctly", async () => {
    const userTimezone = "America/New_York";
    const contactTimezone = "Europe/London";

    const scheduledTime = engine.calculateEscalationTime(
      mockTask({ due_date: "2024-01-01T12:00:00Z" }),
      mockContacts.gentle,
      userTimezone,
      contactTimezone
    );

    expect(scheduledTime).toBe("2024-01-01T12:15:00Z");
  });
});
```

### Component Testing with React Testing Library

```typescript
// __tests__/components/TaskForm.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TaskForm } from "@/components/tasks/TaskForm";
import { mockSupabaseClient } from "@/test/mocks";

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseClient,
}));

describe("TaskForm", () => {
  it("creates task with escalation policy", async () => {
    const onSubmit = jest.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    // Fill form
    fireEvent.change(screen.getByLabelText("Task Title"), {
      target: { value: "Complete project proposal" },
    });

    fireEvent.change(screen.getByLabelText("Due Date"), {
      target: { value: "2024-01-15T17:00" },
    });

    // Select escalation contacts
    fireEvent.click(screen.getByText("Add Escalation Contact"));
    fireEvent.click(screen.getByText("Partner - Sarah"));

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: "Create Task" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "Complete project proposal",
        due_date: "2024-01-15T17:00:00Z",
        escalation_policy: {
          tiers: [
            { level: 1, contacts: ["sarah-contact-id"], delay_minutes: 15 },
          ],
        },
      });
    });
  });
});
```

### End-to-End Testing with Playwright

```typescript
// e2e/escalation-flow.spec.ts
import { test, expect } from "@playwright/test";
import { createTestUser, createTestTask } from "./helpers";

test.describe("Escalation System", () => {
  test("sends escalation after task becomes overdue", async ({ page }) => {
    // Setup test user and task
    const user = await createTestUser();
    const task = await createTestTask({
      userId: user.id,
      due_date: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
      escalation_policy: {
        tiers: [{ level: 1, delay_minutes: 15, contacts: ["test-contact"] }],
      },
    });

    // Login and navigate to dashboard
    await page.goto("/login");
    await page.fill("[data-testid=email]", user.email);
    await page.fill("[data-testid=password]", "testpassword");
    await page.click("[data-testid=submit]");

    await page.goto("/dashboard/receipts");

    // Verify escalation was sent
    await expect(page.locator("[data-testid=escalation-sent]")).toContainText(
      "Escalation sent to test contact"
    );

    // Verify task shows overdue status
    await page.goto("/dashboard/tasks");
    await expect(page.locator(`[data-task-id="${task.id}"]`)).toHaveClass(
      /overdue/
    );
  });
});
```

### Testing Environment Setup

```bash
# Test database with Supabase
npm run test:setup:db

# Run unit tests
npm run test

# Run component tests
npm run test:components

# Run E2E tests
npm run test:e2e

# Test coverage report
npm run test:coverage
```

---

## Performance Optimization

### Next.js Optimization Strategies

```typescript
// Server Component optimization
export default async function TasksPage() {
  // Parallel data fetching
  const [tasks, contacts, escalations] = await Promise.all([
    getTasks(),
    getContacts(),
    getPendingEscalations(),
  ]);

  return (
    <Suspense fallback={<TasksLoading />}>
      <TasksDashboard
        tasks={tasks}
        contacts={contacts}
        escalations={escalations}
      />
    </Suspense>
  );
}

// Client Component optimization
("use client");
import { memo, useMemo, useCallback } from "react";

const TaskCard = memo(function TaskCard({ task, onComplete }: TaskCardProps) {
  const timeUntilDue = useMemo(
    () => calculateTimeRemaining(task.due_date),
    [task.due_date]
  );

  const handleComplete = useCallback(
    () => onComplete(task.id),
    [task.id, onComplete]
  );

  return <div className="task-card">{/* Optimized rendering */}</div>;
});
```

### Database Query Optimization

```typescript
// Optimized queries with proper indexing
export async function getTasksWithEscalations(userId: string) {
  // Single query with joins instead of N+1
  const { data } = await supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      due_date,
      status,
      escalations!inner (
        id,
        status,
        scheduled_for,
        contact:contacts!inner (
          name,
          relationship_type
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("due_date")
    .limit(50); // Pagination

  return data;
}

// Optimized escalation checking
export async function getOverdueTasks() {
  const { data } = await supabase.rpc("get_overdue_tasks_for_escalation");
  return data;
}
```

### Caching Strategies

```typescript
// React cache for deduplication
import { cache } from "react";

export const getTasks = cache(async (userId: string) => {
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId);

  return data;
});

// Next.js revalidation
export async function getUserTasks(userId: string) {
  const tasks = await fetch(`/api/tasks?userId=${userId}`, {
    next: { revalidate: 60 }, // Cache for 1 minute
  });

  return tasks.json();
}
```

---

## Deployment & DevOps

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/actions@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: "--prod"
```

### Environment Configuration

```bash
# .env.local (Development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

RESEND_API_KEY=your-resend-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# .env.production (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# ... production values
```

### Monitoring & Observability

```typescript
// Error tracking with Sentry
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event, hint) {
    // Filter sensitive information
    return event;
  },
});

// Custom metrics tracking
export class MetricsService {
  static trackEscalationDelivery(
    escalationId: string,
    success: boolean,
    deliveryTime: number
  ) {
    // Track to PostHog or custom analytics
    posthog.capture("escalation_delivered", {
      escalationId,
      success,
      deliveryTime,
      timestamp: new Date(),
    });
  }
}
```

This implementation guide provides the foundation for building a reliable, scalable, and user-focused social accountability application that can handle the critical requirements of the escalation system while maintaining development velocity.
