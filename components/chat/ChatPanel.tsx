"use client";

/**
 * ChatPanel Component
 *
 * Main chat interface that displays messages and handles user input.
 * Supports three modes:
 * - Desktop sidebar (xl+ screens): Sticky panel on the right
 * - Mobile overlay: Slides in from the right
 * - Fullscreen: Centered modal for focused conversation
 *
 * @example
 * <ChatPanel open={true} onClose={() => setOpen(false)} />
 */

import { useState, useRef, useEffect } from "react";
import { useChatMessages, useSendMessage, useClearChat } from "@/hooks/useChat";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

interface ChatPanelProps {
  /** Whether the panel is visible */
  open: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Render as desktop sidebar (sticky, fixed width) */
  desktop?: boolean;
  /** Render as fullscreen modal */
  fullscreen?: boolean;
  /** Toggle fullscreen mode */
  onToggleFullscreen?: () => void;
  /** Current usage stats (from parent) */
  usage?: {
    daily: { used: number; limit: number };
    hourly: { used: number; limit: number };
  } | null;
  /** Callback to update usage stats in parent */
  onUsageUpdate?: (usage: {
    daily: { used: number; limit: number };
    hourly: { used: number; limit: number };
  }) => void;
}

export default function ChatPanel({
  open,
  onClose,
  desktop,
  fullscreen,
  onToggleFullscreen,
  usage,
  onUsageUpdate,
}: ChatPanelProps) {
  const { data: messages = [], isLoading: isLoadingMessages, error: messagesError } = useChatMessages();
  const sendMessage = useSendMessage();
  const clearChat = useClearChat();
  const [input, setInput] = useState("");
  const [optimisticMessage, setOptimisticMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages load or panel opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, optimisticMessage, open]);

  /**
   * Handles sending a message.
   * Shows the user message immediately (optimistic update) while API processes.
   */
  const handleSend = (messageContent?: string) => {
    const content = messageContent || input;
    if (!content.trim() || sendMessage.isPending) return;

    // Clear any previous error
    setSendError(null);

    // Show user message immediately
    setOptimisticMessage(content);

    // Build full conversation history for API context
    const apiMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    apiMessages.push({ role: "user", content });

    sendMessage.mutate(
      { content, messages: apiMessages },
      {
        onSuccess: (data) => {
          // Update usage stats from API response
          if (data.usage && onUsageUpdate) {
            onUsageUpdate(data.usage);
          }
        },
        onError: (error) => {
          // Show error feedback to user
          setSendError(error.message || "Failed to send message. Please try again.");
          // Extract usage from error if available
          const errorWithUsage = error as unknown as { usage?: { daily: { used: number; limit: number }; hourly: { used: number; limit: number } } };
          if (errorWithUsage.usage && onUsageUpdate) {
            onUsageUpdate(errorWithUsage.usage);
          }
        },
        onSettled: () => {
          // Clear optimistic message when API call completes
          setOptimisticMessage(null);
        },
      }
    );
    setInput("");
  };

  /**
   * Handles clearing chat with confirmation dialog.
   */
  const handleClearChat = () => {
    setShowClearDialog(true);
  };

  const confirmClearChat = () => {
    clearChat.mutate();
    setShowClearDialog(false);
  };

  // Shared panel content (header + messages + input)
  const panelContent = (
    <>
      <ChatHeader
        onClose={onClose}
        fullscreen={fullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onClear={messages.length > 0 ? handleClearChat : undefined}
        isClearing={clearChat.isPending}
        usage={usage}
      />
      <ChatMessages
        messages={messages}
        isTyping={sendMessage.isPending}
        isLoading={isLoadingMessages}
        error={messagesError?.message || sendError}
        optimisticMessage={optimisticMessage}
        onSuggestionClick={handleSend}
        scrollRef={messagesEndRef}
      />
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        disabled={sendMessage.isPending}
      />

      {/* Clear chat confirmation dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Chat History</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all chat messages? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              disabled={clearChat.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmClearChat}
              disabled={clearChat.isPending}
            >
              {clearChat.isPending ? "Clearing..." : "Clear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // Fullscreen mode: centered modal
  if (fullscreen) {
    return (
      <div className="flex flex-col h-full bg-[var(--color-surface)]">
        {panelContent}
      </div>
    );
  }

  // Desktop mode: sticky sidebar
  if (desktop) {
    if (!open) return null;
    return (
      <aside className="sticky top-0 h-dvh w-[380px] flex-shrink-0 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col">
        {panelContent}
      </aside>
    );
  }

  // Mobile mode: sliding overlay (z-index above sidebar at z-50)
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`
          fixed top-0 right-0 z-[70] h-dvh w-full sm:w-96 bg-[var(--color-surface)] border-l border-[var(--color-border)]
          flex flex-col shadow-2xl transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
        role="dialog"
        aria-label="Chat panel"
      >
        {panelContent}
      </div>
    </>
  );
}

/**
 * ChatFloatingButton Component
 *
 * Floating action button that opens the chat panel.
 * Features:
 * - Gradient background with glow effect
 * - Hover animations (scale, shadow)
 * - Tooltip on hover
 * - Bot icon for AI assistant branding
 *
 * @example
 * <ChatFloatingButton onClick={() => setOpen(true)} />
 */
export function ChatFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Open AI chat"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />

      {/* Button */}
      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] text-white shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl">
        <Bot size={24} className="transition-transform duration-300 group-hover:scale-110" />
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-[var(--color-text)] text-[var(--color-bg)] text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        AI Assistant
        <div className="absolute top-full right-4 w-2 h-2 bg-[var(--color-text)] transform rotate-45 -translate-y-1" />
      </div>
    </button>
  );
}
