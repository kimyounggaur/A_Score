import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/navigation/safe-next";

describe("safeNextPath", () => {
  it("keeps an internal path with its query and hash", () => {
    expect(safeNextPath("/checkout?items=1001%2C1002#payment")).toBe(
      "/checkout?items=1001%2C1002#payment",
    );
  });

  it.each([
    "https://example.com/phishing",
    "//example.com/phishing",
    "/\\example.com/phishing",
    "/%5Cexample.com/phishing",
    "/%255Cexample.com/phishing",
    "/%2F%2Fexample.com/phishing",
    "/%252F%252Fexample.com/phishing",
    "/%0A/example.com/phishing",
    "checkout",
    "%2F%2Fexample.com/phishing",
    "%",
  ])("rejects an external or malformed redirect target: %s", (target) => {
    expect(safeNextPath(target)).toBe("/");
  });

  it("fails closed when percent encoding is nested excessively", () => {
    const deeplyEncodedSlash = `/${"%25".repeat(9)}2Fexample.com`;
    expect(safeNextPath(deeplyEncodedSlash)).toBe("/");
  });
});
