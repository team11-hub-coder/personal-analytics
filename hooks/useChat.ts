"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "./useAuth";
import type { ChatMessage } from "@/types";

/**
 * Custom hooks for chat functionality.
 *
 * Uses TanStack Query for server state management and Supabase for data persistence.
 * All Supabase operations are isolated in hooks (never in components).
 */

/**
 * Fetches chat messages for the current user.
 *
 * @returns Query result containing array of ChatMessage objects
 *
 * @example
 * const { data: messages, isLoading } = useChatMessages();
 */
export function useChatMessages() {
  const supabase = createClient();
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["chatMessages", user?.id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch chat messages:", error);
        throw error;
      }

      return data as ChatMessage[];
    },
    enabled: !authLoading && !!user,
    refetchOnWindowFocus: false,
  });
}

/**
 * Sends a message to the AI assistant.
 *
 * Flow:
 * 1. Save user message to Supabase
 * 2. Call API route (which calls Gemini)
 * 3. Save assistant response to Supabase
 * 4. Invalidate query cache to refresh messages
 *
 * @returns Mutation result with mutate function and status
 *
 * @example
 * const sendMessage = useSendMessage();
 * sendMessage.mutate({ content: "Hello", messages: [...] });
 */
export function useSendMessage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      messages,
    }: {
      content: string;
      messages: { role: string; content: string }[];
    }) => {
      // Verify user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save user message to database
      const { data: userMsg, error: userMsgError } = await supabase
        .from("chat_messages")
        .insert({
          user_id: user.id,
          role: "user",
          content,
        })
        .select()
        .single();
      if (userMsgError) {
        console.error("Failed to save user message:", userMsgError);
        throw new Error("Failed to save message");
      }

      // Call AI API route
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) {
        // Delete orphaned user message on API failure
        if (userMsg?.id) {
          await supabase.from("chat_messages").delete().eq("id", userMsg.id);
        }
        const errorData = await res.json().catch(() => ({}));
        console.error("Chat API error:", res.status, errorData);

        // Create error with usage data attached
        const error = new Error(errorData.error || "Failed to get AI response");
        (error as unknown as { usage?: typeof errorData.usage }).usage = errorData.usage;
        throw error;
      }

      const { message: assistantContent, usage } = await res.json();

      // Save assistant response to database
      const { error: assistantMsgError } = await supabase
        .from("chat_messages")
        .insert({
          user_id: user.id,
          role: "assistant",
          content: assistantContent,
        });
      if (assistantMsgError) {
        console.error("Failed to save assistant message:", assistantMsgError);
        throw new Error("Failed to save AI response");
      }

      return { assistantContent, usage };
    },
    onSuccess: () => {
      // Invalidate and refetch chat messages
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    },
    onError: (error) => {
      console.error("Send message failed:", error);
    },
  });
}

/**
 * Clears all chat messages for the current user.
 *
 * @returns Mutation result with mutate function and status
 *
 * @example
 * const clearChat = useClearChat();
 * clearChat.mutate();
 */
export function useClearChat() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to clear chat:", error);
        throw new Error("Failed to clear chat history");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    },
    onError: (error) => {
      console.error("Clear chat failed:", error);
    },
  });
}
