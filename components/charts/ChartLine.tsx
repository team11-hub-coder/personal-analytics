"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { chartColors } from "@/lib/theme";

interface ChartLineProps {
  /** Chart data array */
  data: Record<string, unknown>[];
  /** Object key for the X axis */
  xKey: string;
  /** Object key for the Y axis */
  yKey: string;
  /** Stroke color — defaults to chartColors[0] (gold) */
  color?: string;
  /** Line interpolation type */
  type?: "monotone" | "linear" | "step" | "stepBefore" | "stepAfter";
  /** Line stroke width */
  strokeWidth?: number;
  /** Show dots on data points */
  dot?: boolean;
  /** Dot radius */
  dotRadius?: number;
  /** Y axis tick formatter */
  yFormatter?: (value: number) => string;
  /** Tooltip value formatter */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tooltipFormatter?: (value: any, name: any) => [string, string];
  /** Tooltip label formatter */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tooltipLabelFormatter?: (label: any) => string;
  /** Show background grid lines */
  showGrid?: boolean;
  /** Chart height in px */
  height?: number;
  /** Empty state message */
  emptyText?: string;
  /** Optional second line for dual-axis charts */
  secondLine?: {
    yKey: string;
    color?: string;
    label?: string;
  };
}

export default function ChartLine({
  data,
  xKey,
  yKey,
  color = chartColors[0],
  type = "monotone",
  strokeWidth = 2,
  dot = true,
  dotRadius = 4,
  yFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  showGrid = false,
  height = 200,
  emptyText = "No data yet",
  secondLine,
}: ChartLineProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-[var(--color-text-muted)] text-sm">{emptyText}</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={yFormatter}
          width={yFormatter ? 45 : 30}
        />
        <Tooltip
          formatter={tooltipFormatter}
          labelFormatter={tooltipLabelFormatter}
          contentStyle={{
            backgroundColor: "var(--chart-tooltip-bg)",
            color: "var(--chart-tooltip-text)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
          }}
        />
        <Line
          type={type}
          dataKey={yKey}
          stroke={color}
          strokeWidth={strokeWidth}
          dot={dot ? { r: dotRadius, fill: color } : false}
          activeDot={{ r: dotRadius + 2 }}
        />
        {secondLine && (
          <Line
            type={type}
            dataKey={secondLine.yKey}
            stroke={secondLine.color ?? chartColors[1]}
            strokeWidth={strokeWidth}
            dot={dot ? { r: dotRadius, fill: secondLine.color ?? chartColors[1] } : false}
            activeDot={{ r: dotRadius + 2 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
