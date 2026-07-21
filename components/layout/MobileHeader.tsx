"use client";

import { useUIStore } from "@/store/ui";
import { Menu, Moon, Sun } from "lucide-react";

export default function MobileHeader() {
  const { toggleSidebar, theme, toggleTheme } = useUIStore();

  return (
    <header
      className="lg:hidden sticky top-0 z-30 backdrop-blur-md border-b border-(--color-border) px-4 py-3 flex items-center justify-between bg-(--color-bg)/80"
    >
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg transition-colors text-(--color-text-secondary)"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <h1 className="text-sm font-bold text-(--color-text)">
        Personal Analytics
      </h1>
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg transition-colors text-(--color-text-secondary)"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </header>
  );
}
