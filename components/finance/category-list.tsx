"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import { categorySchema, type CategoryFormData } from "@/lib/validations";
import { card, button } from "@/lib/theme";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Tag,
  X,
  Check,
  FolderOpen,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryList() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const [isAdding, setIsAdding] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const onSubmit = (data: CategoryFormData) => {
    createCategory.mutate(data.name, {
      onSuccess: () => {
        reset();
        setIsAdding(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className={card.base}>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const systemCategories = categories?.filter((c) => !c.user_id) || [];
  const userCategories = categories?.filter((c) => c.user_id) || [];

  return (
    <div className={card.base}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--color-text)]">Categories</h3>
        <button
          onClick={() => setIsAdding(true)}
          className={`flex items-center gap-2 ${button.primary} px-3 py-1.5 rounded-lg text-sm`}
        >
          <Plus size={14} />
          Add Custom
        </button>
      </div>

      {/* Add form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-4 p-3 bg-[var(--color-surface-hover)] rounded-lg flex gap-2"
        >
          <input
            {...register("name")}
            placeholder="Category name"
            className="flex-1 border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm"
            autoFocus
          />
          <button
            type="submit"
            disabled={createCategory.isPending}
            className={`${button.primary} px-3 py-1.5 rounded-lg text-sm`}
          >
            {createCategory.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              reset();
            }}
            className={`${button.ghost} px-3 py-1.5 rounded-lg text-sm`}
          >
            <X size={14} />
          </button>
        </form>
      )}
      {errors.name && (
        <p className="text-xs text-red-500 mb-2">{errors.name.message}</p>
      )}

      {/* System categories */}
      {systemCategories.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
            Default Categories
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {systemCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-hover)] rounded-lg text-sm"
              >
                <Tag size={14} className="text-[var(--color-text-muted)]" />
                <span className="text-[var(--color-text)]">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User categories */}
      {userCategories.length > 0 && (
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
            Your Custom Categories
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {userCategories.map((cat) => (
              <CategoryItem key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {categories?.length === 0 && (
        <div className="text-center py-8">
          <FolderOpen
            size={48}
            className="mx-auto text-[var(--color-text-muted)] mb-3"
          />
          <p className="text-[var(--color-text-secondary)]">
            No categories yet
          </p>
        </div>
      )}
    </div>
  );
}

function CategoryItem({
  category,
}: {
  category: { id: number; name: string };
}) {
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string }>({
    defaultValues: { name: category.name },
  });

  const onUpdate = (data: { name: string }) => {
    updateCategory.mutate(
      { id: category.id, name: data.name },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const onDelete = () => {
    if (confirm(`Delete "${category.name}"?`)) {
      deleteCategory.mutate(category.id);
    }
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit(onUpdate)}
        className="flex items-center gap-1 p-1 bg-[var(--color-surface-hover)] rounded-lg"
      >
        <input
          {...register("name", { required: "Name is required" })}
          className="flex-1 border border-[var(--color-border)] rounded px-2 py-1 text-sm min-w-0"
          autoFocus
        />
        <button
          type="submit"
          disabled={updateCategory.isPending}
          className="p-1 text-green-600 hover:text-green-700"
        >
          {updateCategory.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <X size={14} />
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-hover)] rounded-lg group">
      <div className="flex items-center gap-2">
        <Tag size={14} className="text-[var(--color-text-muted)]" />
        <span className="text-sm text-[var(--color-text)]">{category.name}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={onDelete}
          disabled={deleteCategory.isPending}
          className="p-1 text-[var(--color-text-muted)] hover:text-red-500"
        >
          {deleteCategory.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Trash2 size={12} />
          )}
        </button>
      </div>
    </div>
  );
}
