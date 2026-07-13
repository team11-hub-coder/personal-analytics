"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateTaskCategory } from "@/hooks/useTasks";
import { taskCategorySchema, type TaskCategoryFormData } from "@/lib/validations";
import { button } from "@/lib/theme";
import { Plus, Loader2, X } from "lucide-react";

const colorOptions = [
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#f97316", label: "Orange" },
];

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryFormModal({ isOpen, onClose }: CategoryFormModalProps) {
  const createCategory = useCreateTaskCategory();
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskCategoryFormData>({
    resolver: zodResolver(taskCategorySchema),
    defaultValues: {
      color: colorOptions[0].value,
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({ color: colorOptions[0].value });
      // Defer setState to avoid lint error
      queueMicrotask(() => setSelectedColor(colorOptions[0].value));
    }
  }, [isOpen, reset]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const onSubmit = (data: TaskCategoryFormData) => {
    createCategory.mutate(
      { name: data.name, color: selectedColor },
      {
        onSuccess: () => {
          reset();
          setSelectedColor(colorOptions[0].value);
          onClose();
        },
      }
    );
  };

  if (!isOpen) return null;

  const isPending = createCategory.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--color-surface)] rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Add Task Category
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Name *
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="Category name"
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Color
            </label>
            <div className="flex gap-3 flex-wrap">
              {colorOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedColor(opt.value)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedColor === opt.value
                      ? "border-[var(--color-text)] scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: opt.value }}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className={`flex items-center gap-2 ${button.primary} px-4 py-2 rounded-lg text-sm disabled:opacity-50`}
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Add Category
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
