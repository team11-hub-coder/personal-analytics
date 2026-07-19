"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { Reminder } from "@/types";

export function useReminders() {
  const supabase = createClient();

  return useQuery<Reminder[]>({
    queryKey: ["reminders"],
    refetchInterval: 30000, // Refresh every 30s for Telegram bot updates
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("remind_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddReminder() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminder: {
      title: string;
      remind_at: string;
      repeat: "none" | "daily" | "weekly" | "monthly";
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Convert local datetime to UTC for storage
      const localDate = new Date(reminder.remind_at);
      const utcDate = localDate.toISOString();

      const { error } = await supabase.from("reminders").insert({
        user_id: user!.id,
        title: reminder.title,
        remind_at: utcDate,
        repeat: reminder.repeat,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

export function useUpdateReminder() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminder: {
      id: number;
      title: string;
      remind_at: string;
      repeat: "none" | "daily" | "weekly" | "monthly";
    }) => {
      // Convert local datetime to UTC for storage
      const localDate = new Date(reminder.remind_at);
      const utcDate = localDate.toISOString();

      const { error } = await supabase
        .from("reminders")
        .update({
          title: reminder.title,
          remind_at: utcDate,
          repeat: reminder.repeat,
        })
        .eq("id", reminder.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

export function useDeleteReminder() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

export function useToggleReminder() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminder: { id: number; is_active: boolean }) => {
      const { error } = await supabase
        .from("reminders")
        .update({ is_active: !reminder.is_active })
        .eq("id", reminder.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}
