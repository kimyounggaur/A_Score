import { getBrowserStorage, VersionedMockStorage } from "@/lib/repositories/mock/storage";

export const runtimeMockStore = new VersionedMockStorage(getBrowserStorage());
export const runtimeNow = () => new Date();
