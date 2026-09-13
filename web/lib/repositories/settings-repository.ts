import { MockSettingsRepository } from "@/lib/repositories/mock/settings";
import { runtimeMockStore } from "@/lib/repositories/runtime-store";

export const settingsRepository = new MockSettingsRepository(runtimeMockStore);
