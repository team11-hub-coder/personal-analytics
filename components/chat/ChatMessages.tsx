"use client";

import { Bot, User, MessageCircle } from "lucide-react";
import type { ChatMessage } from "@/types";

const suggestions = [
  "How much did I spend?",
  "Show my workouts",
  "What tasks are pending?",
  "Give me a summary",
];

interface ChatMessagesProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onSuggestionClick: (s: string) => void;
}

export default function ChatMessages({
  messages,
  isTyping,
  onSuggestionClick,
}: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] flex items-center justify-center mb-3">
            <MessageCircle size={24} className="text-white" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text)] mb-1">
            Ask me anything
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            I can analyze your finances, workouts, tasks &amp; more.
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestionClick(s)}
                className="px-2.5 py-1 bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] rounded-full text-xs hover:bg-[var(--color-border)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "assistant" && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot size={12} className="text-white" />
            </div>
          )}
          <div
            className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === "user"
                ? "bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] text-white"
                : "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
            }`}
          >
            <div
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br />"),
              }}
            />
          </div>
          {msg.role === "user" && (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User size={12} className="text-[var(--color-text-secondary)]" />
            </div>
          )}
        </div>
      ))}

      {isTyping && (
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] flex items-center justify-center flex-shrink-0">
            <Bot size={12} className="text-white" />
          </div>
          <div className="bg-[var(--color-surface-hover)] rounded-xl px-3 py-2 flex gap-1 items-center">
            <span
              className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
