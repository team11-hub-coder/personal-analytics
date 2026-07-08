"use client";

import { ChartPie } from "@/components/charts";

interface SpendingCategoryChartProps {
  data: { name: string; value: number }[];
}

export default function SpendingCategoryChart({
  data,
}: SpendingCategoryChartProps) {
  return <ChartPie data={data} />;
}
