"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reminderSchema, type ReminderFormData } from "@/lib/validations";
import type { Reminder } from "@/types";
import { toLocalDatetimeString, toISOWithOffset } from "@/lib/dates";

interface ReminderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReminderFormData) => void;
  isPending: boolean;
  initialData?: Reminder | null;
}

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
const minutes = ["00", "15", "30", "45"];

function parseTimeFromISO(isoStr: string) {
  if (!isoStr) return { hour: "9", minute: "00", period: "AM" };
  const timePart = isoStr.split("T")[1] || "09:00";
  const [h, m] = timePart.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { hour: String(hour12), minute: String(m).padStart(2, "0"), period };
}

function buildISODate(dateStr: string, hour: string, minute: string, period: string) {
  let h24 = parseInt(hour, 10);
  if (period === "PM" && h24 !== 12) h24 += 12;
  if (period === "AM" && h24 === 12) h24 = 0;
  return `${dateStr}T${String(h24).padStart(2, "0")}:${minute}`;
}

export function ReminderForm({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  initialData,
}: ReminderFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: "",
      remind_at: "",
      repeat: "none",
    },
  });

  const remindAt = watch("remind_at");
  const timeParts = parseTimeFromISO(remindAt);
  const dateValue = remindAt?.split("T")[0] || "";

  useEffect(() => {
    if (open) {
      if (initialData) {
        const dt = new Date(initialData.remind_at);
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, "0");
        const day = String(dt.getDate()).padStart(2, "0");
        const hours = String(dt.getHours()).padStart(2, "0");
        const minutes = String(dt.getMinutes()).padStart(2, "0");
        reset({
          title: initialData.title,
          remind_at: `${year}-${month}-${day}T${hours}:${minutes}`,
          repeat: initialData.repeat,
        });
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
        const day = String(tomorrow.getDate()).padStart(2, "0");
        reset({
          title: "",
          remind_at: `${year}-${month}-${day}T09:00`,
          repeat: "none",
        });
      }
    }
  }, [open, initialData, reset]);

  const handleDateChange = (newDate: string) => {
    const time = parseTimeFromISO(remindAt);
    setValue("remind_at", buildISODate(newDate, time.hour, time.minute, time.period), { shouldValidate: true });
  };

  const handleTimeChange = (field: "hour" | "minute" | "period", value: string) => {
    const time = parseTimeFromISO(remindAt);
    const updated = { ...time, [field]: value };
    const currentDate = remindAt?.split("T")[0] || new Date().toISOString().slice(0, 10);
    setValue("remind_at", buildISODate(currentDate, updated.hour, updated.minute, updated.period), { shouldValidate: true });
  };

  const handleFormSubmit = (data: ReminderFormData) => {
    // Convert local datetime-local value to ISO with timezone offset
    // so Supabase timestamptz stores the correct absolute instant
    onSubmit({
      ...data,
      remind_at: toISOWithOffset(data.remind_at),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Reminder" : "Add Reminder"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[var(--color-text-secondary)]">
              Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Take medication"
              {...register("title")}
              className="border-[var(--color-border)] focus:ring-[var(--color-primary)]"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-[var(--color-text-secondary)]">Date</Label>
            <div
              className="relative cursor-pointer"
              onClick={() => {
                const el = document.getElementById("remind-date");
                if (el && "showPicker" in el) (el as HTMLInputElement).showPicker();
              }}
            >
              <Input
                id="remind-date"
                type="date"
                value={dateValue}
                className="border-[var(--color-border)] focus:ring-[var(--color-primary)] cursor-pointer"
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label className="text-[var(--color-text-secondary)]">Time</Label>
            <div className="flex gap-2 items-center">
              {/* Hour */}
              <Controller
                control={control}
                name="remind_at"
                render={() => (
                  <Select value={timeParts.hour || "9"} onValueChange={(v) => { if (v) handleTimeChange("hour", v); }}>
                    <SelectTrigger className="w-20 border-[var(--color-border)] focus:ring-[var(--color-primary)] cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <span className="text-[var(--color-text-muted)] font-medium">:</span>
              {/* Minute */}
              <Controller
                control={control}
                name="remind_at"
                render={() => (
                  <Select value={timeParts.minute || "00"} onValueChange={(v) => { if (v) handleTimeChange("minute", v); }}>
                    <SelectTrigger className="w-20 border-[var(--color-border)] focus:ring-[var(--color-primary)] cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {/* AM/PM */}
              <Controller
                control={control}
                name="remind_at"
                render={() => (
                  <Select value={timeParts.period || "AM"} onValueChange={(v) => { if (v) handleTimeChange("period", v); }}>
                    <SelectTrigger className="w-24 border-[var(--color-border)] focus:ring-[var(--color-primary)] cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {errors.remind_at && (
            <p className="text-sm text-red-500">{errors.remind_at.message}</p>
          )}

          {/* Repeat */}
          <div className="space-y-2">
            <Label className="text-[var(--color-text-secondary)]">Repeat</Label>
            <Controller
              control={control}
              name="repeat"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="border-[var(--color-border)] focus:ring-[var(--color-primary)] cursor-pointer">
                    <SelectValue placeholder="Select repeat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.repeat && (
              <p className="text-sm text-red-500">{errors.repeat.message}</p>
            )}
          </div>

          <DialogFooter className="!justify-center gap-3 py-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="border-[var(--color-border)] px-8 py-3 text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isPending || !remindAt}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-8 py-3 text-base"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
