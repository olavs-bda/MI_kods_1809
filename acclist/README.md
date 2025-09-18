# AccountaList - Social Accountability To-Do App

AccountaList helps you get things done by adding social stakes to your tasks. Miss a deadline? We'll notify your chosen contacts with escalating shame levels.

## Features

- Create tasks with real social consequences
- Set up escalation policies for missed deadlines
- Track your accountability with the receipts dashboard
- Secure authentication and contact management

## Tech Stack

- **Frontend**: Next.js 15 with App Router + TypeScript
- **Backend**: Next.js API routes with serverless architecture
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- A Supabase account and project

### Environment Setup

1. Clone the repository
2. Create a `.env.local` file in the root directory with the following variables:

```
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Email service (Resend)
RESEND_API_KEY=your-resend-api-key

# App configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Install dependencies:

```bash
npm install
```

4. Set up your Supabase database using the schema in `models/schema.sql`

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following tables:

- `profiles`: User profile information
- `tasks`: Core task management
- `contacts`: Accountability contacts
- `escalation_policies`: Defines how tasks escalate
- `escalations`: Records of actual escalation events

## Authentication

Authentication is handled by Supabase Auth with the following features:

- Email/password authentication
- Password reset
- Session management
- Row-Level Security policies

## Deployment

This project is configured for deployment on Vercel.

## License

MIT
