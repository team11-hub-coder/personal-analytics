-- ============================================
-- Finance Module: Full Schema
-- Run in Supabase SQL Editor
-- ============================================

-- 1. CATEGORIES TABLE
create table categories (
  id bigint generated always as identity primary key,
  name text not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name, user_id)
);

-- 2. SEED DEFAULT CATEGORIES (system-owned, user_id = null)
insert into categories (name) values
  ('Food'),
  ('Transport'),
  ('Utilities'),
  ('Shopping'),
  ('Entertainment'),
  ('Health'),
  ('Education'),
  ('Others');

-- 3. TRANSACTIONS TABLE (expenses only)
create table transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  category_id bigint references categories(id) on delete set null,
  description text,
  date date not null,
  receipt_image_url text,
  entry_source text check (entry_source in ('manual_form', 'chatbot_text', 'chatbot_voice', 'chatbot_receipt', 'recurring')),
  ai_confidence_score numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. BUDGETS TABLE (one budget per category per user)
create table budgets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id bigint references categories(id) on delete cascade,
  monthly_limit numeric not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, category_id)
);

-- 5. RECURRING TEMPLATES TABLE (rules for auto-generating expenses)
create table recurring_templates (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  category_id bigint references categories(id) on delete set null,
  description text,
  interval text not null check (interval in ('weekly', 'monthly')),
  next_run_date date not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Link transactions back to their template (nullable — manual entries have no template)
alter table transactions add column template_id bigint references recurring_templates(id) on delete set null;

-- 6. RLS POLICIES
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table recurring_templates enable row level security;

-- Categories: users see system + their own
create policy "view categories" on categories
  for select
  using (user_id is null or auth.uid() = user_id);

create policy "insert own categories" on categories
  for insert
  with check (auth.uid() = user_id);

create policy "update own categories" on categories
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own categories" on categories
  for delete
  using (auth.uid() = user_id);

-- Transactions: user owns their rows
create policy "own rows" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Budgets: user owns their rows
create policy "own rows" on budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Recurring templates: user owns their rows
create policy "own rows" on recurring_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 7. INDEXES
create index idx_transactions_user_date on transactions(user_id, date);
create index idx_transactions_category on transactions(category_id);
create index idx_budgets_user_category on budgets(user_id, category_id);
create index idx_categories_user on categories(user_id);
create index idx_recurring_templates_user on recurring_templates(user_id);
create index idx_recurring_templates_next_run on recurring_templates(next_run_date) where is_active = true;

-- 8. AUTO-UPDATE updated_at TRIGGER
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on categories
  for each row execute function update_updated_at();

create trigger set_updated_at before update on transactions
  for each row execute function update_updated_at();

create trigger set_updated_at before update on budgets
  for each row execute function update_updated_at();

create trigger set_updated_at before update on recurring_templates
  for each row execute function update_updated_at();
