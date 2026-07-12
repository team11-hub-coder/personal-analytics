"use client";

interface BudgetItem {
  id: number;
  user_id: string;
  category_id: number;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
  spent: number;
  percent: number;
}

interface BudgetProgressChartProps {
  data: BudgetItem[];
}

export default function BudgetProgressChart({
  data,
}: BudgetProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-[var(--color-text-muted)] text-sm">No budget data</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((b) => (
        <div key={b.id} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="capitalize font-medium text-[var(--color-text-secondary)]">
              Category {b.category_id}
            </span>
            <span className="text-[var(--color-text-secondary)]">
              ${b.spent.toFixed(0)} / ${b.monthly_limit}
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
