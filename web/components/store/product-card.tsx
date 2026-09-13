import Link from "next/link";

import { NotationThumbnail } from "@/components/store/notation-thumbnail";
import { PriceTag } from "@/components/store/price-tag";
import { WishlistButton } from "@/components/store/wishlist-button";
import { Badge } from "@/components/ui/badge";
import { getInstrument, NOTATION_FORMAT, PRODUCT_TYPE } from "@/lib/catalog/taxonomy";
import { getProductPath, type CatalogProduct } from "@/lib/catalog/types";
import { isFree, isOnSale } from "@/lib/pricing";

function ProductBadges({ product }: { product: CatalogProduct }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {isFree(product) ? <Badge variant="free">무료</Badge> : null}
      {isOnSale(product) ? <Badge variant="sale">할인</Badge> : null}
      {product.type === PRODUCT_TYPE.BUNDLE ? <Badge variant="bundle">악보집</Badge> : null}
      {product.type === PRODUCT_TYPE.BAND_SET ? <Badge variant="band-set">밴드세트</Badge> : null}
      {product.formats.includes(NOTATION_FORMAT.COLOR) ? (
        <Badge variant="color-score">색깔악보</Badge>
      ) : null}
    </div>
  );
}

export function ProductCard({
  product,
  browserBacked = false,
}: {
  product: CatalogProduct;
  browserBacked?: boolean;
}) {
  const instrumentLabel = getInstrument(product.instrumentIds[0] ?? "")?.label;
  const href = getProductPath(product, { browserBacked });

  return (
    <article className="group relative min-w-0">
      <Link className="block rounded-xl focus-visible:outline-offset-4" href={href}>
        <NotationThumbnail
          className="transition-transform motion-safe:[@media(hover:hover)]:group-hover:-translate-y-1"
          product={product}
        />
        <div className="space-y-2 pt-3">
          <ProductBadges product={product} />
          <div>
            <h3 className="line-clamp-2 text-sm font-bold leading-5 text-ink-900 md:text-base">
              {product.title}
            </h3>
            {product.artist || instrumentLabel ? (
              <p className="mt-1 truncate text-xs text-text-muted">
                {[product.artist, instrumentLabel].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          <PriceTag
            listPrice={product.listPrice}
            saleEndsAt={product.saleEndsAt}
            salePrice={product.salePrice}
            size="sm"
          />
        </div>
      </Link>
      <WishlistButton productId={product.id} title={product.title} />
    </article>
  );
}
