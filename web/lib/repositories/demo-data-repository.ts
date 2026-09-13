import { MockDemoDataRepository } from "@/lib/repositories/mock/demo-data";
import { runtimeMockStore } from "@/lib/repositories/runtime-store";

export const demoDataRepository = new MockDemoDataRepository(runtimeMockStore);
