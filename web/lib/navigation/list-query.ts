import type { ProductStatus } from "@/lib/catalog/types";
import type { OrderStatus, UserRole } from "@/lib/repositories/interfaces";
import type { PointTransactionType } from "@/lib/points/types";

export interface SearchParamsLike {
  get(name: string): string | null;
}

const PRODUCT_STATUSES = ["draft", "published", "hidden"] as const;
const PRODUCT_SORTS = ["newest", "sales", "title"] as const;
const ORDER_STATUSES = ["pending", "paid", "failed", "canceled", "refunded"] as const;
const ORDER_SORTS = ["newest", "oldest", "amount-desc"] as const;
const USER_ROLES = ["user", "admin"] as const;
const USER_STATUSES = ["active", "suspended"] as const;
const USER_SORTS = ["newest", "name"] as const;
const POINT_FILTERS = ["charge", "earn", "spend", "expire", "refund"] as const;
const POINT_SORTS = ["newest", "oldest", "amount-desc"] as const;

function isMember<const T extends readonly string[]>(
  values: T,
  value: string | null,
): value is T[number] {
  return value !== null && values.includes(value as T[number]);
}

function parsePage(params: SearchParamsLike): number {
  const page = Number(params.get("page") ?? "1");
  return Number.isSafeInteger(page) && page >= 1 && page <= 10_000 ? page : 1;
}

function parseQuery(params: SearchParamsLike): string {
  return (params.get("q") ?? "").trim().slice(0, 100);
}

export type AdminProductListQuery = {
  q: string;
  status: "all" | ProductStatus;
  sort: (typeof PRODUCT_SORTS)[number];
  page: number;
};

export function parseAdminProductListQuery(params: SearchParamsLike): AdminProductListQuery {
  const status = params.get("status");
  const sort = params.get("sort");
  return {
    q: parseQuery(params),
    status: isMember(PRODUCT_STATUSES, status) ? status : "all",
    sort: isMember(PRODUCT_SORTS, sort) ? sort : "newest",
    page: parsePage(params),
  };
}

export type AdminOrderListQuery = {
  q: string;
  status: "all" | OrderStatus;
  sort: (typeof ORDER_SORTS)[number];
  page: number;
};

export function parseAdminOrderListQuery(params: SearchParamsLike): AdminOrderListQuery {
  const status = params.get("status");
  const sort = params.get("sort");
  return {
    q: parseQuery(params),
    status: isMember(ORDER_STATUSES, status) ? status : "all",
    sort: isMember(ORDER_SORTS, sort) ? sort : "newest",
    page: parsePage(params),
  };
}

export type AdminUserListQuery = {
  q: string;
  role: "all" | UserRole;
  status: "all" | (typeof USER_STATUSES)[number];
  sort: (typeof USER_SORTS)[number];
  page: number;
};

export function parseAdminUserListQuery(params: SearchParamsLike): AdminUserListQuery {
  const role = params.get("role");
  const status = params.get("status");
  const sort = params.get("sort");
  return {
    q: parseQuery(params),
    role: isMember(USER_ROLES, role) ? role : "all",
    status: isMember(USER_STATUSES, status) ? status : "all",
    sort: isMember(USER_SORTS, sort) ? sort : "newest",
    page: parsePage(params),
  };
}

export type PointHistoryFilter = "all" | Exclude<PointTransactionType, "bonus">;

export type PointHistoryListQuery = {
  filter: PointHistoryFilter;
  sort: (typeof POINT_SORTS)[number];
  page: number;
};

export function parsePointHistoryListQuery(params: SearchParamsLike): PointHistoryListQuery {
  const filter = params.get("filter");
  const sort = params.get("sort");
  return {
    filter: isMember(POINT_FILTERS, filter) ? filter : "all",
    sort: isMember(POINT_SORTS, sort) ? sort : "newest",
    page: parsePage(params),
  };
}
