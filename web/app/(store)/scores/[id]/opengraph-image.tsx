import { PRODUCT_TYPE } from "@/lib/catalog/taxonomy";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import {
  createHomeOpenGraphImage,
  createProductOpenGraphImage,
  OPEN_GRAPH_CONTENT_TYPE,
  OPEN_GRAPH_SIZE,
} from "@/lib/seo/open-graph";

export const alt = "ScoreStore 단일 악보";
export const size = OPEN_GRAPH_SIZE;
export const contentType = OPEN_GRAPH_CONTENT_TYPE;

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await catalogRepository.getProduct(Number(id));
  return product?.type === PRODUCT_TYPE.SCORE
    ? createProductOpenGraphImage(product)
    : createHomeOpenGraphImage();
}
