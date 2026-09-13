import type { WishlistRepository } from "@/lib/repositories/interfaces";
import { MOCK_STORAGE_KEYS, type VersionedMockStorage } from "@/lib/repositories/mock/storage";

export class MockWishlistRepository implements WishlistRepository {
  constructor(private readonly store: VersionedMockStorage) {}

  private readAll(): Record<string, number[]> {
    if (!this.store.available) return {};
    return this.store.read<Record<string, number[]>>(MOCK_STORAGE_KEYS.wishlists, {});
  }

  async listProductIds(userId: string): Promise<number[]> {
    return this.readAll()[userId] ?? [];
  }

  async has(userId: string, productId: number): Promise<boolean> {
    return (await this.listProductIds(userId)).includes(productId);
  }

  async add(userId: string, productId: number): Promise<void> {
    const all = this.readAll();
    all[userId] = [...new Set([...(all[userId] ?? []), productId])];
    this.store.write(MOCK_STORAGE_KEYS.wishlists, all);
  }

  async remove(userId: string, productId: number): Promise<void> {
    const all = this.readAll();
    all[userId] = (all[userId] ?? []).filter((id) => id !== productId);
    this.store.write(MOCK_STORAGE_KEYS.wishlists, all);
  }

  async toggle(userId: string, productId: number): Promise<boolean> {
    if (await this.has(userId, productId)) {
      await this.remove(userId, productId);
      return false;
    }
    await this.add(userId, productId);
    return true;
  }
}
