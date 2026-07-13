"use client";

import { useEffect, useState } from "react";
import { getWorkoutStats, getMuscleGroupCoverage, getWorkouts, type MuscleGroupData } from "@/lib/workouts";
import { Dumbbell, Flame, Clock, Calendar } from "lucide-react";

interface Stats {
  totalWorkouts: number;
  totalCalories: number;
  totalMinutes: number;
  thisWeek: number;
}

const statCards = [
  { key: "totalWorkouts" as const, icon: Dumbbell, label: "Total Workouts", color: "bg-[#f3ece3] text-[#8b6914]" },
  { key: "totalCalories" as const, icon: Flame, label: "Calories Burned", color: "bg-orange-50 text-orange-600" },
  { key: "totalMinutes" as const, icon: Clock, label: "Total Minutes", color: "bg-blue-50 text-blue-600" },
  { key: "thisWeek" as const, icon: Calendar, label: "This Week", color: "bg-emerald-50 text-emerald-600" },
];

const muscleGroups = ["chest", "back", "shoulders", "arms", "legs", "core", "cardio"];

const muscleColors: Record<string, string> = {
  chest: "#8b6914",
  back: "#3b82f6",
  shoulders: "#a855f7",
  arms: "#ec4899",
  legs: "#10b981",
  core: "#f59e0b",
  cardio: "#ef4444",
};

export default function WorkoutStats() {
  const [stats, setStats] = useState<Stats>({ totalWorkouts: 0, totalCalories: 0, totalMinutes: 0, thisWeek: 0 });
  const [coverage, setCoverage] = useState<Record<string, MuscleGroupData>>({});

  useEffect(() => {
    getWorkoutStats().then(setStats);
    getWorkouts(20).then((result) => {
      const coverageData = getMuscleGroupCoverage(result.data);
      setCoverage(coverageData);
    });
  }, []);

  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.key} className="bg-[var(--color-surface)] rounded-xl p-4 shadow-sm border border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{card.label}</p>
                <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>{stats[card.key]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Muscle Group Coverage */}
      {Object.keys(coverage).length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl p-5 shadow-sm border border-[var(--color-border)]">
          <h3 className="font-semibold mb-4" style={{ color: "var(--color-text)" }}>Muscle Group Coverage</h3>
          <div className="space-y-4">
            {muscleGroups.map((group) => {
              const data = coverage[group];
              const pct = data?.percentage ?? 0;
              const exercises = data?.exercises ?? [];
              const color = muscleColors[group] ?? "#8b6914";

              return (
                <div key={group}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium capitalize" style={{ color: "var(--color-text)" }}>{group}</span>
                    </div>
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: "var(--color-surface-hover)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 80 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  {exercises.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {exercises.map((ex) => (
                        <span
                          key={ex}
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color}15`, color }}
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
