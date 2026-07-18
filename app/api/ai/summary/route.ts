import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit, recordUsage } from "@/lib/rateLimit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "AI service unavailable" }, { status: 500 });
    }

    // Check rate limits
    let userTimezone = "UTC";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("timezone")
        .eq("id", user.id)
        .single();
      if (profile?.timezone) userTimezone = profile.timezone;
    } catch { /* fallback to UTC */ }

    const rateLimit = await checkRateLimit(user.id, supabase, userTimezone);
    if (!rateLimit.allowed) {
      return Response.json({ error: rateLimit.error }, { status: 429 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Fetch today's data across all modules + user profile for currency
    const [workoutsRes, tasksRes, focusRes, transactionsRes, remindersRes, profileRes] = await Promise.allSettled([
      supabase.from("workouts")
        .select("exercise_name, exercise_type, calories, duration_min, date")
        .eq("user_id", user.id)
        .gte("date", todayISO),
      supabase.from("tasks")
        .select("title, priority, status, due_date")
        .eq("user_id", user.id),
      supabase.from("focus_sessions")
        .select("title, duration_minutes, completed, started_at")
        .eq("user_id", user.id)
        .gte("started_at", todayISO),
      supabase.from("transactions")
        .select("amount, category_id, description, date, categories(name)")
        .eq("user_id", user.id)
        .gte("date", todayISO.split("T")[0]),
      supabase.from("reminders")
        .select("title, remind_at, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("remind_at", { ascending: true })
        .limit(5),
      supabase.from("profiles")
        .select("currency")
        .eq("id", user.id)
        .single(),
    ]);

    const workouts = workoutsRes.status === "fulfilled" ? workoutsRes.value.data : [];
    const tasks = tasksRes.status === "fulfilled" ? tasksRes.value.data : [];
    const focus = focusRes.status === "fulfilled" ? focusRes.value.data : [];
    const transactions = transactionsRes.status === "fulfilled" ? transactionsRes.value.data : [];
    const reminders = remindersRes.status === "fulfilled" ? remindersRes.value.data : [];
    const profile = profileRes.status === "fulfilled" ? profileRes.value.data : null;
    const currency = profile?.currency || "MMK";

    // Calculate stats
    const completedTasks = tasks?.filter(t => t.status === "completed") || [];
    const pendingTasks = tasks?.filter(t => t.status === "pending") || [];
    const totalCalories = workouts?.reduce((sum, w) => sum + (w.calories || 0), 0) || 0;
    const totalFocusMin = focus?.reduce((sum, f) => sum + (f.completed ? f.duration_minutes : 0), 0) || 0;
    const totalSpent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a personal analytics assistant generating a daily summary. Be concise, motivating, and data-driven.

RULES:
1. Return ONLY valid JSON — no markdown wrapping
2. Keep the summary to 3-5 sentences max
3. Highlight achievements and areas for improvement
4. Be encouraging but honest
5. Reference specific numbers from the data

Return format (JSON only):
{
  "summary": "2-3 sentence overall summary",
  "highlights": ["achievement 1", "achievement 2"],
  "suggestion": "One actionable suggestion for tomorrow",
  "emoji": "single emoji representing the day"
}`,
    });

    const result = await model.generateContent(`Generate a daily summary for today.

Today's Data:
- Workouts: ${workouts?.length || 0} (${totalCalories} cal burned)
${workouts?.map(w => `  - ${w.exercise_name} (${w.exercise_type})`).join("\n") || "  None"}
- Tasks: ${completedTasks.length} completed, ${pendingTasks.length} pending
${completedTasks.map(t => `  ✓ ${t.title}`).join("\n") || ""}
- Focus Time: ${totalFocusMin} minutes
- Spending: ${totalSpent} ${currency}
${transactions?.map(t => {
  const catData = t.categories as unknown as { name: string } | null;
  return `  - ${catData?.name || "other"}: ${t.amount} ${currency}`;
}).join("\n") || ""}
- Upcoming Reminders: ${reminders?.length || 0}
${reminders?.map(r => `  - ${r.title}`).join("\n") || ""}

Generate the daily summary as JSON only.`);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return Response.json({ error: "Failed to generate summary" }, { status: 500 });
    }

    const summary = JSON.parse(jsonMatch[0]);

    // Record usage
    await recordUsage(user.id, "daily summary", responseText, supabase, "gemini-3-flash-preview");

    return Response.json({
      summary: summary.summary,
      highlights: summary.highlights || [],
      suggestion: summary.suggestion || "",
      emoji: summary.emoji || "📊",
      stats: {
        workouts: workouts?.length || 0,
        calories: totalCalories,
        tasksCompleted: completedTasks.length,
        tasksPending: pendingTasks.length,
        focusMinutes: totalFocusMin,
        spent: totalSpent,
        currency,
      },
    });
  } catch (error) {
    console.error("AI Summary error:", error);
    return Response.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
