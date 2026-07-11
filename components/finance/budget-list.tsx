"use client";

import { useState } from "react";
import {
  useBudgets,
  useUpdateBudget,
  useDeleteBudget,
} from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useExpenses";
import { card, button } from "@/lib/theme";
import { formatCurrency } from "@/lib/currency";
import { useProfile } from "@/hooks/useProfile";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Wallet,
  X,
  Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import BudgetForm from "./budget-form";

export default function BudgetList() {
  const { data: budgets, isLoading } = useBudgets();
  const { data: profile } = useProfile();
  const [isAdding, setIsAdding] = useState(false);

  const currency = profile?.currency || "MMK";

  if (isLoading) {
    return (
      <div className={card.base}>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const existingCategoryIds = budgets?.map((b) => b.category_id) || [];

  return (
    <div className={card.base}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--color-text)]">
          Monthly Budgets
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className={`flex items-center gap-2 ${button.primary} px-3 py-1.5 rounded-lg text-sm`}
        >
          <Plus size={14} />
          Add Budget
        </button>
      </div>

      {/* Add form */}
      {isAdding && (
        <BudgetForm
          existingCategoryIds={existingCategoryIds}
          onSuccess={() => setIsAdding(false)}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* Budget list */}
      {budgets && budgets.length > 0 ? (
        <div className="space-y-3 mt-4">
          {budgets.map((budget) => (
            <BudgetItem
              key={budget.id}
              budget={budget}
              currency={currency}
            />
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="text-center py-8">
            <Wallet
              size={48}
              className="mx-auto text-[var(--color-text-muted)] mb-3"
            />
            <p className="text-[var(--color-text-secondary)]">
              No budgets set yet
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Add a budget to track your spending limits
            </p>
          </div>
        )
      )}
    </div>
  );
}

function BudgetItem({
  budget,
  currency,
}: {
  budget: {
    id: number;
    category_id: number;
    monthly_limit: number;
    categories: { id: number; name: string } | null;
  };
  currency: string;
}) {
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();
  const { data: transactions } = useTransactions();
  const [isEditing, setIsEditing] = useState(false);

  // Calculate spent amount for this category in current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const spent =
    transactions
      ?.filter(
        (t) =>
          t.category_id === budget.category_id &&
          t.date.startsWith(currentMonth)
      )
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const limit = Number(budget.monthly_limit);
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isOverBudget = spent > limit;

  const handleUpdate = (newLimit: number) => {
    updateBudget.mutate(
      { id: budget.id, monthly_limit: newLimit },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleDelete = () => {
    if (confirm(`Delete budget for "${budget.categories?.name}"?`)) {
      deleteBudget.mutate(budget.id);
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-[var(--color-surface-hover)] rounded-lg">
        <p className="text-sm font-medium text-[var(--color-text)] mb-2">
          {budget.categories?.name}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="1"
            min="0"
            defaultValue={budget.monthly_limit}
            id={`budget-limit-${budget.id}`}
            className="flex-1 border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => {
              const input = document.getElementById(
                `budget-limit-${budget.id}`
              ) as HTMLInputElement;
              handleUpdate(parseFloat(input.value));
            }}
            disabled={updateBudget.isPending}
            className={`${button.primary} px-3 py-1.5 rounded-lg text-sm`}
          >
            {updateBudget.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className={`${button.ghost} px-3 py-1.5 rounded-lg text-sm`}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-[var(--color-surface-hover)] rounded-lg group">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-[var(--color-text)]">
          {budget.categories?.name}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              isOverBudget ? "text-red-500" : "text-[var(--color-text-secondary)]"
            }`}
          >
            {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteBudget.isPending}
              className="p-1 text-[var(--color-text-muted)] hover:text-red-500"
            >
              {deleteBudget.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[var(--color-border)] rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isOverBudget
              ? "bg-red-500"
              : percentage > 80
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isOverBudget && (
        <p className="text-xs text-red-500 mt-1">
          ⚠️ Over budget by {formatCurrency(spent - limit, currency)}
        </p>
      )}
    </div>
  );
}
