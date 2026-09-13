import { MockWishlistRepository } from "@/lib/repositories/mock/wishlist";
import { runtimeMockStore } from "@/lib/repositories/runtime-store";

export const wishlistRepository = new MockWishlistRepository(runtimeMockStore);
