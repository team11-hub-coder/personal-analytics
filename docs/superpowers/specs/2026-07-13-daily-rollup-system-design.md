# Daily Rollup System Design

**Date:** 2026-07-13
**Author:** Claude Code
**Status:** Approved

## Problem

Dashboard hooks fetch raw rows and aggregate client-side. Performance degrades with more data. No monthly/weekly summary views. No data retention management.

## Decision

- **Approach:** Summary tables (daily_summary, weekly_summary)
- **Aggregation:** Supabase Edge Function nightly at midnight UTC
- **Retention:** Raw data 90 days, summary tables forever
- **Metrics:** Finance, Workouts, Tasks, Focus

## Why Summary Tables

Fast reads, easy debugging, extensible. Materialized views are read-only and harder to debug. Query-based still slow at scale.

## Implementation

### 1. Database Schema

#### daily_summary

```sql
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
```

#### weekly_summary

```sql
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
```

#### Indexes

```sql
create index idx_daily_summary_user_date on daily_summary(user_id, date desc);
create index idx_weekly_summary_user_week on weekly_summary(user_id, week_start desc);
```

#### RLS

```sql
alter table daily_summary enable row level security;
alter table weekly_summary enable row level security;
create policy "own rows" on daily_summary for all using (auth.uid() = user_id);
create policy "own rows" on weekly_summary for all using (auth.uid() = user_id);
```

### 2. Aggregation Functions

```sql
-- Aggregate daily data for a user on a specific date
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

-- Aggregate weekly data for a user
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

### 3. Edge Function

```typescript
// supabase/functions/aggregate-daily/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]

  const { data: users } = await supabase.auth.admin.listUsers()

  for (const user of users?.users ?? []) {
    await supabase.rpc('aggregate_daily', {
      p_user_id: user.id,
      p_date: dateStr
    })

    if (yesterday.getDay() === 1) {
      const weekStart = new Date(yesterday)
      weekStart.setDate(weekStart.getDate() - 6)
      await supabase.rpc('aggregate_weekly', {
        p_user_id: user.id,
        p_week_start: weekStart.toISOString().split('T')[0]
      })
    }
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  await supabase.from('transactions')
    .delete()
    .lt('date', cutoff.toISOString().split('T')[0])

  return new Response('OK')
})
```

### 4. Cron Setup

```sql
-- Enable pg_cron and pg_net extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule nightly aggregation
select cron.schedule(
  'aggregate-daily',
  '0 0 * * *',
  $$ select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/aggregate-daily',
    headers := '{"Authorization": "Bearer " || current_setting('app.settings.service_role_key')}'
  ) $$
);
```

### 5. Types

```typescript
// types/index.ts
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

### 6. Updated Hooks

```typescript
// hooks/useDashboard.ts
export function useDashboardDailySummary(date?: string) {
  const supabase = createClient();
  const { data: user } = useUser();
  const targetDate = date || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['daily-summary', targetDate, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_summary')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', targetDate)
        .single();
      return data as DailySummary;
    },
    enabled: !!user,
  });
}

export function useDashboardWeeklySummary() {
  const supabase = createClient();
  const { data: user } = useUser();

  return useQuery({
    queryKey: ['weekly-summary', user?.id],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data } = await supabase
        .from('daily_summary')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', weekAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });
      return data as DailySummary[];
    },
    enabled: !!user,
  });
}

export function useDashboardMonthlySummary() {
  const supabase = createClient();
  const { data: user } = useUser();

  return useQuery({
    queryKey: ['monthly-summary', user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { data } = await supabase
        .from('daily_summary')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', monthStart)
        .order('date', { ascending: true });
      return data as DailySummary[];
    },
    enabled: !!user,
  });
}
```

### 7. Dashboard Tabs

```tsx
// app/(app)/dashboard/page.tsx
const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("daily");

// Tab buttons
<div className="flex gap-2">
  {["daily", "weekly", "monthly"].map((range) => (
    <button
      key={range}
      onClick={() => setTimeRange(range)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        timeRange === range
          ? "bg-[var(--color-primary)] text-white"
          : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
      }`}
    >
      {range.charAt(0).toUpperCase() + range.slice(1)}
    </button>
  ))}
</div>
```

## Files Changed

| File | Change |
|------|--------|
| `SETUP-GUIDE.md` | Add table SQL + functions + cron |
| `supabase/functions/aggregate-daily/index.ts` | New Edge Function |
| `types/index.ts` | Add DailySummary, WeeklySummary |
| `hooks/useDashboard.ts` | Add summary hooks |
| `app/(app)/dashboard/page.tsx` | Add tabs, use summary hooks |

## Scope

- Database tables + RLS + indexes
- Aggregation SQL functions
- Edge Function + cron
- Updated hooks (summary-based)
- Dashboard tabs (Daily/Weekly/Monthly)
- 90-day raw data retention
