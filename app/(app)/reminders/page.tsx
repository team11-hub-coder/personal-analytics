"use client";

import { Bell, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const statCards = [
  {
    icon: <Bell size={20} />,
    label: "Total Reminders",
    value: "0",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: <CheckCircle size={20} />,
    label: "Active",
    value: "0",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: <AlertCircle size={20} />,
    label: "Overdue",
    value: "0",
    color: "bg-amber-50 text-amber-600",
  },
];

export default function RemindersPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Reminders
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Never miss important events and deadlines.
          </p>
        </div>
        <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white">
          Add Reminder
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
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

      {/* Reminder List Placeholder */}
      <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">
          Reminders
        </h3>
        <p className="text-[var(--color-text-muted)] text-sm">
          Reminder list coming soon
        </p>
      </div>
    </div>
  );
}
