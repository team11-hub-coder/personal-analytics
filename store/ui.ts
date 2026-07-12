import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  theme: "light" | "dark";
  chatButtonPos: { x: number; y: number };
  cameraEnabled: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setChatButtonPos: (pos: { x: number; y: number }) => void;
  toggleCamera: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      theme: "light",
      chatButtonPos: { x: 24, y: 24 },
      cameraEnabled: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        })),
      setChatButtonPos: (pos) => set({ chatButtonPos: pos }),
      toggleCamera: () =>
        set((state) => ({
          cameraEnabled: !state.cameraEnabled,
        })),
    }),
    {
      name: "ui-store",
      partialize: (state) => ({ theme: state.theme, chatButtonPos: state.chatButtonPos }),
      storage: createJSONStorage(() => {
        const storage: Storage = {
          getItem: (name: string) => {
            const raw = localStorage.getItem(name);
            if (!raw) return null;
            try {
              JSON.parse(raw);
              return raw;
            } catch {
              localStorage.removeItem(name);
              return null;
            }
          },
          setItem: (name: string, value: string) => localStorage.setItem(name, value),
          removeItem: (name: string) => localStorage.removeItem(name),
          clear: () => localStorage.clear(),
          get length() { return localStorage.length; },
          key: (index: number) => localStorage.key(index),
        };
        return storage;
      }),
    }
  )
);
