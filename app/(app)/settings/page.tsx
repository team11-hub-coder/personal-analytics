"use client";

import { useState } from "react";
import { Loader2, DollarSign, Dumbbell, CheckSquare, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotificationPreferences";
import { pageHeader, card } from "@/lib/theme";
import type { NotificationPreference } from "@/types";
import { TelegramSettings } from "@/components/telegram/telegram-settings";

const features = [
  {
    key: "finance_enabled" as const,
    label: "Finance Alerts",
    description: "Get email alerts when you approach budget limits.",
    icon: DollarSign,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "workout_enabled" as const,
    label: "Workout Reminders",
    description: "Receive reminders for your scheduled workouts.",
    icon: Dumbbell,
    color: "bg-blue-50 text-blue-600",
  },
  {
    key: "tasks_enabled" as const,
    label: "Task Reminders",
    description: "Get notified about upcoming and overdue tasks.",
    icon: CheckSquare,
    color: "bg-amber-50 text-amber-600",
  },
  {
    key: "reminders_enabled" as const,
    label: "General Reminders",
    description: "Email alerts for your custom reminders.",
    icon: Bell,
    color: "bg-rose-50 text-rose-600",
  },
] as const;

function NotificationForm({ prefs }: { prefs: NotificationPreference }) {
  const updatePrefs = useUpdateNotificationPreferences();

  const [localPrefs, setLocalPrefs] = useState({
    finance_enabled: prefs.finance_enabled,
    workout_enabled: prefs.workout_enabled,
    tasks_enabled: prefs.tasks_enabled,
    reminders_enabled: prefs.reminders_enabled,
  });

  const hasChanges =
    localPrefs.finance_enabled !== prefs.finance_enabled ||
    localPrefs.workout_enabled !== prefs.workout_enabled ||
    localPrefs.tasks_enabled !== prefs.tasks_enabled ||
    localPrefs.reminders_enabled !== prefs.reminders_enabled;

  const handleSave = () => {
    updatePrefs.mutate(localPrefs);
  };

  const handleToggle = (
    key: keyof typeof localPrefs,
    checked: boolean
  ) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <div className={card.base}>
      <h2 className="text-base font-semibold text-(--color-text) mb-1">
        Email Notifications
      </h2>
      <p className="text-xs text-(--color-text-secondary) mb-6">
        Choose which features send you email reminders. You can change these
        anytime.
      </p>

      <div className="divide-y divide-(--color-border)">
        {features.map((feature) => (
          <div
            key={feature.key}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.color}`}
              >
                <feature.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-(--color-text)">
                  {feature.label}
                </p>
                <p className="text-xs text-(--color-text-secondary)">
                  {feature.description}
                </p>
              </div>
            </div>
            <Switch
              checked={localPrefs[feature.key]}
              onCheckedChange={(checked) =>
                handleToggle(feature.key, checked)
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-(--color-border) flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updatePrefs.isPending}
        >
          {updatePrefs.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: prefs, isLoading } = useNotificationPreferences();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className={pageHeader.container}>
        <div>
          <h1 className={pageHeader.title}>Settings</h1>
          <p className={pageHeader.subtitle}>
            Manage your notification preferences and integrations.
          </p>
        </div>
      </div>

      {/* Telegram Bot Integration */}
      <TelegramSettings />

      {isLoading ? (
        <div className={card.base}>
          <h2 className="text-base font-semibold text-(--color-text) mb-1">
            Email Notifications
          </h2>
          <p className="text-xs text-(--color-text-secondary) mb-6">
            Choose which features send you email reminders.
          </p>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : prefs ? (
        <NotificationForm prefs={prefs} />
      ) : null}
    </div>
  );
}
