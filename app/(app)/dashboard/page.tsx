"use client";

import { useState, useMemo } from "react";
import { DollarSign, Dumbbell, CheckSquare, Bell, Timer } from "lucide-react";
import Link from "next/link";
import {
  card,
  statCard,
  statColors,
  pageHeader,
  sectionHeader,
  quickAction,
  quickActionColors,
} from "@/lib/theme";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartCard,
  SpendingCategoryChart,
  WeeklySpendingChart,
  WeeklyWorkoutChart,
  BudgetProgressChart,
} from "@/components/charts";
import {
  useTodayFocusMinutes,
} from "@/hooks/useFocus";
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

const quickActions = [
  { href: "/finance", label: "Add Transaction", color: quickActionColors.finance },
  { href: "/workouts", label: "Log Workout", color: quickActionColors.workouts },
  { href: "/tasks", label: "Add Task", color: quickActionColors.tasks },
  { href: "/reminders", label: "Set Reminder", color: quickActionColors.reminders },
];

function formatFocusTime(mins: number) {
  if (mins === 0) return "0m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function DashboardPage() {
  // ─── Finance ───────────────────────────────────────────
  const { data: spentToday = 0, isLoading: spentLoading } = useDashboardSpentToday();
  const { data: categoryData = [], isLoading: catLoading } = useDashboardCategoryData();
  const { data: weeklySpending = [], isLoading: weeklySpendingLoading } = useDashboardWeeklySpending();
  const { data: budgetProgress = [], isLoading: budgetLoading } = useDashboardBudgetProgress();

  // ─── Tasks ─────────────────────────────────────────────
  const { data: pendingTasks = 0, isLoading: tasksLoading } = useDashboardPendingTasks();

  // ─── Reminders ────────────────────────────────────────
  const { data: upcomingReminders = [], isLoading: remindersLoading } = useDashboardUpcomingReminders();

  // ─── Workouts ─────────────────────────────────────────
  const { data: todayWorkouts = 0, isLoading: workoutsLoading } = useDashboardTodayWorkouts();
  const { data: weeklyWorkouts = [], isLoading: weeklyWorkoutsLoading } = useDashboardWeeklyWorkouts();
  const { data: recentWorkouts = [], isLoading: recentWorkoutsLoading } = useDashboardRecentWorkouts(4);

  // ─── Focus ─────────────────────────────────────────────
  const { data: todayFocusMinutes = 0 } = useTodayFocusMinutes();

  // ─── Summary Data ───────────────────────────────────────
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const { data: dailySummary } = useDashboardDailySummary();
  const { data: weeklySummary } = useDashboardWeeklySummary();
  const { data: monthlySummary } = useDashboardMonthlySummary();

  // Aggregate summary based on active tab
  const activeSummary = useMemo(() => {
    if (timeRange === "daily") return dailySummary;
    const data = timeRange === "weekly" ? weeklySummary : monthlySummary;
    if (!data || data.length === 0) return null;
    return {
      total_spent: data.reduce((s, d) => s + d.total_spent, 0),
      workout_count: data.reduce((s, d) => s + d.workout_count, 0),
      tasks_pending: data[data.length - 1]?.tasks_pending ?? 0,
      focus_minutes: data.reduce((s, d) => s + d.focus_minutes, 0),
    };
  }, [timeRange, dailySummary, weeklySummary, monthlySummary]);

  // Dynamic labels based on tab
  const labels = {
    daily: { spent: "Spent Today", workouts: "Workouts Today", tasks: "Pending Tasks", focus: "Focus Today" },
    weekly: { spent: "Spent This Week", workouts: "Workouts This Week", tasks: "Pending Tasks", focus: "Focus This Week" },
    monthly: { spent: "Spent This Month", workouts: "Workouts This Month", tasks: "Pending Tasks", focus: "Focus This Month" },
  };

  // ─── Stat Cards ───────────────────────────────────────
  const statCards = [
    {
      icon: <DollarSign size={20} />,
      label: labels[timeRange].spent,
      value: spentLoading ? null : `$${(activeSummary?.total_spent ?? spentToday).toFixed(2)}`,
      color: statColors.emerald,
    },
    {
      icon: <Dumbbell size={20} />,
      label: labels[timeRange].workouts,
      value: workoutsLoading ? null : (activeSummary?.workout_count ?? todayWorkouts).toString(),
      color: statColors.gold,
    },
    {
      icon: <CheckSquare size={20} />,
      label: labels[timeRange].tasks,
      value: tasksLoading ? null : (activeSummary?.tasks_pending ?? pendingTasks).toString(),
      color: statColors.amber,
    },
    {
      icon: <Bell size={20} />,
      label: "Reminders",
      value: remindersLoading ? null : upcomingReminders.length.toString(),
      color: statColors.rose,
    },
    {
      icon: <Timer size={20} />,
      label: labels[timeRange].focus,
      value: formatFocusTime(activeSummary?.focus_minutes ?? todayFocusMinutes),
      color: statColors.blue,
    },
  ];

  const isLoading = spentLoading || catLoading || weeklySpendingLoading || budgetLoading;

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={statCard.container}>
            <div className="flex items-center gap-3">
              <div className={`${statCard.iconWrapper} ${s.color}`}>
                {s.icon}
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <p className={statCard.label}>{s.label}</p>
                {s.value === null ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <p className={statCard.value}>{s.value}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts - Finance & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Spending by Category">
          {catLoading ? (
            <div className="space-y-3"><Skeleton className="h-[200px] w-full" /></div>
          ) : (
            <SpendingCategoryChart data={categoryData} />
          )}
        </ChartCard>
        <ChartCard title="Weekly Spending">
          {weeklySpendingLoading ? (
            <div className="space-y-3"><Skeleton className="h-[200px] w-full" /></div>
          ) : (
            <WeeklySpendingChart data={weeklySpending} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Workout Frequency">
          {weeklyWorkoutsLoading ? (
            <div className="space-y-3"><Skeleton className="h-[200px] w-full" /></div>
          ) : (
            <WeeklyWorkoutChart data={weeklyWorkouts} />
          )}
        </ChartCard>
        <ChartCard title="Budget Progress">
          {budgetLoading ? (
            <div className="space-y-3"><Skeleton className="h-[200px] w-full" /></div>
          ) : (
            <BudgetProgressChart data={budgetProgress} />
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
          <h3 className={`${sectionHeader.title} mb-4`}>
            Upcoming Reminders
          </h3>
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

      {/* Quick Actions */}
      <div className={card.base}>
        <h3 className={`${sectionHeader.title} mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={quickAction.base}
            >
              <div className={`${quickAction.dot} ${action.color}`} />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
