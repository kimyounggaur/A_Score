import { describe, expect, it } from "vitest";

import {
  parseAdminOrderListQuery,
  parseAdminProductListQuery,
  parseAdminUserListQuery,
  parsePointHistoryListQuery,
} from "@/lib/navigation/list-query";

describe("list URL query parsing", () => {
  it("restores valid admin product state", () => {
    const query = parseAdminProductListQuery(
      new URLSearchParams("q=%EB%B0%A4%ED%8E%B8%EC%A7%80&status=published&sort=sales&page=3"),
    );
    expect(query).toEqual({ q: "밤편지", status: "published", sort: "sales", page: 3 });
  });

  it("restores valid order, user, and point state", () => {
    expect(
      parseAdminOrderListQuery(
        new URLSearchParams("q=20260810&status=paid&sort=amount-desc&page=2"),
      ),
    ).toEqual({ q: "20260810", status: "paid", sort: "amount-desc", page: 2 });
    expect(
      parseAdminUserListQuery(
        new URLSearchParams("q=demo&role=admin&status=suspended&sort=name&page=4"),
      ),
    ).toEqual({ q: "demo", role: "admin", status: "suspended", sort: "name", page: 4 });
    expect(
      parsePointHistoryListQuery(new URLSearchParams("filter=refund&sort=oldest&page=5")),
    ).toEqual({ filter: "refund", sort: "oldest", page: 5 });
  });

  it("ignores invalid values and limits query length", () => {
    const longQuery = "가".repeat(130);
    expect(
      parseAdminProductListQuery(
        new URLSearchParams(`q=${longQuery}&status=deleted&sort=random&page=-1`),
      ),
    ).toEqual({ q: "가".repeat(100), status: "all", sort: "newest", page: 1 });
    expect(
      parseAdminOrderListQuery(new URLSearchParams("status=unknown&sort=nope&page=1.5")),
    ).toEqual({ q: "", status: "all", sort: "newest", page: 1 });
    expect(
      parseAdminUserListQuery(new URLSearchParams("role=seller&status=blocked&page=10001")),
    ).toEqual({ q: "", role: "all", status: "all", sort: "newest", page: 1 });
    expect(
      parsePointHistoryListQuery(new URLSearchParams("filter=bonus&sort=nope&page=0")),
    ).toEqual({ filter: "all", sort: "newest", page: 1 });
  });
});
