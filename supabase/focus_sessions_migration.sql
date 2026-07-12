-- Fix focus_sessions: add title column and allow stopwatch mode
-- Run this in Supabase SQL Editor

-- Add title column (if missing)
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';

-- Update mode constraint to include stopwatch
ALTER TABLE focus_sessions DROP CONSTRAINT IF EXISTS focus_sessions_mode_check;
ALTER TABLE focus_sessions ADD CONSTRAINT focus_sessions_mode_check CHECK (mode in ('pomodoro', 'custom', 'stopwatch'));

-- Test data (replace auth.uid() with your actual user ID if needed)
INSERT INTO focus_sessions (user_id, title, mode, duration_minutes, break_minutes, completed, started_at, ended_at)
SELECT
  auth.uid(),
  x.title,
  x.mode,
  x.duration_minutes,
  x.break_minutes,
  x.completed,
  now() - (x.ago || ' hours')::interval,
  now() - (x.ago || ' hours')::interval - (x.duration_minutes || ' minutes')::interval
FROM (VALUES
  ('Deep Work', 'custom', 25, 5, true, '2'),
  ('Reading', 'custom', 45, 10, true, '26'),
  ('Study Session', 'custom', 30, 10, true, '50')
) AS x(title, mode, duration_minutes, break_minutes, completed, ago);
