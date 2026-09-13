"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

function remainingLabel(endAt: string, now: number) {
  const milliseconds = new Date(endAt).getTime() - now;
  if (milliseconds <= 0) return "할인이 종료됐어요";
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}일 ${hours}시간 남았어요`;
  return `${hours}시간 ${minutes}분 남았어요`;
}

export function SaleCountdown({ endAt }: { endAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <p
      className="inline-flex items-center gap-1.5 text-sm font-medium text-sale"
      aria-live="polite"
    >
      <Clock3 className="size-4" strokeWidth={1.5} aria-hidden="true" />
      {remainingLabel(endAt, now)}
    </p>
  );
}
