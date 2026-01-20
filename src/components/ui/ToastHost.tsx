"use client";
import React, { useEffect, useState } from "react";
import { ToastEvent, TOAST_EVENT } from "@/utils/toast";

type ToastItem = ToastEvent & { timeoutId?: number };

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastEvent>).detail;
      if (!detail) return;
      const timeoutId = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 4000);
      setToasts((prev) => [...prev, { ...detail, timeoutId }]);
    }

    window.addEventListener(TOAST_EVENT, onToast as EventListener);
    return () => window.removeEventListener(TOAST_EVENT, onToast as EventListener);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target?.timeoutId) window.clearTimeout(target.timeoutId);
      return prev.filter((t) => t.id !== id);
    });
  }

  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[60] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-lg border px-3 py-2 shadow-lg bg-white text-gray-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 ${
            t.type === "success"
              ? "border-green-200 dark:border-green-800"
              : t.type === "error"
              ? "border-red-200 dark:border-red-800"
              : "border-gray-200 dark:border-slate-700"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="text-sm">{t.message}</div>
          <button
            onClick={() => dismiss(t.id)}
            className="ml-auto rounded px-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
