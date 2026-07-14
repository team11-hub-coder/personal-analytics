"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ExerciseCategories from "./ExerciseCategories";
import { X, Loader2, Check } from "lucide-react";

interface QuickLogOverlayProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: QuickLogData) => void;
}

export interface QuickLogData {
  exerciseName: string;
  category: string;
  sets: number;
  reps: number | null;
  weight: number | null;
  duration_min: number | null;
  distance_km: number | null;
  calories: number | null;
  notes: string;
}

export default function QuickLogOverlay({ open, onClose, onSave }: QuickLogOverlayProps) {
  const [step, setStep] = useState<"pick" | "log">("pick");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState<number | null>(10);
  const [weight, setWeight] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [calories, setCalories] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const handlePickExercise = (exercise: string, category: string) => {
    setSelectedExercise(exercise);
    setSelectedCategory(category);
    setStep("log");
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      exerciseName: selectedExercise,
      category: selectedCategory,
      sets,
      reps,
      weight,
      duration_min: duration,
      distance_km: distance,
      calories,
      notes,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      handleClose();
    }, 1000);
  };

  const handleClose = () => {
    setStep("pick");
    setSelectedExercise("");
    setSelectedCategory("");
    setSets(3);
    setReps(10 as number | null);
    setWeight(null);
    setDuration(null);
    setDistance(null);
    setCalories(null);
    setNotes("");
    onClose();
  };

  const isCardio = ["Running", "Walking", "Swimming", "Sports"].some(
    (c) => selectedCategory.toLowerCase().includes(c.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Panel */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto shadow-2xl"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
            {step === "pick" ? "Choose Exercise" : selectedExercise}
          </h2>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)]">
            <X size={20} style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === "pick" ? (
            <ExerciseCategories onSelect={handlePickExercise} />
          ) : (
            <div className="space-y-4">
              {/* Exercise badge */}
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: "var(--color-surface-hover)" }}>
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Category:</span>
                <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{selectedCategory}</span>
              </div>

              {saved ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Check size={24} className="text-emerald-500" />
                  <span className="text-lg font-medium text-emerald-500">Saved!</span>
                </div>
              ) : (
                <>
                  {/* Strength fields */}
                  {!isCardio && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Sets</Label>
                        <Input type="number" min={1} value={sets} onChange={(e) => setSets(Number(e.target.value) || 1)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Reps</Label>
                        <Input type="number" min={0} value={reps ?? ""} onChange={(e) => setReps(Number(e.target.value) || null)} placeholder="-" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Weight (kg)</Label>
                        <Input type="number" min={0} step={0.5} value={weight ?? ""} onChange={(e) => setWeight(Number(e.target.value) || null)} placeholder="-" />
                      </div>
                    </div>
                  )}

                  {/* Cardio fields */}
                  {isCardio && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Duration (min)</Label>
                        <Input type="number" min={0} value={duration ?? ""} onChange={(e) => setDuration(Number(e.target.value) || null)} placeholder="0" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Distance (km)</Label>
                        <Input type="number" min={0} step={0.1} value={distance ?? ""} onChange={(e) => setDistance(Number(e.target.value) || null)} placeholder="0" />
                      </div>
                    </div>
                  )}

                  {/* Optional fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Calories</Label>
                      <Input type="number" min={0} value={calories ?? ""} onChange={(e) => setCalories(Number(e.target.value) || null)} placeholder="-" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Notes</Label>
                      <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setStep("pick")} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#8b6914] hover:bg-[#a07d1a] text-white">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
