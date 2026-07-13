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
      colors={["#10b981", "#3b82f6", "#f59e0b"]} // Alternates colors across bars
      yFormatter={(v) => `$${v}`}
      yAxisWidth={65}
      tooltipFormatter={(v) => [`$${Number(v).toFixed(2)}`, "Spent"]}
    />
  );
}

