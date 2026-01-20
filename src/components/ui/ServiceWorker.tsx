"use client";
import { useEffect } from "react";

export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // no-op; failing to register shouldn't block app
    });
  }, []);

  return null;
}
