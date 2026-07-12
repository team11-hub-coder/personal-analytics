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
      color="var(--chart-bar-2)"
      tooltipFormatter={(v) => [String(v), "Workouts"]}
    />
  );
}
