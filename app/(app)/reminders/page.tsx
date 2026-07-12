"use client";

import { useMemo, useState } from "react";
import { Bell, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useReminders, useAddReminder, useUpdateReminder } from "@/hooks/useReminders";
import { useRealtimeReminders } from "@/hooks/useRealtimeReminders";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { ReminderList } from "@/components/reminders/ReminderList";
import { ReminderAnalytics } from "@/components/reminders/ReminderAnalytics";
import { statCard, statColors, pageHeader } from "@/lib/theme";
import type { Reminder } from "@/types";
import type { ReminderFormData } from "@/lib/validations";

export default function RemindersPage() {
  useRealtimeReminders();
  const { data: reminders = [], isLoading } = useReminders();
  const addReminder = useAddReminder();
  const updateReminder = useUpdateReminder();

  const [formOpen, setFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const total = reminders.length;
  const active = useMemo(
    () => reminders.filter((r) => r.is_active).length,
    [reminders]
  );
  const overdue = useMemo(
    () =>
      reminders.filter(
        (r) => r.is_active && new Date(r.remind_at) < new Date()
      ).length,
    [reminders]
  );

  const stats = [
    {
      icon: <Bell size={20} />,
      label: "Total Reminders",
      value: total,
      color: statColors.rose,
    },
    {
      icon: <CheckCircle size={20} />,
      label: "Active",
      value: active,
      color: statColors.emerald,
    },
    {
      icon: <AlertCircle size={20} />,
      label: "Overdue",
      value: overdue,
      color: statColors.amber,
    },
  ];

  const handleAdd = (data: ReminderFormData) => {
    addReminder.mutate(data, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const handleUpdate = (data: ReminderFormData) => {
    if (!editingReminder) return;
    updateReminder.mutate(
      { id: editingReminder.id, ...data },
      {
        onSuccess: () => {
          setFormOpen(false);
          setEditingReminder(null);
        },
      }
    );
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingReminder(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className={pageHeader.container}>
        <div>
          <h1 className={pageHeader.title}>Reminders</h1>
          <p className={pageHeader.subtitle}>
            Never miss important events and deadlines.
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading
          ? [1, 2, 3].map((i) => (
              <div key={i} className={statCard.container}>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </div>
            ))
          : stats.map((stat) => (
              <div key={stat.label} className={statCard.container}>
                <div className="flex items-center gap-3">
                  <div
                    className={`${statCard.iconWrapper} ${stat.color}`}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className={statCard.label}>{stat.label}</p>
                    <p className={statCard.value}>{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Reminder List */}
      <ReminderList onEdit={handleEdit} />

      {/* Analytics */}
      <ReminderAnalytics />

      {/* Add / Edit Form */}
      <ReminderForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        onSubmit={editingReminder ? handleUpdate : handleAdd}
        isPending={addReminder.isPending || updateReminder.isPending}
        initialData={editingReminder}
      />
    </div>
  );
}
