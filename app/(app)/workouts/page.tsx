"use client";

import { useCallback, useState } from "react";
import { useUser } from "@/hooks/useAuth";
import { addWorkout, calculateCalories } from "@/lib/workouts";
import { useUIStore } from "@/store/ui";
import WorkoutStats from "@/components/workouts/WorkoutStats";
import WorkoutHistory from "@/components/workouts/WorkoutHistory";
import CameraWorkout from "@/components/workouts/CameraWorkout";
import QuickLogOverlay from "@/components/workouts/QuickLogOverlay";
import ExerciseCategories from "@/components/workouts/ExerciseCategories";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { GeneratedWorkout, WorkoutExercise } from "@/types";
import type { ExerciseType } from "@/lib/poseDetection";
import { Plus, Sparkles, Camera, CameraOff, X, ArrowLeft, Loader2, Dumbbell, Target, Zap, Clock } from "lucide-react";

const muscleGroupOptions = [
  { id: "chest", label: "Chest", icon: "💪" },
  { id: "back", label: "Back", icon: "🔙" },
  { id: "shoulders", label: "Shoulders", icon: "🏋️" },
  { id: "arms", label: "Arms", icon: "💪" },
  { id: "legs", label: "Legs", icon: "🦵" },
  { id: "core", label: "Core", icon: "🎯" },
  { id: "cardio", label: "Cardio", icon: "❤️" },
  { id: "full-body", label: "Full Body", icon: "⚡" },
] as const;

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
    async (data: { exerciseName: string; category: string; sets: number; reps: number | null; weight: number | null; duration_min: number | null; distance_km: number | null; calories: number | null; notes: string }) => {
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
        date: new Date().toISOString(),
      });
      triggerRefresh();
    },
    [user]
  );

  // ─── AI Generate ─────────────────────────────────────
  const handleMusclePick = async (muscleId: string) => {
    setSelectedMuscle(muscleId);
    setGenerating(true);
    setAiStep("preview");
    // Simulate generation delay
    await new Promise((r) => setTimeout(r, 1200));
    setGeneratedWorkout(workoutTemplates[muscleId] ?? workoutTemplates["full-body"]);
    setGenerating(false);
  };

  const handleLogFromAI = useCallback(async () => {
    if (!user || !generatedWorkout) return;
    for (const ex of generatedWorkout.exercises) {
      const calories = calculateCalories({
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
        date: new Date().toISOString(),
      });
    }
    closeAI();
    triggerRefresh();
  }, [user, generatedWorkout]);

  const closeAI = () => {
    setAiOpen(false);
    setAiStep("pick");
    setSelectedMuscle("");
    setGeneratedWorkout(null);
    setGenerating(false);
  };

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
        date: new Date().toISOString(),
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
            <div key={i} className="bg-[var(--color-surface)] rounded-xl p-4 shadow-sm border border-[var(--color-border)]">
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
        <div className="bg-[var(--color-surface)] rounded-xl p-5 shadow-sm border border-[var(--color-border)]">
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
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Workout Tracker</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Log workouts and track your fitness progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuickLogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#8b6914] hover:bg-[#a07d1a] text-white transition-colors"
          >
            <Plus size={16} />
            Quick Log
          </button>
          <button
            onClick={() => { setAiOpen(true); setAiStep("pick"); setGeneratedWorkout(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: aiOpen ? "#8b6914" : "var(--color-surface-hover)",
              color: aiOpen ? "white" : "var(--color-text-secondary)",
            }}
          >
            <Sparkles size={16} />
            AI Generate
          </button>
          <button
            onClick={() => setFormCheckOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: cameraEnabled ? "#10b981" : "var(--color-surface-hover)",
              color: cameraEnabled ? "white" : "var(--color-text-secondary)",
            }}
          >
            {cameraEnabled ? <CameraOff size={16} /> : <Camera size={16} />}
            Form Check
          </button>
        </div>
      </div>

      {/* Stats */}
      <WorkoutStats />

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
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto shadow-2xl"
            style={{ backgroundColor: "var(--color-bg)" }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
              <div className="flex items-center gap-2">
                {aiStep === "preview" && (
                  <button onClick={() => { setAiStep("pick"); setGeneratedWorkout(null); setGenerating(false); }} className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)]">
                    <ArrowLeft size={20} style={{ color: "var(--color-text-secondary)" }} />
                  </button>
                )}
                <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                  {aiStep === "pick" ? "AI Workout Generator" : generatedWorkout?.title ?? "Generating..."}
                </h2>
              </div>
              <button onClick={closeAI} className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)]">
                <X size={20} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {aiStep === "pick" ? (
                /* Step 1: Pick muscle group */
                <div className="space-y-4">
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Choose a muscle group to target
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {muscleGroupOptions.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleMusclePick(m.id)}
                        className="flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: "var(--color-surface-hover)", border: "1px solid var(--color-border)" }}
                      >
                        <span className="text-2xl">{m.icon}</span>
                        <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : generating ? (
                /* Generating state */
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 size={40} className="animate-spin" style={{ color: "#8b6914" }} />
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Generating your workout...</p>
                </div>
              ) : generatedWorkout ? (
                /* Step 2: Preview & log */
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="flex items-center gap-1"><Clock size={14} /> {generatedWorkout.duration} min</span>
                    <span className="flex items-center gap-1"><Dumbbell size={14} /> {generatedWorkout.exercises.length} exercises</span>
                  </div>
                  <div className="space-y-2">
                    {generatedWorkout.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ backgroundColor: "var(--color-surface-hover)" }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{ex.name}</p>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{ex.muscle_group}</p>
                        </div>
                        <div className="text-right text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          {ex.sets}×{ex.reps ?? `${ex.duration_min}min`}
                          {ex.rest_seconds ? ` (${ex.rest_seconds}s rest)` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleLogFromAI}
                    className="w-full bg-[#8b6914] hover:bg-[#a07d1a] text-white"
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
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto shadow-2xl"
            style={{ backgroundColor: "var(--color-bg)" }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>Form Check</h2>
              <button onClick={closeFormCheck} className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)]">
                <X size={20} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
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
