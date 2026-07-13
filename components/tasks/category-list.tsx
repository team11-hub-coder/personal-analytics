"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useTaskCategories,
  useCreateTaskCategory,
  useDeleteTaskCategory,
} from "@/hooks/useTasks";
import {
  taskCategorySchema,
  type TaskCategoryFormData,
} from "@/lib/validations";
import { card, button } from "@/lib/theme";
import { Plus, Trash2, Loader2, Tag, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function CategoryList() {
  const [isAdding, setIsAdding] = useState(false);
  const { data: categories, isLoading } = useTaskCategories();
  const createCategory = useCreateTaskCategory();
  const deleteCategory = useDeleteTaskCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskCategoryFormData>({
    resolver: zodResolver(taskCategorySchema),
    defaultValues: {
      color: "#22c55e",
    },
  });

  const onSubmit = (data: TaskCategoryFormData) => {
    createCategory.mutate(
      { name: data.name, color: data.color || undefined },
      {
        onSuccess: () => {
          reset();
          setIsAdding(false);
        },
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Delete category "${name}"? Tasks in this category will become uncategorized.`)) {
      deleteCategory.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={card.base}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--color-text)]">Task Categories</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 ${button.secondary} px-3 py-1.5 rounded-lg text-sm`}
        >
          <Plus size={14} />
          Add Category
        </button>
      </div>

      {/* Add Category Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-4 bg-[var(--color-surface-hover)] rounded-lg space-y-4 mb-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((opt) => (
                  <label key={opt.value} className="cursor-pointer">
                    <input
                      type="radio"
                      value={opt.value}
                      {...register("color")}
                      className="sr-only"
                    />
                    <div
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: opt.value,
                        borderColor: "transparent",
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={createCategory.isPending}
              className={`flex items-center gap-2 ${button.primary} px-4 py-2 rounded-lg text-sm disabled:opacity-50`}
            >
              {createCategory.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Add Category
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={`${button.ghost} px-4 py-2 rounded-lg text-sm`}
            >
              <X size={14} className="mr-1" />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Category List */}
      {categories && categories.length > 0 ? (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-hover)]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: cat.color || "#6b7280" }}
                />
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {cat.name}
                </span>
              </div>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500"
                disabled={deleteCategory.isPending}
              >
                {deleteCategory.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Tag className="mx-auto mb-2 text-[var(--color-text-muted)]" size={24} />
          <p className="text-[var(--color-text-muted)] text-sm">
            No categories yet. Add one to organize your tasks.
          </p>
        </div>
      )}
    </div>
  );
}
