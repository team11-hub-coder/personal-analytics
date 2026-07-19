-- TELEGRAM BOTS table (stores bot config per user)
-- This table was documented in SETUP-GUIDE.md but missing from migrations

create table if not exists telegram_bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  bot_token text not null,
  chat_id bigint,
  webhook_secret text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table telegram_bots enable row level security;

create policy "own bot" on telegram_bots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant all on telegram_bots to authenticated;

-- Auto-update updated_at
create trigger set_updated_at before update on telegram_bots
  for each row execute function update_updated_at();
