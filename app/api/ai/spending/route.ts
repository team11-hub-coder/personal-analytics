import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  checkRateLimit,
  recordUsage,
  getUserTimezone,
  DAILY_LIMIT,
  HOURLY_LIMIT,
} from "@/lib/rateLimit";

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

    // Rate limit check
    const userTimezone = await getUserTimezone(user.id, supabase);
    const rateLimitResult = await checkRateLimit(user.id, supabase, userTimezone);
    if (!rateLimitResult.allowed) {
      return Response.json(
        {
          error: rateLimitResult.error,
          usage: {
            daily: { used: rateLimitResult.dailyUsed, limit: DAILY_LIMIT },
            hourly: { used: rateLimitResult.hourlyUsed, limit: HOURLY_LIMIT },
          },
        },
        { status: 429 }
      );
    }

    // Fetch recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [transactionsRes, budgetsRes, profileRes] = await Promise.allSettled([
      supabase.from("transactions")
        .select("amount, category_id, description, date, categories(name)")
        .eq("user_id", user.id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false }),
      supabase.from("budgets")
        .select("monthly_limit, categories(name)")
        .eq("user_id", user.id),
      supabase.from("profiles")
        .select("monthly_budget_goal, currency")
        .eq("id", user.id)
        .single(),
    ]);

    const transactions = transactionsRes.status === "fulfilled" ? transactionsRes.value.data : [];
    const budgets = budgetsRes.status === "fulfilled" ? budgetsRes.value.data : [];
    const profile = profileRes.status === "fulfilled" ? profileRes.value.data : null;

    // Aggregate by category
    const categoryTotals: Record<string, number> = {};
    transactions?.forEach(t => {
      const catData = t.categories as unknown as { name: string } | null;
      const cat = catData?.name || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
    });

    const totalSpent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const dailyAvg = totalSpent / 30;

    // Find top spending days
    const dailyTotals: Record<string, number> = {};
    transactions?.forEach(t => {
      const day = t.date.split("T")[0];
      dailyTotals[day] = (dailyTotals[day] || 0) + Number(t.amount);
    });
    const topDay = Object.entries(dailyTotals).sort(([,a], [,b]) => b - a)[0];

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a personal finance analyst. Analyze spending patterns and provide actionable insights.

RULES:
1. Return ONLY valid JSON — no markdown wrapping
2. Be specific with numbers and percentages
3. Identify trends, not just facts
4. Give 2-3 actionable suggestions
5. Compare against budget if available
6. Keep insights concise (3-5 bullet points max)

Return format (JSON only):
{
  "insights": [
    {
      "type": "trend" | "warning" | "tip" | "achievement",
      "title": "Short title",
      "detail": "1-2 sentence explanation with specific numbers",
      "icon": "single emoji"
    }
  ],
  "topCategory": "category name",
  "topCategoryAmount": <number>,
  "budgetStatus": "under" | "over" | "on_track" | "no_budget",
  "monthProjection": <estimated monthly spend based on daily avg>
}`,
    });

    const budgetInfo = budgets?.length
      ? budgets.map(b => {
          const catData = b.categories as unknown as { name: string } | null;
          return `${catData?.name || "Other"}: ${b.monthly_limit} limit`;
        }).join(", ")
      : "No budgets set";

    const result = await model.generateContent(`Analyze this spending data for the last 30 days.

Total Spent: ${totalSpent} ${profile?.currency || "MMK"}
Daily Average: ${dailyAvg.toFixed(2)}
Monthly Budget Goal: ${profile?.monthly_budget_goal ? `${profile.monthly_budget_goal} ${profile.currency || "MMK"}` : "Not set"}
Budgets: ${budgetInfo}

Spending by Category:
${Object.entries(categoryTotals).sort(([,a], [,b]) => b - a).map(([cat, amount]) => `- ${cat}: ${amount}`).join("\n") || "No transactions"}

Top Spending Day: ${topDay ? `${topDay[0]} (${topDay[1]})` : "N/A"}

Recent Transactions (${transactions?.length || 0} total):
${transactions?.slice(0, 15).map(t => {
  const catData = t.categories as unknown as { name: string } | null;
  return `- ${t.date}: ${catData?.name || "other"} ${t.amount} ${t.description || ""}`;
}).join("\n") || "None"}

Generate spending insights as JSON only.`);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return Response.json({ error: "Failed to generate insights" }, { status: 500 });
    }

    const insights = JSON.parse(jsonMatch[0]);

    // Record usage for cost tracking
    await recordUsage(user.id, "spending-insights", responseText, supabase, "gemini-3-flash-preview");

    return Response.json({
      insights: insights.insights || [],
      topCategory: insights.topCategory || "",
      topCategoryAmount: insights.topCategoryAmount || 0,
      budgetStatus: insights.budgetStatus || "no_budget",
      monthProjection: insights.monthProjection || 0,
      totalSpent,
      currency: profile?.currency || "MMK",
    });
  } catch (error) {
    console.error("AI Spending error:", error);
    return Response.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
