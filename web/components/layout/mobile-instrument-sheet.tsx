"use client";

import { ChevronDown, X } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function MobileInstrumentSheet({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = () => dialogRef.current?.close();
  const wrapFocusAtEdges = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;

    const dialog = event.currentTarget;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) =>
        !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
        element.getClientRects().length > 0,
    );
    const first = focusable.at(0);
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="md:hidden">
      <button
        className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-cta"
        type="button"
        ref={triggerRef}
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        전체 악기
        <ChevronDown className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
      <dialog
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-ink-900 backdrop:bg-ink-900/40"
        ref={dialogRef}
        aria-labelledby="mobile-instrument-sheet-title"
        onClose={() => triggerRef.current?.focus()}
        onKeyDown={wrapFocusAtEdges}
      >
        <div className="relative z-10 ml-auto h-full w-[min(22rem,90vw)] overflow-y-auto border-l border-line bg-surface shadow-xl">
          <div className="sticky top-0 z-10 flex min-h-14 items-center justify-between border-b border-line bg-surface px-5">
            <h2 className="font-display text-lg font-semibold" id="mobile-instrument-sheet-title">
              전체 악기
            </h2>
            <button
              className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted"
              type="button"
              aria-label="전체 악기 닫기"
              onClick={close}
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
        <button
          className="absolute inset-0 z-0 h-full w-full cursor-default"
          type="button"
          aria-label="전체 악기 바깥 영역 닫기"
          tabIndex={-1}
          onClick={close}
        />
      </dialog>
    </div>
  );
}
