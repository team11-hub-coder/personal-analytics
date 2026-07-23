"use client";

/**
 * ChatMessages Component
 *
 * Displays the list of chat messages with:
 * - Empty state with suggestion chips
 * - Message bubbles (user = gradient, assistant = gray)
 * - Typing indicator when AI is responding
 * - Bold markdown support (**text**)
 *
 * @example
 * <ChatMessages
 *   messages={messages}
 *   isTyping={false}
 *   onSuggestionClick={setInput}
 * />
 */

import { Bot, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/types";

/** Quick suggestion chips for new users — covers all modules */
const suggestions = [
  "How much did I spend?",
  "What are my budgets?",
  "Summarize my recent workouts",
  "What tasks are pending?",
  "Any upcoming reminders?",
  "Give me a full summary",
];

interface ChatMessagesProps {
  /** Array of chat messages to display */
  messages: ChatMessage[];
  /** Whether the AI is currently responding */
  isTyping: boolean;
  /** Whether initial messages are loading */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Optimistic user message to display immediately */
  optimisticMessage?: string | null;
  /** Callback when a suggestion chip is clicked */
  onSuggestionClick: (s: string) => void;
  /** Ref for auto-scrolling to bottom */
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ChatMessages({
  messages,
  isTyping,
  isLoading,
  error,
  optimisticMessage,
  onSuggestionClick,
  scrollRef,
}: ChatMessagesProps) {
  /**
   * Format ISO date string to readable time
   * @example "2026-07-11T14:30:00Z" → "2:30 PM"
   */
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  /**
   * Render message content with bold markdown support
   * Converts **text** to <strong>text</strong>
   */
  const renderContent = (content: string) => {
    return content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {/* Loading skeleton */}
      {isLoading && messages.length === 0 && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state with suggestions */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] flex items-center justify-center mb-3">
            <Bot size={24} className="text-white" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text)] mb-1">
            Ask me anything
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            I can analyze your finances, workouts, tasks &amp; more.
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {suggestions.map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick(s)}
                className="text-xs border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message list */}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-2 ${
            msg.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {/* AI avatar */}
          {msg.role === "assistant" && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot size={12} className="text-white" />
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] text-white"
                  : "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
              }`}
            >
              <div className="whitespace-pre-wrap">
                {renderContent(msg.content)}
              </div>
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] mt-1 px-1">
              {formatTime(msg.created_at)}
            </span>
          </div>

          {/* User avatar */}
          {msg.role === "user" && (
            <div className="w-6 h-6 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <User size={12} className="text-[var(--color-text-secondary)]" />
            </div>
          )}
        </div>
      ))}

      {/* Optimistic user message (shown immediately while API processes) */}
      {optimisticMessage && (
        <div className="flex gap-2 justify-end">
          <div className="flex flex-col items-end">
            <div className="max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] text-white opacity-80">
              <p className="whitespace-pre-wrap">{optimisticMessage}</p>
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] mt-1 px-1">
              Sending...
            </span>
          </div>
          <div className="w-6 h-6 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <User size={12} className="text-[var(--color-text-secondary)]" />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex gap-2 justify-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex gap-2" role="status" aria-label="AI is thinking">
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

      {/* Scroll anchor for auto-scroll */}
      {scrollRef && <div ref={scrollRef} />}
    </div>
  );
}
