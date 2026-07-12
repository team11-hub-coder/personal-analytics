"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";
import { chartColors } from "@/lib/theme";

interface ChartPieProps {
  /** Data array — each object needs `name` and `value` */
  data: { name: string; value: number }[];
  /** Inner radius for donut mode (0 = full pie) */
  innerRadius?: number;
  /** Outer radius */
  outerRadius?: number;
  /** Color array — defaults to chartColors */
  colors?: readonly string[];
  /** Tooltip value formatter */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tooltipFormatter?: (value: any) => string;
  /** Show a legend below/beside the chart */
  showLegend?: boolean;
  /** Legend value formatter */
  legendFormatter?: (item: { name: string; value: number }) => string;
  /** Pie padding angle between slices */
  paddingAngle?: number;
  /** Custom label renderer */
  renderLabel?: (props: PieLabelRenderProps) => string;
  /** Chart size */
  size?: number;
  /** Chart height (overrides size when using responsive layout) */
  height?: number;
  /** Empty state message */
  emptyText?: string;
  /** Layout: 'row' puts legend beside chart, 'col' stacks them */
  layout?: "row" | "col";
}

export default function ChartPie({
  data,
  innerRadius = 40,
  outerRadius = 70,
  colors = chartColors,
  tooltipFormatter,
  showLegend = true,
  legendFormatter,
  paddingAngle = 2,
  renderLabel,
  size,
  height,
  emptyText = "No data yet",
  layout = "row",
}: ChartPieProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-[var(--color-text-muted)] text-sm">{emptyText}</p>
    );
  }

  const defaultTooltip = (v: unknown) => `$${Number(v).toFixed(2)}`;
  const fmt = tooltipFormatter ?? defaultTooltip;

  const legendFmt =
    legendFormatter ??
    ((item: { name: string; value: number }) => `$${item.value.toFixed(2)}`);

  const safeColors = colors.length > 0 ? colors : chartColors;

  const pieSize = size ?? 160;
  const chartHeight = height ?? pieSize;

  return (
    <div
      className={`flex ${
        layout === "row"
          ? "flex-col sm:flex-row items-center gap-4 sm:gap-6"
          : "flex-col items-center gap-4"
      }`}
    >
      <ResponsiveContainer width={pieSize} height={chartHeight}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            paddingAngle={paddingAngle}
            label={renderLabel}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={safeColors[i % safeColors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={fmt}
            contentStyle={{
              backgroundColor: "var(--chart-tooltip-bg)",
              color: "var(--chart-tooltip-text)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {showLegend && (
        <div className="space-y-2 text-sm">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: safeColors[i % safeColors.length] }}
              />
              <span className="capitalize text-[var(--color-text-secondary)]">
                {item.name}
              </span>
              <span className="font-medium text-[var(--color-text)] ml-auto">
                {legendFmt(item)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
