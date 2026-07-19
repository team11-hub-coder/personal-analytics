"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "./useAuth";
import type { TelegramLink } from "@/types";

// ─── Get Link Status ─────────────────────────────────────────────────

export function useTelegramLink() {
  const supabase = createClient();
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["telegram-link", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("telegram_links")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data as TelegramLink | null;
    },
    enabled: !authLoading && !!user,
  });
}

// ─── Generate Connect Code ───────────────────────────────────────────

export function useGenerateConnectCode() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Generate a 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Upsert the link with new code
      const { data, error } = await supabase
        .from("telegram_links")
        .upsert(
          {
            user_id: user.id,
            chat_id: null, // Will be set when user messages bot
            connect_code: code,
            is_active: false, // Not active until linked
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;

      return { code, link: data as TelegramLink };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-link"] });
    },
  });
}

// ─── Unlink Telegram ─────────────────────────────────────────────────

export function useUnlinkTelegram() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("telegram_links")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-link"] });
    },
  });
}
