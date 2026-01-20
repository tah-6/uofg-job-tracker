export const TOAST_EVENT = "uofg-toast";

export type ToastType = "success" | "error" | "info";

export type ToastEvent = {
  id: string;
  message: string;
  type: ToastType;
};

export function toast(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") return;
  const detail: ToastEvent = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    message,
    type,
  };
  window.dispatchEvent(new CustomEvent<ToastEvent>(TOAST_EVENT, { detail }));
}
