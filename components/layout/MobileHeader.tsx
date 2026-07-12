"use client";

import { useUIStore } from "@/store/ui";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Menu, Moon, Sun } from "lucide-react";

export default function MobileHeader() {
  const { toggleSidebar, theme, toggleTheme } = useUIStore();

  return (
    <header
      className="lg:hidden sticky top-0 z-30 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-bg) 80%, transparent)",
        borderColor: "var(--color-border)",
      }}
    >
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg transition-colors"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <Menu size={20} />
      </button>
      <h1 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
        Personal Analytics
      </h1>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}
