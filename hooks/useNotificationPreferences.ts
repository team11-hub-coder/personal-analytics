"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { NotificationPreference } from "@/types";

async function getAuthenticatedUser(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export function useNotificationPreferences() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["notification_preferences"],
    queryFn: async () => {
      const user = await getAuthenticatedUser(supabase);

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // If no preferences exist, create default ones
      if (error && error.code === "PGRST116") {
        const { data: newPrefs, error: createErr } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: user.id,
            finance_enabled: false,
            workout_enabled: false,
            tasks_enabled: false,
            reminders_enabled: false,
          })
          .select()
          .single();

        if (createErr) throw createErr;
        return newPrefs as NotificationPreference;
      }

      if (error) throw error;
      return data as NotificationPreference;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      finance_enabled?: boolean;
      workout_enabled?: boolean;
      tasks_enabled?: boolean;
      reminders_enabled?: boolean;
    }) => {
      const user = await getAuthenticatedUser(supabase);

      const { error } = await supabase
        .from("notification_preferences")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_preferences"] });
    },
  });
}
