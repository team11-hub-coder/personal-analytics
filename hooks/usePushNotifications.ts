"use client";

import { useEffect, useRef } from "react";
import { useReminders } from "@/hooks/useReminders";
import { showNotification, registerServiceWorker } from "@/utils/notifications";

const CHECK_INTERVAL_MS = 30_000; // 30 seconds

export function usePushNotifications() {
  const { data: reminders = [] } = useReminders();
  const notifiedRef = useRef<Set<number>>(new Set());

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Check reminders periodically
  useEffect(() => {
    if (reminders.length === 0) return;

    function check() {
      const now = new Date();

      for (const reminder of reminders) {
        if (!reminder.is_active) continue;
        if (notifiedRef.current.has(reminder.id)) continue;

        const remindDate = new Date(reminder.remind_at);

        // Fire if remind_at is within the last 30 seconds (just triggered)
        const diffMs = now.getTime() - remindDate.getTime();
        if (diffMs >= 0 && diffMs < CHECK_INTERVAL_MS) {
          showNotification(reminder.title, {
            body: `Reminder: ${reminder.title}`,
          });
          notifiedRef.current.add(reminder.id);
        }
      }
    }

    // Run immediately, then on interval
    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [reminders]);
}
