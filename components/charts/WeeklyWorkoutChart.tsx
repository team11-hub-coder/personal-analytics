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
      color="#10b981"
      tooltipFormatter={(v) => [String(v), "Workouts"]}
    />
  );
}
