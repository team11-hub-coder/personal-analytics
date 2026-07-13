"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useRecurringTemplates,
  useUpdateRecurringTemplate,
  useDeleteRecurringTemplate,
  useProcessRecurringTemplates,
} from "@/hooks/useRecurringTemplates";
import { useProfile } from "@/hooks/useProfile";
import { card, button } from "@/lib/theme";
import { formatCurrency } from "@/lib/currency";
import { getCategoryIconInfo } from "@/lib/icons";
import {
  inlineRecurringTemplateSchema,
  type InlineRecurringTemplateFormData,
} from "@/lib/validations";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  Check,
  Repeat,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import RecurringTemplateForm from "./recurring-template-form";

export default function RecurringTemplateList() {
  const { data: templates, isLoading } = useRecurringTemplates();
  const { data: profile } = useProfile();
  const processTemplates = useProcessRecurringTemplates();
  const [isAdding, setIsAdding] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);

  const currency = profile?.currency || "MMK";

  const handleProcess = () => {
    processTemplates.mutate(undefined, {
      onSuccess: (result) => {
        setProcessResult(`Generated ${result.created} expense(s)`);
        setTimeout(() => setProcessResult(null), 3000);
      },
      onError: () => {
        setProcessResult("Failed to process templates");
        setTimeout(() => setProcessResult(null), 3000);
      },
    });
  };

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

  const activeTemplates = templates?.filter((t) => t.is_active) || [];
  const inactiveTemplates = templates?.filter((t) => !t.is_active) || [];

  return (
    <div className={card.base}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--color-text)]">
          Recurring Templates
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleProcess}
            disabled={processTemplates.isPending || activeTemplates.length === 0}
            className={`flex items-center gap-2 ${button.secondary} px-3 py-1.5 rounded-lg text-sm disabled:opacity-50`}
          >
            {processTemplates.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Generate Now
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className={`flex items-center gap-2 ${button.primary} px-3 py-1.5 rounded-lg text-sm`}
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Process result message */}
      {processResult && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            processResult.includes("Failed")
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {processResult}
        </div>
      )}

      {/* Add form */}
      {isAdding && (
        <div className="mb-4">
          <RecurringTemplateForm
            onSuccess={() => setIsAdding(false)}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      {/* Active templates */}
      {activeTemplates.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
            Active ({activeTemplates.length})
          </p>
          <div className="space-y-2">
            {activeTemplates.map((template) => (
              <TemplateItem
                key={template.id}
                template={template}
                currency={currency}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive templates */}
      {inactiveTemplates.length > 0 && (
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
            Paused ({inactiveTemplates.length})
          </p>
          <div className="space-y-2 opacity-60">
            {inactiveTemplates.map((template) => (
              <TemplateItem
                key={template.id}
                template={template}
                currency={currency}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {templates?.length === 0 && !isAdding && (
        <div className="text-center py-8">
          <Repeat
            size={48}
            className="mx-auto text-[var(--color-text-muted)] mb-3"
          />
          <p className="text-[var(--color-text-secondary)]">
            No recurring templates yet
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Add templates for expenses that repeat regularly
          </p>
        </div>
      )}
    </div>
  );
}

function TemplateItem({
  template,
  currency,
}: {
  template: {
    id: number;
    amount: number;
    description: string | null;
    interval: string;
    next_run_date: string;
    is_active: boolean;
    categories: { id: number; name: string; icon: string } | null;
  };
  currency: string;
}) {
  const updateTemplate = useUpdateRecurringTemplate();
  const deleteTemplate = useDeleteRecurringTemplate();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InlineRecurringTemplateFormData>({
    resolver: zodResolver(inlineRecurringTemplateSchema),
    defaultValues: {
      amount: template.amount,
      description: template.description || "",
      interval: template.interval as "weekly" | "monthly",
      next_run_date: template.next_run_date,
    },
  });

  const handleToggleActive = () => {
    updateTemplate.mutate({
      id: template.id,
      is_active: !template.is_active,
    });
  };

  const handleDelete = () => {
    if (confirm(`Delete this recurring template?`)) {
      deleteTemplate.mutate(template.id);
    }
  };

  const onSubmit = (data: InlineRecurringTemplateFormData) => {
    updateTemplate.mutate(
      {
        id: template.id,
        amount: data.amount,
        description: data.description || undefined,
        interval: data.interval,
        next_run_date: data.next_run_date,
      },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const iconInfo = getCategoryIconInfo(template.categories?.icon || "MoreHorizontal");
  const Icon = iconInfo.icon;

  if (isEditing) {
    return (
      <div className="p-3 bg-[var(--color-surface-hover)] rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[var(--color-text-muted)]">Amount</label>
              <input
                type="number"
                step="1"
                {...register("amount", { valueAsNumber: true })}
                className="w-full border border-[var(--color-border)] rounded px-2 py-1 text-sm"
              />
              {errors.amount && (
                <p className="text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)]">Description</label>
              <input
                type="text"
                {...register("description")}
                className="w-full border border-[var(--color-border)] rounded px-2 py-1 text-sm"
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)]">Interval</label>
              <select
                {...register("interval")}
                className="w-full border border-[var(--color-border)] rounded px-2 py-1 text-sm"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {errors.interval && (
                <p className="text-xs text-red-500">{errors.interval.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)]">Next Date</label>
              <input
                type="date"
                {...register("next_run_date")}
                className="w-full border border-[var(--color-border)] rounded px-2 py-1 text-sm"
              />
              {errors.next_run_date && (
                <p className="text-xs text-red-500">{errors.next_run_date.message}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={updateTemplate.isPending}
              className={`${button.primary} px-3 py-1 rounded-lg text-sm`}
            >
              {updateTemplate.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={`${button.ghost} px-3 py-1 rounded-lg text-sm`}
            >
              <X size={12} />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-[var(--color-surface-hover)] rounded-lg">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconInfo.color}`}
        >
          <Icon size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--color-text)]">
              {template.description || template.categories?.name || "Recurring"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
              {template.interval === "weekly" ? "Weekly" : "Monthly"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <Calendar size={12} />
            <span>Next: {formatDate(template.next_run_date)}</span>
            <span>•</span>
            <span>{template.categories?.name}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-[var(--color-text)]">
          {formatCurrency(Number(template.amount), currency)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleActive}
            disabled={updateTemplate.isPending}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            title={template.is_active ? "Pause" : "Activate"}
          >
            {template.is_active ? (
              <ToggleRight size={20} className="text-green-500" />
            ) : (
              <ToggleLeft size={20} />
            )}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteTemplate.isPending}
            className="p-1 text-[var(--color-text-muted)] hover:text-red-500"
          >
            {deleteTemplate.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
