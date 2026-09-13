import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchX } from "lucide-react";

import { DemoDataControls } from "@/components/dev/demo-data-controls";
import { LevelMeter } from "@/components/store/level-meter";
import { ProductCard } from "@/components/store/product-card";
import { PriceTag } from "@/components/store/price-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingCardGrid } from "@/components/ui/loading-card-grid";
import { catalogRepository } from "@/lib/repositories/catalog-repository";

export const metadata: Metadata = {
  title: "UI 컴포넌트 카탈로그",
  robots: { index: false, follow: false },
};

export default async function UiCatalogPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") notFound();
  const product = (await catalogRepository.listProducts()).items[0];

  return (
    <main className="page-shell space-y-12 py-12" id="main" tabIndex={-1}>
      <div>
        <p className="text-sm font-bold text-cta">DEMO MODE</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-ink-900">
          UI 컴포넌트 카탈로그
        </h1>
        <p className="mt-2 text-text-muted">ScoreStore의 공통 상태를 한 화면에서 확인해요.</p>
      </div>

      <DemoDataControls />

      <section aria-labelledby="buttons-heading">
        <h2 className="text-xl font-bold text-ink-900" id="buttons-heading">
          버튼과 배지
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          상태 미리보기용 버튼은 실행되지 않도록 비활성입니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button disabled>기본 버튼 예시</Button>
          <Button disabled variant="outline">
            보조 버튼 예시
          </Button>
          <Button disabled>비활성 버튼</Button>
          <Badge variant="free">무료</Badge>
          <Badge variant="sale">할인</Badge>
          <Badge variant="new">신규</Badge>
          <Badge variant="bundle">악보집</Badge>
          <Badge variant="band-set">밴드세트</Badge>
          <Badge variant="color-score">색깔악보</Badge>
        </div>
      </section>

      <section aria-labelledby="price-heading">
        <h2 className="text-xl font-bold text-ink-900" id="price-heading">
          가격과 난이도
        </h2>
        <div className="mt-4 flex flex-wrap items-start gap-8 rounded-2xl border border-line bg-surface p-5">
          <PriceTag listPrice={0} />
          <PriceTag listPrice={2_900} />
          <PriceTag listPrice={2_900} salePrice={1_990} />
          <LevelMeter rhythm={2} technique={3} />
        </div>
      </section>

      {product ? (
        <section aria-labelledby="card-heading">
          <h2 className="mb-4 text-xl font-bold text-ink-900" id="card-heading">
            상품 카드
          </h2>
          <div className="max-w-48">
            <ProductCard product={product} />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="states-heading">
        <h2 className="mb-4 text-xl font-bold text-ink-900" id="states-heading">
          빈 상태와 준비 중
        </h2>
        <div className="space-y-5">
          <EmptyState
            icon={<SearchX />}
            title="결과가 없어요"
            description="다른 조건으로 다시 찾아보세요."
            action={
              <Button disabled variant="outline">
                필터 초기화 예시
              </Button>
            }
          />
          <ComingSoon label="샘플 받기" />
        </div>
      </section>

      <section aria-labelledby="loading-heading">
        <h2 className="mb-4 text-xl font-bold text-ink-900" id="loading-heading">
          로딩
        </h2>
        <LoadingCardGrid count={4} />
      </section>
    </main>
  );
}
