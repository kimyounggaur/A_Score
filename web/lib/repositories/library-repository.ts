import { MockLibraryRepository } from "@/lib/repositories/mock/library";
import { runtimeMockStore, runtimeNow } from "@/lib/repositories/runtime-store";

export const libraryRepository = new MockLibraryRepository(runtimeMockStore, runtimeNow);
