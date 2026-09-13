import { ProductGrid } from "@/components/store/product-grid";
import { SectionHeader } from "@/components/ui/section-header";
import type { HomeCatalog } from "@/lib/repositories/interfaces";

export function HomeProductSections({
  home,
  browserBacked = false,
}: {
  home: HomeCatalog;
  browserBacked?: boolean;
}) {
  return (
    <>
      <section aria-labelledby="free-scores-heading">
        <div id="free-scores-heading">
          <SectionHeader
            title="무료 악보"
            description="부담 없이 보관함에 담아 연주해 보세요."
            href="/scores?price=free"
          />
        </div>
        <ProductGrid products={home.free} browserBacked={browserBacked} />
      </section>

      <section aria-labelledby="new-scores-heading">
        <div id="new-scores-heading">
          <SectionHeader
            title="새로 올라온 악보"
            description="발행일이 가장 최근인 악보예요."
            href="/scores?sort=new"
          />
        </div>
        <ProductGrid products={home.new} browserBacked={browserBacked} />
      </section>

      <section aria-labelledby="popular-scores-heading">
        <div id="popular-scores-heading">
          <SectionHeader
            title="인기 악보"
            description="많이 선택된 악보부터 보여드려요."
            href="/scores?sort=popular"
          />
        </div>
        <ProductGrid products={home.popular} browserBacked={browserBacked} />
      </section>
    </>
  );
}
