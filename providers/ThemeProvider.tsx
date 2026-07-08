"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}
