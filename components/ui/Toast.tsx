// components/ui/Toast.tsx
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => removeToast(id), 3000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — bottom-right on desktop, bottom-centre on mobile */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full sm:w-auto pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto animate-fade-up
              px-4 py-3 rounded-xl text-sm font-medium shadow-2xl
              border backdrop-blur-xl
              transition-all duration-300
              ${
                toast.variant === "success"
                  ? "bg-green-900/80 border-green-600/40 text-green-200"
                  : toast.variant === "error"
                  ? "bg-red-900/80 border-red-600/40 text-red-200"
                  : "bg-[#1a1a1a]/90 border-white/10 text-white"
              }
            `}
          >
            <div className="flex items-center gap-2">
              {toast.variant === "success" && (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.variant === "error" && (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              )}
              {toast.variant === "info" && (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
