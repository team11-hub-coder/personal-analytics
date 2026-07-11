"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import ChartBar from "./ChartBar";
import { chartColors } from "@/lib/theme";

export default function ProductivityChart() {
  const { data: completedTasks } = useTasks({ status: "completed" });

  const chartData = useMemo(() => {
    if (!completedTasks || completedTasks.length === 0) return [];

    // Get last 7 days
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const label = date.toLocaleDateString("en-US", { weekday: "short" });
      days.push({ date: dateStr, label, count: 0 });
    }

    // Count tasks completed per day
    completedTasks.forEach((task) => {
      if (task.completed_at) {
        const completedDate = task.completed_at.split("T")[0];
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
      color={chartColors[1]}
      height={200}
      showLabels
      labelFormatter={(v: number) => v.toString()}
      emptyText="No completed tasks yet"
    />
  );
}
