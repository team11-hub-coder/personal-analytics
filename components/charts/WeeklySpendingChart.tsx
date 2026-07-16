"use client";

import { ChartBar } from "@/components/charts";
import { useProfile } from "@/hooks/useProfile";
import { currencies } from "@/lib/currency";

interface WeeklySpendingChartProps {
  data: { day: string; amount: number }[];
}

export default function WeeklySpendingChart({
  data,
}: WeeklySpendingChartProps) {
  const { data: profile } = useProfile();
  const currency = profile?.currency || "USD";
  const symbol = currencies.find((c) => c.code === currency)?.symbol || currency;

  const chartFormat = (v: number) => `${Math.round(v).toLocaleString()} ${symbol}`;

  return (
    <ChartBar
      data={data}
      xKey="day"
      yKey="amount"
      colors={["#10b981", "#3b82f6", "#f59e0b"]}
      yFormatter={(v) => chartFormat(Number(v))}
      yAxisWidth={90}
      tooltipFormatter={(v) => [chartFormat(Number(v)), "Spent"]}
    />
  );
}

