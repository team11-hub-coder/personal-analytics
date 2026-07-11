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

// Date format regex: YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const transactionSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(999999999, "Amount is too large"),
  category_id: z.number().min(1, "Category is required"),
  description: z.string().max(500, "Description too long").optional(),
  date: z
    .string()
    .min(1, "Date is required")
    .regex(dateRegex, "Date must be in YYYY-MM-DD format"),
  receipt_image_url: z.string().url().optional().nullable(),
  entry_source: z.enum(["manual_form", "chatbot_text", "chatbot_voice", "chatbot_receipt", "recurring"]),
});

export const budgetSchema = z.object({
  category_id: z.number().min(1, "Category is required"),
  monthly_limit: z
    .number()
    .positive("Budget must be positive")
    .max(999999999, "Budget is too large"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
  icon: z.string().min(1, "Icon is required"),
});

export const recurringTemplateSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(999999999, "Amount is too large"),
  category_id: z.number().min(1, "Category is required"),
  description: z.string().max(500, "Description too long").optional(),
  interval: z.enum(["weekly", "monthly"]),
  next_run_date: z
    .string()
    .min(1, "Start date is required")
    .regex(dateRegex, "Date must be in YYYY-MM-DD format"),
});

// Inline edit schemas (stricter, for existing records)
export const inlineTransactionSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(999999999, "Amount is too large"),
  description: z.string().max(500, "Description too long").optional(),
});

export const inlineBudgetSchema = z.object({
  monthly_limit: z
    .number()
    .positive("Budget must be positive")
    .max(999999999, "Budget is too large"),
});

export const inlineRecurringTemplateSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(999999999, "Amount is too large"),
  description: z.string().max(500, "Description too long").optional(),
  interval: z.enum(["weekly", "monthly"]),
  next_run_date: z
    .string()
    .min(1, "Start date is required")
    .regex(dateRegex, "Date must be in YYYY-MM-DD format"),
});

export const currencySchema = z.object({
  currency: z.string().min(1, "Currency is required"),
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

// Inline edit schema for existing tasks (stricter)
export const inlineTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const reminderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  remind_at: z.string().min(1, "Date and time are required"),
  repeat: z.enum(["none", "daily", "weekly", "monthly"]),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type RecurringTemplateFormData = z.infer<typeof recurringTemplateSchema>;
export type CurrencyFormData = z.infer<typeof currencySchema>;
export type InlineTransactionFormData = z.infer<typeof inlineTransactionSchema>;
export type InlineBudgetFormData = z.infer<typeof inlineBudgetSchema>;
export type InlineRecurringTemplateFormData = z.infer<typeof inlineRecurringTemplateSchema>;
export type WorkoutFormData = z.infer<typeof workoutSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type InlineTaskFormData = z.infer<typeof inlineTaskSchema>;
export type ReminderFormData = z.infer<typeof reminderSchema>;
