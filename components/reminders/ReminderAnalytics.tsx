"use client";

import { useMemo } from "react";
import { TrendingUp, Repeat, CheckCircle } from "lucide-react";
import ChartPie from "@/components/charts/ChartPie";
import ChartBar from "@/components/charts/ChartBar";
import { useReminders } from "@/hooks/useReminders";
import { statCard, statColors } from "@/lib/theme";

export function ReminderAnalytics() {
  const { data: reminders = [], isLoading } = useReminders();

  // Adherence rate: % of reminders that were toggled off (completed) before becoming overdue
  const { adherenceRate, completedOnTime, totalCompleted } = useMemo(() => {
    const completed = reminders.filter((r) => !r.is_active);
    const onTime = completed.filter(
      (r) => new Date(r.remind_at) >= new Date(r.created_at)
    );
    const rate = completed.length > 0
      ? Math.round((onTime.length / completed.length) * 100)
      : 0;
    return { adherenceRate: rate, completedOnTime: onTime.length, totalCompleted: completed.length };
  }, [reminders]);

  // Repeat type distribution
  const repeatData = useMemo(() => {
    const counts: Record<string, number> = { none: 0, daily: 0, weekly: 0, monthly: 0 };
    for (const r of reminders) {
      counts[r.repeat] = (counts[r.repeat] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [reminders]);

  // Reminders created per month (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { name: string; value: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const count = reminders.filter((r) => {
        const created = new Date(r.created_at);
        return (
          created.getMonth() === d.getMonth() &&
          created.getFullYear() === d.getFullYear()
        );
      }).length;
      months.push({ name: label, value: count });
    }

    return months;
  }, [reminders]);

  // Overdue vs active vs completed
  const statusData = useMemo(() => {
    const now = new Date();
    const overdue = reminders.filter((r) => r.is_active && new Date(r.remind_at) < now).length;
    const active = reminders.filter((r) => r.is_active && new Date(r.remind_at) >= now).length;
    const completed = reminders.filter((r) => !r.is_active).length;

    return [
      { name: "Overdue", value: overdue },
      { name: "Active", value: active },
      { name: "Completed", value: completed },
    ].filter((d) => d.value > 0);
  }, [reminders]);

  if (isLoading || reminders.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
        Reminder Analytics
      </h3>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={statCard.container}>
          <div className="flex items-center gap-3">
            <div className={`${statCard.iconWrapper} ${statColors.emerald}`}>
              <CheckCircle size={20} />
            </div>
            <div>
              <p className={statCard.label}>Adherence Rate</p>
              <p className={statCard.value}>{adherenceRate}%</p>
            </div>
          </div>
        </div>
        <div className={statCard.container}>
          <div className="flex items-center gap-3">
            <div className={`${statCard.iconWrapper} ${statColors.blue}`}>
              <TrendingUp size={20} />
            </div>
            <div>
              <p className={statCard.label}>Completed On Time</p>
              <p className={statCard.value}>{completedOnTime}/{totalCompleted}</p>
            </div>
          </div>
        </div>
        <div className={statCard.container}>
          <div className="flex items-center gap-3">
            <div className={`${statCard.iconWrapper} ${statColors.amber}`}>
              <Repeat size={20} />
            </div>
            <div>
              <p className={statCard.label}>Recurring</p>
              <p className={statCard.value}>
                {reminders.filter((r) => r.repeat !== "none").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className={statCard.container}>
          <p className="text-sm font-medium mb-4" style={{ color: "var(--color-text)" }}>
            Status Breakdown
          </p>
          <ChartPie
            data={statusData}
            innerRadius={35}
            outerRadius={60}
            tooltipFormatter={(v) => `${v} reminders`}
            legendFormatter={(item) => `${item.name}: ${item.value}`}
            layout="col"
            height={160}
          />
        </div>

        {/* Repeat type distribution */}
        <div className={statCard.container}>
          <p className="text-sm font-medium mb-4" style={{ color: "var(--color-text)" }}>
            Repeat Types
          </p>
          <ChartPie
            data={repeatData}
            innerRadius={35}
            outerRadius={60}
            tooltipFormatter={(v) => `${v} reminders`}
            legendFormatter={(item) => `${item.name}: ${item.value}`}
            layout="col"
            height={160}
          />
        </div>
      </div>

      {/* Monthly chart */}
      <div className={statCard.container}>
        <p className="text-sm font-medium mb-4" style={{ color: "var(--color-text)" }}>
          Reminders Created (Last 6 Months)
        </p>
        <ChartBar
          data={monthlyData}
          xKey="name"
          yKey="value"
          yFormatter={(v) => `${v}`}
          showLabels
          labelFormatter={(v) => `${v}`}
          height={180}
        />
      </div>
    </div>
  );
}
