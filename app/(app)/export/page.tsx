"use client";

import { FileText, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";

const exportCards = [
  {
    icon: <FileText size={20} />,
    title: "Finance Data CSV",
    description: "Export transactions and budgets",
    color: "bg-emerald-50 text-emerald-600",
    count: 0,
  },
  {
    icon: <FileText size={20} />,
    title: "Workout Data CSV",
    description: "Export workout history",
    color: "bg-[#f3ece3] text-[#8b6914]",
    count: 0,
  },
  {
    icon: <FileJson size={20} />,
    title: "All Data JSON",
    description: "Complete backup of all data",
    color: "bg-amber-50 text-amber-600",
    count: 0,
  },
];

export default function ExportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Data Export
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Export your data for backup or analysis.
        </p>
      </div>

      {/* Date Range Placeholder */}
      <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">
          Date Range
        </h3>
        <p className="text-[var(--color-text-muted)] text-sm">
          Date picker coming soon
        </p>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {exportCards.map((card) => (
          <div
            key={card.title}
            className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}
              >
                {card.icon}
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)]">
                  {card.title}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {card.description}
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              {card.count} records
            </p>
            <Button
              variant="outline"
              className="w-full border-[var(--color-border)]"
            >
              Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
