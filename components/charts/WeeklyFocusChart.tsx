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
      colors={["#10b981", "#3b82f6", "#f59e0b"]}
      tooltipFormatter={(v) => [String(v), "Minutes"]}
      emptyText="No focus data yet"
    />
  );
}
