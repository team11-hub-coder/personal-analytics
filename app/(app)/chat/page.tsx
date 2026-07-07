"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChatMessage } from "@/lib/chat";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Load chat history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);

    if (data) setMessages(data);
  };

  const handleSend = async (content: string) => {
    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Date.now(),
      user_id: "temp",
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build messages array for API
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        user_id: "temp",
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Save both messages to DB
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("chat_messages").insert([
          { user_id: user.id, role: "user", content },
          { user_id: user.id, role: "assistant", content: data.message },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        user_id: "temp",
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", user.id);

    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <Card className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI Assistant</CardTitle>
          <Button variant="outline" size="sm" onClick={handleClear}>
            Clear Chat
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 gap-4 overflow-hidden">
          <ChatHistory messages={messages} isLoading={isLoading} />
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
