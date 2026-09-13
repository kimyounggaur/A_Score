import { MockPointRepository } from "@/lib/repositories/mock/point";
import { runtimeMockStore, runtimeNow } from "@/lib/repositories/runtime-store";

export const pointRepository = new MockPointRepository(runtimeMockStore, runtimeNow);
