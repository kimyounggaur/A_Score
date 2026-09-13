import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";

import { CatalogPageOverrideBridge } from "@/components/store/catalog-page-override-bridge";
import { ArrangerProductResults } from "@/components/store/catalog-page-results";
import { getInstrument } from "@/lib/catalog/taxonomy";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import { mergeSearchQuery } from "@/lib/search/query";
import { createDefaultOpenGraph } from "@/lib/seo/metadata";

type ArrangerPageProps = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const revalidate = 3600;

export async function generateStaticParams() {
  const arrangers = await catalogRepository.listArrangers();
  return arrangers.map((arranger) => ({ id: arranger.id }));
}

export async function generateMetadata({ params }: ArrangerPageProps): Promise<Metadata> {
  const { id } = await params;
  const arranger = await catalogRepository.getArranger(id);
  if (!arranger) notFound();
  const description = `${arranger.specialties.join(" · ")} 전문 편곡자 ${arranger.name}의 악보를 만나보세요.`;
  return {
    title: `${arranger.name} 편곡자`,
    description,
    alternates: { canonical: `/arrangers/${arranger.id}` },
    openGraph: createDefaultOpenGraph(
      `${arranger.name} 편곡자`,
      description,
      `/arrangers/${arranger.id}`,
    ),
  };
}

export default async function ArrangerPage({ params }: ArrangerPageProps) {
  const { id } = await params;
  const arranger = await catalogRepository.getArranger(id);
  if (!arranger) notFound();
  const query = mergeSearchQuery({ q: arranger.name, sort: "popular" });
  const products = await catalogRepository.listProducts(query);
  const instruments = arranger.instrumentIds
    .map((instrumentId) => getInstrument(instrumentId)?.label)
    .filter((label): label is NonNullable<typeof label> => label != null);

  return (
    <div className="page-shell py-10 md:py-14">
      <div className="grid gap-6 rounded-2xl border border-line bg-surface p-6 shadow-sm md:grid-cols-[auto_1fr] md:p-8">
        <span
          className="flex size-16 items-center justify-center rounded-full bg-brand-50 text-cta"
          aria-hidden="true"
        >
          <UserRound className="size-8" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-sm font-bold text-cta">ARRANGER</p>
          <h1 className="font-display mt-1 text-3xl font-semibold text-ink-900">{arranger.name}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-ink-600">{arranger.bio}</p>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="inline text-text-muted">전문 분야 </dt>
              <dd className="inline font-semibold text-ink-900">
                {arranger.specialties.join(" · ")}
              </dd>
            </div>
            {instruments.length > 0 ? (
              <div>
                <dt className="inline text-text-muted">담당 악기 </dt>
                <dd className="inline font-semibold text-ink-900">{instruments.join(" · ")}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
      <CatalogPageOverrideBridge query={query} view={{ kind: "arranger" }}>
        <ArrangerProductResults result={products} />
      </CatalogPageOverrideBridge>
    </div>
  );
}
