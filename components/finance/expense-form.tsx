"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateTransaction } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { transactionSchema, type TransactionFormData } from "@/lib/validations";
import { button } from "@/lib/theme";
import { Plus, Loader2, X } from "lucide-react";

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      entry_source: "manual_form",
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    createTransaction.mutate(
      {
        ...data,
        category_id: Number(data.category_id),
      },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      }
    );
  };

  // Filter to only show system categories + user's custom categories
  const availableCategories = categories || [];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 bg-[var(--color-surface-hover)] rounded-lg space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Amount
          </label>
          <input
            type="number"
            step="1"
            min="0"
            {...register("amount", { valueAsNumber: true })}
            placeholder="0"
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          />
          {errors.amount && (
            <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
          )}
        </div>
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
            Date
          </label>
          <input
            type="date"
            {...register("date")}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          />
          {errors.date && (
            <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Description
          </label>
          <input
            type="text"
            {...register("description")}
            placeholder="Optional"
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={createTransaction.isPending}
          className={`flex items-center gap-2 ${button.primary} px-4 py-2 rounded-lg text-sm disabled:opacity-50`}
        >
          {createTransaction.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Add Expense
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
