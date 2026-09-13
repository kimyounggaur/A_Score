import type { Metadata } from "next";

import { HomeCatalogContent } from "@/components/store/home-catalog-content";
import { HomeCatalogOverrideBridge } from "@/components/store/home-catalog-override-bridge";
import { HeroCarousel, type HeroSlide } from "@/components/store/hero-carousel";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import { createDefaultOpenGraph } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "악보를 찾고 바로 연주해요",
  description: "통기타, 피아노, 드럼부터 색깔악보와 밴드세트까지 찾아보세요.",
  alternates: { canonical: "/" },
  openGraph: createDefaultOpenGraph(
    "악보를 찾고 바로 연주해요 | ScoreStore",
    "검색부터 보관함까지 이어지는 디지털 악보 마켓이에요.",
    "/",
  ),
};

const heroSlides: readonly HeroSlide[] = [
  {
    eyebrow: "오늘의 연주",
    title: "어떤 곡을 연주할까요",
    description: "악기와 기보 형식을 고르고, 내 수준에 맞는 악보를 가볍게 찾아보세요.",
    href: "/scores?sort=popular",
    cta: "인기 악보 보기",
  },
  {
    eyebrow: "처음이어도 괜찮아요",
    title: "무료 악보로 시작해요",
    description: "입문용 악보를 보관함에 담고 오늘 바로 첫 곡을 연주해 보세요.",
    href: "/scores?price=free",
    cta: "무료 악보 보기",
  },
  {
    eyebrow: "함께 맞추는 즐거움",
    title: "밴드세트를 한 번에 준비해요",
    description: "같은 마디 기준으로 정리한 파트별 악보로 합주 준비를 간단하게 만들어요.",
    href: "/scores?type=band-set",
    cta: "밴드세트 보기",
  },
];

export default async function HomePage() {
  const [home, searchResult, arrangers] = await Promise.all([
    catalogRepository.listHome(),
    catalogRepository.listProducts(),
    catalogRepository.listArrangers(),
  ]);
  const arrangerCounts = await Promise.all(
    arrangers.map(async (arranger) => ({
      id: arranger.id,
      count: (await catalogRepository.listProducts({ q: arranger.name })).total,
    })),
  );
  const countByArranger = new Map(arrangerCounts.map((item) => [item.id, item.count]));
  const data = {
    home,
    instrumentCounts: searchResult.facets.instruments,
    arrangers: arrangers.map((arranger) => ({
      ...arranger,
      productCount: countByArranger.get(arranger.id) ?? 0,
    })),
  };

  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <HomeCatalogOverrideBridge>
        <HomeCatalogContent data={data} />
      </HomeCatalogOverrideBridge>
    </>
  );
}
