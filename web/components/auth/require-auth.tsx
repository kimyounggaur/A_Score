"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { useSessionStore } from "@/lib/stores/session";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const hydrated = useSessionStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated || session) return;
    const next = `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [hydrated, router, session]);

  if (!hydrated || !session) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center" role="status">
        <LoaderCircle className="size-6 animate-spin text-cta" aria-hidden="true" />
        <span className="ml-2 text-sm text-text-muted">로그인을 확인하고 있어요.</span>
      </div>
    );
  }

  return children;
}
