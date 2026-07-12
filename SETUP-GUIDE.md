# Setup Guide — Personal Analytics Dashboard

**Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Postgres, Auth, Realtime)
**Team:** 5 members · **Deploy:** Vercel · **Built with:** Claude Code

---

## How to read this guide

Steps **1–9 are the Lead's job** and happen mostly on **Day 1–2**. The rest of the
team joins at **Step 10**, after the foundation is frozen. Nothing everyone depends
on (accounts, repo, schema) should be built by two people at once.

> The hard rule: the **database schema must be pushed to `main` by end of Day 1**.
> Every other person is blocked until it exists.

Package names and CLI commands below are the current-standard approach, but tooling
moves — if a command errors, check the official docs (nextjs.org, supabase.com,
ui.shadcn.com, docs.claude.com) for the latest.

---

## Prerequisites (every team member's laptop)

- **Node.js** (current LTS) and npm — check with `node -v`
- **git** and a **GitHub account**
- A code editor (VS Code recommended)
- **Claude Code** installed and signed in

---

## Step 1 — Create the shared accounts (Lead, Day 0)

Create these **once** and invite the whole team. Decide who owns each login.

1. **GitHub**: create an organization (or a shared repo), then a repo named e.g.
   `personal-analytics`. Add all 5 members as collaborators.
2. **Supabase**: sign up at supabase.com → **New project**. Pick a region close to
   you, set a strong database password, save it. Note your **Project URL** and
   **anon public key** (Settings → API). Invite teammates to the project so they can
   see the dashboard.
3. **Anthropic Console** (console.anthropic.com): create an **API key** for the
   chatbot and set up billing. This key is server-side only — it never goes in the repo.
4. **Vercel**: sign up, connect it to the GitHub repo (you'll deploy later).

---

## Step 2 — Scaffold the app (Lead, Day 1 morning)

Do this once. Everyone else clones *after* it's pushed.

```bash
npx create-next-app@latest personal-analytics
# choose: TypeScript = Yes, Tailwind = Yes, App Router = Yes, src/ dir = your call
cd personal-analytics

# UI component system
npx shadcn@latest init
npx shadcn@latest add button card dialog input label

# Supabase client + SSR helpers
npm install @supabase/supabase-js @supabase/ssr

# Charts + Anthropic SDK (for the chatbot module)
npm install recharts @anthropic-ai/sdk
```

Confirm it runs: `npm run dev` → open http://localhost:3000

---

## Step 3 — Environment variables

Create **`.env.example`** (commit this — it documents what's needed, no secrets):

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=server-side-only-never-commit
```

Then create **`.env.local`** (the real values) and make sure it's in `.gitignore`
(create-next-app adds `.env*` by default — verify). Each teammate makes their own
`.env.local` after cloning.

> The `ANTHROPIC_API_KEY` must only ever be read in server code (a route handler),
> never in a component that ships to the browser.

---

## Step 4 — Wire up the Supabase client (Lead)

Create **`utils/supabase/client.ts`** (browser components):

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create **`utils/supabase/server.ts`** (server components / route handlers):

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component — safe to ignore if middleware refreshes sessions
          }
        },
      },
    }
  );
}
```

> The `@supabase/ssr` cookie API has changed across versions. If TypeScript complains,
> copy the current server-client + middleware snippet from the Supabase "Next.js
> Server-Side Auth" docs — that's the source of truth.

---

## Step 5 — The database schema (Lead — freeze by end of Day 1)

Open Supabase → **SQL Editor** → paste and run this. It's your original schema
converted to Postgres, with Supabase Auth handling passwords (so no `password_hash`),
and Row Level Security so each user only sees their own data.

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

Now turn on **Row Level Security** and add the "each user owns their rows" policy for
every table. Run this second block:

```sql
-- Enable RLS
alter table profiles      enable row level security;
alter table transactions  enable row level security;
alter table budgets        enable row level security;
alter table workouts       enable row level security;
alter table tasks          enable row level security;
alter table reminders      enable row level security;
alter table chat_messages  enable row level security;

-- Profiles: user owns the row whose id == their auth id
create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Same pattern for every user_id table
create policy "own rows" on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on budgets      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on workouts     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on tasks        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on reminders    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**Optional but recommended** — auto-create a profile row when someone signs up:

```sql
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

> Once this is applied and confirmed, tell the team the schema is **frozen**. Schema
> changes after this point go through the Lead so nobody's queries break silently.

---

## Daily Rollup System

### Summary Tables

```sql
-- Daily summary: one row per user per day
create table daily_summary (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  total_spent numeric(10,2) default 0,
  transaction_count int default 0,
  workout_count int default 0,
  total_calories int default 0,
  total_duration_min int default 0,
  tasks_completed int default 0,
  tasks_pending int default 0,
  focus_minutes int default 0,
  focus_sessions int default 0,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Weekly summary: one row per user per week
create table weekly_summary (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start date not null,
  total_spent numeric(10,2) default 0,
  transaction_count int default 0,
  workout_count int default 0,
  total_calories int default 0,
  total_duration_min int default 0,
  tasks_completed int default 0,
  tasks_pending int default 0,
  focus_minutes int default 0,
  focus_sessions int default 0,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

-- Indexes
create index idx_daily_summary_user_date on daily_summary(user_id, date desc);
create index idx_weekly_summary_user_week on weekly_summary(user_id, week_start desc);

-- RLS
alter table daily_summary enable row level security;
alter table weekly_summary enable row level security;
create policy "own rows" on daily_summary for all using (auth.uid() = user_id);
create policy "own rows" on weekly_summary for all using (auth.uid() = user_id);
```

### Aggregation Functions

```sql
create or replace function aggregate_daily(p_user_id uuid, p_date date)
returns void as $$
begin
  insert into daily_summary (user_id, date, total_spent, transaction_count, workout_count, total_calories, total_duration_min, tasks_completed, tasks_pending, focus_minutes, focus_sessions)
  select
    p_user_id,
    p_date,
    coalesce(sum(amount), 0),
    count(*),
    0, 0, 0, 0, 0, 0, 0
  from transactions
  where user_id = p_user_id and date = p_date
  on conflict (user_id, date) do update set
    total_spent = excluded.total_spent,
    transaction_count = excluded.transaction_count;

  update daily_summary set
    workout_count = coalesce((select count(*) from workouts where user_id = p_user_id and date::date = p_date), 0),
    total_calories = coalesce((select sum(calories) from workouts where user_id = p_user_id and date::date = p_date), 0),
    total_duration_min = coalesce((select sum(duration_min) from workouts where user_id = p_user_id and date::date = p_date), 0)
  where user_id = p_user_id and date = p_date;

  update daily_summary set
    tasks_completed = coalesce((select count(*) from tasks where user_id = p_user_id and completed_at::date = p_date), 0),
    tasks_pending = coalesce((select count(*) from tasks where user_id = p_user_id and status = 'pending'), 0)
  where user_id = p_user_id and date = p_date;

  update daily_summary set
    focus_minutes = coalesce((select sum(duration_minutes) from focus_sessions where user_id = p_user_id and started_at::date = p_date and completed), 0),
    focus_sessions = coalesce((select count(*) from focus_sessions where user_id = p_user_id and started_at::date = p_date and completed), 0)
  where user_id = p_user_id and date = p_date;
end;
$$ language plpgsql;

create or replace function aggregate_weekly(p_user_id uuid, p_week_start date)
returns void as $$
begin
  insert into weekly_summary (user_id, week_start, total_spent, transaction_count, workout_count, total_calories, total_duration_min, tasks_completed, tasks_pending, focus_minutes, focus_sessions)
  select
    p_user_id,
    p_week_start,
    coalesce(sum(total_spent), 0),
    coalesce(sum(transaction_count), 0),
    coalesce(sum(workout_count), 0),
    coalesce(sum(total_calories), 0),
    coalesce(sum(total_duration_min), 0),
    coalesce(max(tasks_completed), 0),
    coalesce(max(tasks_pending), 0),
    coalesce(sum(focus_minutes), 0),
    coalesce(sum(focus_sessions), 0)
  from daily_summary
  where user_id = p_user_id
    and date >= p_week_start
    and date < p_week_start + interval '7 days'
  on conflict (user_id, week_start) do update set
    total_spent = excluded.total_spent,
    transaction_count = excluded.transaction_count,
    workout_count = excluded.workout_count,
    total_calories = excluded.total_calories,
    total_duration_min = excluded.total_duration_min,
    tasks_completed = excluded.tasks_completed,
    tasks_pending = excluded.tasks_pending,
    focus_minutes = excluded.focus_minutes,
    focus_sessions = excluded.focus_sessions;
end;
$$ language plpgsql;
```

### Cron Setup

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'aggregate-daily',
  '0 0 * * *',
  $$ select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/aggregate-daily',
    headers := '{"Authorization": "Bearer " || current_setting('app.settings.service_role_key')}'
  ) $$
);
```

---

## Step 6 — Auth (Lead, Day 1–2)

Because Supabase handles auth, this is mostly configuration:

1. Supabase → **Authentication → Providers**: keep **Email** enabled. For a class
   demo, you can turn **off "Confirm email"** so logins work instantly without an
   email round-trip.
2. Build two simple pages: `/login` and `/register`, each calling
   `supabase.auth.signInWithPassword(...)` / `supabase.auth.signUp(...)` from the
   browser client.
3. Add a `middleware.ts` that refreshes the session on each request (copy the current
   snippet from Supabase's Next.js Server-Side Auth docs) and redirects logged-out
   users away from protected pages.

---

## Step 7 — CLAUDE.md — the vibe-coding consistency file (Lead, Day 1)

Create **`CLAUDE.md`** at the repo root. Claude Code reads a project file like this
as context, so it's how all five members' sessions stay consistent instead of drifting
into five different styles. (Confirm the current filename/behavior in the Claude Code
docs.) Starter content:

```markdown
# Personal Analytics — Project Conventions

## Stack
- Next.js App Router + TypeScript. Supabase for DB/Auth/Realtime. No separate backend.
- UI: Tailwind + shadcn/ui components ONLY. Do not hand-roll buttons/inputs/dialogs.
- Charts: Recharts, using the shared wrappers in components/charts/.

## Data access
- Use the Supabase client in utils/supabase/ (client.ts in browser, server.ts on server).
- Never write raw SQL in components. RLS is on — every table is scoped by user_id.
- The chatbot's Anthropic calls happen ONLY in a server route (app/api/chat/route.ts).
  The API key is server-side. Model: claude-sonnet-5 (confirm current string in docs).

## How a feature module is structured (copy the Finance module as the template)
- app/(app)/<module>/page.tsx      -> the module page
- components/<module>/             -> forms, lists, filters for that module
- lib/<module>.ts                  -> data functions (fetch/insert/update via Supabase)

## Conventions
- TypeScript strict. No `any`. Type Supabase rows.
- Small components. Loading + empty states on every list.
- Money as numeric; dates as ISO strings.
```

---

## Step 8 — Keep-alive so Supabase never sleeps (Lead, Day 2)

Free Supabase projects **pause after 7 days of inactivity** — which will kill your app
right before a demo if you're not careful. Add this GitHub Action.

Create **`.github/workflows/keep-alive.yml`**:

```yaml
name: Keep Supabase Alive
on:
  schedule:
    - cron: "0 8 */3 * *"   # every 3 days, 08:00 UTC
  workflow_dispatch:          # lets you run it manually
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase REST API
        run: |
          curl -s "${{ secrets.SUPABASE_URL }}/rest/v1/" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -o /dev/null
```

In GitHub → repo **Settings → Secrets and variables → Actions**, add
`SUPABASE_URL` and `SUPABASE_ANON_KEY`. Also: **before the demo, export a SQL dump**
from the Supabase dashboard (the free tier has no automatic backups).

---

## Step 9 — Git workflow + first push (Lead, Day 1)

Agree on the rule and write it in the repo README:

- `main` is always working. **Nobody pushes to `main` directly.**
- Each person works on a branch: `feature/finance`, `feature/workouts`, etc.
- Open a **Pull Request** → one teammate reviews → merge.
- Pull `main` before starting each day to avoid conflicts.

Then push the scaffold:

```bash
git add .
git commit -m "chore: project scaffold, schema, auth, conventions"
git push origin main
```

Set up a **GitHub Issues** board (or Projects) for tasks and bugs, and agree on a
**short daily standup** (even 10 minutes) so blockers surface fast.

---

## Step 10 — The team joins (Day 2)

Now the other four clone the repo, add their own `.env.local`, run `npm install` and
`npm run dev`, and confirm they can register/log in.

Before splitting into modules, do these **together**:

1. **Frontend Lead** builds the shared design system (nav/layout, Card/Modal/DatePicker
   wrappers) and **one reusable chart component** in `components/charts/`.
2. **The whole team builds the Finance module end-to-end** as the reference: schema is
   already there → `lib/finance.ts` data functions → transaction list → add form →
   one chart. This becomes the template every other module copies.

Once the reference module works, split into the 5 roles and build in parallel:

| Member | Owns |
|---|---|
| hlaingthinphyu (Lead / Platform) | Tasks module, schema, auth, integration, deploy, keep-alive, QA coordination |
| 6rose9 (Frontend Lead) | Auth & Profile, Dashboard, design system, charts, responsive, polish |
| shirleyshyun-lgtm (Finance) | Finance module + analytics |
| aungkyawminhtet.sbo (Fitness) | Workout module + analytics |
| Jolly30 (Reminders) | Reminders module |
| nyeinchan-lwin (Chatbot) | AI chatbot + insights |
| Each module owner | Data export for their module |

---

## Quick Day-1 checklist (in dependency order)

- [ ] GitHub repo created, all 5 invited
- [ ] Supabase project created, keys saved, team invited
- [ ] Anthropic API key + billing
- [ ] App scaffolded (Next.js + Tailwind + shadcn + Supabase packages) and pushed
- [ ] `.env.example` committed; `.env.local` gitignored
- [ ] Supabase client files (client.ts / server.ts)
- [ ] **Schema + RLS applied and FROZEN**  ← the true bottleneck
- [ ] Auth working (register/login)
- [ ] `CLAUDE.md` committed
- [ ] Keep-alive Action + secrets
- [ ] Git workflow agreed, README written, Issues board up

When every box is checked, the team can safely start their modules.
