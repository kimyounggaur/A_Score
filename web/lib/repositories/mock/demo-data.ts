import { DEMO_USER } from "@/data/mock/seed-user";
import type { LibraryItem, Order } from "@/lib/repositories/interfaces";
import type { PointLot, PointTransaction } from "@/lib/points/types";
import { MOCK_STORAGE_KEYS, type VersionedMockStorage } from "@/lib/repositories/mock/storage";

const DEMO_IDS = {
  lots: ["demo-seed-lot-paid", "demo-seed-lot-bonus", "demo-seed-lot-earned"],
  transactions: [
    "demo-seed-tx-paid",
    "demo-seed-tx-bonus",
    "demo-seed-tx-spend",
    "demo-seed-tx-earn",
  ],
  orders: ["demo-seed-order-paid", "demo-seed-order-canceled"],
  library: ["demo-seed-library-1001"],
} as const;

const DEMO_LOTS: PointLot[] = [
  {
    id: DEMO_IDS.lots[0],
    bucket: "paid",
    remaining: 8_000,
    createdAt: "2026-08-01T03:00:00.000Z",
    expiresAt: "2031-08-01T03:00:00.000Z",
  },
  {
    id: DEMO_IDS.lots[1],
    bucket: "bonus",
    remaining: 1_200,
    createdAt: "2026-08-01T03:00:00.000Z",
    expiresAt: "2027-08-01T03:00:00.000Z",
  },
  {
    id: DEMO_IDS.lots[2],
    bucket: "bonus",
    remaining: 50,
    createdAt: "2026-08-10T05:31:00.000Z",
    expiresAt: "2027-02-10T05:31:00.000Z",
  },
];

const DEMO_TRANSACTIONS: PointTransaction[] = [
  {
    id: DEMO_IDS.transactions[0],
    userId: DEMO_USER.id,
    type: "charge",
    bucket: "paid",
    amount: 8_300,
    referenceId: "demo-seed",
    lotId: DEMO_LOTS[0]!.id,
    reversalOf: null,
    createdAt: DEMO_LOTS[0]!.createdAt,
    expiresAt: DEMO_LOTS[0]!.expiresAt,
  },
  {
    id: DEMO_IDS.transactions[1],
    userId: DEMO_USER.id,
    type: "bonus",
    bucket: "bonus",
    amount: 1_200,
    referenceId: "demo-seed",
    lotId: DEMO_LOTS[1]!.id,
    reversalOf: null,
    createdAt: DEMO_LOTS[1]!.createdAt,
    expiresAt: DEMO_LOTS[1]!.expiresAt,
  },
  {
    id: DEMO_IDS.transactions[2],
    userId: DEMO_USER.id,
    type: "spend",
    bucket: "paid",
    amount: -300,
    referenceId: DEMO_IDS.orders[0],
    lotId: DEMO_LOTS[0]!.id,
    reversalOf: null,
    createdAt: "2026-08-10T05:31:00.000Z",
    expiresAt: DEMO_LOTS[0]!.expiresAt,
  },
  {
    id: DEMO_IDS.transactions[3],
    userId: DEMO_USER.id,
    type: "earn",
    bucket: "bonus",
    amount: 50,
    referenceId: DEMO_IDS.orders[0],
    lotId: DEMO_LOTS[2]!.id,
    reversalOf: null,
    createdAt: DEMO_LOTS[2]!.createdAt,
    expiresAt: DEMO_LOTS[2]!.expiresAt,
  },
];

const DEMO_ORDERS: Order[] = [
  {
    id: DEMO_IDS.orders[0],
    orderNo: "20260810-000901",
    userId: DEMO_USER.id,
    items: [
      {
        productId: 1001,
        type: "score",
        title: "밤편지",
        listPrice: 2_900,
        salePrice: 1_990,
        paidPrice: 1_990,
      },
    ],
    status: "paid",
    listAmount: 2_900,
    totalAmount: 1_990,
    pointsUsed: 300,
    cashPaid: 1_690,
    earnedPoints: 50,
    paymentMethod: "card",
    paymentRef: "demo:past-payment-1",
    createdAt: "2026-08-10T05:30:00.000Z",
    finalizedAt: "2026-08-10T05:31:00.000Z",
    failureCode: null,
    refundReason: null,
  },
  {
    id: DEMO_IDS.orders[1],
    orderNo: "20260720-000742",
    userId: DEMO_USER.id,
    items: [
      {
        productId: 1002,
        type: "score",
        title: "사랑하게 될 거야",
        listPrice: 2_400,
        salePrice: 1_900,
        paidPrice: 2_400,
      },
    ],
    status: "canceled",
    listAmount: 2_400,
    totalAmount: 2_400,
    pointsUsed: 0,
    cashPaid: 2_400,
    earnedPoints: 72,
    paymentMethod: "kakao-pay",
    paymentRef: null,
    createdAt: "2026-07-20T10:15:00.000Z",
    finalizedAt: null,
    failureCode: null,
    refundReason: null,
  },
];

const DEMO_LIBRARY: LibraryItem[] = [
  {
    id: DEMO_IDS.library[0],
    userId: DEMO_USER.id,
    productId: 1001,
    productType: "score",
    orderId: DEMO_IDS.orders[0],
    orderNo: DEMO_ORDERS[0]!.orderNo,
    purchasedAt: DEMO_ORDERS[0]!.finalizedAt ?? DEMO_ORDERS[0]!.createdAt,
  },
];

function withoutIds<T extends { id: string }>(items: readonly T[], ids: readonly string[]): T[] {
  const excluded = new Set(ids);
  return items.filter((item) => !excluded.has(item.id));
}

export class MockDemoDataRepository {
  constructor(private readonly store: VersionedMockStorage) {}

  seed(): { lots: number; orders: number } {
    const lotsByUser = this.store.read<Record<string, PointLot[]>>(MOCK_STORAGE_KEYS.pointLots, {});
    lotsByUser[DEMO_USER.id] = [
      ...withoutIds(lotsByUser[DEMO_USER.id] ?? [], DEMO_IDS.lots),
      ...structuredClone(DEMO_LOTS),
    ];
    this.store.write(MOCK_STORAGE_KEYS.pointLots, lotsByUser);

    const transactions = this.store.read<PointTransaction[]>(
      MOCK_STORAGE_KEYS.pointTransactions,
      [],
    );
    this.store.write(MOCK_STORAGE_KEYS.pointTransactions, [
      ...withoutIds(transactions, DEMO_IDS.transactions),
      ...structuredClone(DEMO_TRANSACTIONS),
    ]);

    const orders = this.store.read<Order[]>(MOCK_STORAGE_KEYS.orders, []);
    this.store.write(MOCK_STORAGE_KEYS.orders, [
      ...withoutIds(orders, DEMO_IDS.orders),
      ...structuredClone(DEMO_ORDERS),
    ]);

    const library = this.store.read<LibraryItem[]>(MOCK_STORAGE_KEYS.library, []);
    this.store.write(MOCK_STORAGE_KEYS.library, [
      ...withoutIds(library, DEMO_IDS.library),
      ...structuredClone(DEMO_LIBRARY),
    ]);

    return { lots: DEMO_LOTS.length, orders: DEMO_ORDERS.length };
  }

  reset(): void {
    const lotsByUser = this.store.read<Record<string, PointLot[]>>(MOCK_STORAGE_KEYS.pointLots, {});
    lotsByUser[DEMO_USER.id] = withoutIds(lotsByUser[DEMO_USER.id] ?? [], DEMO_IDS.lots);
    this.store.write(MOCK_STORAGE_KEYS.pointLots, lotsByUser);

    const transactions = this.store.read<PointTransaction[]>(
      MOCK_STORAGE_KEYS.pointTransactions,
      [],
    );
    this.store.write(
      MOCK_STORAGE_KEYS.pointTransactions,
      withoutIds(transactions, DEMO_IDS.transactions),
    );
    this.store.write(
      MOCK_STORAGE_KEYS.orders,
      withoutIds(this.store.read<Order[]>(MOCK_STORAGE_KEYS.orders, []), DEMO_IDS.orders),
    );
    this.store.write(
      MOCK_STORAGE_KEYS.library,
      withoutIds(this.store.read<LibraryItem[]>(MOCK_STORAGE_KEYS.library, []), DEMO_IDS.library),
    );
  }
}
