"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { card, sectionHeader } from "@/lib/theme";
import { getExerciseHistory } from "@/lib/workouts";
import { Plus, Trash2, Lightbulb, Loader2 } from "lucide-react";

interface WorkoutLoggerProps {
  onSave: (exercises: ExerciseEntry[]) => void;
}

export interface ExerciseEntry {
  name: string;
  type: "strength" | "cardio" | "flexibility";
  sets: number;
  reps: number | null;
  weight: number | null;
  duration_min: number | null;
  distance_km: number | null;
  calories: number | null;
  notes: string;
}

interface ExerciseSuggestion {
  lastWeight: number | null;
  lastReps: number | null;
  lastSets: number | null;
  averageWeight: number;
  progression: "up" | "same" | "down" | "new";
}

const exercisePresets = [
  { name: "Bench Press", type: "strength" as const, muscle: "chest" },
  { name: "Squat", type: "strength" as const, muscle: "legs" },
  { name: "Deadlift", type: "strength" as const, muscle: "back" },
  { name: "Overhead Press", type: "strength" as const, muscle: "shoulders" },
  { name: "Barbell Row", type: "strength" as const, muscle: "back" },
  { name: "Pull-ups", type: "strength" as const, muscle: "back" },
  { name: "Bicep Curls", type: "strength" as const, muscle: "arms" },
  { name: "Tricep Extensions", type: "strength" as const, muscle: "arms" },
  { name: "Lunges", type: "strength" as const, muscle: "legs" },
  { name: "Leg Press", type: "strength" as const, muscle: "legs" },
  { name: "Running", type: "cardio" as const, muscle: "cardio" },
  { name: "Cycling", type: "cardio" as const, muscle: "cardio" },
  { name: "Jump Rope", type: "cardio" as const, muscle: "cardio" },
  { name: "Plank", type: "strength" as const, muscle: "core" },
  { name: "Crunches", type: "strength" as const, muscle: "core" },
];

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function WorkoutLogger({ onSave }: WorkoutLoggerProps) {
  const [workoutDate, setWorkoutDate] = useState<string>(getTodayString());
  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { name: "", type: "strength", sets: 3, reps: 10, weight: null, duration_min: null, distance_km: null, calories: null, notes: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<number, ExerciseSuggestion>>({});
  const [showPresets, setShowPresets] = useState(false);

  // Fetch smart suggestions when exercise name changes
  useEffect(() => {
    exercises.forEach((ex, idx) => {
      if (ex.name && !suggestions[idx]) {
        getExerciseHistory(ex.name).then((s) => {
          setSuggestions((prev) => ({ ...prev, [idx]: s }));
        });
      }
    });
  }, [exercises, suggestions]);

  const addExercise = () => {
    setExercises((prev) => [
      ...prev,
      { name: "", type: "strength", sets: 3, reps: 10, weight: null, duration_min: null, distance_km: null, calories: null, notes: "" },
    ]);
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx: number, field: keyof ExerciseEntry, value: string | number | null) => {
    setExercises((prev) => prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex)));
  };

  const applySuggestion = (idx: number) => {
    const s = suggestions[idx];
    if (!s) return;
    updateExercise(idx, "weight", s.lastWeight ?? 0);
    updateExercise(idx, "reps", s.lastReps ?? 10);
    updateExercise(idx, "sets", s.lastSets ?? 3);
  };

  const applyPreset = (preset: typeof exercisePresets[0], idx: number) => {
    updateExercise(idx, "name", preset.name);
    updateExercise(idx, "type", preset.type);
  };

  const handleSave = async () => {
    setSaving(true);
    // Inject date into each exercise entry
    const entriesWithDate = exercises.map((ex) => ({ ...ex, notes: ex.notes }));
    await onSave(entriesWithDate);
    setSaving(false);
    setExercises([
      { name: "", type: "strength", sets: 3, reps: 10, weight: null, duration_min: null, distance_km: null, calories: null, notes: "" },
    ]);
  };

  const exerciseTypes = [
    { value: "strength", label: "Strength", icon: "🏋️" },
    { value: "cardio", label: "Cardio", icon: "🏃" },
    { value: "flexibility", label: "Flexibility", icon: "🧘" },
  ];

  return (
    <div className={card.base}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={sectionHeader.title}>Log Workout</h3>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="text-xs underline"
          style={{ color: "#8b6914" }}
        >
          {showPresets ? "Hide presets" : "Exercise presets"}
        </button>
      </div>

      {/* Workout Date (optional) */}
      <div className="mb-4 space-y-1">
        <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Workout Date (optional)</Label>
        <input
          type="date"
          value={workoutDate}
          onChange={(e) => setWorkoutDate(e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          style={{ color: "var(--color-text)", backgroundColor: "var(--color-bg)" }}
        />
        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Defaults to today if empty</p>
      </div>

      {/* Exercise Presets */}
      {showPresets && (
        <div className="flex flex-wrap gap-2 mb-4">
          {exercisePresets.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                const lastIdx = exercises.length - 1;
                if (!exercises[lastIdx].name) {
                  applyPreset(p, lastIdx);
                } else {
                  setExercises((prev) => [
                    ...prev,
                    { name: p.name, type: p.type, sets: 3, reps: 10, weight: null, duration_min: null, distance_km: null, calories: null, notes: "" },
                  ]);
                }
              }}
              className="px-2 py-1 rounded text-xs"
              style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text-secondary)" }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Exercise Entries */}
      <div className="space-y-4">
        {exercises.map((ex, idx) => (
          <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: "var(--color-surface-hover)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                Exercise {idx + 1}
              </span>
              <div className="flex items-center gap-2">
                {suggestions[idx] && suggestions[idx].progression !== "new" && (
                  <button
                    onClick={() => applySuggestion(idx)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: "#ecfdf5", color: "#10b981" }}
                  >
                    <Lightbulb size={12} />
                    AI: {suggestions[idx].lastWeight}kg × {suggestions[idx].lastReps}
                  </button>
                )}
                {exercises.length > 1 && (
                  <button onClick={() => removeExercise(idx)} className="p-1 rounded hover:bg-red-100">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Exercise Name */}
            <div className="space-y-1 mb-3">
              <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Exercise Name</Label>
              <Input
                value={ex.name}
                onChange={(e) => updateExercise(idx, "name", e.target.value)}
                placeholder="e.g. Bench Press"
              />
            </div>

            {/* Exercise Type */}
            <div className="space-y-1 mb-3">
              <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Type</Label>
              <div className="flex gap-2">
                {exerciseTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => updateExercise(idx, "type", t.value)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      ex.type === t.value
                        ? "bg-[#8b6914] text-white"
                        : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                    }`}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sets & Reps */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Sets</Label>
                <Input
                  type="number"
                  min={1}
                  value={ex.sets}
                  onChange={(e) => updateExercise(idx, "sets", Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Reps</Label>
                <Input
                  type="number"
                  min={0}
                  value={ex.reps ?? ""}
                  onChange={(e) => updateExercise(idx, "reps", Number(e.target.value) || null)}
                  placeholder="-"
                />
              </div>
            </div>

            {/* Weight & Duration */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Weight (kg)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={ex.weight ?? ""}
                  onChange={(e) => updateExercise(idx, "weight", Number(e.target.value) || null)}
                  placeholder="-"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Duration (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={ex.duration_min ?? ""}
                  onChange={(e) => updateExercise(idx, "duration_min", Number(e.target.value) || null)}
                  placeholder="-"
                />
              </div>
            </div>

            {/* Distance (cardio only) */}
            {ex.type === "cardio" && (
              <div className="space-y-1 mb-3">
                <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Distance (km)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={ex.distance_km ?? ""}
                  onChange={(e) => updateExercise(idx, "distance_km", Number(e.target.value) || null)}
                  placeholder="-"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Notes</Label>
              <Input
                value={ex.notes}
                onChange={(e) => updateExercise(idx, "notes", e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={addExercise} className="flex-1">
          <Plus size={16} className="mr-1" /> Add Exercise
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#8b6914] hover:bg-[#a07d1a] text-white">
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Workout"}
        </Button>
      </div>
    </div>
  );
}
