"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import ChartBar from "./ChartBar";
import { chartColors } from "@/lib/theme";
import { getLocalDateString } from "@/lib/dates";

export default function ProductivityChart() {
  const { data: completedTasks } = useTasks({ status: "completed" });

  const chartData = useMemo(() => {
    if (!completedTasks || completedTasks.length === 0) return [];

    // Get last 7 days
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = getLocalDateString(date);
      const label = date.toLocaleDateString("en-US", { weekday: "short" });
      days.push({ date: dateStr, label, count: 0 });
    }

    // Count tasks completed per day (convert UTC timestamps to local dates)
    completedTasks.forEach((task) => {
      if (task.completed_at) {
        const completedDate = getLocalDateString(new Date(task.completed_at));
        const day = days.find((d) => d.date === completedDate);
        if (day) day.count++;
      }
    });

    return days.map((d) => ({ name: d.label, tasks: d.count }));
  }, [completedTasks]);

  return (
    <ChartBar
      data={chartData}
      xKey="name"
      yKey="tasks"
      colors={["#10b981", "#3b82f6", "#f59e0b"]}
      height={200}
      showLabels
      labelFormatter={(v: number) => v.toString()}
      emptyText="No completed tasks yet"
    />
  );
}
