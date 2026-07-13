-- Email Queue table
-- Stores emails waiting to be sent by the Edge Function

CREATE TABLE public.email_queue (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  email_type text NOT NULL CHECK (email_type IN (
    'finance_alert',
    'workout_reminder',
    'task_reminder',
    'reminder_alert'
  )),
  subject text NOT NULL,
  body text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'sent',
    'failed'
  )),
  scheduled_for timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_queue_pkey PRIMARY KEY (id),
  CONSTRAINT email_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Only service role can access email queue (Edge Function uses service role)
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on email_queue"
  ON public.email_queue FOR ALL
  USING (auth.role() = 'service_role');

-- Email Templates table
-- Reusable HTML templates with placeholder variables

CREATE TABLE public.email_templates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  template_name text UNIQUE NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_templates_pkey PRIMARY KEY (id)
);

-- Only service role can access templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on email_templates"
  ON public.email_templates FOR ALL
  USING (auth.role() = 'service_role');

-- Insert default templates
INSERT INTO public.email_templates (template_name, subject, html_body) VALUES
('finance_alert', 'Finance Alert: Budget Warning',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finance Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .alert-title { font-weight: 600; color: #92400e; margin: 0 0 10px 0; }
    .alert-text { color: #78350f; margin: 0; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: 700; color: #059669; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .cta { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Finance Alert</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <p class="alert-title">⚠️ Budget Warning</p>
        <p class="alert-text">{{alert_message}}</p>
      </div>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${{spent_amount}}</div>
          <div class="stat-label">Spent This Month</div>
        </div>
        <div class="stat">
          <div class="stat-value">${{budget_limit}}</div>
          <div class="stat-label">Monthly Budget</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{percentage_used}}%</div>
          <div class="stat-label">Used</div>
        </div>
      </div>
      <p>Your spending in <strong>{{category}}</strong> has reached {{percentage_used}}% of your monthly budget limit.</p>
      <a href="{{dashboard_url}}/finance" class="cta">View Finance Dashboard</a>
    </div>
    <div class="footer">
      <p>Personal Analytics Dashboard</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe from finance alerts</a></p>
    </div>
  </div>
</body>
</html>'),

('workout_reminder', 'Workout Reminder: {{workout_name}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workout Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .workout-card { background: #eff6ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .workout-title { font-size: 18px; font-weight: 600; color: #1e40af; margin: 0 0 10px 0; }
    .workout-details { color: #1e3a8a; }
    .workout-details p { margin: 5px 0; }
    .cta { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏋️ Workout Reminder</h1>
    </div>
    <div class="content">
      <div class="workout-card">
        <h2 class="workout-title">{{workout_name}}</h2>
        <div class="workout-details">
          <p>📋 Type: {{exercise_type}}</p>
          <p>⏱️ Duration: {{duration}} minutes</p>
          <p>🔥 Estimated Calories: {{calories}}</p>
        </div>
      </div>
      <p>Time to get moving! Your scheduled workout is waiting for you.</p>
      <a href="{{dashboard_url}}/workouts" class="cta">Log Your Workout</a>
    </div>
    <div class="footer">
      <p>Personal Analytics Dashboard</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe from workout reminders</a></p>
    </div>
  </div>
</body>
</html>'),

('task_reminder', 'Task Due: {{task_title}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f55f; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .task-card { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px; margin: 20px 0; }
    .task-title { font-size: 18px; font-weight: 600; color: #92400e; margin: 0 0 10px 0; }
    .task-details { color: #78350f; }
    .task-details p { margin: 5px 0; }
    .overdue { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 4px; text-align: center; font-weight: 600; margin: 20px 0; }
    .cta { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Task Reminder</h1>
    </div>
    <div class="content">
      {{#if is_overdue}}
      <div class="overdue">⚠️ This task is overdue!</div>
      {{/if}}
      <div class="task-card">
        <h2 class="task-title">{{task_title}}</h2>
        <div class="task-details">
          <p>📅 Due: {{due_date}}</p>
          <p>Priority: {{priority}}</p>
          {{#if description}}<p>📝 {{description}}</p>{{/if}}
        </div>
      </div>
      <a href="{{dashboard_url}}/tasks" class="cta">Complete Task</a>
    </div>
    <div class="footer">
      <p>Personal Analytics Dashboard</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe from task reminders</a></p>
    </div>
  </div>
</body>
</html>'),

('reminder_alert', 'Reminder: {{reminder_title}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .reminder-card { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 4px; margin: 20px 0; }
    .reminder-title { font-size: 18px; font-weight: 600; color: #991b1b; margin: 0 0 10px 0; }
    .reminder-details { color: #7f1d1d; }
    .reminder-details p { margin: 5px 0; }
    .cta { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Reminder</h1>
    </div>
    <div class="content">
      <div class="reminder-card">
        <h2 class="reminder-title">{{reminder_title}}</h2>
        <div class="reminder-details">
          <p>📅 Scheduled: {{remind_at}}</p>
          {{#if repeat}}<p>🔁 Repeats: {{repeat}}</p>{{/if}}
        </div>
      </div>
      <p>Don''t forget: <strong>{{reminder_title}}</strong></p>
      <a href="{{dashboard_url}}/reminders" class="cta">View Reminders</a>
    </div>
    <div class="footer">
      <p>Personal Analytics Dashboard</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe from reminders</a></p>
    </div>
  </div>
</body>
</html>');
