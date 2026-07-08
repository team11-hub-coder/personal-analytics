"use client";

import { Dumbbell, Flame, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const statCards = [
  {
    icon: <Dumbbell size={20} />,
    label: "Total Workouts",
    value: "0",
    color: "bg-[#f3ece3] text-[#8b6914]",
  },
  {
    icon: <Flame size={20} />,
    label: "Calories Burned",
    value: "0",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: <Clock size={20} />,
    label: "Total Minutes",
    value: "0",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: <Calendar size={20} />,
    label: "This Week",
    value: "0",
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function WorkoutsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Workout Tracker
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Log workouts and track your fitness progress.
          </p>
        </div>
        <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white">
          Log Workout
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)]">
          <h3 className="font-semibold text-[var(--color-text)] mb-4">
            Weekly Workout Frequency
          </h3>
          <p className="text-[var(--color-text-muted)] text-sm">
            Chart coming soon
          </p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)]">
          <h3 className="font-semibold text-[var(--color-text)] mb-4">
            Progress Chart
          </h3>
          <p className="text-[var(--color-text-muted)] text-sm">
            Chart coming soon
          </p>
        </div>
      </div>

      {/* Muscle Group Coverage Placeholder */}
      <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">
          Muscle Group Coverage
        </h3>
        <p className="text-[var(--color-text-muted)] text-sm">
          Progress bars coming soon
        </p>
      </div>

      {/* Workout History Placeholder */}
      <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">
          Workout History
        </h3>
        <p className="text-[var(--color-text-muted)] text-sm">
          Workout list coming soon
        </p>
      </div>
    </div>
  );
}
