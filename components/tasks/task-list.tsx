"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useTasks,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskStatus,
  useTaskCategories,
} from "@/hooks/useTasks";
import { card, list, taskColors, priorityColors } from "@/lib/theme";
import {
  Pencil,
  Trash2,
  Loader2,
  Check,
  Circle,
  AlertCircle,
  Calendar,
  Filter,
  Tag,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TaskFormModal from "./task-form-modal";
import type { TaskWithCategory } from "@/types";
import { daysFromToday } from "@/lib/dates";

type StatusFilter = "all" | "pending" | "completed" | "overdue";
type SortBy = "priority" | "due_date" | "created_at";

const priorityOrder = { high: 0, medium: 1, low: 2 };

export default function TaskList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [editingTask, setEditingTask] = useState<TaskWithCategory | null>(null);

  const filters = {
    ...(statusFilter !== "all" ? { status: statusFilter as "pending" | "completed" | "overdue" } : {}),
    ...(categoryFilter ? { category_id: categoryFilter } : {}),
  };

  const { data: tasks, isLoading, error } = useTasks(Object.keys(filters).length > 0 ? filters : undefined);
  const { data: categories } = useTaskCategories();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleStatus = useToggleTaskStatus();

  const sortedTasks = useMemo(() => [...(tasks || [])].sort((a, b) => {
    if (sortBy === "priority") {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === "due_date") {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }), [tasks, sortBy]);

  const handleDelete = useCallback((task: TaskWithCategory) => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      deleteTask.mutate(task.id);
    }
  }, [deleteTask]);

  const handleToggleStatus = useCallback((task: TaskWithCategory) => {
    toggleStatus.mutate({ id: task.id, currentStatus: task.status });
  }, [toggleStatus]);

  const isOverdue = (task: TaskWithCategory) => {
    if (task.status === "completed" || !task.due_date) return false;
    return daysFromToday(task.due_date) < 0;
  };

  const formatDueDate = (date: string | null) => {
    if (!date) return null;
    const diffDays = daysFromToday(date);

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${card.base} text-center py-8`}>
        <AlertCircle className="mx-auto mb-2 text-red-500" size={24} />
        <p className="text-[var(--color-text-secondary)]">Failed to load tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-[var(--color-text-muted)]" />
          <div className="flex gap-1">
            {(["all", "pending", "completed", "overdue"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors capitalize ${
                  statusFilter === status
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          {categories && categories.length > 0 && (
            <select
              value={categoryFilter || ""}
              onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="created_at">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="due_date">Sort by Due Date</option>
          </select>
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskFormModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
        />
      )}

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className={`${card.base} text-center py-12`}>
          <Circle className="mx-auto mb-3 text-[var(--color-text-muted)]" size={32} />
          <p className="text-[var(--color-text-muted)]">No tasks found</p>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            {statusFilter === "all"
              ? "Add your first task to get started"
              : `No ${statusFilter} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`${card.compact} flex items-start gap-4 ${
                isOverdue(task) ? taskColors.overdueBorder : ""
              }`}
            >
              {/* Toggle Status */}
              <button
                onClick={() => handleToggleStatus(task)}
                className="mt-1 flex-shrink-0"
                disabled={toggleStatus.isPending}
              >
                {task.status === "completed" ? (
                  <Check size={20} className={taskColors.completedCheck} />
                ) : (
                  <Circle size={20} className="text-[var(--color-text-muted)] hover:text-emerald-500" />
                )}
              </button>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className={`font-medium ${
                      task.status === "completed"
                        ? "line-through text-[var(--color-text-muted)]"
                        : "text-[var(--color-text)]"
                    }`}
                  >
                    {task.title}
                  </h3>
                  <span className={`${list.badge} ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                  {task.task_categories && (
                    <span
                      className={`${list.badge} flex items-center gap-1`}
                      style={{
                        backgroundColor: task.task_categories.color ? `${task.task_categories.color}20` : undefined,
                        color: task.task_categories.color || undefined,
                      }}
                    >
                      <Tag size={10} />
                      {task.task_categories.name}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1 truncate">
                    {task.description}
                  </p>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-1 mt-2">
                    <Calendar size={12} className="text-[var(--color-text-muted)]" />
                    <span
                      className={`text-xs ${
                        isOverdue(task)
                          ? taskColors.overdueText
                          : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      {formatDueDate(task.due_date)}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditingTask(task)}
                  className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  disabled={updateTask.isPending}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(task)}
                  className="p-2 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500"
                  disabled={deleteTask.isPending}
                >
                  {deleteTask.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
