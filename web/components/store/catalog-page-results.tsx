import { Pagination } from "@/components/store/pagination";
import { ProductGrid } from "@/components/store/product-grid";
import type { InstrumentId } from "@/lib/catalog/taxonomy";
import type { SearchResult } from "@/lib/search/filter";
import { mergeSearchQuery } from "@/lib/search/query";

export function InstrumentProductResults({
  instrumentId,
  instrumentLabel,
  result,
  browserBacked = false,
}: {
  instrumentId: InstrumentId;
  instrumentLabel: string;
  result: SearchResult;
  browserBacked?: boolean;
}) {
  return (
    <section className="mt-10" aria-labelledby="instrument-products-heading">
      <div className="mb-5 flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold text-ink-900" id="instrument-products-heading">
          {instrumentLabel} 악보 {result.total}개
        </h2>
      </div>
      <ProductGrid
        products={result.items}
        browserBacked={browserBacked}
        emptyTitle={`아직 공개된 ${instrumentLabel} 악보가 없어요`}
        emptyDescription="다른 악기를 둘러보거나 새 악보를 기다려 주세요."
      />
      <Pagination
        basePath={`/instruments/${instrumentId}`}
        page={result.page}
        pageCount={result.pageCount}
        query={mergeSearchQuery({ page: result.page, sort: "popular" })}
      />
    </section>
  );
}

export function ArrangerProductResults({
  result,
  browserBacked = false,
}: {
  result: SearchResult;
  browserBacked?: boolean;
}) {
  return (
    <section className="mt-10" aria-labelledby="arranger-products-heading">
      <h2 className="mb-5 text-xl font-bold text-ink-900" id="arranger-products-heading">
        담당 악보 {result.total}개
      </h2>
      <ProductGrid
        products={result.items}
        browserBacked={browserBacked}
        emptyTitle="아직 공개된 악보가 없어요"
        emptyDescription="새 악보가 준비되면 이 페이지에 보여드릴게요."
      />
    </section>
  );
}
