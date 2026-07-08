"use client";

import { useState, useRef, useEffect } from "react";
import { useChatMessages, useSendMessage } from "@/hooks/useChat";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { MessageCircle } from "lucide-react";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  desktop?: boolean;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function ChatPanel({
  open,
  onClose,
  desktop,
  fullscreen,
  onToggleFullscreen,
}: ChatPanelProps) {
  const { data: messages = [] } = useChatMessages();
  const sendMessage = useSendMessage();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input);
    setInput("");
  };

  const panelContent = (
    <>
      <ChatHeader
        onClose={onClose}
        fullscreen={fullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />
      <ChatMessages
        messages={messages}
        isTyping={sendMessage.isPending}
        onSuggestionClick={setInput}
      />
      <div ref={messagesEndRef} />
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        disabled={sendMessage.isPending}
      />
    </>
  );

  // Fullscreen
  if (fullscreen) {
    return (
      <div className="flex flex-col h-full bg-[var(--color-surface)]">
        {panelContent}
      </div>
    );
  }

  // Desktop sidebar
  if (desktop) {
    if (!open) return null;
    return (
      <aside className="sticky top-0 h-dvh w-[380px] flex-shrink-0 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col">
        {panelContent}
      </aside>
    );
  }

  // Mobile overlay
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      <div
        className={`
          fixed top-0 right-0 z-50 h-dvh w-full sm:w-96 bg-[var(--color-surface)] border-l border-[var(--color-border)]
          flex flex-col shadow-2xl transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {panelContent}
      </div>
    </>
  );
}

// Floating chat button
export function ChatFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] text-white shadow-lg flex items-center justify-center transition-all duration-200 opacity-90 hover:opacity-100"
    >
      <MessageCircle size={24} />
    </button>
  );
}
