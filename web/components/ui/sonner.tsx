"use client";

import { useEffect, useState } from "react";

import { subscribeToToasts, type ToastMessage } from "@/lib/toast";

const toneClass: Record<ToastMessage["tone"], string> = {
  success: "border-free/30 bg-free-bg text-free",
  error: "border-sale/30 bg-sale-bg text-sale-ink",
  info: "border-brand-200 bg-brand-50 text-brand-800",
};

export function Toaster() {
  const [items, setItems] = useState<ToastMessage[]>([]);

  useEffect(
    () =>
      subscribeToToasts((item) => {
        setItems((current) => [...current.slice(-2), item]);
        window.setTimeout(
          () => setItems((current) => current.filter((candidate) => candidate.id !== item.id)),
          4_500,
        );
      }),
    [],
  );

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-[calc(var(--tabbar-h)+1rem)] z-[100] flex flex-col items-center gap-2 md:bottom-5"
      aria-label="알림"
      role="region"
    >
      {items.map((item) => (
        <div
          className={`pointer-events-auto flex min-h-12 w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-2 text-sm font-medium shadow-lg ${toneClass[item.tone]}`}
          key={item.id}
          role={item.tone === "error" ? "alert" : "status"}
        >
          <span className="min-w-0 flex-1">{item.message}</span>
          {item.action ? (
            <button
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 font-bold underline underline-offset-4"
              type="button"
              onClick={() => {
                item.action?.onClick();
                setItems((current) => current.filter((candidate) => candidate.id !== item.id));
              }}
            >
              {item.action.label}
            </button>
          ) : null}
          <button
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-lg"
            type="button"
            aria-label="알림 닫기"
            onClick={() =>
              setItems((current) => current.filter((candidate) => candidate.id !== item.id))
            }
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
