"use client";

/**
 * ChatInput Component
 *
 * Text input field with send button for the chat interface.
 * Features:
 * - Enter key to send
 * - Loading state with spinner
 * - Disabled state when AI is responding
 * - Uses shadcn UI components
 *
 * @example
 * <ChatInput
 *   input={input}
 *   setInput={setInput}
 *   onSend={handleSend}
 *   disabled={isPending}
 * />
 */

import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  /** Current input value */
  input: string;
  /** Callback to update input value */
  setInput: (v: string) => void;
  /** Callback when send button is clicked or Enter is pressed */
  onSend: () => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether a message is being sent (shows spinner) */
  isLoading?: boolean;
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  disabled,
  isLoading,
}: ChatInputProps) {
  /**
   * Handle Enter key press
   * Only sends if not disabled and not currently loading
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && !isLoading) {
      onSend();
    }
  };

  return (
    <div className="border-t border-[var(--color-border)] p-3 bg-[var(--color-surface)] flex-shrink-0">
      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your data..."
          disabled={disabled || isLoading}
          maxLength={10000}
          className="flex-1 text-xs"
          aria-label="Chat message input"
        />
        <Button
          onClick={onSend}
          disabled={!input.trim() || disabled || isLoading}
          size="icon"
          className="bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] text-white hover:opacity-90 flex-shrink-0"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </Button>
      </div>
    </div>
  );
}
