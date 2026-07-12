export interface Profile {
  id: string;
  display_name: string;
  daily_calorie_target: number;
  monthly_budget_goal: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

export interface Budget {
  id: number;
  user_id: string;
  category: string;
  monthly_limit: number;
  month: string;
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
