// Per-module Supabase insert logic + confirmation message generation

import { createClient } from "@supabase/supabase-js";
import { getLocalDateString, toISOWithOffset } from "@/lib/dates";
import { calculateCalories } from "@/lib/workouts";
import type {
  ParsedWorkout,
  ParsedFinance,
  ParsedTask,
  ParsedReminder,
  ParsedCommand,
} from "./parser";

// Service role client for server-side inserts (bypasses RLS)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

// ─── Workout Handler ─────────────────────────────────────────────────

async function handleWorkout(userId: string, data: ParsedWorkout): Promise<string> {
  const supabase = getSupabaseAdmin();

  const distanceKm = data.distance_km ?? null;
  const calories = calculateCalories({
    exercise_type: data.exercise_type,
    sets: data.sets,
    reps: data.reps,
    weight: data.weight,
    duration_min: data.duration_min,
    distance_km: distanceKm,
  });

  const { error } = await supabase.from("workouts").insert({
    user_id: userId,
    exercise_type: data.exercise_type,
    exercise_name: data.exercise_name,
    sets: data.sets,
    reps: data.reps,
    weight: data.weight,
    duration_min: data.duration_min,
    distance_km: distanceKm,
    calories: calories || null,
    notes: data.notes,
    date: getLocalDateString(),
  });

  if (error) throw error;

  const parts = [`🏋️ *${data.exercise_name}*`];
  if (data.sets) parts.push(`${data.sets} sets`);
  if (data.reps) parts.push(`${data.reps} reps`);
  if (data.weight) parts.push(`${data.weight} kg`);
  if (data.duration_min) parts.push(`${data.duration_min} min`);
  if (distanceKm) parts.push(`${distanceKm} km`);
  if (calories) parts.push(`${calories} cal`);
  parts.push(`Type: ${data.exercise_type}`);

  return `✅ Workout logged!\n\n${parts.join("\n")}`;
}

// ─── Finance Handler ─────────────────────────────────────────────────

// Map parsed category names to DB category names
const CATEGORY_MAP: Record<string, string> = {
  food: "Food",
  lunch: "Food",
  dinner: "Food",
  breakfast: "Food",
  meal: "Food",
  restaurant: "Food",
  cafe: "Food",
  coffee: "Food",
  snack: "Food",
  transport: "Transport",
  taxi: "Transport",
  uber: "Transport",
  bus: "Transport",
  gas: "Transport",
  fuel: "Transport",
  petrol: "Transport",
  utilities: "Utilities",
  electric: "Utilities",
  water: "Utilities",
  internet: "Utilities",
  phone: "Utilities",
  bills: "Utilities",
  shopping: "Shopping",
  groceries: "Shopping",
  grocery: "Shopping",
  market: "Shopping",
  shop: "Shopping",
  entertainment: "Entertainment",
  movie: "Entertainment",
  game: "Entertainment",
  fun: "Entertainment",
  health: "Health",
  medicine: "Health",
  doctor: "Health",
  pharmacy: "Health",
  education: "Education",
  salary: "Others",
  income: "Others",
};

async function lookupCategoryId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  categoryName: string
): Promise<number | null> {
  const normalizedName = CATEGORY_MAP[categoryName.toLowerCase()] || categoryName;

  // Try exact match first
  const { data } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", normalizedName)
    .is("user_id", null)
    .limit(1)
    .maybeSingle();

  if (data) return data.id;

  // Fallback: try "Others"
  const { data: fallback } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", "Others")
    .is("user_id", null)
    .limit(1)
    .maybeSingle();

  return fallback?.id ?? null;
}

async function handleFinance(userId: string, data: ParsedFinance): Promise<string> {
  const supabase = getSupabaseAdmin();

  // Look up category_id from DB
  const categoryId = await lookupCategoryId(supabase, data.category);

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    amount: data.amount,
    type: data.type,
    category_id: categoryId,
    description: data.description || null,
    date: getLocalDateString(),
    entry_source: "chatbot_text",
  });

  if (error) throw error;

  const emoji = data.type === "income" ? "💰" : "💸";
  const typeLabel = data.type === "income" ? "Income" : "Expense";
  return `${emoji} ${typeLabel} logged!\n\n${emoji} Amount: ${data.amount}\n📂 Category: ${data.category}${data.description ? `\n📝 ${data.description}` : ""}`;
}

// ─── Task Handler ────────────────────────────────────────────────────

async function handleTask(userId: string, data: ParsedTask): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title: data.title,
    description: data.description || null,
    priority: data.priority,
    due_date: data.due_date || null,
    status: "pending",
  });

  if (error) throw error;

  const priorityEmoji =
    data.priority === "high" ? "🔴" : data.priority === "medium" ? "🟡" : "🟢";

  return `✅ Task created!\n\n📝 ${data.title}\n${priorityEmoji} Priority: ${data.priority}`;
}

// ─── Reminder Handler ────────────────────────────────────────────────

async function handleReminder(userId: string, data: ParsedReminder): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("reminders").insert({
    user_id: userId,
    title: data.title,
    remind_at: toISOWithOffset(data.remind_at),
    repeat: data.repeat,
    is_active: true,
  });

  if (error) throw error;

  const dateObj = new Date(data.remind_at);
  const dateStr = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const repeatStr = data.repeat !== "none" ? `\n🔄 Repeats: ${data.repeat}` : "";

  return `⏰ Reminder set!\n\n📌 ${data.title}\n📅 ${dateStr} at ${timeStr}${repeatStr}`;
}

// ─── Main Handler ────────────────────────────────────────────────────

export async function handleParsedMessage(
  userId: string,
  parsed: ParsedCommand
): Promise<string> {
  switch (parsed.module) {
    case "workout":
      return handleWorkout(userId, parsed);
    case "finance":
      return handleFinance(userId, parsed);
    case "task":
      return handleTask(userId, parsed);
    case "reminder":
      return handleReminder(userId, parsed);
    case "help":
      return ""; // Help text handled in route.ts
    case "unknown":
      return `🤔 I didn't understand that. Here are some examples:\n\n🏋️ "Did 30 push-ups today"\n💸 "Spent 1500 on lunch"\n📝 "Buy groceries high priority"\n⏰ "Remind me about meeting tomorrow 10am"\n\nType /help for all commands.`;
  }
}
