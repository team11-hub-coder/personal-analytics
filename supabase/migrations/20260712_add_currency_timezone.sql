-- Add currency and timezone to profiles
-- Run in Supabase SQL Editor

-- Add currency column (default: Myanmar Kyat)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency text DEFAULT 'MMK';

-- Add timezone column (default: Myanmar time)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Yangon';
