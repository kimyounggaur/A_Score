"use client";

import Link from "next/link";
import { Bell, Coins, Music2, Search, ShoppingBag, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { INSTRUMENT_ID, getInstrument, type InstrumentId } from "@/lib/catalog/taxonomy";
import { useSiteName } from "@/hooks/use-site-name";
import { useCartStore } from "@/lib/stores/cart";
import { useSessionStore } from "@/lib/stores/session";
import { useMounted } from "@/hooks/use-mounted";

function instrumentLink(id: InstrumentId) {
  const instrument = getInstrument(id);
  if (!instrument) throw new Error(`분류에 없는 악기예요: ${id}`);
  return { href: `/instruments/${instrument.id}`, label: instrument.label };
}

const desktopLinks = [
  instrumentLink(INSTRUMENT_ID.ACOUSTIC_GUITAR),
  instrumentLink(INSTRUMENT_ID.ELECTRIC_GUITAR),
  instrumentLink(INSTRUMENT_ID.DRUMS),
  instrumentLink(INSTRUMENT_ID.PIANO),
  { href: "/scores?type=bundle", label: "악보집" },
  { href: "/scores?price=free", label: "무료악보" },
  { href: "/points/charge", label: "포인트충전" },
] as const;

export function SiteHeader() {
  const mounted = useMounted();
  const cartCount = useCartStore((state) => state.items.length);
  const session = useSessionStore((state) => state.session);
  const siteName = useSiteName();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="page-shell flex h-[var(--header-h)] items-center gap-2 md:gap-4">
        <Link
          className="font-display inline-flex min-h-11 shrink-0 items-center gap-2 text-lg font-semibold text-ink-900"
          href="/"
          aria-label={`${siteName} 홈`}
        >
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-cta text-surface"
            aria-hidden="true"
          >
            <Music2 className="size-5" strokeWidth={1.5} />
          </span>
          <span>{siteName}</span>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex"
          aria-label="주요 메뉴"
        >
          {desktopLinks.map((item) => (
            <Link
              className="inline-flex min-h-11 shrink-0 items-center rounded-md px-1.5 text-xs font-medium text-ink-700 hover:bg-brand-50 hover:text-cta xl:px-2.5 xl:text-sm"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Link
            className="inline-flex size-11 items-center justify-center rounded-lg text-ink-700 hover:bg-muted"
            href="/scores"
            aria-label="악보 검색"
          >
            <Search className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </Link>

          {mounted && session ? (
            <Link
              className="hidden min-h-11 items-center gap-1.5 rounded-full bg-point-bg px-3 text-sm font-semibold text-point-ink sm:inline-flex"
              href="/me/points"
            >
              <Coins className="size-4" strokeWidth={1.5} aria-hidden="true" />
              포인트
            </Link>
          ) : null}

          <Link
            className="hidden size-11 items-center justify-center rounded-lg text-ink-700 hover:bg-muted md:inline-flex"
            href="/notifications"
            aria-label="알림"
          >
            <Bell className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </Link>

          <Link
            className="relative hidden size-11 items-center justify-center rounded-lg text-ink-700 hover:bg-muted md:inline-flex"
            href="/cart"
            aria-label={mounted ? `장바구니, ${cartCount}개 담김` : "장바구니"}
          >
            <ShoppingBag className="size-5" strokeWidth={1.5} aria-hidden="true" />
            {mounted && cartCount > 0 ? (
              <Badge className="absolute right-0 top-0 min-w-5 justify-center px-1" variant="sale">
                {cartCount}
              </Badge>
            ) : null}
          </Link>

          <Link
            className="hidden size-11 items-center justify-center rounded-lg text-ink-700 hover:bg-muted md:inline-flex"
            href={mounted && session ? "/me" : "/login"}
            aria-label={mounted && session ? "마이페이지" : "로그인"}
          >
            <UserRound className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
