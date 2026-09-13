"use client";

import { useEffect, useState } from "react";

import displayCopy from "@/lib/config/display-copy.json";
import { ADMIN_SETTINGS_UPDATED_EVENT } from "@/lib/repositories/browser-events";
import type { AdminSettings } from "@/lib/repositories/interfaces";
import { settingsRepository } from "@/lib/repositories/settings-repository";

export function useSiteName() {
  const [siteName, setSiteName] = useState(displayCopy.siteName);

  useEffect(() => {
    let active = true;
    const apply = (nextName: string) => {
      if (!active) return;
      setSiteName(nextName);
    };
    void settingsRepository.getSettings().then((settings) => apply(settings.siteName));
    const handleSettings = (event: Event) => {
      apply((event as CustomEvent<AdminSettings>).detail.siteName);
    };
    window.addEventListener(ADMIN_SETTINGS_UPDATED_EVENT, handleSettings);
    return () => {
      active = false;
      window.removeEventListener(ADMIN_SETTINGS_UPDATED_EVENT, handleSettings);
    };
  }, []);

  return siteName;
}
