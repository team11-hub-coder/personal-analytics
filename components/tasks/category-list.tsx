"use client";

import { useTaskCategories, useDeleteTaskCategory } from "@/hooks/useTasks";
import { card } from "@/lib/theme";
import { Trash2, Loader2, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryList() {
  const { data: categories, isLoading } = useTaskCategories();
  const deleteCategory = useDeleteTaskCategory();

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
      <h3 className="font-semibold text-[var(--color-text)] mb-4">Task Categories</h3>

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
