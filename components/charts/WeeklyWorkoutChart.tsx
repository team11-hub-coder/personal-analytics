"use client";

import { ChartBar } from "@/components/charts";

interface WeeklyWorkoutChartProps {
  data: { week: string; count: number }[];
}

export default function WeeklyWorkoutChart({
  data,
}: WeeklyWorkoutChartProps) {
  return (
    <ChartBar
      data={data}
      xKey="week"
      yKey="count"
      colors={["#10b981", "#3b82f6", "#f59e0b"]}
      tooltipFormatter={(v) => [String(v), "Workouts"]}
    />
  );
}
