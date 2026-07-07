# Personal Analytics — Project Plan

> Team | 5 members | 2-week sprint (2026-07-07 → 2026-07-18)

---

## 1. Project Overview

A personal analytics dashboard that consolidates daily finances, workouts, tasks, and reminders into one place — with an AI chatbot that connects the dots across your life data and gives actionable insights.

**Tech Stack:**
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts (charts)
- **Backend / Database:** Supabase — managed PostgreSQL, Auth, Realtime, auto-generated APIs (no separate backend service)
- **Chatbot:** Claude API (claude-sonnet-5 — confirm current model string in docs) via a Next.js server route
- **Auth:** Supabase Auth (email + password), with Row Level Security so each user sees only their own data
- **Deploy:** Vercel (frontend + server routes), Supabase (database)

> *Change note:* This replaces the earlier React (Vite) + FastAPI + SQLite + hand-rolled JWT stack. Supabase provides the database, authentication, and APIs in one platform, which removes the separate backend and lets a 5-person team cover the same scope.

---

## 2. Modules, Core Functions & Sub-Functions

### Module 1: Authentication & User Profile

| Core Function | Sub-Functions |
|---|---|
| 1.1 Login / Register | - Email + password (Supabase Auth)<br>- Session handling (Supabase client + middleware)<br>- Protected routes |
| 1.2 User Profile | - Set display name<br>- Set daily calorie/macro targets<br>- Set monthly budget goals<br>- View/edit profile |

### Module 2: Finance Tracker

| Core Function | Sub-Functions |
|---|---|
| 2.1 Log Transaction | - Add income<br>- Add expense<br>- Category selection (food, transport, bills, etc.)<br>- Add notes<br>- Date picker |
| 2.2 Transaction History | - List all transactions<br>- Filter by date range<br>- Filter by category<br>- Search by keyword |
| 2.3 Budget Management | - Set monthly budget per category<br>- Set overall monthly budget<br>- Budget vs actual comparison |
| 2.4 Finance Analytics | - Daily/weekly/monthly spending summary<br>- Category breakdown (pie chart)<br>- Spending trend over time (line chart)<br>- Income vs expense comparison |

### Module 3: Workout & Exercise Tracker

| Core Function | Sub-Functions |
|---|---|
| 3.1 Log Workout | - Select exercise type (cardio, strength, flexibility)<br>- Log sets, reps, weight (strength)<br>- Log duration, distance, calories (cardio)<br>- Add notes (how it felt) |
| 3.2 Workout History | - List all workouts<br>- Filter by date, exercise type<br>- View workout details |
| 3.3 Workout Analytics | - Weekly workout frequency<br>- Muscle group coverage (body map)<br>- Personal records / PRs<br>- Workout streak tracking<br>- Progress charts over time |

### Module 4: Task Manager (To-Do)

| Core Function | Sub-Functions |
|---|---|
| 4.1 Task CRUD | - Create task (title, description, priority, due date)<br>- Edit task<br>- Delete task<br>- Mark complete/incomplete |
| 4.2 Task Organization | - Filter by status (pending, completed, overdue)<br>- Sort by priority, due date<br>- Filter by category |
| 4.3 Task Analytics | - Completion rate (daily/weekly)<br>- Overdue task count<br>- Productivity trend chart<br>- Tasks completed per day |

### Module 5: Reminder System

| Core Function | Sub-Functions |
|---|---|
| 5.1 Reminder CRUD | - Create reminder (title, date/time, repeat)<br>- Edit reminder<br>- Delete reminder<br>- Toggle on/off |
| 5.2 Notification | - Browser push notification<br>- In-app notification bell<br>- Overdue reminder alerts (Supabase Realtime) |
| 5.3 Reminder Analytics | - Reminder adherence rate<br>- Most common reminder types |

### Module 6: Dashboard (Home)

| Core Function | Sub-Functions |
|---|---|
| 6.1 Overview Widgets | - Today's summary (spending, workouts, tasks)<br>- Weekly trend mini-charts<br>- Upcoming reminders<br>- Quick-add buttons (finance, workout, task) |
| 6.2 Charts & Stats | - Interactive charts (Recharts)<br>- Date range selector<br>- Compare periods (this week vs last week) |

### Module 7: AI Chatbot

| Core Function | Sub-Functions |
|---|---|
| 7.1 Chat Interface | - Message input<br>- Chat history display<br>- Typing indicator |
| 7.2 Query Engine | - Natural language → structured query<br>- Fetch relevant data from Supabase<br>- Format context for Claude API |
| 7.3 Insights Generation | - Weekly summary insights<br>- Trend analysis ("you spent 20% more on food")<br>- Actionable recommendations<br>- Cross-module insights (finance + fitness correlation) |
| 7.4 Chat History | - Save conversation history<br>- Clear chat<br>- Context window management |

### Module 8: Data Export

| Core Function | Sub-Functions |
|---|---|
| 8.1 Export | - Export finance data as CSV<br>- Export workout data as CSV<br>- Export all data as JSON<br>- Date range selection for export |

---

## 3. Future Versions (v2+)

| Version | Features |
|---|---|
| **v1.1** | - Dashboard customization (drag widgets)<br>- Additional chart types |
| **v1.2** | - Photo receipt scanning (OCR for expenses)<br>- Barcode scanning for food items |
| **v2.0** | - Multi-user / family accounts (Supabase RLS already supports this)<br>- Google/Apple Health integration<br>- Bank API import (auto-categorize) |
| **v2.1** | - Voice input for logging<br>- Wearable device integration<br>- Advanced ML-based predictions |
| **v3.0** | - Public API for third-party integrations<br>- Plugin system for custom trackers<br>- Natural language report generation<br>- Scheduled AI insights (daily/weekly email) |

> *Note:* Dark mode and mobile-responsive design are treated as **in-scope for v1** (built during the sprint), not future work.

---

## 4. Team Distribution (5 Members, 2 Weeks)

> **The Lead builds the foundation solo** (setup, schema, auth, config) on Days 1–2; the other four don't wait — they build **mock-data-first** (see the note below). Because the Lead does setup instead of owning a big feature module, the **Chatbot becomes a fully solo role** (hardest, riskiest module) and the small **Reminders module moves to the Lead**. With no dedicated QA person, **testing is everyone's job for their own module, coordinated by the Lead.**
>
> *Team note:* hlaingthinphyu takes the Lead role (they were the original architect's backup, and QA coordination folds into this role). aungkyawminhtet.sbo joins as the Fitness module owner. Each module owner is responsible for data export for their own module.

### Role, Member, Backup, Primary Scope

| Role | Member | Backup | Primary Scope |
|------|--------|--------|----------------|
| **Lead / Platform** | hlaingthinphyu | 6rose9 | Solo setup (schema + RLS, Auth Module 1, scaffold, config) → then **Task Manager (Module 4)** + integration + deployment + QA coordination |
| **Frontend Lead** | 6rose9 | hlaingthinphyu | Auth & Profile (Module 1), Dashboard (Module 6), design system, routing, app shell, reusable charts, responsive, dark mode |
| **Finance** | shirleyshyun-lgtm | aungkyawminhtet.sbo | Finance Tracker + analytics (Module 2) + Data Export for finance |
| **Fitness** | aungkyawminhtet.sbo | shirleyshyun-lgtm | Workout Tracker (Module 3) + analytics + Data Export for workouts |
| **Reminders** | Jolly30 | hlaingthinphyu | Reminder System (Module 5) + Data Export for reminders |
| **AI Chatbot** | nyeinchan-lwin | hlaingthinphyu | AI Chatbot + insights + cross-module analysis (Module 7) + Data Export for chat history |

### Collaboration Map

```
hlaingthinphyu (Lead) ── builds foundation solo (Days 1-2), then Tasks; reviews all PRs, integrates
                            ├── 6rose9 (Frontend + Auth + Dashboard) ↔ backup: hlaingthinphyu
                            ├── shirleyshyun-lgtm (Finance)         ↔ backup: aungkyawminhtet.sbo
                            ├── aungkyawminhtet.sbo (Fitness)       ↔ backup: shirleyshyun-lgtm
                            ├── Jolly30 (Reminders)                 ↔ backup: hlaingthinphyu
                            └── nyeinchan-lwin (Chatbot)            ↔ backup: hlaingthinphyu
```

### Detailed Per-Member Breakdown

> **Days 1–2: the Lead builds the foundation solo** (schema + RLS + auth + scaffold + config). The other four are **not** idle — on Day 1 morning the Lead posts the **data shapes** (column lists per table), and everyone builds **mock-data-first**: module UI (forms, lists, filters) against a hardcoded fake array, swapping in real Supabase calls once the schema lands. The Lead then builds the **Finance reference module** and gives a **15-minute walkthrough** so everyone copies the same pattern (this replaces the co-build; don't skip it, or the five agent sessions drift). See `SETUP-GUIDE.md` for the exact steps.

#### hlaingthinphyu — Lead / Platform
**Week 1 (Days 1–2, solo foundation):**
- Create Supabase project; design and apply full Postgres schema + RLS policies
- **Post the data shapes to the team on Day 1 morning** so everyone can start mock-data-first
- Configure Supabase Auth (email/password), build login/register + middleware
- Scaffold Next.js + Tailwind + shadcn/ui; wire Supabase client (browser + server)
- Set up git branching + PR workflow, `CLAUDE.md` conventions, keep-alive GitHub Action
- Build the **Finance reference module** and give a 15-min walkthrough of the pattern

**Week 1 (Days 3–5):**
- Task Manager (Module 4): CRUD, priority, due dates, status filtering
- Data Export for tasks

**Week 2:**
- Integration: wire all modules together, resolve cross-module data needs
- Deployment (Vercel + Supabase), env/secrets management
- Cross-cutting: loading states, error boundaries, toast notifications
- Coordinate regression testing; export a DB backup before demo
- Final QA and present demo

---

#### 6rose9 — Frontend Lead
**Week 1:**
- Build app shell (sidebar/nav, layout), routing for all module pages
- Create reusable UI components (Card, Button, Modal, DatePicker) via shadcn/ui
- Build reusable Recharts wrappers (line, pie, bar) for all modules to reuse
- Implement dark mode toggle
- Build against the posted data shapes (mock-data-first) until the schema lands
- Auth & Profile (Module 1): profile page, display name, calorie/budget targets

**Week 2:**
- Build Dashboard (Module 6): overview widgets, date-range selector, period comparison
- Loading skeletons and empty states across the app
- UI polish: animations, transitions, hover effects
- Responsive design pass for mobile/tablet

---

#### Jolly30 — Reminders
**Week 1:**
- Reminder CRUD (Module 5): create, edit, delete, toggle on/off
- Repeat options (none, daily, weekly, monthly)
- Date/time picker for remind_at
- Seed sample reminder data

**Week 2:**
- Supabase Realtime notifications + notification bell
- Overdue reminder alerts
- Reminder analytics (adherence rate, common types)
- Data Export for reminders

---

#### shirleyshyun-lgtm — Finance
**Week 1:**
- Finance data functions against Supabase (CRUD, filters, budgets)
- Finance logging form (add income/expense), transaction list with filters + search
- Budget management (set/edit budgets per category)
- Seed sample data for testing

**Week 2:**
- Finance analytics (category breakdown, trends, income vs expense)
- Feed finance data into chatbot context
- Data Export for finance (CSV/JSON with date range)
- Edge cases: delete confirmation, edit validation; write finance tests

---

#### aungkyawminhtet.sbo — Fitness
**Week 1:**
- Workout data functions (CRUD, filters, exercise types) + logging form
- Workout history list with filters; exercise type management
- Seed sample workout data

**Week 2:**
- Workout analytics (frequency, PRs, streaks, simple body map)
- Feed workout data into chatbot context
- Data Export for workouts
- Write workout tests

---

#### nyeinchan-lwin — AI Chatbot (undivided)
**Week 1:**
- Set up Claude API integration in a Next.js server route (API key server-side)
- Build chatbot UI (message input, history, typing indicator) against seeded fake data
- Query engine scaffold (NL → structured query → fetch → context) using mock data
- Basic summaries (spending / workout / task) as the modules come online

**Week 2:**
- Wire the query engine to real Supabase data from every module
- Advanced insights: trend analysis + cross-module correlations (finance × fitness × tasks)
- Actionable recommendations; chat history persistence; context-window management
- End-to-end flow test (log data → chatbot analyzes → export)

> This is the busiest role and depends on all other modules producing data. Mock-data-first in Week 1 keeps it unblocked; the real wiring happens in Week 2 as modules land.

---

## 5. Sprint Milestones

| Date | Milestone |
|---|---|
| **Jul 7 (Mon)** | Lead: accounts + scaffold + **data shapes posted**. Everyone else starts **mock-data-first** module UI |
| **Jul 8 (Tue)** | Lead: **schema + RLS frozen and pushed**, auth working, **Finance reference + walkthrough**; Frontend: design system + charts |
| **Jul 9 (Wed)** | Modules swap mock data for real Supabase calls; Finance/Workout/Task forms functional |
| **Jul 10 (Thu)** | All module CRUDs working against Supabase; Lead's Reminders module functional |
| **Jul 11 (Fri)** | Dashboard overview widgets showing real data |
| **Jul 14 (Mon)** | Chatbot answering basic queries with real data |
| **Jul 15 (Tue)** | All analytics charts rendering, export working |
| **Jul 16 (Wed)** | Chatbot insights + cross-module analysis working |
| **Jul 17 (Thu)** | UI polish, responsive design, dark mode, bug fixes |
| **Jul 18 (Fri)** | Final QA, DB backup, demo prep, presentation |

---

## 6. Database Schema (Supabase / PostgreSQL)

> Passwords are handled by Supabase Auth (`auth.users`), so there is no `password_hash` column. Each data table references `auth.users(id)` and is protected by Row Level Security. Full setup steps and the RLS policies are in `SETUP-GUIDE.md`.

```sql
-- PROFILES (extends Supabase's built-in auth.users)
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    daily_calorie_target integer,
    monthly_budget_goal numeric,
    created_at timestamptz default now()
);

-- FINANCE
create table transactions (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    type text not null check (type in ('income','expense')),
    amount numeric not null,
    category text,
    description text,
    date date not null,
    created_at timestamptz default now()
);

create table budgets (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    category text,
    monthly_limit numeric,
    month text -- 'YYYY-MM'
);

-- WORKOUTS
create table workouts (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    exercise_type text check (exercise_type in ('cardio','strength','flexibility')),
    exercise_name text not null,
    sets integer, reps integer, weight numeric,
    duration_min integer, distance_km numeric, calories integer,
    notes text,
    date date not null,
    created_at timestamptz default now()
);

-- TASKS
create table tasks (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    description text,
    priority text check (priority in ('low','medium','high')),
    status text check (status in ('pending','completed')) default 'pending',
    due_date date,
    completed_at timestamptz,
    created_at timestamptz default now()
);

-- REMINDERS
create table reminders (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    remind_at timestamptz not null,
    repeat text check (repeat in ('none','daily','weekly','monthly')) default 'none',
    is_active boolean default true,
    created_at timestamptz default now()
);

-- CHAT HISTORY
create table chat_messages (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text check (role in ('user','assistant')),
    content text not null,
    created_at timestamptz default now()
);
```

---

## 7. Data Access & Endpoints

With Supabase, most CRUD happens directly through the Supabase client (protected by RLS) instead of hand-written REST endpoints. Only genuinely custom server logic needs its own route.

```
Auth:        Supabase Auth (signUp / signInWithPassword / session)
Finance:     Supabase client — transactions, budgets tables (+ analytics queries)
Workouts:    Supabase client — workouts table (+ analytics queries)
Tasks:       Supabase client — tasks table (+ analytics queries)
Reminders:   Supabase client — reminders table (+ Realtime subscription)
Chatbot:     POST /api/chat        (Next.js server route → Claude API, key server-side)
Export:      GET  /api/export/...  (CSV / JSON, date-range)
Dashboard:   Supabase client — aggregate queries across tables
```
