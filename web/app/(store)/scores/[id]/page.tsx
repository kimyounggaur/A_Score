import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getCatalogProduct,
  getCatalogProductIncludingUnavailable,
  getProductPageData,
  parseProductId,
  staticProductParams,
} from "@/app/(store)/_lib/catalog-pages";
import {
  BrowserProductDetail,
  type BrowserProductData,
} from "@/components/store/browser-product-detail";
import { ProductDetailView } from "@/components/store/product-detail-view";
import { PRODUCT_TYPE } from "@/lib/catalog/taxonomy";
import { createProductOpenGraphMetadata, productMetaDescription } from "@/lib/seo/metadata";

type ScoreDetailProps = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const revalidate = 60;

export function generateStaticParams() {
  return staticProductParams(PRODUCT_TYPE.SCORE);
}

async function getScore(rawId: string) {
  const id = parseProductId(rawId);
  if (id == null) return null;
  const product = await getCatalogProduct(id);
  return product?.type === PRODUCT_TYPE.SCORE ? product : null;
}

async function getScoreIncludingUnavailable(rawId: string) {
  const id = parseProductId(rawId);
  if (id == null) return null;
  const product = await getCatalogProductIncludingUnavailable(id);
  return product?.type === PRODUCT_TYPE.SCORE ? product : null;
}

export async function generateMetadata({ params }: ScoreDetailProps): Promise<Metadata> {
  const { id } = await params;
  const record = await getScoreIncludingUnavailable(id);
  if (!record) notFound();
  const product = await getScore(id);
  if (!product) {
    const path = `/scores/${record.id}`;
    return {
      title: record.title,
      description: "현재 판매할 수 없는 디지털 악보예요.",
      alternates: { canonical: path },
      robots: { index: false, follow: false },
    };
  }
  const description = productMetaDescription(product);
  const path = `/scores/${product.id}`;
  return {
    title: product.title,
    description,
    alternates: { canonical: path },
    openGraph: createProductOpenGraphMetadata(product.title, description, path),
  };
}

export default async function ScoreDetailPage({ params }: ScoreDetailProps) {
  const { id } = await params;
  const record = await getScoreIncludingUnavailable(id);
  if (!record) notFound();
  const product = await getScore(id);
  const initialData: BrowserProductData | null = product
    ? { product, ...(await getProductPageData(product)) }
    : null;
  return (
    <BrowserProductDetail
      expectedType={PRODUCT_TYPE.SCORE}
      hasInitialData={initialData !== null}
      productId={record.id}
      routeMode="canonical"
    >
      {initialData ? <ProductDetailView {...initialData} /> : null}
    </BrowserProductDetail>
  );
}
