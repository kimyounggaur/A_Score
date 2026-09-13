import type { AdminSettings } from "@/lib/repositories/interfaces";

export const ADMIN_SETTINGS_UPDATED_EVENT = "scorestore:admin-settings-updated";

export function announceAdminSettings(settings: AdminSettings): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AdminSettings>(ADMIN_SETTINGS_UPDATED_EVENT, { detail: settings }),
  );
}
