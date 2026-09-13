const PRODUCT_CATALOG_STORAGE_KEY = "ss.mock.products";

export function hasBrowserCatalogOverride(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PRODUCT_CATALOG_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
