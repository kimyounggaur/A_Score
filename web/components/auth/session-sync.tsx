"use client";

import { useEffect } from "react";

import { useSessionStore } from "@/lib/stores/session";

const SESSION_STORAGE_KEYS = new Set(["ss.mock.session", "ss.mock.session.v1", "ss.mock.users"]);

export function SessionSync() {
  const refreshSession = useSessionStore((state) => state.refreshSession);

  useEffect(() => {
    const refresh = () => {
      void refreshSession().catch(() => undefined);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || SESSION_STORAGE_KEYS.has(event.key)) refresh();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshSession]);

  return null;
}
