"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Clock,
  BellRing,
  BellOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import {
  requestNotificationPermission,
  getNotificationPermission,
} from "@/utils/notifications";
import Link from "next/link";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const { notifications, overdueCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<
    "unsupported" | NotificationPermission
  >("unsupported");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Check permission on client only
  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  // Position dropdown relative to trigger
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.right + 8,
      });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
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

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-80 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/10 z-[9999] overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--color-primary)]/10">
                  <Bell size={14} className="text-[var(--color-primary)]" />
                </div>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  Notifications
                </h3>
                {overdueCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-500">
                    {overdueCount} overdue
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <CheckCheck size={13} />
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="inline-flex p-3 rounded-full bg-[var(--color-primary)]/5 mb-3">
                <BellOff
                  size={20}
                  className="text-[var(--color-text-muted)]"
                />
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                All caught up!
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                No overdue or upcoming reminders
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {notifications.map(({ reminder, type, timeAgo }, index) => (
                <Link
                  key={reminder.id}
                  href="/reminders"
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-5 py-3.5 transition-all duration-150 hover:bg-[var(--color-hover)] ${
                    index !== notifications.length - 1
                      ? "border-b border-[var(--color-border)]/50"
                      : ""
                  }`}
                >
                  <div
                    className={`flex-shrink-0 p-2 rounded-xl ${
                      type === "overdue"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {type === "overdue" ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p
                      className="text-sm font-medium truncate leading-snug"
                      style={{ color: "var(--color-text)" }}
                    >
                      {reminder.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          type === "overdue" ? "bg-red-500" : "bg-amber-500"
                        }`}
                      />
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {type === "overdue"
                          ? `Overdue by ${timeAgo}`
                          : `Due in ${timeAgo}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Enable push notifications */}
          {permission === "default" && (
            <div className="px-5 py-3.5 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs h-9 rounded-xl"
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

          {/* Permission granted */}
          {permission === "granted" && (
            <div className="px-5 py-3 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <CheckCheck size={14} />
                <span>Push notifications enabled</span>
              </div>
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`relative ${className}`}>
      {/* Bell button */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-700/50 active:scale-95"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {overdueCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-red-500/30 animate-pulse">
            {overdueCount > 9 ? "9+" : overdueCount}
          </span>
        )}
      </button>

      {dropdown}
    </div>
  );
}
