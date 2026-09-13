import { DOWNLOAD_POLICY } from "@/lib/config/policy";
import type {
  DownloadTicket,
  LibraryGrant,
  LibraryItem,
  LibraryRepository,
} from "@/lib/repositories/interfaces";
import { RepositoryError } from "@/lib/repositories/interfaces";
import {
  createMockId,
  MOCK_STORAGE_KEYS,
  type VersionedMockStorage,
} from "@/lib/repositories/mock/storage";

export class MockLibraryRepository implements LibraryRepository {
  constructor(
    private readonly store: VersionedMockStorage,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private readAll(): LibraryItem[] {
    if (!this.store.available) return [];
    return this.store.read<LibraryItem[]>(MOCK_STORAGE_KEYS.library, []);
  }

  async listLibrary(userId: string): Promise<LibraryItem[]> {
    return this.readAll()
      .filter((item) => item.userId === userId)
      .toSorted((a, b) => Date.parse(b.purchasedAt) - Date.parse(a.purchasedAt));
  }

  async hasPurchased(userId: string, productId: number): Promise<boolean> {
    return this.readAll().some((item) => item.userId === userId && item.productId === productId);
  }

  async issueDownloadTicket(userId: string, productId: number): Promise<DownloadTicket> {
    if (!(await this.hasPurchased(userId, productId))) {
      throw new RepositoryError(
        "NOT_PURCHASED",
        "구매 내역을 확인할 수 없어요. 보관함을 새로고침해 주세요.",
      );
    }
    const now = this.now();
    return {
      ticket: createMockId("download", now),
      productId,
      status: "coming-soon",
      expiresAt: new Date(now.getTime() + 5 * 60 * 1_000).toISOString(),
    };
  }

  async grantPurchase(grant: LibraryGrant): Promise<LibraryItem[]> {
    const allItems = this.readAll();
    const granted: LibraryItem[] = [];
    for (const product of grant.products) {
      const existing = allItems.find(
        (item) => item.userId === grant.userId && item.productId === product.id,
      );
      if (existing) {
        granted.push(existing);
        continue;
      }
      const item: LibraryItem = {
        id: createMockId("library", new Date(grant.purchasedAt)),
        userId: grant.userId,
        productId: product.id,
        productType: product.type,
        orderId: grant.orderId,
        orderNo: grant.orderNo,
        purchasedAt: grant.purchasedAt,
      };
      allItems.push(item);
      granted.push(item);
    }
    this.store.write(MOCK_STORAGE_KEYS.library, allItems);
    return granted;
  }

  async revokeOrder(userId: string, orderId: string): Promise<void> {
    const remaining = this.readAll().filter(
      (item) => !(item.userId === userId && item.orderId === orderId),
    );
    this.store.write(MOCK_STORAGE_KEYS.library, remaining);
  }
}

export const MOCK_DOWNLOAD_POLICY = DOWNLOAD_POLICY;
