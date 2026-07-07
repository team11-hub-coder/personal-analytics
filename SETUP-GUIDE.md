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
| Lead / Platform | Schema, auth, integration, deploy, keep-alive, QA coordination |
| Frontend Lead | Design system, dashboard, charts, responsive, polish |
| Finance + Export | Finance module + analytics + CSV/JSON export |
| Fitness + Tasks | Workout module + Task module + their analytics |
| Chatbot + Reminders | AI chatbot + insights; Reminders as the week-1 warm-up |

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
