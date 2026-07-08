"use client";

import { Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  disabled,
}: ChatInputProps) {
  return (
    <div className="border-t border-[var(--color-border)] p-3 bg-[var(--color-surface)] flex-shrink-0">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !disabled && onSend()}
          placeholder="Ask about your data..."
          disabled={disabled}
          className="flex-1 border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gradient-from)] focus:border-transparent disabled:opacity-50"
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || disabled}
          className="bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] text-white p-2 rounded-lg opacity-90 hover:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
