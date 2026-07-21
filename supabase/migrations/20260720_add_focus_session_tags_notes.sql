-- Add tags, notes, and distraction_log columns to focus_sessions
-- Part of Phase 1 Focus Page Upgrade (2026-07-14 design spec)

ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS distraction_log JSONB DEFAULT '[]';
