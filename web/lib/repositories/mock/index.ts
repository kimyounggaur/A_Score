import { MockAdminRepository } from "@/lib/repositories/mock/admin";
import { MockCatalogRepository } from "@/lib/repositories/mock/catalog";
import { MockLibraryRepository } from "@/lib/repositories/mock/library";
import { MockNotificationRepository } from "@/lib/repositories/mock/notification";
import { MockOrderRepository } from "@/lib/repositories/mock/order";
import { MockSettingsRepository } from "@/lib/repositories/mock/settings";
import { MockPointRepository } from "@/lib/repositories/mock/point";
import {
  getBrowserStorage,
  type StorageLike,
  VersionedMockStorage,
} from "@/lib/repositories/mock/storage";
import { MockUserRepository } from "@/lib/repositories/mock/user";
import { MockWishlistRepository } from "@/lib/repositories/mock/wishlist";

export interface MockRepositoryOptions {
  storage?: StorageLike | null;
  now?: () => Date;
}

export function createMockRepositories(options: MockRepositoryOptions = {}) {
  const store = new VersionedMockStorage(
    options.storage === undefined ? getBrowserStorage() : options.storage,
  );
  const now = options.now ?? (() => new Date());
  const catalog = new MockCatalogRepository(store, now);
  const user = new MockUserRepository(store);
  const library = new MockLibraryRepository(store, now);
  const points = new MockPointRepository(store, now);
  const orders = new MockOrderRepository(store, catalog, user, points, library, now);
  const wishlist = new MockWishlistRepository(store);
  const notifications = new MockNotificationRepository(store, now);
  const settings = new MockSettingsRepository(store);
  const admin = new MockAdminRepository(store, points, library, user, settings, now);

  return { catalog, user, library, orders, points, wishlist, notifications, settings, admin };
}

export type MockRepositories = ReturnType<typeof createMockRepositories>;

export * from "@/lib/repositories/mock/storage";
