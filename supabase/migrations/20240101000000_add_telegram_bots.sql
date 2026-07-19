-- TELEGRAM LINKS table (links user accounts to Telegram chat IDs)
-- One bot for all users, each user links their Telegram account

create table if not exists telegram_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  chat_id bigint not null unique,
  connect_code text unique,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table telegram_links enable row level security;

-- Policy: users can only access their own link
create policy "own link" on telegram_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Grant access
grant all on telegram_links to authenticated;

-- Add bot token to environment (do NOT store in database)
-- Add this to .env.local: TELEGRAM_BOT_TOKEN=your_token_here
