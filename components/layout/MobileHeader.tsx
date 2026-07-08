"use client";

import { useUIStore } from "@/store/ui";
import { Menu, Moon, Sun } from "lucide-react";

export default function MobileHeader() {
  const { toggleSidebar, theme, toggleTheme } = useUIStore();

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
      <button
        onClick={toggleSidebar}
        className="p-2 text-muted-foreground hover:bg-muted rounded-lg"
      >
        <Menu size={20} />
      </button>
      <h1 className="text-sm font-bold text-foreground">
        Personal Analytics
      </h1>
      <button
        onClick={toggleTheme}
        className="p-2 text-muted-foreground hover:bg-muted rounded-lg"
      >
        {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </header>
  );
}
