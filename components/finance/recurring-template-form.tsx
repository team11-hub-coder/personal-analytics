"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateRecurringTemplate } from "@/hooks/useRecurringTemplates";
import { useCategories } from "@/hooks/useCategories";
import { recurringTemplateSchema, type RecurringTemplateFormData } from "@/lib/validations";
import { button } from "@/lib/theme";
import { getLocalDateString } from "@/lib/dates";
import { Plus, Loader2, X } from "lucide-react";

interface RecurringTemplateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RecurringTemplateForm({
  onSuccess,
  onCancel,
}: RecurringTemplateFormProps) {
  const { data: categories } = useCategories();
  const createTemplate = useCreateRecurringTemplate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecurringTemplateFormData>({
    resolver: zodResolver(recurringTemplateSchema),
    defaultValues: {
      interval: "monthly",
      next_run_date: getLocalDateString(),
    },
  });

  const onSubmit = (data: RecurringTemplateFormData) => {
    createTemplate.mutate(
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
            Interval
          </label>
          <select
            {...register("interval")}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {errors.interval && (
            <p className="text-xs text-red-500 mt-1">
              {errors.interval.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Start Date
          </label>
          <input
            type="date"
            {...register("next_run_date")}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          />
          {errors.next_run_date && (
            <p className="text-xs text-red-500 mt-1">
              {errors.next_run_date.message}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Description (optional)
          </label>
          <input
            type="text"
            {...register("description")}
            placeholder="e.g., Netflix subscription"
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={createTemplate.isPending}
          className={`flex items-center gap-2 ${button.primary} px-4 py-2 rounded-lg text-sm disabled:opacity-50`}
        >
          {createTemplate.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Add Template
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
