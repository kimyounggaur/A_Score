import { MockCatalogRepository } from "@/lib/repositories/mock/catalog";
import { runtimeMockStore, runtimeNow } from "@/lib/repositories/runtime-store";

export const catalogRepository = new MockCatalogRepository(runtimeMockStore, runtimeNow);
