"use client";

import { notFound } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import type { DemoRole } from "@/lib/stores/session";
import { useSessionStore } from "@/lib/stores/session";

export function RequireRole({
  requiredRole,
  children,
}: {
  requiredRole: DemoRole;
  children: React.ReactNode;
}) {
  const session = useSessionStore((state) => state.session);
  const hydrated = useSessionStore((state) => state.hydrated);

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <LoaderCircle className="size-6 animate-spin text-cta" aria-hidden="true" />
        <span className="sr-only">권한을 확인하는 중</span>
      </div>
    );
  }

  if (session?.role !== requiredRole) notFound();
  return children;
}
