"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Edit2,
  Trash2,
  Clock,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useReminders,
  useDeleteReminder,
  useToggleReminder,
} from "@/hooks/useReminders";
import { card, list } from "@/lib/theme";
import type { Reminder } from "@/types";
import type { ReminderFormData } from "@/lib/validations";

interface ReminderListProps {
  onEdit: (reminder: Reminder) => void;
}

export function ReminderList({ onEdit }: ReminderListProps) {
  const { data: reminders = [], isLoading } = useReminders();
  const deleteReminder = useDeleteReminder();
  const toggleReminder = useToggleReminder();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const sortedReminders = useMemo(
    () =>
      [...reminders].sort(
        (a, b) =>
          new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()
      ),
    [reminders]
  );

  const repeatLabel = (repeat: ReminderFormData["repeat"]) => {
    const map: Record<ReminderFormData["repeat"], string> = {
      none: "One-time",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    };
    return map[repeat];
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isOverdue = (dateStr: string, isActive: boolean) => {
    return isActive && new Date(dateStr) < new Date();
  };

  if (isLoading) {
    return (
      <div className={card.base}>
        <h3 className="font-semibold text-[var(--color-text)] mb-4">
          Reminders
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)]"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sortedReminders.length === 0) {
    return (
      <div className={card.base}>
        <h3 className="font-semibold text-[var(--color-text)] mb-4">
          Reminders
        </h3>
        <div className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-[var(--color-text-muted)] mb-3" />
          <p className="text-[var(--color-text-muted)] text-sm">
            No reminders yet. Add one to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={card.base}>
      <h3 className="font-semibold text-[var(--color-text)] mb-4">
        Reminders
      </h3>
      <div className="space-y-2">
        {sortedReminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
              isOverdue(reminder.remind_at, reminder.is_active)
                ? "border-yellow-500"
                : reminder.is_active
                ? "border-green-500"
                : "border-[var(--color-border)]"
            } ${
              !reminder.is_active ? "opacity-50" : ""
            }`}
          >
            {/* Toggle */}
            <button
              onClick={() =>
                toggleReminder.mutate({
                  id: reminder.id,
                  is_active: reminder.is_active,
                })
              }
              className="flex-shrink-0"
              disabled={toggleReminder.isPending}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  reminder.is_active
                    ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                    : "border-[var(--color-border)]"
                }`}
              >
                {reminder.is_active && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`${list.title} ${!reminder.is_active ? "line-through" : ""}`}>
                {reminder.title}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={list.subtitle}>
                  <Clock className="inline h-3 w-3 mr-1" />
                  {formatDateTime(reminder.remind_at)}
                </span>
                {reminder.repeat !== "none" && (
                  <Badge variant="secondary" className="text-xs">
                    <Repeat className="inline h-3 w-3 mr-1" />
                    {repeatLabel(reminder.repeat)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onEdit(reminder)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDeleteId(reminder.id)}
                disabled={deleteReminder.isPending}
                className="text-[var(--color-text-muted)] hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Reminder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="!justify-center gap-3 py-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDeleteId(null)}
              className="border-[var(--color-border)] px-8 py-3 text-base"
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={() => {
                if (deleteId) {
                  deleteReminder.mutate(deleteId, {
                    onSuccess: () => setDeleteId(null),
                  });
                }
              }}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-8 py-3 text-base"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
