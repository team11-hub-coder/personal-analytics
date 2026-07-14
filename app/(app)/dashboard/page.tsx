"use client";

import { useState, useMemo } from "react";
import { DollarSign, Dumbbell, CheckSquare, Bell, Timer } from "lucide-react";
import {
  card,
  statCard,
  statColors,
  pageHeader,
  sectionHeader,
} from "@/lib/theme";
import { formatCurrency } from "@/lib/currency";
import { useProfile } from "@/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartCard,
  SpendingCategoryChart,
  WeeklySpendingChart,
  WeeklyWorkoutChart,
  BudgetProgressChart,
} from "@/components/charts";
import { useTodayFocusMinutes, useFocusSessions } from "@/hooks/useFocus";
import { useTransactions } from "@/hooks/useExpenses";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useTasks } from "@/hooks/useTasks";
import { useBudgets } from "@/hooks/useBudgets";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency } from "@/lib/currency";
import {
  useDashboardSpentToday,
  useDashboardCategoryData,
  useDashboardWeeklySpending,
  useDashboardBudgetProgress,
  useDashboardPendingTasks,
  useDashboardUpcomingReminders,
  useDashboardTodayWorkouts,
  useDashboardWeeklyWorkouts,
  useDashboardRecentWorkouts,
  useDashboardDailySummary,
  useDashboardWeeklySummary,
  useDashboardMonthlySummary,
} from "@/hooks/useDashboard";

function formatFocusTime(mins: number) {
  if (mins === 0) return "0m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function DashboardPage() {
  // ─── Raw Data Fetching (for real-time daily/weekly/monthly stats) ───
  const { data: profile } = useProfile();
  const { data: rawTransactions = [], isLoading: txLoading } =
    useTransactions();
  const { data: workoutResult, isLoading: woLoading } = useWorkouts(1000);
  const { data: rawTasks = [], isLoading: rawTasksLoading } = useTasks();
  const { data: focusResult, isLoading: focusLoading } = useFocusSessions(1000);

  const rawWorkouts = workoutResult?.data ?? [];
  const rawFocusSessions = focusResult?.data ?? [];
  const { data: profile } = useProfile();
  const currency = profile?.currency || "MMK";

  // ─── Dashboard Hooks (for charts/list views) ─────────────────────────
  const { data: categoryData = [], isLoading: catLoading } =
    useDashboardCategoryData();
  const { data: weeklySpending = [], isLoading: weeklySpendingLoading } =
    useDashboardWeeklySpending();
  const { data: budgetProgress = [], isLoading: budgetLoading } =
    useDashboardBudgetProgress();
  const { data: upcomingReminders = [], isLoading: remindersLoading } =
    useDashboardUpcomingReminders();
  const { data: weeklyWorkouts = [], isLoading: weeklyWorkoutsLoading } =
    useDashboardWeeklyWorkouts();
  const { data: recentWorkouts = [], isLoading: recentWorkoutsLoading } =
    useDashboardRecentWorkouts(4);

  // ─── Summary Data Filter State ──────────────────────────────
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );

  const stats = useMemo(() => {
    // Current local date components
    const now = new Date();

    const todayStr = now.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toLocaleDateString("en-CA");

    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toLocaleDateString("en-CA");

    // Spent Calculation
    const dailySpent = rawTransactions
      .filter((t) => t.date === todayStr)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const weeklySpent = rawTransactions
      .filter((t) => t.date >= weekAgoStr)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlySpent = rawTransactions
      .filter((t) => t.date >= monthStartStr)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Workout Calculation
    const dailyWorkouts = rawWorkouts.filter(
      (w) => w.date.split("T")[0] === todayStr,
    ).length;
    const weeklyWorkouts = rawWorkouts.filter(
      (w) => w.date.split("T")[0] >= weekAgoStr,
    ).length;
    const monthlyWorkouts = rawWorkouts.filter(
      (w) => w.date.split("T")[0] >= monthStartStr,
    ).length;

    // Pending Tasks (always snapshot count)
    const pendingCount = rawTasks.filter((t) => t.status === "pending").length;

    // Focus Calculation
    const dailyFocus = rawFocusSessions
      .filter((s) => s.completed && s.started_at.split("T")[0] === todayStr)
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    const weeklyFocus = rawFocusSessions
      .filter((s) => s.completed && s.started_at.split("T")[0] >= weekAgoStr)
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    const monthlyFocus = rawFocusSessions
      .filter((s) => s.completed && s.started_at.split("T")[0] >= monthStartStr)
      .reduce((sum, s) => sum + s.duration_minutes, 0);

    return {
      daily: {
        spent: dailySpent,
        workouts: dailyWorkouts,
        tasks: pendingCount,
        focus: dailyFocus,
      },
      weekly: {
        spent: weeklySpent,
        workouts: weeklyWorkouts,
        tasks: pendingCount,
        focus: weeklyFocus,
      },
      monthly: {
        spent: monthlySpent,
        workouts: monthlyWorkouts,
        tasks: pendingCount,
        focus: monthlyFocus,
      },
    };
  }, [rawTransactions, rawWorkouts, rawTasks, rawFocusSessions]);

  // ─── Filtered Category Data ─────────────────────────────────
  const filteredCategoryData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA");
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toLocaleDateString("en-CA");
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toLocaleDateString("en-CA");

    const filteredTx = rawTransactions.filter((t) => {
      if (timeRange === "daily") return t.date === todayStr;
      if (timeRange === "weekly") return t.date >= weekAgoStr;
      return t.date >= monthStartStr;
    });

    const catMap: Record<string, number> = {};
    filteredTx.forEach((t) => {
      const cat = t.categories?.name || "Other";
      catMap[cat] = (catMap[cat] || 0) + Number(t.amount);
    });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [timeRange, rawTransactions]);

  // ─── Filtered Spending Trend ───────────────────────────────
  const filteredSpendingTrend = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();

    if (timeRange === "daily") {
      // Last 7 days
      const weekDays: { day: string; dateStr: string; amount: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-CA");
        weekDays.push({ day: days[d.getDay()], dateStr, amount: 0 });
      }
      rawTransactions.forEach((t) => {
        const entry = weekDays.find((w) => w.dateStr === t.date);
        if (entry) entry.amount += Number(t.amount);
      });
      return weekDays.map(({ day, amount }) => ({ day, amount }));
    } else if (timeRange === "weekly") {
      // Last 4 weeks
      const weeks: { day: string; start: Date; end: Date; amount: number }[] =
        [];
      for (let i = 3; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const label = i === 0 ? "This Week" : `${i}w ago`;
        weeks.push({ day: label, start, end, amount: 0 });
      }
      rawTransactions.forEach((t) => {
        const tDate = new Date(t.date);
        const entry = weeks.find((w) => tDate >= w.start && tDate <= w.end);
        if (entry) entry.amount += Number(t.amount);
      });
      return weeks.map(({ day, amount }) => ({ day, amount }));
    } else {
      // Last 6 months
      const monthlyData: {
        day: string;
        year: number;
        month: number;
        amount: number;
      }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = months[d.getMonth()];
        monthlyData.push({
          day: label,
          year: d.getFullYear(),
          month: d.getMonth(),
          amount: 0,
        });
      }
      rawTransactions.forEach((t) => {
        const tDate = new Date(t.date);
        const entry = monthlyData.find(
          (m) => tDate.getFullYear() === m.year && tDate.getMonth() === m.month,
        );
        if (entry) entry.amount += Number(t.amount);
      });
      return monthlyData.map(({ day, amount }) => ({ day, amount }));
    }
  }, [timeRange, rawTransactions]);

  // ─── Filtered Workout Trend ────────────────────────────────
  const filteredWorkoutTrend = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();

    if (timeRange === "daily") {
      // Last 7 days
      const weekDays: { week: string; dateStr: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-CA");
        weekDays.push({ week: days[d.getDay()], dateStr, count: 0 });
      }
      rawWorkouts.forEach((w) => {
        const wDate = w.date.split("T")[0];
        const entry = weekDays.find((d) => d.dateStr === wDate);
        if (entry) entry.count++;
      });
      return weekDays.map(({ week, count }) => ({ week, count }));
    } else if (timeRange === "weekly") {
      // Last 4 weeks
      const weeks: { week: string; start: Date; end: Date; count: number }[] =
        [];
      for (let i = 3; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const label = i === 0 ? "This Week" : `${i}w ago`;
        weeks.push({ week: label, start, end, count: 0 });
      }
      rawWorkouts.forEach((w) => {
        const wDate = new Date(w.date);
        const entry = weeks.find((wk) => wDate >= wk.start && wDate <= wk.end);
        if (entry) entry.count++;
      });
      return weeks.map(({ week, count }) => ({ week, count }));
    } else {
      // Last 6 months
      const monthlyData: {
        week: string;
        year: number;
        month: number;
        count: number;
      }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = months[d.getMonth()];
        monthlyData.push({
          week: label,
          year: d.getFullYear(),
          month: d.getMonth(),
          count: 0,
        });
      }
      rawWorkouts.forEach((w) => {
        const wDate = new Date(w.date);
        const entry = monthlyData.find(
          (m) => wDate.getFullYear() === m.year && wDate.getMonth() === m.month,
        );
        if (entry) entry.count++;
      });
      return monthlyData.map(({ week, count }) => ({ week, count }));
    }
  }, [timeRange, rawWorkouts]);

  // ─── Filtered Budget Progress ──────────────────────────────
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();

  const filteredBudgetProgress = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA");
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toLocaleDateString("en-CA");
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toLocaleDateString("en-CA");

    return budgets.map((b) => {
      const spent = rawTransactions
        .filter((t) => {
          if (t.category_id !== b.category_id) return false;
          if (timeRange === "daily") return t.date === todayStr;
          if (timeRange === "weekly") return t.date >= weekAgoStr;
          return t.date >= monthStartStr;
        })
        .reduce((s, t) => s + Number(t.amount), 0);

      // Scale limits
      let limit = b.monthly_limit;
      if (timeRange === "daily") {
        limit = Math.round(b.monthly_limit / 30);
      } else if (timeRange === "weekly") {
        limit = Math.round(b.monthly_limit / 4);
      }

      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      return {
        category: b.categories?.name || "Other",
        monthly_limit: limit,
        spent,
        percent,
      };
    });
  }, [timeRange, budgets, rawTransactions]);

  // Dynamic labels based on tab
  const labels = {
    daily: {
      spent: "Spent Today",
      workouts: "Workouts Today",
      tasks: "Pending Tasks",
      focus: "Focus Today",
      categoryChart: "Spending by Category (Today)",
      spendingChart: "Daily Spending (Last 7 Days)",
      workoutChart: "Workout Frequency (Last 7 Days)",
      budgetChart: "Daily Budget Progress",
    },
    weekly: {
      spent: "Spent This Week",
      workouts: "Workouts This Week",
      tasks: "Pending Tasks",
      focus: "Focus This Week",
      categoryChart: "Spending by Category (This Week)",
      spendingChart: "Weekly Spending (Last 4 Weeks)",
      workoutChart: "Workout Frequency (Last 4 Weeks)",
      budgetChart: "Weekly Budget Progress",
    },
    monthly: {
      spent: "Spent This Month",
      workouts: "Workouts This Month",
      tasks: "Pending Tasks",
      focus: "Focus This Month",
      categoryChart: "Spending by Category (This Month)",
      spendingChart: "Monthly Spending (Last 6 Months)",
      workoutChart: "Workout Frequency (Last 6 Months)",
      budgetChart: "Monthly Budget Progress",
    },
  };

  const statsLoading =
    txLoading || woLoading || rawTasksLoading || focusLoading;

  // ─── Stat Cards ───────────────────────────────────────
  const statCards = [
    {
      icon: <DollarSign size={15} />,
      label: labels[timeRange].spent,
      value: statsLoading ? null : formatCurrency(stats[timeRange].spent, currency),
      color: statColors.emerald,
    },
    {
      icon: <Dumbbell size={15} />,
      label: labels[timeRange].workouts,
      value: statsLoading ? null : stats[timeRange].workouts.toString(),
      color: statColors.gold,
    },
    {
      icon: <CheckSquare size={15} />,
      label: labels[timeRange].tasks,
      value: statsLoading ? null : stats[timeRange].tasks.toString(),
      color: statColors.amber,
    },
    {
      icon: <Bell size={15} />,
      label: "Reminders",
      value: remindersLoading ? null : upcomingReminders.length.toString(),
      color: statColors.rose,
    },
    {
      icon: <Timer size={20} />,
      label: labels[timeRange].focus,
      value: statsLoading ? null : formatFocusTime(stats[timeRange].focus),
      color: statColors.blue,
    },
  ];

  const isLoading =
    txLoading ||
    woLoading ||
    catLoading ||
    weeklySpendingLoading ||
    budgetLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageHeader.title}>Welcome back!</h1>
        <p className={pageHeader.subtitle}>
          Here&apos;s your overview for today.
        </p>
      </div>

      {/* Time Range Tabs */}
      <div className="flex gap-2">
        {(["daily", "weekly", "monthly"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {statCards.map((s) => (
          <div key={s.label} className={statCard.container}>
              <p
                className={`${statCard.label} truncate`}
                title={s.label}
              >
                {s.label}
              </p>
            <div className="flex items-center gap-1">
              <div className={`${statCard.iconWrapper} ${s.color}`}>
                {s.icon}
              </div>
              {s.value === null ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className={`${statCard.value} truncate`} title={s.value ?? undefined}>{s.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts - Finance & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title={labels[timeRange].categoryChart}
        >
          {txLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : (
            <SpendingCategoryChart data={filteredCategoryData} />
          )}
        </ChartCard>
        <ChartCard
          title={labels[timeRange].spendingChart}
        >
          {txLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : (
            <WeeklySpendingChart data={filteredSpendingTrend} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title={labels[timeRange].workoutChart}
        >
          {woLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : (
            <WeeklyWorkoutChart data={filteredWorkoutTrend} />
          )}
        </ChartCard>
        <ChartCard
          title={labels[timeRange].budgetChart}
        >
          {txLoading || budgetsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : (
            <BudgetProgressChart data={filteredBudgetProgress} />
          )}
        </ChartCard>
      </div>

      {/* Bottom - Recent & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={card.base}>
          <h3 className={`${sectionHeader.title} mb-4`}>Recent Workouts</h3>
          <div className="space-y-3">
            {recentWorkoutsLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : recentWorkouts.length > 0 ? (
              recentWorkouts.slice(0, 3).map((w) => (
                <div key={w.id} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-[#f3ece3] flex items-center justify-center text-[#8b6914]">
                    <Dumbbell size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate">
                      {w.exercise_name}
                    </p>
                    <p className="text-[var(--color-text-secondary)] text-xs">
                      {w.date}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] capitalize">
                    {w.exercise_type}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[var(--color-text-muted)] text-sm">
                No workouts yet
              </p>
            )}
          </div>
        </div>

        <div className={card.base}>
          <h3 className={`${sectionHeader.title} mb-4`}>Upcoming Reminders</h3>
          <div className="space-y-3">
            {remindersLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : upcomingReminders.length > 0 ? (
              upcomingReminders.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                    <Bell size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate">
                      {r.title}
                    </p>
                    <p className="text-[var(--color-text-secondary)] text-xs">
                      {new Date(r.remind_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {r.repeat !== "none" && (
                    <span className="text-xs bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full">
                      {r.repeat}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[var(--color-text-muted)] text-sm">
                No upcoming reminders
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
