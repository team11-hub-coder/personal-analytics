"use client";

import { useMemo } from "react";
import { useReminders } from "@/hooks/useReminders";
import type { Reminder } from "@/types";

export interface NotificationReminder {
  reminder: Reminder;
  type: "overdue" | "upcoming";
  timeAgo: string;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const absDiff = Math.abs(diffMs);
  const isPast = diffMs > 0;

  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  let text: string;
  if (minutes < 1) text = "Just now";
  else if (minutes < 60) text = `${minutes}m ${isPast ? "ago" : "left"}`;
  else if (hours < 24) text = `${hours}h ${isPast ? "ago" : "left"}`;
  else text = `${days}d ${isPast ? "ago" : "left"}`;

  return text;
}

export function useNotifications() {
  const { data: reminders = [] } = useReminders();

  const notifications = useMemo(() => {
    const now = new Date();
    const upcoming24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const result: NotificationReminder[] = [];

    for (const reminder of reminders) {
      if (!reminder.is_active) continue;

      const remindDate = new Date(reminder.remind_at);

      if (remindDate < now) {
        result.push({ reminder, type: "overdue", timeAgo: formatTimeAgo(reminder.remind_at) });
      } else if (remindDate <= upcoming24h) {
        result.push({ reminder, type: "upcoming", timeAgo: formatTimeAgo(reminder.remind_at) });
      }
    }

    // Sort: overdue first (most overdue first), then upcoming (soonest first)
    result.sort((a, b) => {
      if (a.type !== b.type) return a.type === "overdue" ? -1 : 1;
      return new Date(a.reminder.remind_at).getTime() - new Date(b.reminder.remind_at).getTime();
    });

    return result;
  }, [reminders]);

  const overdueCount = useMemo(
    () => notifications.filter((n) => n.type === "overdue").length,
    [notifications]
  );

  return { notifications, overdueCount };
}
