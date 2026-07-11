-- Add icon column to categories table
-- Run in Supabase SQL Editor

ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon text DEFAULT 'MoreHorizontal';

-- Update default categories with appropriate icons
UPDATE categories SET icon = 'Utensils' WHERE name = 'Food' AND user_id IS NULL;
UPDATE categories SET icon = 'Car' WHERE name = 'Transport' AND user_id IS NULL;
UPDATE categories SET icon = 'Zap' WHERE name = 'Utilities' AND user_id IS NULL;
UPDATE categories SET icon = 'ShoppingBag' WHERE name = 'Shopping' AND user_id IS NULL;
UPDATE categories SET icon = 'Gamepad2' WHERE name = 'Entertainment' AND user_id IS NULL;
UPDATE categories SET icon = 'Heart' WHERE name = 'Health' AND user_id IS NULL;
UPDATE categories SET icon = 'BookOpen' WHERE name = 'Education' AND user_id IS NULL;
UPDATE categories SET icon = 'MoreHorizontal' WHERE name = 'Others' AND user_id IS NULL;
