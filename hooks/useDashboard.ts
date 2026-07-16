"use client";

import { useMemo } from "react";
import { useTransactions } from "./useExpenses";
import { useBudgets } from "./useBudgets";
import { useTasks } from "./useTasks";
import { useReminders } from "./useReminders";
import { useWorkouts } from "./useWorkouts";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "./useAuth";
import { useQuery } from "@tanstack/react-query";
import { getLocalDateString } from "@/lib/dates";
import type { DailySummary } from "@/types";

// ─── Finance Hooks ─────────────────────────────────────────────

/** Today's total expenses */
export function useDashboardSpentToday() {
  const { data: transactions = [], isLoading } = useTransactions();

  const spent = useMemo(() => {
    const today = getLocalDateString();
    return transactions
      .filter((t) => t.date === today)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  return { data: spent, isLoading };
}

/** Spending by category for pie chart — current month */
export function useDashboardCategoryData() {
  const { data: transactions = [], isLoading } = useTransactions();

  const data = useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const catMap: Record<string, number> = {};

    transactions
      .filter((t) => t.date.startsWith(monthPrefix))
      .forEach((t) => {
        const cat = t.categories?.name || "Other";
        catMap[cat] = (catMap[cat] || 0) + Number(t.amount);
      });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  return { data, isLoading };
}

/** Daily spending for the current week — bar chart */
export function useDashboardWeeklySpending() {
  const { data: transactions = [], isLoading } = useTransactions();

  const data = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Build last 7 days
    const weekDays: { day: string; dateStr: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      weekDays.push({ day: days[d.getDay()], dateStr, amount: 0 });
    }

    // Sum expenses per day
    transactions
      .filter((t) => t.date >= weekDays[0].dateStr)
      .forEach((t) => {
        const entry = weekDays.find((w) => w.dateStr === t.date);
        if (entry) entry.amount += Number(t.amount);
      });

    return weekDays.map(({ day, amount }) => ({ day, amount }));
  }, [transactions]);

  return { data, isLoading };
}

/** Budget progress for current month — horizontal bar chart */
export function useDashboardBudgetProgress() {
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();

  const data = useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    return budgets.map((b) => {
      const spent = transactions
        .filter(
          (t) =>
            t.date.startsWith(monthPrefix) &&
            t.category_id === b.category_id
        )
        .reduce((s, t) => s + Number(t.amount), 0);

      const percent = b.monthly_limit > 0
        ? Math.round((spent / b.monthly_limit) * 100)
        : 0;

      return {
        category: b.categories?.name || "Other",
        monthly_limit: b.monthly_limit,
        spent,
        percent,
      };
    });
  }, [budgets, transactions]);

  return { data, isLoading: budgetsLoading || txLoading };
}

// ─── Tasks Hooks ───────────────────────────────────────────────

/** Count of pending tasks */
export function useDashboardPendingTasks() {
  const { data: allTasks, isLoading } = useTasks();

  const count = useMemo(() => {
    if (!allTasks) return 0;
    return allTasks.filter((t) => t.status === "pending").length;
  }, [allTasks]);

  return { data: count, isLoading };
}

// ─── Reminders Hooks ──────────────────────────────────────────

/** Upcoming reminders in the next 7 days */
export function useDashboardUpcomingReminders() {
  const { data: allReminders = [], isLoading } = useReminders();

  const data = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return allReminders
      .filter((r) => {
        const d = new Date(r.remind_at);
        return r.is_active && d >= now && d <= nextWeek;
      })
      .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
      .slice(0, 5);
  }, [allReminders]);

  return { data, isLoading };
}

// ─── Workouts Hooks ───────────────────────────────────────────

/** Today's workout count */
export function useDashboardTodayWorkouts() {
  const { data: result, isLoading } = useWorkouts(100);

  const count = useMemo(() => {
    if (!result?.data) return 0;
    const today = getLocalDateString();
    return result.data.filter((w) => w.date.split("T")[0] === today).length;
  }, [result]);

  return { data: count, isLoading };
}

/** Weekly workout frequency — bar chart */
export function useDashboardWeeklyWorkouts() {
  const { data: result, isLoading } = useWorkouts(100);

  const data = useMemo(() => {
    if (!result?.data) return [];

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();

    // Build last 7 days
    const weekDays: { day: string; dateStr: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      weekDays.push({ day: days[d.getDay()], dateStr, count: 0 });
    }

    // Count workouts per day
    result.data.forEach((w) => {
      const wDate = w.date.split("T")[0];
      const entry = weekDays.find((d) => d.dateStr === wDate);
      if (entry) entry.count++;
    });

    return weekDays.map(({ day, count }) => ({ week: day, count }));
  }, [result]);

  return { data, isLoading };
}

/** Recent workouts for dashboard list */
export function useDashboardRecentWorkouts(limit = 4) {
  const { data: result, isLoading } = useWorkouts(limit);

  return { data: result?.data ?? [], isLoading };
}

// ─── Summary Hooks ──────────────────────────────────────────

/** Daily summary from summary table */
export function useDashboardDailySummary(date?: string) {
  const supabase = createClient();
  const { data: user } = useUser();
  const targetDate = date || getLocalDateString();

  return useQuery({
    queryKey: ["daily-summary", targetDate, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_summary")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", targetDate)
        .single();

      if (error) throw error;
      return data as DailySummary;
    },
    enabled: !!user,
  });
}

/** Last 7 days from daily_summary */
export function useDashboardWeeklySummary() {
  const supabase = createClient();
  const { data: user } = useUser();

  return useQuery({
    queryKey: ["weekly-summary", user?.id],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data, error } = await supabase
        .from("daily_summary")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", getLocalDateString(weekAgo))
        .order("date", { ascending: true });

      if (error) throw error;
      return data as DailySummary[];
    },
    enabled: !!user,
  });
}

/** Current month from daily_summary */
export function useDashboardMonthlySummary() {
  const supabase = createClient();
  const { data: user } = useUser();

  return useQuery({
    queryKey: ["monthly-summary", user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const { data, error } = await supabase
        .from("daily_summary")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", monthStart)
        .order("date", { ascending: true });

      if (error) throw error;
      return data as DailySummary[];
    },
    enabled: !!user,
  });
}
