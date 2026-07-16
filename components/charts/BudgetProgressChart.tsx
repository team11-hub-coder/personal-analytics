"use client";

import { useProfile } from "@/hooks/useProfile";
import { currencies } from "@/lib/currency";

interface BudgetItem {
  category: string;
  monthly_limit: number;
  spent: number;
  percent: number;
}

interface BudgetProgressChartProps {
  data: BudgetItem[];
}

export default function BudgetProgressChart({
  data,
}: BudgetProgressChartProps) {
  const { data: profile } = useProfile();
  const currency = profile?.currency || "USD";
  const symbol = currencies.find((c) => c.code === currency)?.symbol || currency;
  const fmt = (v: number) => `${Math.round(v).toLocaleString()} ${symbol}`;

  if (!data || data.length === 0) {
    return (
      <p className="text-[var(--color-text-muted)] text-sm">No budget data</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((b) => (
        <div key={b.category} className="space-y-2">
          <div className="flex justify-between text-sm gap-2 min-w-0">
            <span className="capitalize font-medium text-[var(--color-text-secondary)] truncate">
              {b.category}
            </span>
            <span className="text-[var(--color-text-secondary)] whitespace-nowrap shrink-0">
              {fmt(b.spent)} / {fmt(b.monthly_limit)}
            </span>
          </div>
          <div className="w-full bg-[var(--color-surface-hover)] rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                b.percent > 90
                  ? "bg-red-500"
                  : b.percent > 70
                    ? "bg-amber-500"
                    : "bg-[#10b981]"
              }`}
              style={{ width: `${Math.min(b.percent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {Math.round(b.percent)}% used
          </p>
        </div>
      ))}
    </div>
  );
}
