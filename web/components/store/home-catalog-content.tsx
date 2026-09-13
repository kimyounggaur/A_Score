import Link from "next/link";
import { BookOpen, Palette, UsersRound } from "lucide-react";

import { InstrumentMenu } from "@/components/layout/instrument-menu";
import { HomeProductSections } from "@/components/store/home-product-sections";
import { SectionHeader } from "@/components/ui/section-header";
import type { InstrumentId } from "@/lib/catalog/taxonomy";
import type { Arranger } from "@/lib/catalog/types";
import type { HomeCatalog } from "@/lib/repositories/interfaces";

export type HomeCatalogViewData = {
  home: HomeCatalog;
  instrumentCounts: Partial<Record<InstrumentId, number>>;
  arrangers: Array<Arranger & { productCount: number }>;
};

const categoryEntries = [
  {
    href: "/scores?type=bundle",
    title: "악보집",
    description: "좋아하는 테마를 묶어서 더 알뜰하게",
    icon: BookOpen,
  },
  {
    href: "/scores?type=band-set",
    title: "밴드세트",
    description: "합주에 필요한 파트를 한 번에",
    icon: UsersRound,
  },
  {
    href: "/scores?format=color",
    title: "색깔악보",
    description: "음표 읽기가 낯설어도 직관적으로",
    icon: Palette,
  },
] as const;

export function HomeCatalogContent({
  data,
  browserBacked = false,
}: {
  data: HomeCatalogViewData;
  browserBacked?: boolean;
}) {
  return (
    <>
      <InstrumentMenu counts={data.instrumentCounts} />

      <div className="page-shell space-y-14 py-10 md:space-y-20 md:py-16">
        <HomeProductSections home={data.home} browserBacked={browserBacked} />

        <section aria-labelledby="category-heading">
          <SectionHeader title="연주 방식에 맞춰 찾아봐요" />
          <h2 className="sr-only" id="category-heading">
            상품 유형
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {categoryEntries.map(({ href, title, description, icon: Icon }) => (
              <Link
                className="group rounded-2xl border border-line bg-surface p-5 shadow-sm transition-colors hover:border-brand-400 hover:bg-brand-50"
                href={href}
                key={href}
              >
                <span
                  className="flex size-12 items-center justify-center rounded-xl bg-brand-100 text-cta"
                  aria-hidden="true"
                >
                  <Icon className="size-6" strokeWidth={1.5} />
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink-900 group-hover:text-cta">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-text-muted">{description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="arrangers-heading">
          <div id="arrangers-heading">
            <SectionHeader title="편곡자" description="악기 특성을 아는 편곡자를 만나보세요." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.arrangers.map((arranger) => (
              <Link
                className="rounded-2xl border border-line bg-surface p-5 shadow-sm hover:border-brand-400"
                href={`/arrangers/${arranger.id}`}
                key={arranger.id}
              >
                <h3 className="text-lg font-bold text-ink-900">{arranger.name}</h3>
                <p className="mt-1 text-sm font-medium text-cta">
                  {arranger.specialties.join(" · ")}
                </p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-text-muted">
                  {arranger.bio}
                </p>
                <p className="mt-4 text-sm font-semibold text-ink-700">
                  담당 악보 {arranger.productCount}개
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
