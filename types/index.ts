export interface Profile {
  id: string;
  display_name: string;
  daily_calorie_target: number;
  monthly_budget_goal: number;
  currency: string;
  timezone: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  user_id: string;
  type: "expense" | "income";
  amount: number;
  category_id: number | null;
  description: string | null;
  date: string;
  receipt_image_url: string | null;
  entry_source: "manual_form" | "chatbot_text" | "chatbot_voice" | "chatbot_receipt" | "recurring";
  ai_confidence_score: number | null;
  template_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  user_id: string;
  category_id: number;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringTemplate {
  id: number;
  user_id: string;
  amount: number;
  category_id: number | null;
  description: string | null;
  interval: "weekly" | "monthly";
  next_run_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: number;
  user_id: string;
  exercise_type: "strength" | "cardio" | "flexibility";
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  duration_min: number | null;
  distance_km: number | null;
  calories: number | null;
  notes: string;
  date: string;
  created_at: string;
}

export interface TaskCategory {
  id: number;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  title: string;
  duration_minutes: number;
  equipment: string[];
  target_muscles: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  exercises: WorkoutExercise[];
  created_at: string;
}

export interface WorkoutExercise {
  name: string;
  type: "strength" | "cardio" | "flexibility";
  sets: number;
  reps: number | null;
  weight: number | null;
  duration_min: number | null;
  rest_seconds: number;
  muscle_group: string;
}

export interface GeneratedWorkout {
  title: string;
  duration: number;
  exercises: WorkoutExercise[];
}
export interface Task {
  id: number;
  user_id: string;
  category_id: number | null;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  priority_rank: number;
  status: "pending" | "completed";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Task with joined category info
export interface TaskWithCategory extends Task {
  task_categories: { id: number; name: string; color: string } | null;
}

// Task from the view with effective_status
export interface TaskView extends Task {
  effective_status: "pending" | "completed" | "overdue";
}

export interface Reminder {
  id: number;
  user_id: string;
  title: string;
  remind_at: string;
  repeat: "none" | "daily" | "weekly" | "monthly";
  is_active: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  title: string;
  mode: "pomodoro" | "stopwatch";
  duration_minutes: number;
  break_minutes: number;
  completed: boolean;
  completed_count: number;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export type FocusPhase = "idle" | "focus" | "break" | "longBreak";

export interface NotificationPreference {
  id: number;
  user_id: string;
  finance_enabled: boolean;
  workout_enabled: boolean;
  tasks_enabled: boolean;
  reminders_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailQueue {
  id: number;
  user_id: string;
  email_type: "finance_alert" | "workout_reminder" | "task_reminder" | "reminder_alert";
  subject: string;
  body: string;
  status: "pending" | "processing" | "sent" | "failed";
  scheduled_for: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface EmailTemplate {
  id: number;
  template_name: string;
  subject: string;
  html_body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
