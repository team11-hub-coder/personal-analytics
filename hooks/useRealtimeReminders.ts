"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

/**
 * Subscribes to Supabase Realtime changes on the `reminders` table.
 * When a row is inserted, updated, or deleted, invalidates the ["reminders"]
 * query so all consumers (list, bell, stats) re-fetch instantly.
 */
export function useRealtimeReminders() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("reminders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reminders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["reminders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
