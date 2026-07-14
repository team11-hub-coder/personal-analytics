"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateBudget } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { budgetSchema, type BudgetFormData } from "@/lib/validations";
import { button } from "@/lib/theme";
import { Plus, Loader2, X } from "lucide-react";

interface BudgetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  existingCategoryIds?: number[];
}

export default function BudgetForm({
  onSuccess,
  onCancel,
  existingCategoryIds = [],
}: BudgetFormProps) {
  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
  });

  // Filter out categories that already have budgets
  const availableCategories =
    categories?.filter(
      (c) => !existingCategoryIds.includes(c.id)
    ) || [];

  const onSubmit = (data: BudgetFormData) => {
    createBudget.mutate(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 bg-[var(--color-surface-hover)] rounded-lg space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Category
          </label>
          <select
            {...register("category_id", { valueAsNumber: true })}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="text-xs text-red-500 mt-1">
              {errors.category_id.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Monthly Limit
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register("monthly_limit", { valueAsNumber: true })}
            placeholder="0"
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          />
          {errors.monthly_limit && (
            <p className="text-xs text-red-500 mt-1">
              {errors.monthly_limit.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={createBudget.isPending || availableCategories.length === 0}
          className={`flex items-center gap-2 ${button.primary} px-4 py-2 rounded-lg text-sm disabled:opacity-50`}
        >
          {createBudget.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          {availableCategories.length === 0
            ? "All categories have budgets"
            : "Add Budget"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`${button.ghost} px-4 py-2 rounded-lg text-sm`}
          >
            <X size={14} className="mr-1" />
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
