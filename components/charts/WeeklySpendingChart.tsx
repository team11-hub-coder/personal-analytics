"use client";

import { ChartBar } from "@/components/charts";

interface WeeklySpendingChartProps {
  data: { day: string; amount: number }[];
}

export default function WeeklySpendingChart({
  data,
}: WeeklySpendingChartProps) {
  return (
    <ChartBar
      data={data}
      xKey="day"
      yKey="amount"
      yFormatter={(v) => `$${v}`}
      tooltipFormatter={(v) => [`$${Number(v).toFixed(2)}`, "Spent"]}
    />
  );
}
