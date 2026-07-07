import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Build context from user's data
    const context = await buildUserContext(user.id, supabase);

    // Call Claude API using SDK
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5-20250514",
      max_tokens: 1024,
      system: `You are a helpful personal analytics assistant. You help users understand their finances, workouts, tasks, and reminders. Be concise and actionable.

User's current data:
${context}`,
      messages: messages.map(
        (m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })
      ),
    });

    const assistantMessage =
      response.content[0].type === "text"
        ? response.content[0].text
        : "No response generated.";

    return Response.json({ message: assistantMessage });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function buildUserContext(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  const sections: string[] = [];

  // Get recent transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount, category, description, date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(10);

  if (transactions && transactions.length > 0) {
    sections.push(
      `Recent Transactions:\n${transactions
        .map(
          (t) =>
            `- ${t.date}: ${t.type} $${t.amount} (${t.category}) ${t.description || ""}`
        )
        .join("\n")}`
    );
  }

  // Get recent workouts
  const { data: workouts } = await supabase
    .from("workouts")
    .select("exercise_type, exercise_name, duration_min, calories, date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(10);

  if (workouts && workouts.length > 0) {
    sections.push(
      `Recent Workouts:\n${workouts
        .map(
          (w) =>
            `- ${w.date}: ${w.exercise_name} (${w.exercise_type}) ${w.duration_min}min ${w.calories}cal`
        )
        .join("\n")}`
    );
  }

  // Get pending tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("title, priority, status, due_date")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .limit(10);

  if (tasks && tasks.length > 0) {
    sections.push(
      `Pending Tasks:\n${tasks
        .map(
          (t) =>
            `- [${t.priority}] ${t.title} (due: ${t.due_date || "no date"})`
        )
        .join("\n")}`
    );
  }

  // Get upcoming reminders
  const { data: reminders } = await supabase
    .from("reminders")
    .select("title, remind_at, repeat")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("remind_at", { ascending: true })
    .limit(5);

  if (reminders && reminders.length > 0) {
    sections.push(
      `Upcoming Reminders:\n${reminders
        .map(
          (r) =>
            `- ${r.title} at ${r.remind_at} (repeat: ${r.repeat})`
        )
        .join("\n")}`
    );
  }

  return sections.length > 0
    ? sections.join("\n\n")
    : "No data available yet. The user hasn't logged any transactions, workouts, tasks, or reminders.";
}
