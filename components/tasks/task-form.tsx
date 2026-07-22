"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateTask, useUpdateTask, useTaskCategories } from "@/hooks/useTasks";
import { taskSchema, type TaskFormData } from "@/lib/validations";
import { button } from "@/lib/theme";
import { Plus, Loader2, X, Pencil } from "lucide-react";
import type { TaskWithCategory } from "@/types";

interface TaskFormProps {
  /** If provided, form is in edit mode */
  task?: TaskWithCategory;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TaskForm({ task, onSuccess, onCancel }: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: categories } = useTaskCategories();

  const isEditMode = !!task;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: isEditMode
      ? {
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          due_date: task.due_date || "",
          category_id: task.category_id || undefined,
        }
      : {
          priority: "medium",
        },
  });

  const onSubmit = (data: TaskFormData) => {
    if (isEditMode) {
      updateTask.mutate(
        {
          id: task.id,
          title: data.title,
          description: data.description || undefined,
          priority: data.priority,
          due_date: data.due_date || null,
          category_id: data.category_id || null,
        },
        {
          onSuccess: () => {
            reset();
            onSuccess?.();
          },
        }
      );
    } else {
      createTask.mutate(
        {
          title: data.title,
          description: data.description || undefined,
          priority: data.priority,
          due_date: data.due_date || null,
          category_id: data.category_id || null,
        },
        {
          onSuccess: () => {
            reset();
            onSuccess?.();
          },
        }
      );
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 bg-[var(--color-surface-hover)] rounded-lg space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Title *
          </label>
          <input
            type="text"
            {...register("title")}
            placeholder="Task title"
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Description
          </label>
          <textarea
            {...register("description")}
            placeholder="Optional description"
            rows={3}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm resize-none"
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Priority
          </label>
          <select
            {...register("priority")}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {errors.priority && (
            <p className="text-xs text-red-500 mt-1">{errors.priority.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Due Date
          </label>
          <input
            type="date"
            {...register("due_date")}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          />
          {errors.due_date && (
            <p className="text-xs text-red-500 mt-1">{errors.due_date.message}</p>
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
            <option value={0}>No category</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className={`flex items-center gap-2 ${button.primary} px-4 py-2 rounded-lg text-sm disabled:opacity-50`}
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isEditMode ? (
            <Pencil size={14} />
          ) : (
            <Plus size={14} />
          )}
          {isEditMode ? "Update Task" : "Add Task"}
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
