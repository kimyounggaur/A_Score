import { MockOrderRepository } from "@/lib/repositories/mock/order";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import { libraryRepository } from "@/lib/repositories/library-repository";
import { pointRepository } from "@/lib/repositories/point-repository";
import { runtimeMockStore, runtimeNow } from "@/lib/repositories/runtime-store";
import { userRepository } from "@/lib/repositories/user-repository";

export const orderRepository = new MockOrderRepository(
  runtimeMockStore,
  catalogRepository,
  userRepository,
  pointRepository,
  libraryRepository,
  runtimeNow,
);
