"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Menu,
  Music2,
  PackageSearch,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSiteName } from "@/hooks/use-site-name";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "대시보드", icon: BarChart3 },
  { href: "/admin/products", label: "악보 관리", icon: Music2 },
  { href: "/admin/orders", label: "주문 관리", icon: ShoppingCart },
  { href: "/admin/users", label: "회원 관리", icon: Users },
  { href: "/admin/settings", label: "설정", icon: Settings },
] as const;

function Links({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="관리자 메뉴" className="space-y-1">
      {adminLinks.map(({ href, label, icon: Icon }) => {
        const current = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
              current
                ? "bg-brand-100 text-brand-800"
                : "text-ink-600 hover:bg-muted hover:text-ink-900",
              mobile && "text-base",
            )}
          >
            <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const siteName = useSiteName();

  return (
    <aside className="hidden min-h-screen w-60 shrink-0 border-r border-line bg-surface p-5 md:block">
      <Link
        href="/admin"
        className="font-display flex min-h-11 items-center gap-2 text-lg font-semibold text-ink-900"
      >
        <PackageSearch className="text-brand-700" aria-hidden="true" /> {siteName}
      </Link>
      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
        <Badge className="mb-6 mt-2" variant="sale">
          DEMO
        </Badge>
      ) : null}
      <Links />
    </aside>
  );
}

export function AdminMobileHeader() {
  const siteName = useSiteName();

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-line bg-surface px-4 md:hidden">
      <Link
        href="/admin"
        className="font-display inline-flex min-h-11 items-center font-semibold text-ink-900"
      >
        {siteName} 관리
      </Link>
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="관리자 메뉴 열기">
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-5">
          <SheetHeader className="px-0">
            <SheetTitle className="font-display text-left">관리자 메뉴</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <Links mobile />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
