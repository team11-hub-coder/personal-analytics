import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { checkRateLimit, recordUsage, getUsageStats } from "@/lib/rateLimit";
import { getLocalNow } from "@/lib/dates";

/**
 * Chat API Route
 *
 * Handles AI-powered chat using Gemini. Reads user data from Supabase
 * and provides context-aware responses about finances, workouts, tasks, and reminders.
 *
 * Security:
 * - Requires authentication (Supabase session)
 * - Input validation via Zod schema
 * - Rate limiting per user
 * - Usage tracking for cost monitoring
 * - No sensitive data exposed in errors
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Input validation schema
const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(10000),
      })
    )
    .min(1)
    .max(50), // Limit conversation history
});

/** Maximum context size in characters (rough estimate: ~4 chars per token) */
const MAX_CONTEXT_CHARS = 30000;

/** Maximum individual message length in history */
const MAX_HISTORY_MSG_CHARS = 2000;

/**
 * POST /api/chat
 *
 * Sends a message to the AI assistant and returns the response.
 * The API builds context from the user's data before calling Gemini.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { messages } = validationResult.data;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return Response.json(
        { error: "AI service temporarily unavailable" },
        { status: 500 }
      );
    }

    // Fetch user's timezone from profile
    let userTimezone = "UTC";
    try {
      const { data: tzProfile } = await supabase
        .from("profiles")
        .select("timezone")
        .eq("id", user.id)
        .single();
      if (tzProfile?.timezone) {
        userTimezone = tzProfile.timezone;
      }
    } catch {
      // Fallback to UTC
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(user.id, supabase, userTimezone);
    if (!rateLimitResult.allowed) {
      return Response.json(
        {
          error: rateLimitResult.error,
          usage: await getUsageStats(user.id, supabase, userTimezone),
        },
        { status: 429 }
      );
    }

    const localNow = getLocalNow(userTimezone);

    // Build context from user's Supabase data (truncated if too large)
    const rawContext = await buildUserContext(user.id, supabase, userTimezone);
    const context = truncateContext(rawContext);

    // Initialize Gemini model with system instructions
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a personal analytics assistant. You analyze and answer questions ONLY about the user's data shown below. Be concise, insightful, and helpful.

CURRENT DATE & TIME:
- Timezone: ${userTimezone}
- Current date/time: ${localNow.datetimeStr}
- Use this as "today" and "now" when answering date-related questions (e.g., "today's spending", "upcoming reminders", "this week's workouts").

CAPABILITIES:
- Analyze spending patterns and budget status
- Track workout progress and fitness trends
- Review task completion and productivity
- Summarize upcoming reminders and schedule

STRICT RULES:
1. ONLY answer questions about: finances (transactions, budgets, spending), workouts (exercises, calories, progress), tasks (pending, completed, priorities), reminders, and user profile
2. REFUSE off-topic questions with: "I can only help with your personal analytics data — finances, workouts, tasks, and reminders."
3. Do NOT provide general knowledge, coding help, opinions, or unrelated advice
4. Always reference the user's actual data when answering
5. When asked for insights, analyze patterns in their data
6. For summaries, calculate totals and provide actionable insights
7. When referencing dates, use the user's local timezone (shown above) — not UTC

User's Data:
${context}`,
    });

    // Build conversation history (exclude last message, truncate long messages)
    const truncatedHistory = truncateHistory(messages.slice(0, -1));
    const history = truncatedHistory.map(
      (m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })
    );

    // Start chat session and send message
    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const assistantMessage = result.response.text();

    // Record usage for tracking
    await recordUsage(user.id, lastMessage.content, assistantMessage, supabase);

    // Get updated usage stats
    const updatedUsage = await getUsageStats(user.id, supabase, userTimezone);

    return Response.json({
      message: assistantMessage,
      usage: updatedUsage,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    // Return generic error to avoid leaking internal details
    return Response.json(
      { error: "Failed to process your request. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Builds a context string from the user's Supabase data.
 * Gracefully handles missing tables by catching errors.
 *
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance
 * @returns Formatted context string for the AI
 */
async function buildUserContext(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  timezone: string
): Promise<string> {
  const sections: string[] = [];

  // Fetch user profile
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, daily_calorie_target, monthly_budget_goal, currency")
      .eq("id", userId)
      .single();

    if (profile) {
      sections.push(
        `User Profile:
- Name: ${profile.display_name || "Not set"}
- Daily Calorie Target: ${profile.daily_calorie_target || "Not set"} cal
- Monthly Budget Goal: ${profile.monthly_budget_goal || "Not set"} ${profile.currency || "MMK"}`
      );
    }
  } catch {
    // Profile might not exist yet
  }

  // Fetch recent transactions with category names
  try {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, amount, category_id, description, date, entry_source, categories(name)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(20);

    if (transactions && transactions.length > 0) {
      const totalExpenses = transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      // Aggregate spending by category
      const categoryTotals: Record<string, number> = {};
      transactions.forEach((t) => {
        const catData = t.categories as unknown as { name: string } | null;
        const cat = catData?.name || "other";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
      });

      const categoryBreakdown = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amount]) => `${cat}: ${amount}`)
        .join(", ");

      sections.push(
        `Finance Summary:
- Total Expenses: ${totalExpenses}
- Spending by Category: ${categoryBreakdown || "None"}

Recent Transactions (last 20):
${transactions
  .slice(0, 10)
  .map((t) => {
    const catData = t.categories as unknown as { name: string } | null;
    const cat = catData?.name || "other";
    return `- ${t.date}: ${cat} ${t.amount} ${t.description || ""}`;
  })
  .join("\n")}`
      );
    }
  } catch {
    // Transactions table might not exist or has different schema
  }

  // Fetch budgets with category names
  try {
    const { data: budgets } = await supabase
      .from("budgets")
      .select("id, monthly_limit, categories(name)")
      .eq("user_id", userId);

    if (budgets && budgets.length > 0) {
      sections.push(
        `Budgets:
${budgets
  .map((b) => {
    const catData = b.categories as unknown as { name: string } | null;
    const cat = catData?.name || "other";
    return `- ${cat}: ${b.monthly_limit} limit`;
  })
  .join("\n")}`
      );
    }
  } catch {
    // Budgets table might not exist or has different schema
  }

  // Fetch workouts summary (if table exists)
  try {
    const { data: workouts } = await supabase
      .from("workouts")
      .select(
        "exercise_type, exercise_name, sets, reps, weight, duration_min, calories, date"
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(15);

    if (workouts && workouts.length > 0) {
      const totalCalories = workouts.reduce(
        (sum, w) => sum + (w.calories || 0),
        0
      );
      const workoutCounts: Record<string, number> = {};
      workouts.forEach((w) => {
        const type = w.exercise_type || "other";
        workoutCounts[type] = (workoutCounts[type] || 0) + 1;
      });

      sections.push(
        `Workout Summary:
- Total Workouts: ${workouts.length}
- Total Calories Burned: ${totalCalories} cal
- Workout Types: ${Object.entries(workoutCounts)
          .map(([t, c]) => `${t}(${c})`)
          .join(", ")}

Recent Workouts:
${workouts
  .slice(0, 8)
  .map(
    (w) =>
      `- ${w.date}: ${w.exercise_name} (${w.exercise_type}) ${w.sets ? `${w.sets}x${w.reps} @ ${w.weight}kg` : ""} ${w.duration_min ? `${w.duration_min}min` : ""} ${w.calories ? `${w.calories}cal` : ""}`
  )
  .join("\n")}`
      );
    }
  } catch {
    // Workouts table doesn't exist yet
  }

  // Fetch pending tasks (if table exists)
  try {
    const { data: pendingTasks } = await supabase
      .from("tasks")
      .select("title, priority, status, due_date")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("due_date", { ascending: true })
      .limit(10);

    const { count: completedCount } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");

    if (pendingTasks && pendingTasks.length > 0) {
      sections.push(
        `Pending Tasks (${pendingTasks.length}):
${pendingTasks
  .map(
    (t) =>
      `- [${t.priority}] ${t.title} (due: ${t.due_date || "no date"})`
  )
  .join("\n")}

Completed Tasks: ${completedCount || 0}`
      );
    }
  } catch {
    // Tasks table doesn't exist yet
  }

  // Fetch active reminders (if table exists)
  try {
    const { data: reminders } = await supabase
      .from("reminders")
      .select("title, remind_at, repeat")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("remind_at", { ascending: true })
      .limit(10);

    if (reminders && reminders.length > 0) {
      sections.push(
        `Upcoming Reminders:
${reminders
  .map(
    (r) =>
      `- ${r.title} at ${r.remind_at} (repeat: ${r.repeat})`
  )
  .join("\n")}`
      );
    }
  } catch {
    // Reminders table doesn't exist yet
  }

  return sections.length > 0
    ? sections.join("\n\n")
    : "No data available yet. The user hasn't logged any transactions, workouts, tasks, or reminders.";
}

/**
 * Truncate context if it exceeds the character limit.
 * Preserves the beginning (profile) and truncates later sections.
 */
function truncateContext(context: string): string {
  if (context.length <= MAX_CONTEXT_CHARS) return context;
  return context.slice(0, MAX_CONTEXT_CHARS) + "\n\n[Context truncated due to size]";
}

/**
 * Truncate individual messages in history to prevent exceeding model limits.
 */
function truncateHistory(
  messages: { role: string; content: string }[]
): { role: string; content: string }[] {
  return messages.map((m) => ({
    ...m,
    content:
      m.content.length > MAX_HISTORY_MSG_CHARS
        ? m.content.slice(0, MAX_HISTORY_MSG_CHARS) + "..."
        : m.content,
  }));
}
