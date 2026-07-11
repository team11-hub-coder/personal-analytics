"use client";

import { useState } from "react";
import TaskAnalytics from "@/components/tasks/task-analytics";
import TaskList from "@/components/tasks/task-list";
import TaskForm from "@/components/tasks/task-form";
import CategoryList from "@/components/tasks/category-list";
import ProductivityChart from "@/components/charts/ProductivityChart";
import CompletionRateChart from "@/components/charts/CompletionRateChart";
import { card, button } from "@/lib/theme";
import { Plus, Tag } from "lucide-react";

type ActiveSection = "tasks" | "categories";

export default function TasksPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>("tasks");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Task Manager
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage your tasks and stay productive.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 ${button.primary} px-4 py-2 rounded-lg text-sm`}
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <TaskForm
          onSuccess={() => setIsAdding(false)}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* Summary Cards: Total, Pending, Completed, Overdue */}
      <TaskAnalytics />

      {/* Quick Access Links */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveSection("tasks")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            activeSection === "tasks"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveSection("categories")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            activeSection === "categories"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
          }`}
        >
          <Tag size={14} />
          Categories
        </button>
      </div>

      {/* Active Section Content */}
      {activeSection === "categories" && <CategoryList />}

      {/* Charts - Only show when on tasks section */}
      {activeSection === "tasks" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={card.base}>
            <h3 className="font-semibold text-[var(--color-text)] mb-4">
              Tasks Completed (Last 7 Days)
            </h3>
            <ProductivityChart />
          </div>
          <div className={card.base}>
            <h3 className="font-semibold text-[var(--color-text)] mb-4">
              Completion Rate
            </h3>
            <CompletionRateChart />
          </div>
        </div>
      )}

      {/* Task List with Filters - Only show when on tasks section */}
      {activeSection === "tasks" && <TaskList />}
    </div>
  );
}
