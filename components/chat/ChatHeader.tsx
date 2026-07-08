"use client";

import { Bot, X, Maximize2, Minimize2 } from "lucide-react";

interface ChatHeaderProps {
  onClose: () => void;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function ChatHeader({
  onClose,
  fullscreen,
  onToggleFullscreen,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">
            AI Assistant
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Ask about your data
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
