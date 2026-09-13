import { EARN_RATE_PERCENT } from "@/lib/config/points";
import { formatOrderNo } from "@/lib/format";
import { clampPoints, earnPoints, effectivePrice, sumList } from "@/lib/pricing";
import type {
  AdminSettings,
  CatalogRepository,
  CreateOrderDraft,
  LibraryRepository,
  Order,
  OrderRepository,
  OrderStatus,
  PointRepository,
  UserRepository,
} from "@/lib/repositories/interfaces";
import { RepositoryError } from "@/lib/repositories/interfaces";
import {
  createMockId,
  MOCK_STORAGE_KEYS,
  type VersionedMockStorage,
} from "@/lib/repositories/mock/storage";

/**
 * 상태 전이: pending → paid | failed | canceled, paid → refunded.
 * finalizeOrder는 paid 주문을 다시 받으면 기존 결과를 돌려주는 멱등 연산이다.
 */
export class MockOrderRepository implements OrderRepository {
  constructor(
    private readonly store: VersionedMockStorage,
    private readonly catalog: CatalogRepository,
    private readonly users: UserRepository,
    private readonly points: PointRepository,
    private readonly library: LibraryRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private readAll(): Order[] {
    if (!this.store.available) return [];
    return this.store.read<Order[]>(MOCK_STORAGE_KEYS.orders, []);
  }

  private writeAll(orders: Order[]): void {
    this.store.write(MOCK_STORAGE_KEYS.orders, orders);
  }

  private replace(order: Order): Order {
    const orders = this.readAll();
    const index = orders.findIndex((candidate) => candidate.id === order.id);
    if (index < 0) throw new RepositoryError("ORDER_NOT_FOUND", "주문을 찾을 수 없어요.");
    orders[index] = order;
    this.writeAll(orders);
    return order;
  }

  async createOrder(draft: CreateOrderDraft): Promise<Order> {
    await this.users.assertActive(draft.userId);

    if (draft.items.length === 0) {
      throw new RepositoryError("EMPTY_ORDER", "결제할 상품이 없어요. 장바구니를 확인해 주세요.");
    }
    if (!Number.isInteger(draft.clientAmount) || draft.clientAmount < 0) {
      throw new RepositoryError("INVALID_AMOUNT", "결제 금액이 올바르지 않아요.");
    }

    const uniqueProductIds = new Set(draft.items.map((item) => item.productId));
    if (uniqueProductIds.size !== draft.items.length) {
      throw new RepositoryError(
        "DUPLICATE_PRODUCT",
        "같은 디지털 상품은 한 번만 구매할 수 있어요.",
      );
    }

    const now = this.now();
    const products = await Promise.all(
      draft.items.map(async (item) => {
        const product = await this.catalog.getProduct(item.productId);
        if (!product || product.type !== item.type) {
          throw new RepositoryError(
            "PRODUCT_UNAVAILABLE",
            "판매가 종료된 상품이에요. 장바구니에서 제외하고 다시 시도해 주세요.",
            { productId: item.productId },
          );
        }
        return product;
      }),
    );

    const alreadyOwned = (
      await Promise.all(
        products.map(async (product) => ({
          product,
          owned: await this.library.hasPurchased(draft.userId, product.id),
        })),
      )
    ).filter(({ owned }) => owned);
    if (alreadyOwned.length > 0) {
      throw new RepositoryError(
        "ALREADY_OWNED",
        "이미 보관함에 있는 상품이에요. 보관함에서 다시 받아 주세요.",
        { productIds: alreadyOwned.map(({ product }) => product.id) },
      );
    }

    const totalAmount = products.reduce(
      (total, product) => total + effectivePrice(product, now),
      0,
    );
    if (draft.clientAmount !== totalAmount) {
      throw new RepositoryError(
        "AMOUNT_MISMATCH",
        "상품 가격이 변경되었어요. 새 금액을 확인한 뒤 다시 결제해 주세요.",
        { clientAmount: draft.clientAmount, catalogAmount: totalAmount },
      );
    }

    const balance = await this.points.getBalance(draft.userId);
    const pointsUsed = clampPoints(draft.pointsToUse, balance.total, totalAmount);
    const cashPaid = totalAmount - pointsUsed;
    const settings = this.store.read<Pick<AdminSettings, "earnRatePercent">>(
      MOCK_STORAGE_KEYS.settings,
      { earnRatePercent: EARN_RATE_PERCENT },
    );
    const existingOrders = this.readAll();
    const id = createMockId("order", now);
    const order: Order = {
      id,
      orderNo: formatOrderNo(now, existingOrders.length + 1),
      userId: draft.userId,
      items: products.map((product) => ({
        productId: product.id,
        type: product.type,
        title: product.title,
        listPrice: product.listPrice,
        salePrice: product.salePrice,
        paidPrice: effectivePrice(product, now),
      })),
      status: "pending",
      listAmount: sumList(products),
      totalAmount,
      pointsUsed,
      cashPaid,
      earnedPoints: earnPoints(cashPaid, settings.earnRatePercent),
      paymentMethod: totalAmount === 0 ? "free" : cashPaid === 0 ? "points" : draft.paymentMethod,
      paymentRef: null,
      createdAt: now.toISOString(),
      finalizedAt: null,
      failureCode: null,
      refundReason: null,
    };
    this.writeAll([...existingOrders, order]);
    return structuredClone(order);
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return structuredClone(this.readAll().find((order) => order.id === orderId) ?? null);
  }

  async listOrders(userId: string): Promise<Order[]> {
    return this.readAll()
      .filter((order) => order.userId === userId)
      .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async finalizeOrder(orderId: string, paymentRef: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    if (!order) throw new RepositoryError("ORDER_NOT_FOUND", "주문을 찾을 수 없어요.");
    if (order.status === "paid") return order;
    if (order.cashPaid === 0) {
      throw new RepositoryError(
        "PAYMENT_NOT_REQUIRED",
        "현금 결제가 없는 주문이에요. 포인트 또는 무료 주문 확정 절차를 이용해 주세요.",
      );
    }
    if (!paymentRef.trim()) {
      throw new RepositoryError(
        "PAYMENT_REFERENCE_REQUIRED",
        "결제 승인 정보를 찾을 수 없어요. 결제 내역을 확인해 주세요.",
      );
    }
    return this.settleOrder(order, paymentRef);
  }

  async finalizeNoPaymentOrder(orderId: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    if (!order) throw new RepositoryError("ORDER_NOT_FOUND", "주문을 찾을 수 없어요.");
    if (order.status === "paid") return order;
    if (
      order.cashPaid !== 0 ||
      (order.paymentMethod !== "points" && order.paymentMethod !== "free")
    ) {
      throw new RepositoryError(
        "PAYMENT_REQUIRED",
        "현금 결제가 필요한 주문이에요. 결제 승인을 완료한 뒤 다시 시도해 주세요.",
      );
    }
    return this.settleOrder(order, `no-payment:${order.id}`);
  }

  private async settleOrder(order: Order, paymentRef: string): Promise<Order> {
    if (order.status !== "pending") {
      throw new RepositoryError(
        "INVALID_ORDER_STATE",
        "결제를 확정할 수 없는 주문이에요. 주문 내역을 확인해 주세요.",
      );
    }

    await this.users.assertActive(order.userId);

    // 각 하위 저장소도 orderId를 멱등 키로 사용하므로 중간 실패 뒤 재시도해도 중복 반영되지 않는다.
    await this.points.spend(order.userId, order.pointsUsed, order.id);
    await this.points.earn(order.userId, order.earnedPoints, order.id);
    const finalizedAt = this.now().toISOString();
    await this.library.grantPurchase({
      userId: order.userId,
      orderId: order.id,
      orderNo: order.orderNo,
      purchasedAt: finalizedAt,
      products: order.items.map((item) => ({ id: item.productId, type: item.type })),
    });

    return structuredClone(
      this.replace({ ...order, status: "paid", paymentRef, finalizedAt, failureCode: null }),
    );
  }

  async markFailed(orderId: string, failureCode: string): Promise<Order> {
    return this.transitionPending(orderId, "failed", failureCode);
  }

  async cancelOrder(orderId: string): Promise<Order> {
    return this.transitionPending(orderId, "canceled", null);
  }

  private async transitionPending(
    orderId: string,
    status: Extract<OrderStatus, "failed" | "canceled">,
    failureCode: string | null,
  ): Promise<Order> {
    const order = await this.getOrder(orderId);
    if (!order) throw new RepositoryError("ORDER_NOT_FOUND", "주문을 찾을 수 없어요.");
    if (order.status === status) return order;
    if (order.status !== "pending") {
      throw new RepositoryError("INVALID_ORDER_STATE", "주문 상태를 변경할 수 없어요.");
    }
    return structuredClone(this.replace({ ...order, status, failureCode }));
  }
}
