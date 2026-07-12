"use client";

import { ChartBar } from "@/components/charts";

interface WeeklyFocusChartProps {
  data: { name: string; minutes: number }[];
}

export default function WeeklyFocusChart({ data }: WeeklyFocusChartProps) {
  return (
    <ChartBar
      data={data}
      xKey="name"
      yKey="minutes"
      color="var(--chart-bar-6)"
      tooltipFormatter={(v) => [String(v), "Minutes"]}
      emptyText="No focus data yet"
    />
  );
}
