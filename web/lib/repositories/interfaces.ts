import type { InstrumentId, ProductType } from "@/lib/catalog/taxonomy";
import type { Arranger, CatalogProduct, ProductStatus } from "@/lib/catalog/types";
import type { Money } from "@/lib/pricing";
import type { PointAllocation, PointBalance, PointLot, PointTransaction } from "@/lib/points/types";
import type { SearchQuery } from "@/lib/search/query";
import type { SearchResult } from "@/lib/search/filter";

export class RepositoryError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export interface HomeCatalog {
  free: CatalogProduct[];
  new: CatalogProduct[];
  popular: CatalogProduct[];
  bundles: CatalogProduct[];
  bandSets: CatalogProduct[];
  colorScores: CatalogProduct[];
}

export interface CatalogRepository {
  listProducts(query?: Partial<SearchQuery>): Promise<SearchResult>;
  listProductsIncludingUnavailable(): Promise<CatalogProduct[]>;
  getProduct(id: number): Promise<CatalogProduct | null>;
  /**
   * 관리자 브라우저 DB의 override 여부와 무관하게 상품 식별자가 존재하는지 판정할 때 쓴다.
   * 공개 화면에 값을 그대로 노출하지 말고, 판매 가능 여부는 getProduct로 다시 확인한다.
   */
  getProductIncludingUnavailable(id: number): Promise<CatalogProduct | null>;
  getBundleItems(bundleId: number): Promise<CatalogProduct[]>;
  listByInstrument(
    instrumentId: InstrumentId,
    options?: Partial<SearchQuery>,
  ): Promise<SearchResult>;
  listArrangers(): Promise<Arranger[]>;
  getArranger(id: string): Promise<Arranger | null>;
  listHome(): Promise<HomeCatalog>;
}

export type AuthProvider = "email" | "kakao" | "demo";
export type UserRole = "user" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  provider: AuthProvider;
  joinedAt: string;
  suspended?: boolean;
}

export interface UserRepository {
  getSession(): Promise<SessionUser | null>;
  assertActive(userId: string): Promise<SessionUser>;
  signInDemo(provider: AuthProvider, options?: { role?: UserRole }): Promise<SessionUser>;
  signOut(): Promise<void>;
}

export interface LibraryItem {
  id: string;
  userId: string;
  productId: number;
  productType: ProductType;
  orderId: string;
  orderNo: string;
  purchasedAt: string;
}

export interface DownloadTicket {
  ticket: string;
  productId: number;
  status: "coming-soon";
  expiresAt: string;
}

export interface LibraryGrant {
  userId: string;
  orderId: string;
  orderNo: string;
  purchasedAt: string;
  products: readonly Pick<CatalogProduct, "id" | "type">[];
}

export interface LibraryRepository {
  listLibrary(userId: string): Promise<LibraryItem[]>;
  hasPurchased(userId: string, productId: number): Promise<boolean>;
  issueDownloadTicket(userId: string, productId: number): Promise<DownloadTicket>;
  grantPurchase(grant: LibraryGrant): Promise<LibraryItem[]>;
  revokeOrder(userId: string, orderId: string): Promise<void>;
}

export interface CartItemRef {
  productId: number;
  type: ProductType;
}

export type PaymentMethod = "card" | "kakao-pay" | "naver-pay" | "toss" | "points" | "free";
export type OrderStatus = "pending" | "paid" | "failed" | "canceled" | "refunded";

export interface OrderItem {
  productId: number;
  type: ProductType;
  title: string;
  listPrice: Money;
  salePrice: Money | null;
  paidPrice: Money;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  listAmount: Money;
  totalAmount: Money;
  pointsUsed: number;
  cashPaid: Money;
  earnedPoints: number;
  paymentMethod: PaymentMethod;
  paymentRef: string | null;
  createdAt: string;
  finalizedAt: string | null;
  failureCode: string | null;
  refundReason: string | null;
}

export interface CreateOrderDraft {
  userId: string;
  items: readonly CartItemRef[];
  /** 클라이언트 표시 금액. 저장 전 카탈로그의 현재 가격과 대조한다. */
  clientAmount: Money;
  pointsToUse: number;
  paymentMethod: PaymentMethod;
}

export interface OrderRepository {
  createOrder(draft: CreateOrderDraft): Promise<Order>;
  getOrder(orderId: string): Promise<Order | null>;
  listOrders(userId: string): Promise<Order[]>;
  finalizeOrder(orderId: string, paymentRef: string): Promise<Order>;
  finalizeNoPaymentOrder(orderId: string): Promise<Order>;
  markFailed(orderId: string, failureCode: string): Promise<Order>;
  cancelOrder(orderId: string): Promise<Order>;
}

export interface PointChargeResult {
  paidLot: PointLot;
  bonusLot: PointLot | null;
  balance: PointBalance;
}

export interface PointOrderRefund {
  orderId: string;
  pointsUsed: number;
  earnedPoints: number;
  restoreSpentPoints: boolean;
}

export interface PointOrderRefundResult {
  restoredPoints: number;
  reversedEarnedPoints: number;
  balance: PointBalance;
}

export interface PointRepository {
  getLots(userId: string): Promise<PointLot[]>;
  getBalance(userId: string): Promise<PointBalance>;
  charge(userId: string, packageId: string): Promise<PointChargeResult>;
  spend(userId: string, amount: number, orderId: string): Promise<PointAllocation[]>;
  earn(userId: string, amount: number, orderId: string): Promise<PointLot | null>;
  refundOrder(userId: string, refund: PointOrderRefund): Promise<PointOrderRefundResult>;
  listHistory(userId: string): Promise<PointTransaction[]>;
}

export interface WishlistRepository {
  listProductIds(userId: string): Promise<number[]>;
  has(userId: string, productId: number): Promise<boolean>;
  add(userId: string, productId: number): Promise<void>;
  remove(userId: string, productId: number): Promise<void>;
  toggle(userId: string, productId: number): Promise<boolean>;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationRepository {
  list(userId: string): Promise<NotificationItem[]>;
  markRead(userId: string, notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}

export interface AdminProductQuery {
  q?: string;
  status?: ProductStatus;
}

export interface AdminSettings {
  siteName: string;
  earnRatePercent: number;
  paidExpiryMonths: number;
  bonusExpiryMonths: number;
  pointChargeEnabled: boolean;
}

export interface SettingsRepository {
  getSettings(): Promise<AdminSettings>;
  updateSettings(settings: AdminSettings): Promise<AdminSettings>;
}

export interface RefundRequest {
  orderId: string;
  reason: "change-of-mind" | "duplicate" | "file-error" | "other";
  detail?: string;
  restorePoints: boolean;
}

export interface AdminRepository extends SettingsRepository {
  listProducts(query?: AdminProductQuery): Promise<CatalogProduct[]>;
  getProduct(id: number): Promise<CatalogProduct | null>;
  createProduct(product: CatalogProduct): Promise<CatalogProduct>;
  updateProduct(id: number, product: CatalogProduct): Promise<CatalogProduct>;
  removeProduct(id: number): Promise<void>;
  listOrders(): Promise<Order[]>;
  getOrder(orderId: string): Promise<Order | null>;
  refundOrder(request: RefundRequest): Promise<Order>;
  listUsers(): Promise<SessionUser[]>;
  upsertUser(user: SessionUser): Promise<SessionUser>;
  deleteUser(userId: string): Promise<void>;
}
