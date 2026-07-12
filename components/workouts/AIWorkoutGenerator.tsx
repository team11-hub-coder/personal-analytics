"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { card, sectionHeader } from "@/lib/theme";
import type { GeneratedWorkout } from "@/types";
import { Sparkles, Clock, Dumbbell, Target, Zap, Loader2 } from "lucide-react";

interface AIWorkoutGeneratorProps {
  onGenerate: (workout: GeneratedWorkout) => void;
}

const equipmentOptions = [
  "None (Bodyweight)",
  "Dumbbells",
  "Barbell",
  "Kettlebell",
  "Resistance Bands",
  "Pull-up Bar",
  "Bench",
  "Machine",
];

const muscleOptions = [
  "Full Body",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Cardio",
];

const difficultyOptions = ["beginner", "intermediate", "advanced"] as const;

const workoutTemplates: Record<string, GeneratedWorkout> = {
  "quick-chest": {
    title: "Quick Chest Blast",
    duration: 20,
    exercises: [
      { name: "Push-ups", type: "strength", sets: 3, reps: 15, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "chest" },
      { name: "Dumbbell Press", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "chest" },
      { name: "Chest Fly", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "chest" },
    ],
  },
  "full-body": {
    title: "Full Body Power",
    duration: 45,
    exercises: [
      { name: "Squats", type: "strength", sets: 4, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "legs" },
      { name: "Bench Press", type: "strength", sets: 4, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "chest" },
      { name: "Bent-over Row", type: "strength", sets: 4, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "back" },
      { name: "Shoulder Press", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "shoulders" },
      { name: "Plank", type: "strength", sets: 3, reps: null, weight: null, duration_min: 1, rest_seconds: 30, muscle_group: "core" },
    ],
  },
  "leg-day": {
    title: "Leg Day Destroyer",
    duration: 40,
    exercises: [
      { name: "Barbell Squat", type: "strength", sets: 4, reps: 8, weight: null, duration_min: null, rest_seconds: 120, muscle_group: "legs" },
      { name: "Romanian Deadlift", type: "strength", sets: 3, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "legs" },
      { name: "Leg Press", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "legs" },
      { name: "Walking Lunges", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "legs" },
      { name: "Calf Raises", type: "strength", sets: 4, reps: 15, weight: null, duration_min: null, rest_seconds: 45, muscle_group: "legs" },
    ],
  },
  "hiit-cardio": {
    title: "HIIT Cardio Blast",
    duration: 25,
    exercises: [
      { name: "Jumping Jacks", type: "cardio", sets: 3, reps: null, weight: null, duration_min: 1, rest_seconds: 30, muscle_group: "cardio" },
      { name: "Burpees", type: "cardio", sets: 3, reps: 10, weight: null, duration_min: null, rest_seconds: 45, muscle_group: "cardio" },
      { name: "Mountain Climbers", type: "cardio", sets: 3, reps: null, weight: null, duration_min: 1, rest_seconds: 30, muscle_group: "cardio" },
      { name: "High Knees", type: "cardio", sets: 3, reps: null, weight: null, duration_min: 1, rest_seconds: 30, muscle_group: "cardio" },
      { name: "Jump Squats", type: "cardio", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 45, muscle_group: "cardio" },
    ],
  },
  "upper-body": {
    title: "Upper Body Sculpt",
    duration: 35,
    exercises: [
      { name: "Pull-ups", type: "strength", sets: 4, reps: 8, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "back" },
      { name: "Dumbbell Bench Press", type: "strength", sets: 4, reps: 10, weight: null, duration_min: null, rest_seconds: 90, muscle_group: "chest" },
      { name: "Overhead Press", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 60, muscle_group: "shoulders" },
      { name: "Bicep Curls", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 45, muscle_group: "arms" },
      { name: "Tricep Dips", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 45, muscle_group: "arms" },
    ],
  },
  "core-abs": {
    title: "Core Crusher",
    duration: 20,
    exercises: [
      { name: "Plank", type: "strength", sets: 3, reps: null, weight: null, duration_min: 1, rest_seconds: 30, muscle_group: "core" },
      { name: "Russian Twists", type: "strength", sets: 3, reps: 20, weight: null, duration_min: null, rest_seconds: 30, muscle_group: "core" },
      { name: "Leg Raises", type: "strength", sets: 3, reps: 15, weight: null, duration_min: null, rest_seconds: 30, muscle_group: "core" },
      { name: "Bicycle Crunches", type: "strength", sets: 3, reps: 20, weight: null, duration_min: null, rest_seconds: 30, muscle_group: "core" },
      { name: "Dead Bug", type: "strength", sets: 3, reps: 12, weight: null, duration_min: null, rest_seconds: 30, muscle_group: "core" },
    ],
  },
};

export default function AIWorkoutGenerator({ onGenerate }: AIWorkoutGeneratorProps) {
  const [duration, setDuration] = useState(30);
  const [equipment, setEquipment] = useState("Dumbbells");
  const [targetMuscle, setTargetMuscle] = useState("Full Body");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [generating, setGenerating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));

    let templateKey = "full-body";
    if (targetMuscle === "Chest") templateKey = "quick-chest";
    else if (targetMuscle === "Legs") templateKey = "leg-day";
    else if (targetMuscle === "Cardio") templateKey = "hiit-cardio";
    else if (["Back", "Shoulders", "Arms"].includes(targetMuscle)) templateKey = "upper-body";
    else if (targetMuscle === "Core") templateKey = "core-abs";

    const workout = { ...workoutTemplates[templateKey], duration };
    onGenerate(workout);
    setGenerating(false);
  };

  return (
    <div className={card.base}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} style={{ color: "#8b6914" }} />
        <h3 className={sectionHeader.title}>AI Workout Generator</h3>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-sm underline"
          style={{ color: "#8b6914" }}
        >
          {showTemplates ? "Hide templates" : "Show quick templates"}
        </button>

        {showTemplates && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
            {Object.entries(workoutTemplates).map(([key, tmpl]) => (
              <button
                key={key}
                onClick={() => { onGenerate(tmpl); setShowTemplates(false); }}
                className="p-3 rounded-lg text-left text-sm transition-colors"
                style={{ backgroundColor: "var(--color-surface-hover)", border: "1px solid var(--color-border)" }}
              >
                <p className="font-medium" style={{ color: "var(--color-text)" }}>{tmpl.title}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{tmpl.duration} min</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
            <Clock size={12} /> Duration (min)
          </Label>
          <Input type="number" min={10} max={90} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 30)} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
            <Dumbbell size={12} /> Equipment
          </Label>
          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map((eq) => (
              <button
                key={eq}
                onClick={() => setEquipment(eq)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: equipment === eq ? "#8b6914" : "var(--color-surface-hover)",
                  color: equipment === eq ? "white" : "var(--color-text-secondary)",
                }}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
            <Target size={12} /> Target Muscles
          </Label>
          <div className="flex flex-wrap gap-2">
            {muscleOptions.map((muscle) => (
              <button
                key={muscle}
                onClick={() => setTargetMuscle(muscle)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: targetMuscle === muscle ? "#8b6914" : "var(--color-surface-hover)",
                  color: targetMuscle === muscle ? "white" : "var(--color-text-secondary)",
                }}
              >
                {muscle}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
            <Zap size={12} /> Difficulty
          </Label>
          <div className="flex gap-2">
            {difficultyOptions.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
                style={{
                  backgroundColor: difficulty === d ? "#8b6914" : "var(--color-surface-hover)",
                  color: difficulty === d ? "white" : "var(--color-text-secondary)",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={generating} className="w-full bg-[#8b6914] hover:bg-[#a07d1a] text-white">
          {generating ? (
            <><Loader2 size={16} className="animate-spin mr-2" />Generating...</>
          ) : (
            <><Sparkles size={16} className="mr-2" />Generate Workout</>
          )}
        </Button>
      </div>
    </div>
  );
}
