"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateTask, useUpdateTask, useTaskCategories } from "@/hooks/useTasks";
import { taskSchema, type TaskFormData } from "@/lib/validations";
import { button } from "@/lib/theme";
import { Plus, Loader2, X, Pencil } from "lucide-react";
import type { TaskWithCategory } from "@/types";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: TaskWithCategory;
}

export default function TaskFormModal({ isOpen, onClose, task }: TaskFormModalProps) {
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

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        reset({
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          due_date: task.due_date || "",
          category_id: task.category_id || undefined,
        });
      } else {
        reset({ priority: "medium" });
      }
    }
  }, [isOpen, isEditMode, task, reset]);

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
            onClose();
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
            onClose();
          },
        }
      );
    }
  };

  if (!isOpen) return null;

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--color-surface)] rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            {isEditMode ? "Edit Task" : "Add New Task"}
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

          <div>
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

          <div className="grid grid-cols-2 gap-4">
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

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
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
