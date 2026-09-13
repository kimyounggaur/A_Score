import {
  createHomeOpenGraphImage,
  OPEN_GRAPH_CONTENT_TYPE,
  OPEN_GRAPH_SIZE,
} from "@/lib/seo/open-graph";

export const alt = "ScoreStore 디지털 악보 마켓";
export const size = OPEN_GRAPH_SIZE;
export const contentType = OPEN_GRAPH_CONTENT_TYPE;

export default function OpenGraphImage() {
  return createHomeOpenGraphImage();
}
