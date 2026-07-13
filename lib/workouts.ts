import { createClient } from "@/utils/supabase/client";
import type { Workout } from "@/types";

const supabase = createClient();

// ─── Local Timezone Helpers ──────────────────────────────────

/**
 * Get current time as ISO string in local timezone.
 * Avoids UTC offset issues (e.g., Myanmar UTC+6.30).
 */
export function getLocalISOString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  const offset = -now.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, "0");
  const offsetSign = offset >= 0 ? "+" : "-";
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

// ─── Calorie Estimation ──────────────────────────────────────

const BODY_WEIGHT_KG = 70; // assumed default

const MET_VALUES: Record<string, number> = {
  strength: 5.0,
  cardio: 8.0,
  flexibility: 3.0,
};

/**
 * Estimate calories burned for a single exercise entry.
 * Uses MET formula: calories = MET × weight_kg × duration_hours
 * For strength without duration, estimates from sets × reps × load.
 */
export function calculateCalories(workout: {
  exercise_type: string | null;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  duration_min: number | null;
  distance_km: number | null;
}): number {
  const { exercise_type, sets, reps, weight, duration_min, distance_km } = workout;

  // If duration is provided, use MET formula
  if (duration_min && duration_min > 0) {
    const met = MET_VALUES[exercise_type ?? "strength"] ?? 5.0;
    const hours = duration_min / 60;
    const weightKg = weight && weight > 0 ? weight : BODY_WEIGHT_KG;
    return Math.round(met * weightKg * hours);
  }

  // Cardio with distance: ~60-80 cal/km depending on type
  if (distance_km && distance_km > 0) {
    return Math.round(distance_km * (exercise_type === "cardio" ? 75 : 60));
  }

  // Strength without duration: estimate from volume
  if (sets && reps && sets > 0 && reps > 0) {
    const loadKg = weight && weight > 0 ? weight : BODY_WEIGHT_KG;
    // ~0.06 cal per kg per rep (rough estimate)
    return Math.round(sets * reps * loadKg * 0.06);
  }

  return 0;
}

function isTableMissing(error: { code?: string; message?: string }): boolean {
  // Empty error object (404 from Supabase REST) means the table doesn't exist
  if (!error.code && !error.message) return true;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" || // schema cache miss (table not found)
    error.message?.includes("does not exist") === true ||
    error.message?.includes("relation") === true ||
    error.message?.includes("Could not find the table") === true
  );
}

// ─── Workouts CRUD ─────────────────────────────────────────────

export async function getWorkouts(limit = 50): Promise<{
  data: Workout[];
  tableMissing: boolean;
}> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    if (isTableMissing(error)) return { data: [], tableMissing: true };
    console.error("Error fetching workouts:", error);
    return { data: [], tableMissing: false };
  }

  return { data: (data as Workout[]) ?? [], tableMissing: false };
}

export async function addWorkout(
  workout: Omit<Workout, "id" | "created_at">
): Promise<{ data: Workout | null; tableMissing: boolean }> {
  const { data, error } = await supabase
    .from("workouts")
    .insert(workout)
    .select()
    .single();

  if (error) {
    if (isTableMissing(error)) return { data: null, tableMissing: true };
    console.error("Error adding workout:", error);
    return { data: null, tableMissing: false };
  }

  return { data: data as Workout, tableMissing: false };
}

export async function deleteWorkout(id: number): Promise<boolean> {
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) {
    console.error("Error deleting workout:", error);
    return false;
  }
  return true;
}

// ─── Stats ─────────────────────────────────────────────────────

export async function getWorkoutStats(): Promise<{
  totalWorkouts: number;
  totalCalories: number;
  totalMinutes: number;
  thisWeek: number;
}> {
  const { data, error } = await supabase.from("workouts").select("*");

  if (error || !data) return { totalWorkouts: 0, totalCalories: 0, totalMinutes: 0, thisWeek: 0 };

  const workouts = data as Workout[];
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return {
    totalWorkouts: workouts.length,
    totalCalories: workouts.reduce((sum, w) => sum + (w.calories ?? calculateCalories(w)), 0),
    totalMinutes: workouts.reduce((sum, w) => sum + (w.duration_min ?? 0), 0),
    thisWeek: workouts.filter((w) => new Date(w.date) >= weekAgo).length,
  };
}

// ─── AI Suggestions (based on history) ─────────────────────────

export async function getExerciseHistory(exerciseName: string): Promise<{
  lastWeight: number | null;
  lastReps: number | null;
  lastSets: number | null;
  averageWeight: number;
  progression: "up" | "same" | "down" | "new";
}> {
  const { data, error } = await supabase
    .from("workouts")
    .select("weight, reps, sets")
    .eq("exercise_name", exerciseName)
    .order("date", { ascending: false })
    .limit(5);

  if (error || !data || data.length === 0) {
    return { lastWeight: null, lastReps: null, lastSets: null, averageWeight: 0, progression: "new" };
  }

  const recent = data as Pick<Workout, "weight" | "reps" | "sets">[];
  const last = recent[0];
  const avgWeight = recent.reduce((sum, r) => sum + (r.weight ?? 0), 0) / recent.length;

  let progression: "up" | "same" | "down" | "new" = "same";
  if (recent.length >= 2) {
    const prev = recent[1].weight ?? 0;
    const curr = last.weight ?? 0;
    if (curr > prev) progression = "up";
    else if (curr < prev) progression = "down";
  }

  return {
    lastWeight: last.weight,
    lastReps: last.reps,
    lastSets: last.sets,
    averageWeight: avgWeight,
    progression,
  };
}

// ─── Muscle Group Coverage ─────────────────────────────────────

export interface MuscleGroupData {
  percentage: number;
  exercises: string[];
}

export function getMuscleGroupCoverage(workouts: Workout[]): Record<string, MuscleGroupData> {
  const muscleMap: Record<string, string[]> = {
    chest: ["bench press", "push up", "chest fly", "dumbbell press", "cable fly", "chest"],
    back: ["pull up", "row", "lat pulldown", "deadlift", "barbell row", "back"],
    shoulders: ["overhead press", "lateral raise", "front raise", "shoulder press", "shoulder"],
    legs: ["squat", "lunges", "leg press", "leg curl", "leg extension", "calf raise", "leg", "thigh"],
    arms: ["bicep curl", "tricep extension", "hammer curl", "tricep pushdown", "arm"],
    core: ["plank", "crunch", "russian twist", "leg raise", "ab roll", "core", "abs"],
    cardio: ["running", "cycling", "swimming", "jumping rope", "walking", "treadmill", "cardio"],
  };

  const coverage: Record<string, MuscleGroupData> = {};
  const recentWorkouts = workouts.slice(0, 20);

  for (const [group, keywords] of Object.entries(muscleMap)) {
    const matched = recentWorkouts.filter((w) =>
      keywords.some((k) => w.exercise_name.toLowerCase().includes(k))
    );
    const uniqueExercises = [...new Set(matched.map((w) => w.exercise_name))];
    coverage[group] = {
      percentage: Math.min(100, (matched.length / 5) * 100),
      exercises: uniqueExercises.slice(0, 5),
    };
  }

  return coverage;
}
