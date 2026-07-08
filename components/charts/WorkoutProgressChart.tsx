"use client";

import { ChartLine } from "@/components/charts";

interface WorkoutProgressChartProps {
  data: { date: string; weight: number }[];
}

export default function WorkoutProgressChart({
  data,
}: WorkoutProgressChartProps) {
  return (
    <ChartLine
      data={data}
      xKey="date"
      yKey="weight"
      yFormatter={(v) => `${v}kg`}
      tooltipFormatter={(v) => [`${v}kg`, "Weight"]}
    />
  );
}
