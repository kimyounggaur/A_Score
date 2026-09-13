import type { Metadata } from "next";

import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "설정" };

export default function AdminSettingsPage() {
  return <SettingsForm />;
}
