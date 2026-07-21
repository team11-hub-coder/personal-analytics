# Daily Rollup System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add daily/weekly summary tables, nightly aggregation Edge Function, and dashboard tabs for daily/weekly/monthly views.

**Architecture:** Two summary tables (daily_summary, weekly_summary) populated by a Supabase Edge Function running nightly. Dashboard hooks query summary tables instead of raw data. Tabs switch between daily/weekly/monthly views.

**Tech Stack:** Supabase (Postgres, Edge Functions, pg_cron), Next.js 16, TanStack React Query, TypeScript

## Global Constraints

- Next.js 16 (App Router) — check `node_modules/next/dist/docs/` for breaking changes
- Tailwind v4 — CSS-only config in `app/globals.css`, no `tailwind.config.js`
- All colors/spacing from `lib/theme.ts` — never hardcode
- TypeScript strict — no `any`
- Supabase client in `utils/supabase/client.ts`, server in `utils/supabase/server.ts`

---

### Task 1: Add TypeScript Interfaces

**Files:**
- Modify: `types/index.ts`

**Interfaces:**
- Consumes: none
- Produces: `DailySummary` and `WeeklySummary` types used by hooks and dashboard

- [ ] **Step 1: Add DailySummary interface**

In `types/index.ts`, add at the end of the file:

```typescript
export interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  total_spent: number;
  transaction_count: number;
  workout_count: number;
  total_calories: number;
  total_duration_min: number;
  tasks_completed: number;
  tasks_pending: number;
  focus_minutes: number;
  focus_sessions: number;
  created_at: string;
}
```

- [ ] **Step 2: Add WeeklySummary interface**

Add after DailySummary:

```typescript
export interface WeeklySummary {
  id: string;
  user_id: string;
  week_start: string;
  total_spent: number;
  transaction_count: number;
  workout_count: number;
  total_calories: number;
  total_duration_min: number;
  tasks_completed: number;
  tasks_pending: number;
  focus_minutes: number;
  focus_sessions: number;
  created_at: string;
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1 | head -30`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add types/index.ts
git commit -m "feat: add DailySummary and WeeklySummary types"
```

---

### Task 2: Add Summary Hooks

**Files:**
- Modify: `hooks/useDashboard.ts`

**Interfaces:**
- Consumes: `DailySummary` from Task 1
- Produces: `useDashboardDailySummary`, `useDashboardWeeklySummary`, `useDashboardMonthlySummary` hooks

- [ ] **Step 1: Add imports**

At the top of `hooks/useDashboard.ts`, add:

```typescript
import { createClient } from "@/utils/supabase/client";
import { useUser } from "./useAuth";
import { useQuery } from "@tanstack/react-query";
import type { DailySummary } from "@/types";
```

- [ ] **Step 2: Add useDashboardDailySummary hook**

Add at the end of the file:

```typescript
// ─── Summary Hooks ──────────────────────────────────────────

/** Daily summary from summary table */
export function useDashboardDailySummary(date?: string) {
  const supabase = createClient();
  const { data: user } = useUser();
  const targetDate = date || new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["daily-summary", targetDate, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_summary")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", targetDate)
        .single();

      if (error) throw error;
      return data as DailySummary;
    },
    enabled: !!user,
  });
}
```

- [ ] **Step 3: Add useDashboardWeeklySummary hook**

Add after useDashboardDailySummary:

```typescript
/** Last 7 days from daily_summary */
export function useDashboardWeeklySummary() {
  const supabase = createClient();
  const { data: user } = useUser();

  return useQuery({
    queryKey: ["weekly-summary", user?.id],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data, error } = await supabase
        .from("daily_summary")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", weekAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;
      return data as DailySummary[];
    },
    enabled: !!user,
  });
}
```

- [ ] **Step 4: Add useDashboardMonthlySummary hook**

Add after useDashboardWeeklySummary:

```typescript
/** Current month from daily_summary */
export function useDashboardMonthlySummary() {
  const supabase = createClient();
  const { data: user } = useUser();

  return useQuery({
    queryKey: ["monthly-summary", user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const { data, error } = await supabase
        .from("daily_summary")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", monthStart)
        .order("date", { ascending: true });

      if (error) throw error;
      return data as DailySummary[];
    },
    enabled: !!user,
  });
}
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build 2>&1 | head -30`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add hooks/useDashboard.ts
git commit -m "feat: add daily/weekly/monthly summary hooks"
```

---

### Task 3: Create Edge Function

**Files:**
- Create: `supabase/functions/aggregate-daily/index.ts`

**Interfaces:**
- Consumes: none (standalone function)
- Produces: Edge Function that aggregates data nightly

- [ ] **Step 1: Create directory structure**

Run: `mkdir -p supabase/functions/aggregate-daily`

- [ ] **Step 2: Create Edge Function**

Create `supabase/functions/aggregate-daily/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];

  // Get all active users
  const { data: users } = await supabase.auth.admin.listUsers();

  for (const user of users?.users ?? []) {
    // Aggregate daily
    const { error: dailyError } = await supabase.rpc("aggregate_daily", {
      p_user_id: user.id,
      p_date: dateStr,
    });
    if (dailyError) console.error("Daily aggregation error:", dailyError);

    // If Monday, aggregate weekly
    if (yesterday.getDay() === 1) {
      const weekStart = new Date(yesterday);
      weekStart.setDate(weekStart.getDate() - 6);
      const { error: weeklyError } = await supabase.rpc("aggregate_weekly", {
        p_user_id: user.id,
        p_week_start: weekStart.toISOString().split("T")[0],
      });
      if (weeklyError) console.error("Weekly aggregation error:", weeklyError);
    }
  }

  // Archive old data (90 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .lt("date", cutoff.toISOString().split("T")[0]);
  if (deleteError) console.error("Archive error:", deleteError);

  return new Response("OK", { status: 200 });
});
```

- [ ] **Step 3: Commit**
```bash
git add supabase/functions/aggregate-daily/index.ts
git commit -m "feat: add aggregate-daily Edge Function"
```

---

### Task 4: Update Dashboard with Tabs

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: summary hooks from Task 2
- Produces: Dashboard with Daily/Weekly/Monthly tabs

- [ ] **Step 1: Add useState import**

Add to imports in `app/(app)/dashboard/page.tsx`:

```typescript
import { useState } from "react";
```

- [ ] **Step 2: Add summary hooks**

After the existing hook calls, add:

```typescript
// ─── Summary Data ───────────────────────────────────────
const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("daily");
const { data: dailySummary } = useDashboardDailySummary();
const { data: weeklySummary } = useDashboardWeeklySummary();
const { data: monthlySummary } = useDashboardMonthlySummary();
```

- [ ] **Step 3: Add tab buttons**

After the page header `<div>`, before the stat cards grid, add:

```typescript
{/* Time Range Tabs */}
<div className="flex gap-2">
  {(["daily", "weekly", "monthly"] as const).map((range) => (
    <button
      key={range}
      onClick={() => setTimeRange(range)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        timeRange === range
          ? "bg-[var(--color-primary)] text-white"
          : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
      }`}
    >
      {range.charAt(0).toUpperCase() + range.slice(1)}
    </button>
  ))}
</div>
```

- [ ] **Step 4: Update stat cards to use summary data**

Replace the stat cards array with:

```typescript
const statCards = [
  {
    icon: <DollarSign size={20} />,
    label: "Spent Today",
    value: spentLoading ? null : `$${(dailySummary?.total_spent ?? spentToday).toFixed(2)}`,
    color: statColors.emerald,
  },
  {
    icon: <Dumbbell size={20} />,
    label: "Workouts Today",
    value: workoutsLoading ? null : (dailySummary?.workout_count ?? todayWorkouts).toString(),
    color: statColors.gold,
  },
  {
    icon: <CheckSquare size={20} />,
    label: "Pending Tasks",
    value: tasksLoading ? null : (dailySummary?.tasks_pending ?? pendingTasks).toString(),
    color: statColors.amber,
  },
  {
    icon: <Bell size={20} />,
    label: "Reminders",
    value: remindersLoading ? null : upcomingReminders.length.toString(),
    color: statColors.rose,
  },
  {
    icon: <Timer size={20} />,
    label: "Focus Today",
    value: formatFocusTime(dailySummary?.focus_minutes ?? todayFocusMinutes),
    color: statColors.blue,
  },
];
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build 2>&1 | head -30`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx
git commit -m "feat: add daily/weekly/monthly tabs to dashboard"
```

---

### Task 5: Update SETUP-GUIDE.md

**Files:**
- Modify: `SETUP-GUIDE.md`

**Interfaces:**
- Consumes: all SQL from spec
- Produces: documented setup instructions for new tables

- [ ] **Step 1: Add database schema section**

After the existing table definitions in SETUP-GUIDE.md, add:

```markdown
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
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build 2>&1 | head -30`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add SETUP-GUIDE.md
git commit -m "docs: add daily rollup system setup instructions"
```
