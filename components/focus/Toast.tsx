"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, Phone, UserX } from "lucide-react";

export interface Toast {
  id: number;
  type: "warning" | "danger";
  message: string;
  icon: typeof AlertTriangle;
}

let toastId = 0;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastId;
    const icon = type === "danger" ? Phone : UserX;
    setToasts((prev) => [...prev.slice(-2), { id, type, message, icon }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return { toasts, addToast };
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in"
          style={{
            backgroundColor: toast.type === "danger" ? "#fef2f2" : "#fef3c7",
            border: `1px solid ${toast.type === "danger" ? "#fca5a5" : "#fcd34d"}`,
          }}
        >
          <toast.icon
            size={18}
            style={{ color: toast.type === "danger" ? "#dc2626" : "#92400e" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: toast.type === "danger" ? "#dc2626" : "#92400e" }}
          >
            {toast.message}
          </span>
        </div>
      ))}
    </div>
  );
}
