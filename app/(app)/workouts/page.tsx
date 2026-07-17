"use client";

import { useCallback, useState, useMemo } from "react";
import { useUser } from "@/hooks/useAuth";
import { addWorkout, calculateCalories, getLocalISOString } from "@/lib/workouts";
import { useGenerateWorkout } from "@/hooks/useAI";
import { useProfile } from "@/hooks/useProfile";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useUIStore } from "@/store/ui";
import WorkoutStats from "@/components/workouts/WorkoutStats";
import WorkoutHistory from "@/components/workouts/WorkoutHistory";
import CameraWorkout from "@/components/workouts/CameraWorkout";
import QuickLogOverlay, { type QuickLogData } from "@/components/workouts/QuickLogOverlay";
import ExerciseCategories from "@/components/workouts/ExerciseCategories";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { GeneratedWorkout, WorkoutExercise } from "@/types";
import type { ExerciseType } from "@/lib/poseDetection";
import { Plus, Sparkles, Camera, CameraOff, X, ArrowLeft, Loader2, Dumbbell, Target, Zap, Clock, Flame, ArrowUp, Activity, Heart, Footprints, CircleDot } from "lucide-react";

const muscleGroupOptions = [
  { id: "chest", label: "Chest", icon: "chest" },
  { id: "back", label: "Back", icon: "back" },
  { id: "shoulders", label: "Shoulders", icon: "shoulders" },
  { id: "arms", label: "Arms", icon: "arms" },
  { id: "legs", label: "Legs", icon: "legs" },
  { id: "core", label: "Core", icon: "core" },
  { id: "cardio", label: "Cardio", icon: "cardio" },
  { id: "full-body", label: "Full Body", icon: "fullBody" },
] as const;

const muscleGroupIcons: Record<string, React.ReactNode> = {
  chest: <Dumbbell size={20} />,
  back: <ArrowUp size={20} />,
  shoulders: <Activity size={20} />,
  arms: <Dumbbell size={20} />,
  legs: <Footprints size={20} />,
  core: <CircleDot size={20} />,
  cardio: <Heart size={20} />,
  fullBody: <Zap size={20} />,
};

const workoutTemplates: Record<string, GeneratedWorkout> = {
  chest: {
    title: "Chest Day",
    duration: 30,
    exercises: [
      { name: "Bench Press", type: "strength", sets: 4, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "chest" },
      { name: "Incline Dumbbell Press", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "chest" },
      { name: "Cable Fly", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "chest" },
      { name: "Push-ups", type: "strength", sets: 3, reps: 15, weight: null, duration_min: null, rest_seconds: 45, muscle_group: "chest" },
    ],
  },
  back: {
    title: "Back Day",
    duration: 35,
    exercises: [
      { name: "Deadlift", type: "strength", sets: 4, reps: 8, weight: null, duration_min: null, rest_seconds: 120, muscle_group: "back" },
      { name: "Pull-ups", type: "strength", sets: 4, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "back" },
      { name: "Barbell Row", type: "strength", sets: 4, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "back" },
      { name: "Lat Pulldown", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "back" },
    ],
  },
  shoulders: {
    title: "Shoulder Day",
    duration: 30,
    exercises: [
      { name: "Overhead Press", type: "strength", sets: 4, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "shoulders" },
      { name: "Lateral Raise", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "shoulders" },
      { name: "Front Raise", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "shoulders" },
      { name: "Face Pull", type: "strength", sets: 3, reps: 15, weight: null, duration_min: null, rest_seconds: 45, muscle_group: "shoulders" },
    ],
  },
  arms: {
    title: "Arm Day",
    duration: 30,
    exercises: [
      { name: "Bicep Curls", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "arms" },
      { name: "Tricep Extensions", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "arms" },
      { name: "Hammer Curls", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 45, muscle_group: "arms" },
      { name: "Tricep Dips", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 45, muscle_group: "arms" },
    ],
  },
  legs: {
    title: "Leg Day",
    duration: 40,
    exercises: [
      { name: "Squat", type: "strength", sets: 4, reps: 8, weight: null, duration_min: null, rest_seconds: 120, muscle_group: "legs" },
      { name: "Romanian Deadlift", type: "strength", sets: 3, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "legs" },
      { name: "Leg Press", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "legs" },
      { name: "Walking Lunges", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "legs" },
      { name: "Calf Raises", type: "strength", sets: 4, reps: 15, weight: null, duration_min: null, rest_seconds: 45, muscle_group: "legs" },
    ],
  },
  core: {
    title: "Core Crusher",
    duration: 25,
    exercises: [
      { name: "Plank", type: "strength", sets: 3, reps: null, weight: null, duration_min: 1, rest_seconds: 30, muscle_group: "core" },
      { name: "Russian Twists", type: "strength", sets: 3, reps: 20, weight: null, duration_min: null, rest_seconds: 30, muscle_group: "core" },
      { name: "Leg Raises", type: "strength", sets: 3, reps: 15, weight: null, duration_min: null, rest_seconds: 30, muscle_group: "core" },
      { name: "Bicycle Crunches", type: "strength", sets: 3, reps: 20, weight: null, duration_min: null, rest_seconds: 30, muscle_group: "core" },
    ],
  },
  cardio: {
    title: "Cardio Blast",
    duration: 30,
    exercises: [
      { name: "Jumping Jacks", type: "cardio", sets: 3, reps: null, weight: null, duration_min: 2, rest_seconds: 30, muscle_group: "cardio" },
      { name: "Burpees", type: "cardio", sets: 3, reps: 10, weight: null, duration_min: null, rest_seconds: 45, muscle_group: "cardio" },
      { name: "Mountain Climbers", type: "cardio", sets: 3, reps: null, weight: null, duration_min: 1, rest_seconds: 30, muscle_group: "cardio" },
      { name: "High Knees", type: "cardio", sets: 3, reps: null, weight: null, duration_min: 1, rest_seconds: 30, muscle_group: "cardio" },
    ],
  },
  "full-body": {
    title: "Full Body Power",
    duration: 45,
    exercises: [
      { name: "Squat", type: "strength", sets: 4, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "legs" },
      { name: "Bench Press", type: "strength", sets: 4, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "chest" },
      { name: "Barbell Row", type: "strength", sets: 4, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "back" },
      { name: "Overhead Press", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "shoulders" },
      { name: "Plank", type: "strength", sets: 3, reps: null, weight: null, duration_min: 1, rest_seconds: 30, muscle_group: "core" },
    ],
  },
};

export default function WorkoutsPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const { cameraEnabled, toggleCamera } = useUIStore();
  const [currentExercise, setCurrentExercise] = useState("");
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiStep, setAiStep] = useState<"pick" | "preview">("pick");
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [generating, setGenerating] = useState(false);
  const [formCheckOpen, setFormCheckOpen] = useState(false);
  const [formCheckExercise, setFormCheckExercise] = useState<ExerciseType | "">("");
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // ─── Quick Log ───────────────────────────────────────
  const handleQuickLog = useCallback(
    async (data: QuickLogData) => {
      if (!user) return;
      const exerciseType = data.duration_min ? "cardio" : "strength";
      // Auto-calculate calories if not provided
      const calories = data.calories ?? calculateCalories({
        exercise_type: exerciseType,
        sets: data.sets,
        reps: data.reps,
        weight: data.weight,
        duration_min: data.duration_min,
        distance_km: data.distance_km,
      });
      await addWorkout({
        user_id: user.id,
        exercise_type: exerciseType,
        exercise_name: data.exerciseName,
        sets: data.sets,
        reps: data.reps,
        weight: data.weight,
        duration_min: data.duration_min,
        distance_km: data.distance_km,
        calories,
        notes: `${data.category}${data.notes ? ` - ${data.notes}` : ""}`,
        date: data.date || getLocalISOString(),
      });
      triggerRefresh();
    },
    [user]
  );

  // ─── AI Generate ─────────────────────────────────────
  const generateWorkout = useGenerateWorkout();

  const handleMusclePick = async (muscleId: string) => {
    setSelectedMuscle(muscleId);
    setGenerating(true);
    setAiStep("preview");
    try {
      const result = await generateWorkout.mutateAsync({ muscleGroup: muscleId, duration: 30 });
      setGeneratedWorkout(result as unknown as GeneratedWorkout);
    } catch {
      // Fallback to template on error
      setGeneratedWorkout(workoutTemplates[muscleId] ?? workoutTemplates["full-body"]);
    } finally {
      setGenerating(false);
    }
  };

  const closeAI = () => {
    setAiOpen(false);
    setAiStep("pick");
    setSelectedMuscle("");
    setGeneratedWorkout(null);
    setGenerating(false);
  };

  const handleLogFromAI = useCallback(async () => {
    if (!user || !generatedWorkout) return;
    for (const ex of generatedWorkout.exercises) {
      // Use AI-estimated calories if available, otherwise calculate
      const calories = (ex as unknown as Record<string, unknown>).calories as number
        || calculateCalories({
            exercise_type: ex.type,
            sets: ex.sets,
            reps: ex.reps,
            weight: null,
            duration_min: ex.duration_min,
            distance_km: null,
          });
      await addWorkout({
        user_id: user.id,
        exercise_type: ex.type,
        exercise_name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: null,
        duration_min: ex.duration_min,
        distance_km: null,
        calories,
        notes: `AI Generated - ${generatedWorkout.title}`,
        date: getLocalISOString(),
      });
    }
    closeAI();
    triggerRefresh();
  }, [user, generatedWorkout]);

  // ─── Form Check ──────────────────────────────────────
  const mapExerciseToType = (name: string): ExerciseType => {
    const lower = name.toLowerCase();
    if (lower.includes("push")) return "pushups";
    return "squats";
  };

  const handleFormCheckExercise = (exercise: string) => {
    const type = mapExerciseToType(exercise);
    setFormCheckExercise(type);
    setCurrentExercise(exercise);
    setFormCheckOpen(false);
    if (!cameraEnabled) toggleCamera();
  };

  const handleSaveFormCheck = useCallback(
    async (reps: number, exType: ExerciseType, durationSec: number) => {
      if (!user || reps === 0) return;
      const durationMin = Math.max(1, Math.round(durationSec / 60));
      const exerciseName = exType === "squats" ? "Squats" : "Push-ups";
      const calories = calculateCalories({
        exercise_type: "strength",
        sets: 1,
        reps,
        weight: null,
        duration_min: durationMin,
        distance_km: null,
      });
      await addWorkout({
        user_id: user.id,
        exercise_type: "strength",
        exercise_name: exerciseName,
        sets: 1,
        reps: reps,
        weight: null,
        duration_min: durationMin,
        distance_km: null,
        calories,
        notes: "Form Check - Camera",
        date: getLocalISOString(),
      });
      toggleCamera();
      setFormCheckExercise("");
      triggerRefresh();
    },
    [user, toggleCamera]
  );

  const closeFormCheck = () => {
    setFormCheckOpen(false);
    setFormCheckExercise("");
  };

  if (userLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-(--color-surface) rounded-xl p-4 shadow-sm border border-(--color-border)">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Workout history skeleton */}
        <div className="bg-(--color-surface) rounded-xl p-5 shadow-sm border border-(--color-border)">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-(--color-text)">Workout Tracker</h1>
          <p className="text-(--color-text-secondary)">Log workouts and track your fitness progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuickLogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-(--color-primary) hover:bg-(--color-primary-hover) text-white transition-colors"
          >
            <Plus size={16} />
            Add Workout
          </button>
          <button
            onClick={() => { setAiOpen(true); setAiStep("pick"); setGeneratedWorkout(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aiOpen ? "bg-(--color-primary) text-white" : "bg-(--color-surface-hover) text-(--color-text-secondary)"}`}
          >
            <Sparkles size={16} />
            AI Generate
          </button>
          <button
            onClick={() => setFormCheckOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${cameraEnabled ? "bg-emerald-500 text-white" : "bg-(--color-surface-hover) text-(--color-text-secondary)"}`}
          >
            {cameraEnabled ? <CameraOff size={16} /> : <Camera size={16} />}
            Form Check
          </button>
        </div>
      </div>

      {/* Stats */}
      <WorkoutStats />

      {/* Daily Calorie Progress */}
      <CalorieProgress refreshKey={refreshKey} />

      {/* Workout History */}
      <WorkoutHistory refreshKey={refreshKey} />

      {/* Camera Form Check */}
      <CameraWorkout
        key={formCheckExercise || "default"}
        enabled={cameraEnabled}
        exerciseType={(formCheckExercise as ExerciseType) || "squats"}
        onRepCount={(count) => console.log("Reps:", count)}
        onSave={handleSaveFormCheck}
        onClose={toggleCamera}
      />

      {/* Quick Log Overlay */}
      <QuickLogOverlay
        open={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        onSave={handleQuickLog}
      />

      {/* AI Generate Overlay */}
      {aiOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60" onClick={closeAI} />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto shadow-2xl bg-(--color-bg)"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-(--color-border) bg-(--color-bg)">
              <div className="flex items-center gap-2">
                {aiStep === "preview" && (
                  <button onClick={() => { setAiStep("pick"); setGeneratedWorkout(null); setGenerating(false); }} className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)]">
                    <ArrowLeft size={20} className="text-(--color-text-secondary)" />
                  </button>
                )}
                <h2 className="text-base font-bold text-(--color-text)">
                  {aiStep === "pick" ? "AI Workout Generator" : generatedWorkout?.title ?? "Generating..."}
                </h2>
              </div>
              <button onClick={closeAI} className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)]">
                <X size={20} className="text-(--color-text-secondary)" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {aiStep === "pick" ? (
                /* Step 1: Pick muscle group */
                <div className="space-y-4">
                  <p className="text-sm text-(--color-text-secondary)">
                    Choose a muscle group to target
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {muscleGroupOptions.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleMusclePick(m.id)}
                        className="flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.02] bg-(--color-surface-hover) border border-(--color-border)"
                      >
                        <span className="text-(--color-text-secondary)">{muscleGroupIcons[m.icon]}</span>
                        <span className="text-sm font-medium text-(--color-text)">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : generating ? (
                /* Generating state */
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 size={40} className="animate-spin text-(--color-primary)" />
                  <p className="text-sm text-(--color-text-secondary)">Generating your workout...</p>
                </div>
              ) : generatedWorkout ? (
                /* Step 2: Preview & log */
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-(--color-text-secondary)">
                    <span className="flex items-center gap-1"><Clock size={14} /> {generatedWorkout.duration} min</span>
                    <span className="flex items-center gap-1"><Dumbbell size={14} /> {generatedWorkout.exercises.length} exercises</span>
                  </div>
                  {(generatedWorkout as unknown as { summary?: string }).summary && (
                    <p className="text-xs p-3 rounded-lg bg-(--color-surface-hover) text-(--color-text-secondary)">
                      {(generatedWorkout as unknown as { summary: string }).summary}
                    </p>
                  )}
                  <div className="space-y-2">
                    {generatedWorkout.exercises.map((ex, i) => {
                      const exMeta = ex as unknown as Record<string, unknown>;
                      const calories = exMeta.calories as number | undefined;
                      const tip = exMeta.tip as string | undefined;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg bg-(--color-surface-hover)"
                        >
                          <div>
                            <p className="text-sm font-medium text-(--color-text)">{ex.name}</p>
                            <p className="text-xs text-(--color-text-muted)">
                              {ex.muscle_group}{calories ? ` · ${calories} cal` : ""}
                            </p>
                            {tip && <p className="text-xs mt-0.5 text-(--color-text-muted)">{tip}</p>}
                          </div>
                          <div className="text-right text-sm text-(--color-text-secondary)">
                            {ex.sets}×{ex.reps ?? `${ex.duration_min}min`}
                            {ex.rest_seconds ? ` (${ex.rest_seconds}s rest)` : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    onClick={handleLogFromAI}
                    className="w-full bg-(--color-primary) hover:bg-(--color-primary-hover) text-white"
                  >
                    Log This Workout
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Form Check Overlay */}
      {formCheckOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60" onClick={closeFormCheck} />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto shadow-2xl bg-(--color-bg)"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-(--color-border) bg-(--color-bg)">
              <h2 className="text-base font-bold text-(--color-text)">Form Check</h2>
              <button onClick={closeFormCheck} className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)]">
                <X size={20} className="text-(--color-text-secondary)" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm mb-4 text-(--color-text-secondary)">
                Pick an exercise to check your form
              </p>
              <ExerciseCategories
                onSelect={(exercise) => handleFormCheckExercise(exercise)}
                filterIds={["gym", "home"]}
                filterExercises={["squat", "push"]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Daily Calorie Progress Component ────────────────────────

function CalorieProgress({ refreshKey }: { refreshKey: number }) {
  const { data: profile } = useProfile();
  const { data: workoutResult } = useWorkouts(100);
  const target = profile?.daily_calorie_target ?? 0;

  // Calculate today's burned calories
  const todayBurned = useMemo(() => {
    const workouts = workoutResult?.data ?? [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    return workouts
      .filter((w) => {
        const wDate = w.date.split("T")[0];
        return wDate === todayStr;
      })
      .reduce((sum, w) => sum + (w.calories ?? calculateCalories(w)), 0);
  }, [workoutResult, refreshKey]);

  if (!target || target <= 0) return null;

  const progress = Math.min(100, Math.round((todayBurned / target) * 100));
  const remaining = Math.max(0, target - todayBurned);

  return (
    <div className="bg-(--color-surface) rounded-xl p-5 shadow-sm border border-(--color-border)">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <Flame size={16} className="text-orange-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-(--color-text)">
              Daily Calorie Goal
            </h3>
            <p className="text-xs text-(--color-text-muted)">
              {todayBurned} / {target} kcal
            </p>
          </div>
        </div>
        <span className={`text-base font-bold ${progress >= 100 ? "text-emerald-500" : "text-amber-500"}`}>
          {progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 rounded-full bg-(--color-surface-hover)">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-(--color-text-muted)">
          {todayBurned} burned
        </span>
        <span className="text-xs text-(--color-text-muted)">
          {remaining > 0 ? `${remaining} remaining` : "Goal reached!"}
        </span>
      </div>
    </div>
  );
}
