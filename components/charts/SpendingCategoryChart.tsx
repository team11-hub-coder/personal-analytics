"use client";

import { ChartPie } from "@/components/charts";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency } from "@/lib/currency";

interface SpendingCategoryChartProps {
  data: { name: string; value: number }[];
}

export default function SpendingCategoryChart({
  data,
}: SpendingCategoryChartProps) {
  const { data: profile } = useProfile();
  const currency = profile?.currency || "USD";

  return (
    <ChartPie
      data={data}
      tooltipFormatter={(v) => formatCurrency(Number(v), currency)}
      legendFormatter={(item) => formatCurrency(item.value, currency)}
    />
  );
}
