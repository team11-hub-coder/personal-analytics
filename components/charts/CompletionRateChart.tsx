"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import ChartLine from "./ChartLine";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors } from "@/lib/theme";

export default function CompletionRateChart() {
  const { data: allTasks, isLoading } = useTasks();

  const chartData = useMemo(() => {
    if (!allTasks || allTasks.length === 0) return [];

    // Get last 7 days
    const days: { date: string; label: string; total: number; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const label = date.toLocaleDateString("en-US", { weekday: "short" });
      days.push({ date: dateStr, label, total: 0, completed: 0 });
    }

    // Count tasks created and completed per day
    allTasks.forEach((task) => {
      const createdDate = task.created_at.split("T")[0];
      const createdDay = days.find((d) => d.date === createdDate);
      if (createdDay) createdDay.total++;

      if (task.completed_at) {
        const completedDate = task.completed_at.split("T")[0];
        const completedDay = days.find((d) => d.date === completedDate);
        if (completedDay) completedDay.completed++;
      }
    });

    // Calculate completion rate percentage
    return days.map((d) => ({
      name: d.label,
      rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
    }));
  }, [allTasks]);

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  return (
    <ChartLine
      data={chartData}
      xKey="name"
      yKey="rate"
      color={chartColors[0]}
      height={200}
      yFormatter={(v: number) => `${v}%`}
      tooltipFormatter={(v: number) => [`${v}%`, "Completion Rate"]}
      emptyText="No task data yet"
    />
  );
}
