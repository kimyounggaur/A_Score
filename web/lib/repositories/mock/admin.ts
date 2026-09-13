import { MOCK_PRODUCTS } from "@/data/mock/products";
import { getUnavailableBundleItemIds, quarantineIncompleteBundles } from "@/lib/catalog/integrity";
import { parseProduct, productArraySchema } from "@/lib/catalog/schemas";
import { isBundleProduct, isPurchasable, type CatalogProduct } from "@/lib/catalog/types";
import type {
  AdminProductQuery,
  AdminRepository,
  LibraryRepository,
  Order,
  PointRepository,
  RefundRequest,
  SessionUser,
  SettingsRepository,
} from "@/lib/repositories/interfaces";
import { RepositoryError } from "@/lib/repositories/interfaces";
import { normalizeText } from "@/lib/search/normalize";

import { MOCK_STORAGE_KEYS, type VersionedMockStorage } from "@/lib/repositories/mock/storage";
import type { ManagedUserStore } from "@/lib/repositories/mock/user";

export class MockAdminRepository implements AdminRepository {
  constructor(
    private readonly store: VersionedMockStorage,
    private readonly points: PointRepository,
    private readonly library: LibraryRepository,
    private readonly users: ManagedUserStore,
    private readonly settings: SettingsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private readProducts(): CatalogProduct[] {
    return productArraySchema.parse(
      this.store.read<CatalogProduct[]>(MOCK_STORAGE_KEYS.products, MOCK_PRODUCTS),
    ) as CatalogProduct[];
  }

  private writeProducts(products: CatalogProduct[]): void {
    this.store.write(MOCK_STORAGE_KEYS.products, productArraySchema.parse(products));
  }

  private readOrders(): Order[] {
    if (!this.store.available) return [];
    return this.store.read<Order[]>(MOCK_STORAGE_KEYS.orders, []);
  }

  private writeOrders(orders: Order[]): void {
    this.store.write(MOCK_STORAGE_KEYS.orders, orders);
  }

  async listProducts(query: AdminProductQuery = {}): Promise<CatalogProduct[]> {
    const normalizedQuery = normalizeText(query.q ?? "");
    return this.readProducts().filter((product) => {
      if (query.status && product.status !== query.status) return false;
      return (
        !normalizedQuery ||
        normalizeText(`${product.title} ${product.artist ?? ""}`).includes(normalizedQuery)
      );
    });
  }

  async getProduct(id: number): Promise<CatalogProduct | null> {
    return structuredClone(this.readProducts().find((product) => product.id === id) ?? null);
  }

  async createProduct(product: CatalogProduct): Promise<CatalogProduct> {
    const parsed = parseProduct(product);
    const products = this.readProducts();
    if (products.some((candidate) => candidate.id === parsed.id)) {
      throw new RepositoryError("DUPLICATE_PRODUCT_ID", "이미 사용 중인 상품 번호예요.");
    }
    const nextProducts = [...products, parsed];
    this.assertPublishable(parsed, nextProducts);
    this.writeProducts(quarantineIncompleteBundles(nextProducts));
    return structuredClone(parsed);
  }

  async updateProduct(id: number, product: CatalogProduct): Promise<CatalogProduct> {
    if (id !== product.id) {
      throw new RepositoryError("PRODUCT_ID_IMMUTABLE", "상품 번호는 변경할 수 없어요.");
    }
    const parsed = parseProduct(product);
    const products = this.readProducts();
    const index = products.findIndex((candidate) => candidate.id === id);
    if (index < 0) throw new RepositoryError("PRODUCT_NOT_FOUND", "상품을 찾을 수 없어요.");
    const nextProducts = products.with(index, parsed);
    this.assertPublishable(parsed, nextProducts);
    this.writeProducts(quarantineIncompleteBundles(nextProducts));
    return structuredClone(parsed);
  }

  async removeProduct(id: number): Promise<void> {
    const products = this.readProducts();
    const target = products.find((product) => product.id === id);
    if (!target) throw new RepositoryError("PRODUCT_NOT_FOUND", "상품을 찾을 수 없어요.");
    const hasOrderHistory = this.readOrders().some((order) =>
      order.items.some((item) => item.productId === id),
    );
    const nextProducts = hasOrderHistory
      ? products.map((product) =>
          product.id === id ? { ...product, status: "hidden" as const } : product,
        )
      : products.filter((product) => product.id !== id);
    this.writeProducts(quarantineIncompleteBundles(nextProducts));
  }

  async listOrders(): Promise<Order[]> {
    return this.readOrders().toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return structuredClone(this.readOrders().find((order) => order.id === orderId) ?? null);
  }

  async refundOrder(request: RefundRequest): Promise<Order> {
    if (request.reason === "other" && !request.detail?.trim()) {
      throw new RepositoryError("REFUND_REASON_REQUIRED", "기타 환불 사유를 입력해 주세요.");
    }
    const orders = this.readOrders();
    const index = orders.findIndex((order) => order.id === request.orderId);
    const order = orders[index];
    if (!order) throw new RepositoryError("ORDER_NOT_FOUND", "주문을 찾을 수 없어요.");
    if (order.status === "refunded") return structuredClone(order);
    if (order.status !== "paid") {
      throw new RepositoryError("INVALID_ORDER_STATE", "결제 완료 주문만 환불할 수 있습니다.");
    }
    await this.points.refundOrder(order.userId, {
      orderId: order.id,
      pointsUsed: order.pointsUsed,
      earnedPoints: order.earnedPoints,
      restoreSpentPoints: request.restorePoints,
    });
    await this.library.revokeOrder(order.userId, order.id);
    const reason = request.reason === "other" ? request.detail?.trim() : request.reason;
    const refunded: Order = {
      ...order,
      status: "refunded",
      refundReason: reason ?? request.reason,
      finalizedAt: order.finalizedAt ?? this.now().toISOString(),
    };
    orders[index] = refunded;
    this.writeOrders(orders);
    return structuredClone(refunded);
  }

  async listUsers(): Promise<SessionUser[]> {
    return this.users.listManagedUsers();
  }

  async upsertUser(user: SessionUser): Promise<SessionUser> {
    return this.users.upsertManagedUser(user);
  }

  async deleteUser(userId: string): Promise<void> {
    return this.users.deleteManagedUser(userId);
  }

  async getSettings() {
    return this.settings.getSettings();
  }

  async updateSettings(settings: Parameters<SettingsRepository["updateSettings"]>[0]) {
    return this.settings.updateSettings(settings);
  }

  private assertPublishable(product: CatalogProduct, products: readonly CatalogProduct[]): void {
    if (product.status === "published" && product.licenseStatus !== "cleared") {
      throw new RepositoryError(
        "LICENSE_NOT_CLEARED",
        "이용허락이 확인되지 않은 상품은 게시할 수 없습니다.",
      );
    }
    if (isBundleProduct(product) && isPurchasable(product)) {
      const unavailableItemIds = getUnavailableBundleItemIds(product, products);
      if (unavailableItemIds.length > 0) {
        throw new RepositoryError(
          "BUNDLE_ITEMS_UNAVAILABLE",
          "게시할 악보집에는 현재 판매 중인 단일 악보만 수록할 수 있습니다.",
          { itemIds: unavailableItemIds },
        );
      }
    }
  }
}
