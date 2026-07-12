"use client";

import { useEffect, useState, useMemo } from "react";
import { getWorkouts, deleteWorkout, calculateCalories } from "@/lib/workouts";
import type { Workout } from "@/types";
import { card, sectionHeader } from "@/lib/theme";
import { Dumbbell, Flame, Trash2, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { getLocalDateString, parseLocalDate } from "@/lib/dates";

function formatDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(mins: number | null): string {
  if (!mins) return "-";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function toDateKey(dateStr: string): string {
  // Workout dates come as YYYY-MM-DD from the DB, return as-is
  return dateStr;
}

const typeColors: Record<string, string> = {
  strength: "#8b6914",
  cardio: "#ef4444",
  flexibility: "#10b981",
};

interface WorkoutHistoryProps {
  refreshKey?: number;
}

export default function WorkoutHistory({ refreshKey }: WorkoutHistoryProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());

  useEffect(() => {
    setLoading(true);
    getWorkouts(50).then((result) => {
      setWorkouts(result.data);
      setTableMissing(result.tableMissing);
      setLoading(false);
    });
  }, [refreshKey]);

  // Get unique dates from workouts
  const availableDates = useMemo(() => {
    const dates = new Set(workouts.map((w) => toDateKey(w.date)));
    return Array.from(dates).sort().reverse();
  }, [workouts]);

  // Navigate dates
  const goToPrevDay = () => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(getLocalDateString(d));
  };

  const goToNextDay = () => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(getLocalDateString(d));
  };

  const goToToday = () => {
    setSelectedDate(getLocalDateString());
  };

  // Filter workouts by selected date
  const filteredWorkouts = useMemo(
    () => workouts.filter((w) => toDateKey(w.date) === selectedDate),
    [workouts, selectedDate]
  );

  // Calculate daily stats
  const dailyStats = useMemo(() => {
    const totalCalories = filteredWorkouts.reduce(
      (sum, w) => sum + (w.calories ?? calculateCalories(w)),
      0
    );
    const totalMinutes = filteredWorkouts.reduce(
      (sum, w) => sum + (w.duration_min ?? 0),
      0
    );
    const strengthCount = filteredWorkouts.filter((w) => w.exercise_type === "strength").length;
    const cardioCount = filteredWorkouts.filter((w) => w.exercise_type === "cardio").length;
    return { totalCalories, totalMinutes, strengthCount, cardioCount, count: filteredWorkouts.length };
  }, [filteredWorkouts]);

  const handleDelete = async (id: number) => {
    const ok = await deleteWorkout(id);
    if (ok) setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    const today = parseLocalDate(getLocalDateString());
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className={card.base}>
        <h3 className={sectionHeader.title}>Workout History</h3>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-surface-hover)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={card.base}>
      <h3 className={sectionHeader.title}>Workout History</h3>

      {tableMissing ? (
        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: "#fef3c7", border: "1px solid #fcd34d" }}>
          <p className="text-sm font-medium" style={{ color: "#92400e" }}>Database table not found</p>
          <p className="text-xs mt-1" style={{ color: "#a16207" }}>Run the workouts SQL migration in Supabase SQL Editor.</p>
        </div>
      ) : workouts.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
          No workouts logged yet. Start your first one!
        </p>
      ) : (
        <>
          {/* Date Filter */}
          <div className="mt-4 flex items-center justify-between">
            <button onClick={goToPrevDay} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors">
              <ChevronLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
            </button>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-medium px-2 py-1 rounded-lg border text-center"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-bg)" }}
              />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {formatDisplayDate(selectedDate)}
              </span>
            </div>
            <button onClick={goToNextDay} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors">
              <ChevronRight size={18} style={{ color: "var(--color-text-secondary)" }} />
            </button>
          </div>

          {/* Today button */}
          {selectedDate !== getLocalDateString() && (
            <div className="flex justify-center mt-2">
              <button
                onClick={goToToday}
                className="text-xs px-3 py-1 rounded-full bg-[#8b6914] text-white hover:bg-[#a07d1a] transition-colors"
              >
                Go to Today
              </button>
            </div>
          )}

          {/* Daily Summary */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "var(--color-surface-hover)" }}>
              <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{dailyStats.count}</p>
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Exercises</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "#fef2f2" }}>
              <p className="text-lg font-bold text-orange-500">{dailyStats.totalCalories}</p>
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Calories</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "#eff6ff" }}>
              <p className="text-lg font-bold text-blue-500">{dailyStats.totalMinutes}</p>
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Minutes</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "#f0fdf4" }}>
              <p className="text-lg font-bold text-emerald-500">{dailyStats.strengthCount}/{dailyStats.cardioCount}</p>
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Str/Cardio</p>
            </div>
          </div>

          {/* Workout List */}
          <div className="mt-4 space-y-2">
            {filteredWorkouts.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                No workouts on this day.
              </p>
            ) : (
              filteredWorkouts.map((w) => {
                const estCalories = w.calories ?? calculateCalories(w);
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: "var(--color-surface-hover)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${typeColors[w.exercise_type] ?? "#8b6914"}20` }}
                    >
                      {w.exercise_type === "cardio" ? (
                        <Flame size={16} style={{ color: typeColors[w.exercise_type] ?? "#ef4444" }} />
                      ) : (
                        <Dumbbell size={16} style={{ color: typeColors[w.exercise_type] ?? "#8b6914" }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                        {w.exercise_name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {w.sets && w.reps ? `${w.sets}×${w.reps}` : ""}
                        {w.weight ? ` @ ${w.weight}kg` : ""}
                        {w.duration_min ? ` ${formatDuration(w.duration_min)}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {estCalories > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                          🔥 {estCalories} cal
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
