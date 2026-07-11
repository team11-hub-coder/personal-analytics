"use client";

import { useState } from "react";
import ExpenseAnalysis from "@/components/finance/expense-analysis";
import CategoryList from "@/components/finance/category-list";
import BudgetList from "@/components/finance/budget-list";
import RecurringTemplateList from "@/components/finance/recurring-template-list";
import ExpenseList from "@/components/finance/expense-list";
import { button } from "@/lib/theme";
import { Tag, Wallet, Repeat } from "lucide-react";

type ActiveSection = "transactions" | "categories" | "budgets" | "recurring";

export default function FinancePage() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("transactions");

  const sections = [
    { id: "categories" as const, label: "Categories", icon: Tag },
    { id: "budgets" as const, label: "Budgets", icon: Wallet },
    { id: "recurring" as const, label: "Recurring", icon: Repeat },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Finance Tracker
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Track your expenses and budgets.
        </p>
      </div>

      {/* Summary Cards */}
      <ExpenseAnalysis />

      {/* Quick Access Links */}
      <div className="flex items-center gap-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() =>
                setActiveSection(isActive ? "transactions" : section.id)
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
              }`}
            >
              <Icon size={14} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      {activeSection === "categories" && <CategoryList />}
      {activeSection === "budgets" && <BudgetList />}
      {activeSection === "recurring" && <RecurringTemplateList />}

      {/* Transactions - Always visible */}
      <ExpenseList />
    </div>
  );
}
