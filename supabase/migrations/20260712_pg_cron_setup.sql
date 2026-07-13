-- ============================================================
-- pg_cron Setup: Helper Functions + Scheduled Jobs
-- ============================================================

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA cron TO supabase_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO supabase_admin;

-- ============================================================
-- 2. Helper Functions
-- ============================================================

-- Queue finance alerts when spending >= 80% of budget
CREATE OR REPLACE FUNCTION queue_finance_alerts()
RETURNS void AS $$
BEGIN
  INSERT INTO email_queue (user_id, email_type, subject, body, scheduled_for)
  SELECT
    np.user_id,
    'finance_alert',
    'Finance Alert: Budget Warning for ' || c.name,
    jsonb_build_object(
      'alert_message', 'You have spent ' || COALESCE(SUM(t.amount), 0)::text ||
        ' of your ' || b.monthly_limit::text || ' budget for ' || c.name || '.',
      'spent_amount', COALESCE(SUM(t.amount), 0)::text,
      'budget_limit', b.monthly_limit::text,
      'percentage_used', ROUND((COALESCE(SUM(t.amount), 0) / b.monthly_limit) * 100)::text,
      'category', c.name
    )::text,
    NOW()
  FROM notification_preferences np
  JOIN budgets b ON b.user_id = np.user_id
  JOIN categories c ON c.id = b.category_id
  LEFT JOIN transactions t ON t.user_id = np.user_id
    AND t.category_id = b.category_id
    AND t.date >= date_trunc('month', CURRENT_DATE)
  WHERE np.finance_enabled = TRUE
  GROUP BY np.user_id, b.id, b.monthly_limit, c.name
  HAVING COALESCE(SUM(t.amount), 0) >= b.monthly_limit * 0.8;
END;
$$ LANGUAGE plpgsql;

-- Queue workout reminders for today's workouts
CREATE OR REPLACE FUNCTION queue_workout_reminders()
RETURNS void AS $$
BEGIN
  INSERT INTO email_queue (user_id, email_type, subject, body, scheduled_for)
  SELECT DISTINCT
    np.user_id,
    'workout_reminder',
    'Workout Reminder: ' || w.exercise_name,
    jsonb_build_object(
      'workout_name', w.exercise_name,
      'exercise_type', w.exercise_type,
      'duration', COALESCE(w.duration_min, 0)::text,
      'calories', COALESCE(w.calories, 0)::text
    )::text,
    NOW()
  FROM notification_preferences np
  JOIN workouts w ON w.user_id = np.user_id AND w.date = CURRENT_DATE
  WHERE np.workout_enabled = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Queue task reminders for tasks due today or overdue
CREATE OR REPLACE FUNCTION queue_task_reminders()
RETURNS void AS $$
BEGIN
  INSERT INTO email_queue (user_id, email_type, subject, body, scheduled_for)
  SELECT
    np.user_id,
    'task_reminder',
    'Task Due: ' || t.title,
    jsonb_build_object(
      'task_title', t.title,
      'due_date', COALESCE(t.due_date::text, 'No due date'),
      'priority', t.priority,
      'description', COALESCE(t.description, ''),
      'is_overdue', (t.due_date < CURRENT_DATE)::text,
      'days_overdue', CASE WHEN t.due_date < CURRENT_DATE
        THEN (CURRENT_DATE - t.due_date)::text
        ELSE '0' END
    )::text,
    NOW()
  FROM notification_preferences np
  JOIN tasks t ON t.user_id = np.user_id
  WHERE np.tasks_enabled = TRUE
    AND t.status = 'pending'
    AND t.due_date IS NOT NULL
    AND t.due_date <= CURRENT_DATE + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Queue reminder alerts for upcoming reminders (within next hour)
CREATE OR REPLACE FUNCTION queue_reminder_alerts()
RETURNS void AS $$
BEGIN
  INSERT INTO email_queue (user_id, email_type, subject, body, scheduled_for)
  SELECT
    np.user_id,
    'reminder_alert',
    'Reminder: ' || r.title,
    jsonb_build_object(
      'reminder_title', r.title,
      'remind_at', r.remind_at::text,
      'repeat', CASE r.repeat
        WHEN 'daily' THEN 'Repeats daily'
        WHEN 'weekly' THEN 'Repeats weekly'
        WHEN 'monthly' THEN 'Repeats monthly'
        ELSE '' END
    )::text,
    NOW()
  FROM notification_preferences np
  JOIN reminders r ON r.user_id = np.user_id
  WHERE np.reminders_enabled = TRUE
    AND r.is_active = TRUE
    AND r.remind_at >= NOW()
    AND r.remind_at <= NOW() + INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Process email queue: call the Edge Function
-- UPDATE: Replace YOUR_SUPABASE_URL and YOUR_SERVICE_ROLE_KEY with actual values
CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS void AS $$
DECLARE
  supabase_url TEXT := 'YOUR_SUPABASE_URL';
  service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY';
BEGIN
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'Content-Type', 'application/json'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. Schedule Cron Jobs
-- ============================================================

-- Finance alerts: every 6 hour
SELECT cron.schedule(
  'queue-finance-alerts',
  '0 */6 * * *',
  'SELECT queue_finance_alerts()'
);

-- Workout reminders: daily at 7:00 AM
SELECT cron.schedule(
  'queue-workout-reminders',
  '0 7 * * *',
  'SELECT queue_workout_reminders()'
);

-- Task reminders: every 4 hours
SELECT cron.schedule(
  'queue-task-reminders',
  '0 */4 * * *',
  'SELECT queue_task_reminders()'
);

-- Reminder alerts: every 15 minutes
SELECT cron.schedule(
  'queue-reminder-alerts',
  '*/15 * * * *',
  'SELECT queue_reminder_alerts()'
);

-- Process email queue: every 5 minutes
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  'SELECT process_email_queue()'
);
