"use client";
import { useEffect, useState } from "react";

/** Persist any JSON-serializable state in localStorage */
export function useLocalRows<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);

  // hydrate on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // persist on change
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState] as const;
}
