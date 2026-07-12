"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  type BarProps,
} from "recharts";
import { chartColors } from "@/lib/theme";

interface ChartBarProps {
  /** Chart data array — each object has at least xKey and yKey fields */
  data: Record<string, unknown>[];
  /** Object key for the X axis */
  xKey: string;
  /** Object key for the Y axis */
  yKey: string;
  /** Fill color — defaults to chartColors[0] (gold) */
  color?: string;
  /** Per-bar colors — overrides `color` when provided */
  colors?: string[];
  /** Bar border radius [topLeft, topRight, bottomLeft, bottomRight] */
  radius?: [number, number, number, number];
  /** Y axis tick formatter (e.g. v => `$${v}`) */
  yFormatter?: (value: number) => string;
  /** Tooltip value formatter */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tooltipFormatter?: (value: any, name: any) => [string, string];
  /** Tooltip label formatter */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tooltipLabelFormatter?: (label: any) => string;
  /** Bar props spread onto <Bar> */
  barProps?: Partial<BarProps>;
  /** Show value labels on top of bars */
  showLabels?: boolean;
  /** Label formatter for top-of-bar labels */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labelFormatter?: (value: any) => string;
  /** Chart height in px */
  height?: number;
  /** Empty state message */
  emptyText?: string;
}

export default function ChartBar({
  data,
  xKey,
  yKey,
  color = chartColors[0],
  colors,
  radius = [4, 4, 0, 0],
  yFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  barProps,
  showLabels = false,
  labelFormatter,
  height = 200,
  emptyText = "No data yet",
}: ChartBarProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-[var(--color-text-muted)] text-sm">{emptyText}</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
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
          cursor={{ fill: "var(--color-surface-hover)" }}
          contentStyle={{
            backgroundColor: "var(--chart-tooltip-bg)",
            color: "var(--chart-tooltip-text)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
          }}
        />
        <Bar
          dataKey={yKey}
          radius={radius}
          maxBarSize={40}
          {...barProps}
        >
          {colors?.length
            ? data.map((_, i) => (
                <Cell
                  key={i}
                  fill={colors[i % colors.length]}
                />
              ))
            : (
                <Cell fill={color} />
              )
          }
          {showLabels && labelFormatter && (
            <LabelList
              dataKey={yKey}
              position="top"
              formatter={labelFormatter}
              style={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
