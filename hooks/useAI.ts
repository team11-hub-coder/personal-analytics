"use client";

import { useMutation } from "@tanstack/react-query";

// ─── AI Workout Generator ──────────────────────────────────────

interface WorkoutRequest {
  muscleGroup: string;
  duration?: number;
  equipment?: string[];
  goal?: "strength" | "endurance" | "flexibility" | "general";
}

interface AIExercise {
  name: string;
  type: "strength" | "cardio" | "flexibility";
  sets: number;
  reps: number | null;
  weight: number | null;
  duration_min: number | null;
  rest_seconds: number;
  muscle_group: string;
  calories: number;
  tip: string;
}

export interface AIWorkout {
  title: string;
  duration: number;
  exercises: AIExercise[];
  summary: string;
}

export function useGenerateWorkout() {
  return useMutation({
    mutationFn: async (params: WorkoutRequest): Promise<AIWorkout> => {
      const res = await fetch("/api/ai/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to generate workout");
      }

      const data = await res.json();
      return data.workout;
    },
  });
}

// ─── AI Daily Summary ──────────────────────────────────────────

export interface DailySummary {
  summary: string;
  highlights: string[];
  suggestion: string;
  emoji: string;
  stats: {
    workouts: number;
    calories: number;
    tasksCompleted: number;
    tasksPending: number;
    focusMinutes: number;
    spent: number;
  };
}

export function useDailySummary() {
  return useMutation({
    mutationFn: async (): Promise<DailySummary> => {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to generate summary");
      }

      return res.json();
    },
  });
}

// ─── AI Spending Insights ──────────────────────────────────────

export interface SpendingInsight {
  type: "trend" | "warning" | "tip" | "achievement";
  title: string;
  detail: string;
  icon: string;
}

export interface SpendingInsightsResult {
  insights: SpendingInsight[];
  topCategory: string;
  topCategoryAmount: number;
  budgetStatus: "under" | "over" | "on_track" | "no_budget";
  monthProjection: number;
  totalSpent: number;
  currency: string;
}

export function useSpendingInsights() {
  return useMutation({
    mutationFn: async (): Promise<SpendingInsightsResult> => {
      const res = await fetch("/api/ai/spending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to generate insights");
      }

      return res.json();
    },
  });
}
