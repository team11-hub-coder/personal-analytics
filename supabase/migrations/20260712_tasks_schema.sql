-- ============================================
-- Task Manager Module: Full Schema
-- Run in Supabase SQL Editor
-- ============================================

-- 1. TASK CATEGORIES (per-user lookup — supports 4.2 "filter by category")
create table task_categories (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    color text, -- hex code e.g. '#22c55e', for a UI tag color
    created_at timestamptz not null default now(),
    unique (user_id, name)
);

-- 2. TASKS
create table tasks (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    category_id bigint references task_categories(id) on delete set null,
    title text not null,
    description text,
    priority text not null default 'medium' check (priority in ('low','medium','high')),
    priority_rank smallint generated always as (
        case priority
            when 'high' then 3
            when 'medium' then 2
            else 1
        end
    ) stored,
    status text not null default 'pending' check (status in ('pending','completed')),
    due_date date,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. KEEP updated_at CURRENT ON EVERY EDIT
create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger tasks_set_updated_at
before update on tasks
for each row execute function set_updated_at();

-- 4. AUTO-STAMP completed_at WHEN STATUS FLIPS
create or replace function set_completed_at()
returns trigger as $$
begin
    if new.status = 'completed' and old.status is distinct from 'completed' then
        new.completed_at = now();
    elsif new.status = 'pending' and old.status is distinct from 'pending' then
        new.completed_at = null;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger tasks_set_completed_at
before update on tasks
for each row execute function set_completed_at();

-- 5. INDEXES
create index idx_tasks_user_id       on tasks(user_id);
create index idx_tasks_user_status   on tasks(user_id, status);
create index idx_tasks_user_due_date on tasks(user_id, due_date);
create index idx_tasks_user_category on tasks(user_id, category_id);
create index idx_task_categories_user_id on task_categories(user_id);

-- 6. ROW LEVEL SECURITY
alter table tasks enable row level security;
alter table task_categories enable row level security;

create policy "Users manage their own tasks"
on tasks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage their own task categories"
on task_categories for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 7. VIEW WITH EFFECTIVE STATUS
create or replace view tasks_view
with (security_invoker = true) as
select
    t.*,
    case
        when t.status = 'completed' then 'completed'
        when t.status = 'pending' and t.due_date is not null and t.due_date < current_date then 'overdue'
        else 'pending'
    end as effective_status
from tasks t;
