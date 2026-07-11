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

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "completed";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
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
