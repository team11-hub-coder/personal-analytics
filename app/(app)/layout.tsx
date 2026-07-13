"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import ChatPanel, { ChatFloatingButton } from "@/components/chat/ChatPanel";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUIStore } from "@/store/ui";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  usePushNotifications();
  const { chatOpen, setChatOpen } = useUIStore();
  const [chatFullscreen, setChatFullscreen] = useState(false);
  const [usageStats, setUsageStats] = useState<{
    daily: { used: number; limit: number };
    hourly: { used: number; limit: number };
  } | null>(null);

  return (
    <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: "var(--color-bg)" }}>
      <Sidebar />

      {/* Main content — only this column scrolls */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto hide-scrollbar">
        <MobileHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Chat overlay — slides in from right on all screen sizes */}
      {!chatFullscreen && (
        <ChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          onToggleFullscreen={() => setChatFullscreen(true)}
          usage={usageStats}
          onUsageUpdate={setUsageStats}
        />
      )}

      {/* Fullscreen chat */}
      {chatFullscreen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setChatFullscreen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
            <div className="w-full h-full max-w-4xl bg-[var(--color-surface)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <ChatPanel
                open={true}
                onClose={() => setChatFullscreen(false)}
                fullscreen
                onToggleFullscreen={() => setChatFullscreen(false)}
                usage={usageStats}
                onUsageUpdate={setUsageStats}
              />
            </div>
          </div>
        </>
      )}

      {/* Floating chat button */}
      {!chatFullscreen && !chatOpen && (
        <ChatFloatingButton onClick={() => setChatOpen(true)} />
      )}
    </div>
  );
}
