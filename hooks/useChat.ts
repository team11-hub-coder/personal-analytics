"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "./useAuth";
import type { ChatMessage } from "@/types";

export function useChatMessages() {
  const supabase = createClient();
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["chatMessages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !authLoading && !!user,
  });
}

export function useSendMessage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      // Save user message
      const { data: userMsg, error: userErr } = await supabase
        .from("chat_messages")
        .insert({ role: "user", content })
        .select()
        .single();

      if (userErr) throw userErr;

      // Get AI response from API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      if (!res.ok) throw new Error("Failed to get AI response");

      const { reply } = await res.json();

      // Save assistant message
      const { data: assistantMsg, error: assistantErr } = await supabase
        .from("chat_messages")
        .insert({ role: "assistant", content: reply })
        .select()
        .single();

      if (assistantErr) throw assistantErr;

      return { userMsg, assistantMsg };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    },
  });
}

export function useClearChat() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .neq("id", 0); // delete all

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    },
  });
}
