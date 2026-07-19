// NLP parser: Telegram message → structured data for each module
// Supports both commands (/workout push-up 30) and natural language (I did 30 push-ups)

import { getLocalDateString } from "@/lib/dates";

export type ModuleType = "workout" | "finance" | "task" | "reminder" | "help" | "unknown";

export interface ParsedWorkout {
  module: "workout";
  exercise_name: string;
  exercise_type: "strength" | "cardio" | "flexibility";
  sets: number | null;
  reps: number | null;
  weight: number | null;
  duration_min: number | null;
  distance_km: number | null;
  notes: string;
}

export interface ParsedFinance {
  module: "finance";
  type: "expense" | "income";
  amount: number;
  category: string;
  description: string;
}

export interface ParsedTask {
  module: "task";
  title: string;
  priority: "low" | "medium" | "high";
  description: string;
  due_date: string | null;
}

export interface ParsedReminder {
  module: "reminder";
  title: string;
  remind_at: string; // ISO date string
  repeat: "none" | "daily" | "weekly" | "monthly";
}

export type ParsedCommand =
  | ParsedWorkout
  | ParsedFinance
  | ParsedTask
  | ParsedReminder
  | { module: "help" }
  | { module: "unknown"; raw: string };

// ─── Module Detection ────────────────────────────────────────────────

const WORKOUT_KEYWORDS =
  /workout|gym|exercise|push-?up|pull-?up|squat|bench|deadlift|run|jog|swim|cycle|cardio|strength|flexibility|yoga|plank|lunge|curl|press|row/i;
const FINANCE_KEYWORDS =
  /expense|spent|bought|cost|paid|income|earned|received|salary|revenue|profit|loss|\$|€|£|¥|₹|kz/i;
const TASK_KEYWORDS =
  /task|todo|to-?do|buy|complete|finish|do |need to|have to|should|must/i;
const REMINDER_KEYWORDS =
  /remind|reminder|alarm|notify|don't forget|remember|schedule/i;

function detectModule(text: string): ModuleType {
  if (/^\/help/i.test(text) || /^\/start/i.test(text)) return "help";
  // Check command prefixes first — /remind should always be reminder
  if (/^\/remind/i.test(text)) return "reminder";
  if (/^\/workout/i.test(text)) return "workout";
  if (/^\/(expense|income|spent|earned)/i.test(text)) return "finance";
  if (/^\/task/i.test(text)) return "task";
  // Then fall back to keyword detection
  if (WORKOUT_KEYWORDS.test(text)) return "workout";
  if (FINANCE_KEYWORDS.test(text)) return "finance";
  if (REMINDER_KEYWORDS.test(text)) return "reminder";
  if (TASK_KEYWORDS.test(text)) return "task";
  return "unknown";
}

// ─── Helpers ─────────────────────────────────────────────────────────

function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

function extractDate(text: string): string {
  const lower = text.toLowerCase();
  const today = new Date();

  if (/today|now/i.test(text)) return getLocalDateString(today);
  if (/yesterday/i.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  }
  if (/tomorrow/i.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return getLocalDateString(d);
  }

  // Check for YYYY-MM-DD
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  // Check for DD/MM or MM/DD (use current year)
  const slashMatch = text.match(/(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1]);
    const day = parseInt(slashMatch[2]);
    const year = slashMatch[3] ? parseInt(slashMatch[3]) : today.getFullYear();
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return getLocalDateString(today);
}

function extractTime(text: string): { hours: number; minutes: number } | null {
  // 10:30, 2:30pm, 10am, 2:30 PM
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1]);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  const meridian = timeMatch[3]?.toLowerCase();

  if (meridian === "pm" && hours < 12) hours += 12;
  if (meridian === "am" && hours === 12) hours = 0;

  return { hours, minutes };
}

function detectExerciseType(text: string): "strength" | "cardio" | "flexibility" {
  const lower = text.toLowerCase();
  if (/run|jog|swim|cycle|cardio|bike|walk|sprint|hiit|jump|dance/i.test(lower))
    return "cardio";
  if (/yoga|stretch|flexibility|pilates|mobility/i.test(lower)) return "flexibility";
  return "strength"; // default
}

function extractDistance(text: string): number | null {
  // Match "5km", "5 km", "5mi", "5 mi", "5 miles"
  const match = text.match(/(\d+(?:\.\d+)?)\s*(km|mi(?:les?)?)/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("mi")) return Math.round(value * 1.60934 * 100) / 100; // convert miles to km
  return value;
}

function detectPriority(text: string): "low" | "medium" | "high" {
  if (/high|urgent|important|asap|critical/i.test(text)) return "high";
  if (/low|minor|whenever|eventually/i.test(text)) return "low";
  return "medium";
}

function detectRepeat(text: string): "none" | "daily" | "weekly" | "monthly" {
  if (/daily|every day|each day/i.test(text)) return "daily";
  if (/weekly|every week|each week/i.test(text)) return "weekly";
  if (/monthly|every month|each month/i.test(text)) return "monthly";
  return "none";
}

// ─── Command Parsers ─────────────────────────────────────────────────

// /workout push-up 30 reps 5 sets 10kg
function parseWorkoutCommand(text: string): ParsedWorkout {
  // Remove /workout prefix
  const content = text.replace(/^\/workout\s*/i, "").trim();
  const numbers = extractNumbers(content);

  // Extract exercise name: everything that isn't a number or unit keyword
  const cleaned = content
    .replace(/\d+/g, "")
    .replace(
      /reps?|sets?|kg|lbs?|lbs|min|minutes?|hrs?|hours?|for|of|today|yesterday|tomorrow/gi,
      ""
    )
    .trim();

  const exerciseName = cleaned || "Workout";

  // Detect what the numbers mean based on context
  let sets: number | null = null;
  let reps: number | null = null;
  let weight: number | null = null;
  let duration_min: number | null = null;

  if (/\breps?\b/i.test(content) && numbers.length >= 1) {
    reps = numbers[0];
    if (/\bsets?\b/i.test(content) && numbers.length >= 2) sets = numbers[1];
    if (/kg|lbs?/i.test(content) && numbers.length >= 3) weight = numbers[2];
  } else if (/\bsets?\b/i.test(content) && numbers.length >= 1) {
    sets = numbers[0];
    if (numbers.length >= 2) reps = numbers[1];
  } else if (/\bmin|minutes?\b/i.test(content)) {
    duration_min = numbers[0] || null;
  } else if (numbers.length === 1) {
    // Single number: assume reps for strength, duration for cardio
    const type = detectExerciseType(content);
    if (type === "cardio") {
      duration_min = numbers[0];
    } else {
      reps = numbers[0];
    }
  } else if (numbers.length >= 2) {
    reps = numbers[0];
    sets = numbers[1];
    if (numbers.length >= 3) weight = numbers[2];
  }

  return {
    module: "workout",
    exercise_name: exerciseName,
    exercise_type: detectExerciseType(content),
    sets,
    reps,
    weight,
    duration_min,
    distance_km: detectExerciseType(content) === "cardio" ? extractDistance(content) : null,
    notes: "",
  };
}

// /expense food 1500 lunch
function parseFinanceCommand(text: string): ParsedFinance {
  const content = text.replace(/^\/(expense|income|spent|earned)\s*/i, "").trim();
  const numbers = extractNumbers(content);
  const isIncome = /^\/(income|earned)/i.test(text);

  const amount = numbers[0] || 0;

  // Category: first word(s) that aren't numbers
  const cleaned = content.replace(/\d+/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const category = words[0] || "General";
  const description = words.slice(1).join(" ") || "";

  return {
    module: "finance",
    type: isIncome ? "income" : "expense",
    amount,
    category,
    description,
  };
}

// /task buy groceries high
function parseTaskCommand(text: string): ParsedTask {
  const content = text.replace(/^\/task\s*/i, "").trim();
  const priority = detectPriority(content);
  const dueDate = extractDate(content);

  const title = content
    .replace(/\b(high|medium|low|urgent|important|asap|critical|minor|whenever|eventually)\b/gi, "")
    .replace(/\b(today|yesterday|tomorrow)\b/gi, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .trim();

  // Only set due_date if user actually mentioned a date keyword
  const hasDate = /\b(today|yesterday|tomorrow|\d{4}-\d{2}-\d{2})\b/i.test(content);

  return {
    module: "task",
    title: title || "New Task",
    priority,
    description: "",
    due_date: hasDate ? dueDate : null,
  };
}

// /remind meeting tomorrow 10am
function parseReminderCommand(text: string): ParsedReminder {
  const content = text.replace(/^\/remind(er)?\s*/i, "").trim();
  const date = extractDate(content);
  const time = extractTime(content);
  const repeat = detectRepeat(content);

  let title = content
    .replace(/\b(today|yesterday|tomorrow)\b/gi, "")
    .replace(/\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi, "")
    .replace(/\b\d{1,2}\s*(am|pm)\b/gi, "")
    .replace(/\b(daily|weekly|monthly|every day|every week|every month)\b/gi, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .trim();

  let remind_at = `${date}T09:00:00`;
  if (time) {
    remind_at = `${date}T${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}:00`;
  }

  return {
    module: "reminder",
    title: title || "Reminder",
    remind_at,
    repeat,
  };
}

// ─── Natural Language Parsers ────────────────────────────────────────

function parseWorkoutNatural(text: string): ParsedWorkout {
  // "I did 30 push-ups today" / "ran 5km" / "bench press 3 sets of 10"
  const numbers = extractNumbers(text);

  // Extract exercise name by removing common phrases
  let exerciseName = text
    .replace(/\b(i did|i have|i did|i've done|i just|just|today|yesterday|this morning|this evening|at the gym|at gym|for|of|and|the|a|an|my|me)\b/gi, "")
    .replace(/\d+/g, "")
    .replace(
      /reps?|sets?|kg|lbs?|lbs|min|minutes?|hrs?|hours?|push-?ups?|pull-?ups?|squats?|laps?|km|mi|miles?|rounds?/gi,
      (match) => /push-?ups?|pull-?ups?|squats?|laps?|km|mi|miles?|rounds?/i.test(match) ? match : ""
    )
    .replace(/[.,!?;:]/g, "")
    .trim();

  // If exercise name is too short or empty, try to find it from known exercises
  if (exerciseName.length < 2) {
    exerciseName = text
      .replace(/\b(i did|i have|i just|just|today|yesterday|this morning|this evening|at the gym|for|of|and|the|a|an|my|me)\b/gi, "")
      .replace(/\d+/g, "")
      .replace(/[.,!?;:]/g, "")
      .trim() || "Workout";
  }

  const type = detectExerciseType(text);
  let sets: number | null = null;
  let reps: number | null = null;
  let weight: number | null = null;
  let duration_min: number | null = null;

  // Pattern: "N sets of M reps" or "N x M"
  const setsRepsMatch = text.match(/(\d+)\s*(?:sets?|x)\s*(?:of\s*)?(\d+)/i);
  if (setsRepsMatch) {
    sets = parseInt(setsRepsMatch[1]);
    reps = parseInt(setsRepsMatch[2]);
  } else if (type === "cardio") {
    duration_min = numbers[0] || null;
    if (!duration_min && numbers.length > 0) duration_min = numbers[0];
  } else {
    // Strength: first number is usually reps
    reps = numbers[0] || null;
    if (numbers.length > 1) sets = numbers[1];
    if (numbers.length > 2) weight = numbers[2];
  }

  return {
    module: "workout",
    exercise_name: exerciseName,
    exercise_type: type,
    sets,
    reps,
    weight,
    duration_min,
    distance_km: type === "cardio" ? extractDistance(text) : null,
    notes: "",
  };
}

function parseFinanceNatural(text: string): ParsedFinance {
  // "spent 1500 on lunch" / "earned 5000 salary" / "bought groceries for 2000"
  const numbers = extractNumbers(text);
  const amount = numbers[0] || 0;
  const isIncome = /\b(earned|received|salary|revenue|profit|got)\b/i.test(text);

  // Category extraction
  const lower = text.toLowerCase();
  let category = "General";
  let description = "";

  const onMatch = text.match(/(?:on|for|at|from)\s+(.+?)(?:\s+(?:today|yesterday|this|last|\d)|$)/i);
  if (onMatch) {
    description = onMatch[1].replace(/[.,!?;:]/g, "").trim();
  }

  // Try to infer category from keywords (must match DB category names)
  if (/lunch|dinner|breakfast|meal|food|restaurant|cafe|coffee|snack/i.test(text))
    category = "Food";
  else if (/transport|taxi|uber|bus|gas|fuel|petrol/i.test(text)) category = "Transport";
  else if (/rent|electric|water|internet|phone|bill/i.test(text)) category = "Utilities";
  else if (/grocery|groceries|market|shop/i.test(text)) category = "Shopping";
  else if (/entertainment|movie|game|fun/i.test(text)) category = "Entertainment";
  else if (/health|medicine|doctor|pharmacy/i.test(text)) category = "Health";
  else if (/salary|wage|income|paycheck/i.test(text)) category = "Others";

  return {
    module: "finance",
    type: isIncome ? "income" : "expense",
    amount,
    category,
    description: description || `${isIncome ? "Income" : "Expense"} via Telegram`,
  };
}

function parseTaskNatural(text: string): ParsedTask {
  // "buy groceries" / "finish homework high priority" / "call dentist"
  const priority = detectPriority(text);
  const dueDate = extractDate(text);

  const title = text
    .replace(/\b(high|medium|low|urgent|important|asap|critical|priority)\b/gi, "")
    .replace(/\b(i need to|i have to|i should|i must|don't forget to|remember to|todo:?|task:?)\b/gi, "")
    .replace(/\b(today|yesterday|tomorrow)\b/gi, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .replace(/[.,!?;:]/g, "")
    .trim();

  // Only set due_date if user actually mentioned a date keyword
  const hasDate = /\b(today|yesterday|tomorrow|\d{4}-\d{2}-\d{2})\b/i.test(text);

  return {
    module: "task",
    title: title || "New Task",
    priority,
    description: "",
    due_date: hasDate ? dueDate : null,
  };
}

function parseReminderNatural(text: string): ParsedReminder {
  // "remind me about meeting tomorrow at 10am" / "don't forget to call dentist"
  const date = extractDate(text);
  const time = extractTime(text);
  const repeat = detectRepeat(text);

  const title = text
    .replace(/\b(remind me about|remind me to|don't forget to|remember to|don't forget|remember|about|to)\b/gi, "")
    .replace(/\b(today|yesterday|tomorrow)\b/gi, "")
    .replace(/\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi, "")
    .replace(/\b\d{1,2}\s*(am|pm)\b/gi, "")
    .replace(/\b(daily|weekly|monthly|every day|every week|every month)\b/gi, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .replace(/[.,!?;:]/g, "")
    .trim();

  let remind_at = `${date}T09:00:00`;
  if (time) {
    remind_at = `${date}T${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}:00`;
  }

  return {
    module: "reminder",
    title: title || "Reminder",
    remind_at,
    repeat,
  };
}

// ─── Main Parser ─────────────────────────────────────────────────────

export function parseMessage(text: string): ParsedCommand {
  const trimmed = text.trim();
  if (!trimmed) return { module: "unknown", raw: trimmed };

  // Command-based parsing (/command ...)
  if (trimmed.startsWith("/")) {
    const parsedModule = detectModule(trimmed);
    switch (parsedModule) {
      case "workout":
        return parseWorkoutCommand(trimmed);
      case "finance":
        return parseFinanceCommand(trimmed);
      case "task":
        return parseTaskCommand(trimmed);
      case "reminder":
        return parseReminderCommand(trimmed);
      case "help":
        return { module: "help" };
      default:
        return { module: "unknown", raw: trimmed };
    }
  }

  // Natural language parsing
  const parsedModule = detectModule(trimmed);
  switch (parsedModule) {
    case "workout":
      return parseWorkoutNatural(trimmed);
    case "finance":
      return parseFinanceNatural(trimmed);
    case "task":
      return parseTaskNatural(trimmed);
    case "reminder":
      return parseReminderNatural(trimmed);
    default:
      return { module: "unknown", raw: trimmed };
  }
}

// ─── Help Text ───────────────────────────────────────────────────────

export function getHelpText(): string {
  return `👋 *Welcome to Personal Analytics Bot!*

Log workouts, expenses, tasks & reminders directly from Telegram. Data syncs to your dashboard instantly.

━━━━━━━━━━━━━━━━━━━━━━━━━━

🏋️ *WORKOUTS*
*Fields:* exercise_type, exercise_name, sets, reps, weight, distance_km, calories

*Command format:*
/workout [name] [reps] reps [sets] sets [weight]kg

*Examples:*
/workout push-up 30 reps
/workout bench-press 10 reps 5 sets 60kg
/workout squat 20 reps 3 sets 80kg
/workout run 5km 30min

*Or natural language:*
I did 30 push-ups today
Did 5 sets of bench press at 60kg
Ran 5km this morning

*Types auto-detected:*
strength: push-up, bench, squat, curl
cardio: run, jog, swim, cycle, walk (auto-calculates distance + calories)
flexibility: yoga, stretch, pilates

━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 *FINANCE*
*Fields:* amount, description, category

*Command format:*
/expense [category] [amount] [description]
/income [category] [amount] [description]

*Examples:*
/expense food 1500 lunch at cafe
/expense transport 500 taxi to office
/income salary 50000 monthly salary
/expense groceries 2300 weekly groceries

*Or natural language:*
Spent 1500 on lunch
Earned 50000 salary
Bought groceries for 2300

*Auto-categories:*
Food, Transport, Utilities, Shopping, Entertainment, Health, Education, Others

━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ *TASKS*
*Fields:* title, description, priority, due_date, status

*Command format:*
/task [title] [priority] [due_date]

*Examples:*
/task buy groceries high
/task finish homework medium tomorrow
/task call dentist low 2024-12-15

*Or natural language:*
Buy groceries high priority
Finish homework tomorrow
Call dentist by Friday

*Priority keywords:*
🔴 high, urgent, important, asap
🟡 medium (default)
🟢 low, minor, whenever

*Date shortcuts:*
today, tomorrow, YYYY-MM-DD

━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ *REMINDERS*
*Fields:* title, remind_at, repeat, is_active

*Command format:*
/remind [title] [date] [time] [repeat]

*Examples:*
/remind meeting tomorrow 10am
/remind call dentist 2024-12-15 14:30
/remind workout daily 7am
/remind stand-up weekly 9am

*Or natural language:*
Remind me about meeting tomorrow at 10am
Don't forget to call dentist
Remind me about workout at 7am daily

*Date shortcuts:*
today, tomorrow, yesterday, YYYY-MM-DD

*Repeat options:*
none (default), daily, weekly, monthly

━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *COMMANDS*

/help — Show this message
/start — Welcome message

━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 *TIPS*

✅ You can use commands OR natural language
✅ Be specific: "30 push-ups" not just "workout"
✅ Add priority words for tasks: high, urgent, low
✅ Add time for reminders: 10am, 2:30pm, 14:00
✅ Say "today", "tomorrow" for quick dates

❓ *NEED HELP?*
Visit the dashboard for more options.`;
}
