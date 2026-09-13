import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { parseProductId } from "@/app/(store)/_lib/catalog-pages";
import { BrowserProductDetail } from "@/components/store/browser-product-detail";
import { PRODUCT_TYPE } from "@/lib/catalog/taxonomy";

type LocalBandSetPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: LocalBandSetPageProps): Promise<Metadata> {
  const id = parseProductId((await params).id);
  if (id == null) notFound();
  const path = `/band-sets/local/${id}`;
  return {
    title: `브라우저 저장 밴드세트 #${id}`,
    description: "현재 브라우저의 관리자 데모에서 등록한 밴드세트 악보예요.",
    alternates: { canonical: path },
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function LocalBandSetPage({ params }: LocalBandSetPageProps) {
  const id = parseProductId((await params).id);
  if (id == null) notFound();
  return <BrowserProductDetail expectedType={PRODUCT_TYPE.BAND_SET} productId={id} />;
}
