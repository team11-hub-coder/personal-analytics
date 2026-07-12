"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, AlertTriangle, Clock, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { requestNotificationPermission, getNotificationPermission } from "@/utils/notifications";
import Link from "next/link";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const { notifications, overdueCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState(getNotificationPermission);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-700/50"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {overdueCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
            {overdueCount > 9 ? "9+" : overdueCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Notifications
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={() => setOpen(false)}
                className="text-xs flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell size={24} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-muted)]">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {notifications.map(({ reminder, type, timeAgo }) => (
                <Link
                  key={reminder.id}
                  href="/reminders"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-hover)] transition-colors"
                >
                  <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-full ${
                    type === "overdue"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {type === "overdue" ? <AlertTriangle size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                      {reminder.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {type === "overdue" ? `Overdue by ${timeAgo}` : `In ${timeAgo}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Enable push notifications */}
          {permission === "default" && (
            <div className="px-4 py-3 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={async () => {
                  const result = await requestNotificationPermission();
                  setPermission(result);
                }}
              >
                <BellRing size={14} />
                Enable push notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
