"use client";

import { useExpenseAnalysis } from "@/hooks/useExpenseAnalysis";
import { formatCurrency } from "@/lib/currency";
import { card } from "@/lib/theme";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExpenseAnalysis() {
  const {
    isLoading,
    currency,
    totalExpenses,
    totalBudget,
    budgetUsage,
    dailyAverage,
    projectedTotal,
    overBudgetCategories,
    transactionCount,
  } = useExpenseAnalysis();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={card.base}>
          <p className="text-xs text-[var(--color-text-muted)] mb-1">
            Total Spent ({new Date().toLocaleDateString("en-US", { month: "short" })})
          </p>
          <p className="text-xl font-bold text-[var(--color-text)]">
            {formatCurrency(totalExpenses, currency)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {transactionCount} transactions
          </p>
        </div>
        <div className={card.base}>
          <p className="text-xs text-[var(--color-text-muted)] mb-1">
            Daily Average
          </p>
          <p className="text-xl font-bold text-[var(--color-text)]">
            {formatCurrency(dailyAverage, currency)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">per day</p>
        </div>
        <div className={card.base}>
          <p className="text-xs text-[var(--color-text-muted)] mb-1">
            Projected (End of Month)
          </p>
          <p className="text-xl font-bold text-[var(--color-text)]">
            {formatCurrency(projectedTotal, currency)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {projectedTotal > totalBudget ? (
              <TrendingUp size={12} className="text-red-500" />
            ) : (
              <TrendingDown size={12} className="text-green-500" />
            )}
            <p
              className={`text-xs ${
                projectedTotal > totalBudget ? "text-red-500" : "text-green-500"
              }`}
            >
              {projectedTotal > totalBudget ? "Over" : "Under"} budget
            </p>
          </div>
        </div>
        <div className={card.base}>
          <p className="text-xs text-[var(--color-text-muted)] mb-1">
            Budget Used
          </p>
          <p className="text-xl font-bold text-[var(--color-text)]">
            {budgetUsage.toFixed(0)}%
          </p>
          <div className="w-full bg-[var(--color-border)] rounded-full h-1.5 mt-2">
            <div
              className={`h-1.5 rounded-full ${
                budgetUsage > 100
                  ? "bg-red-500"
                  : budgetUsage > 80
                  ? "bg-amber-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(budgetUsage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Over Budget Warning */}
      {overBudgetCategories.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="font-medium text-red-700">Over Budget</p>
          </div>
          <div className="space-y-1">
            {overBudgetCategories.map((cat) => (
              <p key={cat.category_id} className="text-sm text-red-600">
                {cat.category_name}:{" "}
                {formatCurrency(cat.spent - cat.budget_limit, currency)} over
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
