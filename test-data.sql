-- =====================================================
-- TEST DATA for Personal Analytics Dashboard
-- =====================================================
-- HOW TO USE:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. First, get your user_id by running:
--    SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- 3. Replace 'YOUR_USER_ID_HERE' below with your actual user_id
-- 4. Run this script
-- =====================================================

-- First, create a profile (if not exists from trigger)
INSERT INTO profiles (id, display_name, daily_calorie_target, monthly_budget_goal)
VALUES ('YOUR_USER_ID_HERE', 'Test User', 2000, 3000)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- TRANSACTIONS (Finance)
-- =====================
INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES
-- Income
('YOUR_USER_ID_HERE', 'income', 5000, 'salary', 'Monthly salary', '2026-07-01'),
('YOUR_USER_ID_HERE', 'income', 500, 'freelance', 'Side project payment', '2026-07-05'),
('YOUR_USER_ID_HERE', 'income', 150, 'investment', 'Stock dividend', '2026-07-10'),
-- Expenses
('YOUR_USER_ID_HERE', 'expense', 1200, 'rent', 'Monthly rent', '2026-07-01'),
('YOUR_USER_ID_HERE', 'expense', 300, 'groceries', 'Weekly groceries', '2026-07-02'),
('YOUR_USER_ID_HERE', 'expense', 60, 'utilities', 'Electric bill', '2026-07-03'),
('YOUR_USER_ID_HERE', 'expense', 45, 'dining', 'Dinner with friends', '2026-07-04'),
('YOUR_USER_ID_HERE', 'expense', 200, 'shopping', 'New headphones', '2026-07-05'),
('YOUR_USER_ID_HERE', 'expense', 30, 'transport', 'Uber rides', '2026-07-06'),
('YOUR_USER_ID_HERE', 'expense', 15, 'entertainment', 'Movie tickets', '2026-07-07'),
('YOUR_USER_ID_HERE', 'expense', 80, 'health', 'Gym membership', '2026-07-08'),
('YOUR_USER_ID_HERE', 'expense', 50, 'groceries', 'Weekly groceries', '2026-07-09'),
('YOUR_USER_ID_HERE', 'expense', 25, 'dining', 'Lunch', '2026-07-10');

-- =====================
-- BUDGETS
-- =====================
INSERT INTO budgets (user_id, category, monthly_limit, month) VALUES
('YOUR_USER_ID_HERE', 'groceries', 400, '2026-07'),
('YOUR_USER_ID_HERE', 'dining', 200, '2026-07'),
('YOUR_USER_ID_HERE', 'entertainment', 150, '2026-07'),
('YOUR_USER_ID_HERE', 'shopping', 300, '2026-07'),
('YOUR_USER_ID_HERE', 'transport', 100, '2026-07');

-- =====================
-- WORKOUTS
-- =====================
INSERT INTO workouts (user_id, exercise_type, exercise_name, sets, reps, weight, duration_min, distance_km, calories, notes, date) VALUES
-- Strength training
('YOUR_USER_ID_HERE', 'strength', 'Bench Press', 4, 10, 80, NULL, NULL, 250, 'Felt strong today', '2026-07-01'),
('YOUR_USER_ID_HERE', 'strength', 'Squats', 4, 8, 100, NULL, NULL, 300, 'PR attempt next week', '2026-07-03'),
('YOUR_USER_ID_HERE', 'strength', 'Deadlift', 3, 6, 120, NULL, NULL, 280, 'Good form', '2026-07-05'),
('YOUR_USER_ID_HERE', 'strength', 'Pull-ups', 3, 12, NULL, NULL, NULL, 150, 'Bodyweight', '2026-07-07'),
('YOUR_USER_ID_HERE', 'strength', 'Shoulder Press', 3, 10, 40, NULL, NULL, 180, NULL, '2026-07-09'),
-- Cardio
('YOUR_USER_ID_HERE', 'cardio', 'Running', NULL, NULL, NULL, 30, 5.0, 350, 'Morning run', '2026-07-02'),
('YOUR_USER_ID_HERE', 'cardio', 'Cycling', NULL, NULL, NULL, 45, 15.0, 400, 'Park trail', '2026-07-04'),
('YOUR_USER_ID_HERE', 'cardio', 'Swimming', NULL, NULL, NULL, 40, 1.5, 450, 'Lap training', '2026-07-06'),
('YOUR_USER_ID_HERE', 'cardio', 'HIIT', NULL, NULL, NULL, 25, NULL, 380, 'Intense session', '2026-07-08'),
-- Flexibility
('YOUR_USER_ID_HERE', 'flexibility', 'Yoga', NULL, NULL, NULL, 60, NULL, 200, 'Recovery day', '2026-07-10');

-- =====================
-- TASKS
-- =====================
INSERT INTO tasks (user_id, title, description, priority, status, due_date) VALUES
('YOUR_USER_ID_HERE', 'Finish project report', 'Complete the Q2 analytics report', 'high', 'pending', '2026-07-12'),
('YOUR_USER_ID_HERE', 'Review pull requests', 'Check team PRs for the chatbot feature', 'medium', 'pending', '2026-07-11'),
('YOUR_USER_ID_HERE', 'Update documentation', 'Add API endpoints to docs', 'medium', 'pending', '2026-07-15'),
('YOUR_USER_ID_HERE', 'Fix login bug', 'Users getting logged out randomly', 'high', 'completed', '2026-07-10'),
('YOUR_USER_ID_HERE', 'Deploy to production', 'Push latest changes to Vercel', 'low', 'pending', '2026-07-14'),
('YOUR_USER_ID_HERE', 'Database backup', 'Export Supabase data', 'low', 'completed', '2026-07-08'),
('YOUR_USER_ID_HERE', 'Team meeting prep', 'Slides for Monday standup', 'medium', 'pending', '2026-07-13'),
('YOUR_USER_ID_HERE', 'Code review', 'Review finance module', 'high', 'pending', '2026-07-11');

-- =====================
-- REMINDERS
-- =====================
INSERT INTO reminders (user_id, title, remind_at, repeat, is_active) VALUES
('YOUR_USER_ID_HERE', 'Take medication', '2026-07-11 08:00:00+00', 'daily', true),
('YOUR_USER_ID_HERE', 'Team standup', '2026-07-12 09:00:00+00', 'daily', true),
('YOUR_USER_ID_HERE', 'Gym session', '2026-07-11 18:00:00+00', 'daily', true),
('YOUR_USER_ID_HERE', 'Weekly budget review', '2026-07-14 10:00:00+00', 'weekly', true),
('YOUR_USER_ID_HERE', 'Pay rent', '2026-08-01 09:00:00+00', 'monthly', true),
('YOUR_USER_ID_HERE', 'Project deadline', '2026-07-15 17:00:00+00', 'none', true),
('YOUR_USER_ID_HERE', 'Dentist appointment', '2026-07-20 14:00:00+00', 'none', true);

-- =====================================================
-- DONE! Test data inserted successfully.
-- =====================================================
