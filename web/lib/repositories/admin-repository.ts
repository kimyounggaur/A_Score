import { MockAdminRepository } from "@/lib/repositories/mock/admin";
import { libraryRepository } from "@/lib/repositories/library-repository";
import { pointRepository } from "@/lib/repositories/point-repository";
import { runtimeMockStore, runtimeNow } from "@/lib/repositories/runtime-store";
import { settingsRepository } from "@/lib/repositories/settings-repository";
import { userRepository } from "@/lib/repositories/user-repository";

export const adminRepository = new MockAdminRepository(
  runtimeMockStore,
  pointRepository,
  libraryRepository,
  userRepository,
  settingsRepository,
  runtimeNow,
);
