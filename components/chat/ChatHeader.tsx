"use client";

/**
 * ChatHeader Component
 *
 * Displays the chat panel header with:
 * - AI assistant icon and name
 * - Fullscreen toggle button (optional)
 * - Close button
 *
 * @example
 * <ChatHeader onClose={() => setOpen(false)} />
 */

import { Bot, X, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  /** Callback to close the chat panel */
  onClose: () => void;
  /** Whether the panel is in fullscreen mode */
  fullscreen?: boolean;
  /** Callback to toggle fullscreen mode */
  onToggleFullscreen?: () => void;
  /** Callback to clear all chat messages */
  onClear?: () => void;
  /** Whether the clear operation is in progress */
  isClearing?: boolean;
  /** Current usage stats */
  usage?: {
    daily: { used: number; limit: number };
    hourly: { used: number; limit: number };
  } | null;
}

export default function ChatHeader({
  onClose,
  fullscreen,
  onToggleFullscreen,
  onClear,
  isClearing,
  usage,
}: ChatHeaderProps) {
  // Calculate remaining messages
  const remaining = usage ? usage.daily.limit - usage.daily.used : null;
  const isNearLimit = remaining !== null && remaining <= 10;
  const isAtLimit = remaining !== null && remaining <= 0;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
      {/* Left: Icon and title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">
            AI Assistant
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            {isAtLimit
              ? "Daily limit reached"
              : isNearLimit
                ? `${remaining} messages left today`
                : "Ask about your data"}
          </p>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-1">
        {onClear && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={isClearing}
            className="h-8 w-8 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
            title="Clear chat history"
            aria-label="Clear chat history"
          >
            <Trash2 size={16} />
          </Button>
        )}
        {onToggleFullscreen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className="h-8 w-8 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          aria-label="Close chat"
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  );
}
