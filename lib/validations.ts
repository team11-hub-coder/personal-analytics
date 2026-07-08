import { z } from "zod";

const passwordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
});

export const workoutSchema = z.object({
  exercise_type: z.enum(["strength", "cardio", "flexibility"]),
  exercise_name: z.string().min(1, "Exercise name is required"),
  date: z.string().min(1, "Date is required"),
  sets: z.number().int().positive().optional().nullable(),
  reps: z.number().int().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  duration_min: z.number().int().positive().optional().nullable(),
  distance_km: z.number().positive().optional().nullable(),
  calories: z.number().int().positive().optional().nullable(),
  notes: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().optional().nullable(),
});

export const reminderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  remind_at: z.string().min(1, "Date and time are required"),
  repeat: z.enum(["none", "daily", "weekly", "monthly"]),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type WorkoutFormData = z.infer<typeof workoutSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type ReminderFormData = z.infer<typeof reminderSchema>;
