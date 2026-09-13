"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Coins, Heart, LibraryBig, ListChecks, UserRound } from "lucide-react";

const accountLinks = [
  { href: "/me", label: "요약", icon: UserRound, exact: true },
  { href: "/me/library", label: "보관함", icon: LibraryBig, exact: false },
  { href: "/me/orders", label: "주문 내역", icon: ListChecks, exact: false },
  { href: "/me/points", label: "포인트", icon: Coins, exact: false },
  { href: "/me/wishlist", label: "찜", icon: Heart, exact: false },
  { href: "/notifications", label: "알림", icon: Bell, exact: false },
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      className="-mx-2 overflow-x-auto px-2 lg:mx-0 lg:overflow-visible lg:px-0"
      aria-label="마이페이지 메뉴"
    >
      <div className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
        {accountLinks.map(({ href, label, icon: Icon, exact }) => {
          const current = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${
                current
                  ? "bg-brand-100 text-brand-800"
                  : "text-ink-700 hover:bg-muted hover:text-ink-900"
              }`}
              href={href}
              key={href}
              aria-current={current ? "page" : undefined}
            >
              <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
