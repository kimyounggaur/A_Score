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

type BandSetDetailProps = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const revalidate = 60;

export function generateStaticParams() {
  return staticProductParams(PRODUCT_TYPE.BAND_SET);
}

async function getBandSet(rawId: string) {
  const id = parseProductId(rawId);
  if (id == null) return null;
  const product = await getCatalogProduct(id);
  return product?.type === PRODUCT_TYPE.BAND_SET ? product : null;
}

async function getBandSetIncludingUnavailable(rawId: string) {
  const id = parseProductId(rawId);
  if (id == null) return null;
  const product = await getCatalogProductIncludingUnavailable(id);
  return product?.type === PRODUCT_TYPE.BAND_SET ? product : null;
}

export async function generateMetadata({ params }: BandSetDetailProps): Promise<Metadata> {
  const { id } = await params;
  const record = await getBandSetIncludingUnavailable(id);
  if (!record) notFound();
  const product = await getBandSet(id);
  if (!product) {
    const path = `/band-sets/${record.id}`;
    return {
      title: record.title,
      description: "현재 판매할 수 없는 밴드세트 악보예요.",
      alternates: { canonical: path },
      robots: { index: false, follow: false },
    };
  }
  const description = productMetaDescription(product);
  const path = `/band-sets/${product.id}`;
  return {
    title: product.title,
    description,
    alternates: { canonical: path },
    openGraph: createProductOpenGraphMetadata(product.title, description, path),
  };
}

export default async function BandSetDetailPage({ params }: BandSetDetailProps) {
  const { id } = await params;
  const record = await getBandSetIncludingUnavailable(id);
  if (!record) notFound();
  const product = await getBandSet(id);
  const initialData: BrowserProductData | null = product
    ? { product, ...(await getProductPageData(product)) }
    : null;
  return (
    <BrowserProductDetail
      expectedType={PRODUCT_TYPE.BAND_SET}
      hasInitialData={initialData !== null}
      productId={record.id}
      routeMode="canonical"
    >
      {initialData ? <ProductDetailView {...initialData} /> : null}
    </BrowserProductDetail>
  );
}
