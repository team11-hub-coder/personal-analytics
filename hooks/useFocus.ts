"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "./useAuth";
import {
  getFocusSessions,
  getTodayFocusMinutes,
  getWeekFocusMinutes,
} from "@/lib/focus";

// ─── Today's Focus Minutes ──────────────────────────────────────

export function useTodayFocusMinutes() {
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["focus-today-minutes", user?.id],
    queryFn: () => getTodayFocusMinutes(),
    enabled: !authLoading && !!user,
  });
}

// ─── This Week's Focus Minutes ──────────────────────────────────

export function useWeekFocusMinutes() {
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["focus-week-minutes", user?.id],
    queryFn: () => getWeekFocusMinutes(),
    enabled: !authLoading && !!user,
  });
}

// ─── Focus Sessions List ────────────────────────────────────────

export function useFocusSessions(limit = 5) {
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["focus-sessions", limit, user?.id],
    queryFn: () => getFocusSessions(limit),
    enabled: !authLoading && !!user,
  });
}

// ─── Weekly Focus Data (for chart) ─────────────────────────────

export function useWeeklyFocusData() {
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["focus-weekly-data", user?.id],
    queryFn: async () => {
      const { data: sessions } = await getFocusSessions(100);

      // Build last 7 days
      const days: { date: string; label: string; minutes: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const label = date.toLocaleDateString("en-US", { weekday: "short" });
        days.push({ date: dateStr, label, minutes: 0 });
      }

      // Sum completed focus minutes per day
      sessions
        .filter((s) => s.completed)
        .forEach((session) => {
          const sessionDate = session.started_at.split("T")[0];
          const day = days.find((d) => d.date === sessionDate);
          if (day) day.minutes += session.duration_minutes;
        });

      return days.map((d) => ({ name: d.label, minutes: d.minutes }));
    },
    enabled: !authLoading && !!user,
  });
}
