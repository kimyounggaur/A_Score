export { adminRepository } from "@/lib/repositories/admin-repository";
export { catalogRepository } from "@/lib/repositories/catalog-repository";
export { libraryRepository } from "@/lib/repositories/library-repository";
export { notificationRepository } from "@/lib/repositories/notification-repository";
export { orderRepository } from "@/lib/repositories/order-repository";
export { pointRepository } from "@/lib/repositories/point-repository";
export { settingsRepository } from "@/lib/repositories/settings-repository";
export { userRepository } from "@/lib/repositories/user-repository";
export { wishlistRepository } from "@/lib/repositories/wishlist-repository";

import { adminRepository } from "@/lib/repositories/admin-repository";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import { libraryRepository } from "@/lib/repositories/library-repository";
import { notificationRepository } from "@/lib/repositories/notification-repository";
import { orderRepository } from "@/lib/repositories/order-repository";
import { pointRepository } from "@/lib/repositories/point-repository";
import { settingsRepository } from "@/lib/repositories/settings-repository";
import { userRepository } from "@/lib/repositories/user-repository";
import { wishlistRepository } from "@/lib/repositories/wishlist-repository";

export const repositories = Object.freeze({
  catalog: catalogRepository,
  user: userRepository,
  library: libraryRepository,
  orders: orderRepository,
  points: pointRepository,
  wishlist: wishlistRepository,
  notifications: notificationRepository,
  settings: settingsRepository,
  admin: adminRepository,
});

export * from "@/lib/repositories/interfaces";
export { createMockRepositories } from "@/lib/repositories/mock";
