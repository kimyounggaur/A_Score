"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LibraryBig, Search, ShoppingBag, UserRound } from "lucide-react";

import { useMounted } from "@/hooks/use-mounted";
import { useCartStore } from "@/lib/stores/cart";

const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "/scores", label: "검색", icon: Search },
  { href: "/cart", label: "장바구니", icon: ShoppingBag, cart: true },
  { href: "/me/library", label: "보관함", icon: LibraryBig },
  { href: "/me", label: "마이", icon: UserRound },
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomTabBar() {
  const pathname = usePathname();
  const mounted = useMounted();
  const cartCount = useCartStore((state) => state.items.length);
  const currentHref = tabs
    .filter((tab) => isCurrent(pathname, tab.href))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  if (pathname.startsWith("/checkout")) return null;

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden"
      aria-label="하단 메뉴"
    >
      <div className="mx-auto grid h-[var(--tabbar-h)] max-w-lg grid-cols-5">
        {tabs.map((tab) => {
          const { href, label, icon: Icon } = tab;
          const showsCartCount = "cart" in tab && tab.cart;
          const current = href === currentHref;
          const accessibleLabel =
            showsCartCount && mounted ? `${label}, ${cartCount}개 담김` : label;

          return (
            <Link
              className={`relative flex min-h-11 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                current ? "text-cta" : "text-ink-600"
              }`}
              href={href}
              key={href}
              aria-current={current ? "page" : undefined}
              aria-label={accessibleLabel}
            >
              <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
              <span>{label}</span>
              {showsCartCount && mounted && cartCount > 0 ? (
                <span className="absolute right-[calc(50%-1.25rem)] top-1 rounded-full bg-sale px-1.5 text-[0.625rem] font-bold text-surface">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
