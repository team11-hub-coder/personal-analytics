import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { checkRateLimit, recordUsage } from "@/lib/rateLimit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const workoutRequestSchema = z.object({
  muscleGroup: z.string().min(1),
  duration: z.number().min(5).max(120).optional().default(30),
  equipment: z.array(z.string()).optional().default([]),
  goal: z.enum(["strength", "endurance", "flexibility", "general"]).optional().default("general"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = workoutRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

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

    // Fetch user's workout history for context
    const { data: recentWorkouts } = await supabase
      .from("workouts")
      .select("exercise_name, exercise_type, sets, reps, weight, duration_min, calories, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(20);

    // Fetch profile for calorie target
    const { data: profile } = await supabase
      .from("profiles")
      .select("daily_calorie_target")
      .eq("id", user.id)
      .single();

    const { muscleGroup, duration, equipment, goal } = validationResult.data;

    const workoutHistory = recentWorkouts?.length
      ? recentWorkouts.map(w =>
          `- ${w.exercise_name} (${w.exercise_type}) ${w.sets}x${w.reps} @ ${w.weight || 0}kg, ${w.duration_min || 0}min, ${w.calories || 0}cal`
        ).join("\n")
      : "No workout history yet";

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional fitness trainer. Generate personalized workout plans based on the user's history, goals, and preferences.

RULES:
1. Return ONLY valid JSON — no markdown, no explanation before/after
2. Generate 4-6 exercises per workout
3. Include realistic sets, reps, and rest times
4. Consider the user's workout history to avoid repeating the same exercises
5. Adjust intensity based on available time
6. Include warm-up appropriate exercises
7. Estimate calories burned per exercise (realistic, not inflated)

Return format (JSON only):
{
  "title": "Workout Name",
  "duration": <actual duration in minutes>,
  "exercises": [
    {
      "name": "Exercise Name",
      "type": "strength" | "cardio" | "flexibility",
      "sets": <number>,
      "reps": <number or null for timed exercises>,
      "weight": null,
      "duration_min": <number or null for rep-based>,
      "rest_seconds": <number>,
      "muscle_group": "<group>",
      "calories": <estimated calories>,
      "tip": "Brief form tip"
    }
  ],
  "summary": "Brief encouraging summary of the workout"
}`,
    });

    const result = await model.generateContent(`Generate a ${duration}-minute ${goal} workout targeting ${muscleGroup}.

Available equipment: ${equipment.length > 0 ? equipment.join(", ") : "Bodyweight only"}

Calorie target context: ${profile?.daily_calorie_target ? `${profile.daily_calorie_target} kcal/day` : "Not set"}

Recent workout history (avoid repetition):
${workoutHistory}

Generate the workout plan as JSON only.`);

    const responseText = result.response.text();

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "Failed to generate workout" }, { status: 500 });
    }

    const workout = JSON.parse(jsonMatch[0]);

    // Record usage
    await recordUsage(user.id, `workout: ${validationResult.data.muscleGroup}`, responseText, supabase, "gemini-3-flash-preview");

    return Response.json({ workout });
  } catch (error) {
    console.error("AI Workout error:", error);
    return Response.json({ error: "Failed to generate workout" }, { status: 500 });
  }
}
