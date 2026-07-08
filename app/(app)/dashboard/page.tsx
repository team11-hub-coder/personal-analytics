"use client";

import { DollarSign, Dumbbell, CheckSquare, Bell } from "lucide-react";
import Link from "next/link";
import {
  card,
  statCard,
  statColors,
  pageHeader,
  sectionHeader,
  quickAction,
} from "@/lib/theme";
import {
  ChartCard,
  SpendingCategoryChart,
  WeeklySpendingChart,
  WeeklyWorkoutChart,
  BudgetProgressChart,
} from "@/components/charts";
import {
  getTodaySpent,
  getTodayWorkouts,
  getPendingTasks,
  getUpcomingReminders,
  getCategoryData,
  getWeeklySpending,
  getWeeklyWorkouts,
  getBudgetProgress,
  mockWorkouts,
} from "@/lib/mock/data";

const statCards = [
  {
    icon: <DollarSign size={20} />,
    label: "Spent Today",
    value: `$${getTodaySpent().toFixed(2)}`,
    color: statColors.emerald,
  },
  {
    icon: <Dumbbell size={20} />,
    label: "Workouts Today",
    value: getTodayWorkouts().toString(),
    color: statColors.gold,
  },
  {
    icon: <CheckSquare size={20} />,
    label: "Pending Tasks",
    value: getPendingTasks().toString(),
    color: statColors.amber,
  },
  {
    icon: <Bell size={20} />,
    label: "Upcoming Reminders",
    value: getUpcomingReminders().length.toString(),
    color: statColors.rose,
  },
];

const quickActions = [
  { href: "/finance", label: "Add Transaction", color: "bg-emerald-500" },
  { href: "/workouts", label: "Log Workout", color: "bg-[#8b6914]" },
  { href: "/tasks", label: "Add Task", color: "bg-amber-500" },
  { href: "/reminders", label: "Set Reminder", color: "bg-rose-500" },
];

export default function DashboardPage() {
  const upcomingReminders = getUpcomingReminders();
  const recentWorkouts = mockWorkouts.slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageHeader.title}>Welcome back!</h1>
        <p className={pageHeader.subtitle}>
          Here&apos;s your overview for today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s) => (
          <div key={s.label} className={statCard.container}>
            <div className="flex items-center gap-3">
              <div className={`${statCard.iconWrapper} ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className={statCard.label}>{s.label}</p>
                <p className={statCard.value}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row - Finance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Spending by Category">
          <SpendingCategoryChart data={getCategoryData()} />
        </ChartCard>
        <ChartCard title="This Week's Spending">
          <WeeklySpendingChart data={getWeeklySpending()} />
        </ChartCard>
      </div>

      {/* Charts Row - Workouts & Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Weekly Workout Frequency">
          <WeeklyWorkoutChart data={getWeeklyWorkouts()} />
        </ChartCard>
        <ChartCard title="Budget Progress (July)">
          <BudgetProgressChart data={getBudgetProgress()} />
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={card.base}>
          <h3 className={`${sectionHeader.title} mb-4`}>Recent Workouts</h3>
          <div className="space-y-3">
            {recentWorkouts.map((w) => (
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
            ))}
          </div>
        </div>

        <div className={card.base}>
          <h3 className={`${sectionHeader.title} mb-4`}>
            Upcoming Reminders
          </h3>
          <div className="space-y-3">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((r) => (
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

        <div className={card.base}>
          <h3 className={`${sectionHeader.title} mb-4`}>Quick Actions</h3>
          <div className="space-y-3">
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
    </div>
  );
}
