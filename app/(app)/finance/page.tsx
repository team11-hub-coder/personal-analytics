"use client";

import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryList from "@/components/finance/category-list";

const summaryCards = [
  {
    icon: <TrendingUp size={20} />,
    label: "Income",
    value: "$0.00",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: <TrendingDown size={20} />,
    label: "Expenses",
    value: "$0.00",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: <DollarSign size={20} />,
    label: "Net",
    value: "$0.00",
    color: "bg-[#f3ece3] text-[#8b6914]",
  },
];

export default function FinancePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Finance Tracker
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Track your income, expenses, and budgets.
          </p>
        </div>
        <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white">
          Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-[var(--color-surface)] rounded-xl p-5 shadow-sm border border-[var(--color-border)]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {card.label}
                </p>
                <p className="text-xl font-bold text-[var(--color-text)]">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)]">
          <h3 className="font-semibold text-[var(--color-text)] mb-4">
            Category Breakdown
          </h3>
          <p className="text-[var(--color-text-muted)] text-sm">
            Chart coming soon
          </p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)]">
          <h3 className="font-semibold text-[var(--color-text)] mb-4">
            Income vs Expense
          </h3>
          <p className="text-[var(--color-text-muted)] text-sm">
            Chart coming soon
          </p>
        </div>
      </div>

      {/* Categories */}
      <CategoryList />

      {/* Budget Progress Placeholder */}
      <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">
          Budget Progress
        </h3>
        <p className="text-[var(--color-text-muted)] text-sm">
          Budget bars coming soon
        </p>
      </div>

      {/* Transaction List Placeholder */}
      <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">
          Transactions
        </h3>
        <p className="text-[var(--color-text-muted)] text-sm">
          Transaction list coming soon
        </p>
      </div>
    </div>
  );
}
