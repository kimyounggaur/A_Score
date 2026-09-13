import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NotationThumbnail } from "@/components/store/notation-thumbnail";
import { MOCK_SCORES } from "@/data/mock/products";

describe("NotationThumbnail", () => {
  it("renders the same deterministic SVG for the same product id", () => {
    const product = MOCK_SCORES.find((candidate) => candidate.id === 1002);
    expect(product).toBeDefined();

    const first = renderToStaticMarkup(<NotationThumbnail product={product!} />);
    const second = renderToStaticMarkup(<NotationThumbnail product={product!} />);

    expect(second).toBe(first);
    expect(first).toContain("통기타 TAB 악보 미리보기");
  });

  it("prefers a resolved sample image over the generated SVG", () => {
    const product = MOCK_SCORES.find((candidate) => candidate.id === 1001);
    const markup = renderToStaticMarkup(<NotationThumbnail product={product!} />);

    expect(markup).toContain("/samples/score-demo.svg");
    expect(markup).not.toContain("<svg");
  });
});
