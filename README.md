# Personal Analytics Dashboard

A multi-module web application that consolidates daily finances, workouts, tasks, focus sessions, and reminders into a single dashboard — with an AI chatbot that provides insights across all your life data.

## Features

- **Finance Tracker** — Log income/expenses, manage budgets by category, view analytics with pie charts and trend lines
- **Workout & Exercise Tracker** — Log cardio, strength, and flexibility workouts with metrics like sets/reps/weight/duration. Track streaks and personal records
- **Task Manager** — Create tasks with priorities and due dates. Filter by status, sort by priority
- **Reminder System** — Set reminders with repeat options (daily/weekly/monthly) and real-time notifications
- **Focus / Pomodoro Timer** — Track pomodoro, custom, and stopwatch focus sessions
- **AI Chatbot** — Conversational AI (Google Gemini) that provides insights across all your data
- **Dashboard** — Central overview aggregating data from all modules
- **Data Export** — Export your data

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (base-nova) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Server State | TanStack React Query v5 |
| Client State | Zustand |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| AI | Google Gemini |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- A [Supabase](https://supabase.com) account
- A [Google Cloud](https://cloud.google.com) API key for Gemini

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in your values in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Set up the database

1. Create a Supabase project
2. Go to the SQL Editor in the Supabase dashboard
3. Run the schema from [SETUP-GUIDE.md](SETUP-GUIDE.md) (Step 5) — this creates the core tables: `profiles`, `transactions`, `budgets`, `workouts`, `tasks`, `reminders`, `chat_messages`
4. Enable Row Level Security on all tables with per-user policies

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
app/
├── (app)/                  # Authenticated routes
│   ├── dashboard/page.tsx  # Central overview
│   ├── finance/page.tsx    # Finance tracker
│   ├── workouts/page.tsx   # Workout tracker
│   ├── tasks/page.tsx      # Task manager
│   ├── reminders/page.tsx  # Reminder system
│   ├── focus/page.tsx      # Focus / Pomodoro timer
│   ├── chat/page.tsx       # AI chatbot
│   ├── profile/page.tsx    # User profile
│   ├── settings/page.tsx   # Settings
│   └── export/page.tsx     # Data export
├── (auth)/                 # Unauthenticated routes
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
└── api/                    # API routes

components/                 # Reusable UI components
├── ui/                     # shadcn/ui components
└── <module>/               # Module-specific components

hooks/                      # TanStack Query + Supabase hooks
lib/                        # Utility functions, theme, validations
store/                      # Zustand stores (UI state)
types/                      # TypeScript interfaces
supabase/                   # Database migrations
```

## Contributing

1. Create a `feature/*` branch from `main`
2. Make your changes following the conventions in [CLAUDE.md](CLAUDE.md)
3. Open a PR for review before merging to `main`
