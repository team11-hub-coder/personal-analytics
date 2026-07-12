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
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: "",
      remind_at: "",
      repeat: "none",
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        const dt = new Date(initialData.remind_at);
        const local = dt.toISOString().slice(0, 16);
        reset({
          title: initialData.title,
          remind_at: local,
          repeat: initialData.repeat,
        });
      } else {
        reset({ title: "", remind_at: "", repeat: "none" });
      }
    }
  }, [open, initialData, reset]);

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

          {/* Date & Time */}
          <div className="space-y-2">
            <Label
              htmlFor="remind_at"
              className="text-[var(--color-text-secondary)]"
            >
              Date & Time
            </Label>
            <Input
              id="remind_at"
              type="datetime-local"
              {...register("remind_at")}
              className="border-[var(--color-border)] focus:ring-[var(--color-primary)]"
            />
            {errors.remind_at && (
              <p className="text-sm text-red-500">{errors.remind_at.message}</p>
            )}
          </div>

          {/* Repeat */}
          <div className="space-y-2">
            <Label className="text-[var(--color-text-secondary)]">Repeat</Label>
            <Controller
              control={control}
              name="repeat"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="border-[var(--color-border)] focus:ring-[var(--color-primary)]">
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[var(--color-border)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Reminder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
