"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, FileMusic, ShoppingCart, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatWon, sumPaidRevenue } from "@/lib/pricing";
import { adminRepository } from "@/lib/repositories/admin-repository";
import type { Order, SessionUser } from "@/lib/repositories/interfaces";
import type { CatalogProduct } from "@/lib/catalog/types";

type DashboardData = { products: CatalogProduct[]; orders: Order[]; users: SessionUser[] };

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminRepository.listProducts(),
      adminRepository.listOrders(),
      adminRepository.listUsers(),
    ]).then(
      ([products, orders, users]) => setData({ products, orders, users }),
      (caught: unknown) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "관리 데이터를 불러오지 못했습니다. 새로고침해 주세요.",
        ),
    );
  }, []);

  const paidOrders = data?.orders.filter((order) => order.status === "paid") ?? [];
  const revenue = sumPaidRevenue(data?.orders ?? []);
  const kpis = [
    { label: "결제 매출", value: formatWon(revenue), icon: CircleDollarSign },
    {
      label: "결제 완료 주문",
      value: paidOrders.length.toLocaleString("ko-KR"),
      icon: ShoppingCart,
    },
    { label: "회원", value: (data?.users.length ?? 0).toLocaleString("ko-KR"), icon: Users },
    {
      label: "게시 악보",
      value: (
        data?.products.filter((product) => product.status === "published").length ?? 0
      ).toLocaleString("ko-KR"),
      icon: FileMusic,
    },
  ];

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">대시보드</h1>
        <p className="mt-1 text-sm text-text-muted">모의 저장소의 실제 주문과 상품을 집계합니다.</p>
      </header>
      {error ? (
        <p className="mb-5 rounded-lg bg-sale-bg p-4 text-sm text-sale-ink" role="alert">
          {error}
        </p>
      ) : null}
      {!data ? (
        <p className="py-12 text-center text-sm text-text-muted" role="status">
          관리 데이터를 불러오는 중입니다.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="border-line bg-surface shadow-none">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-sm text-text-muted">{label}</CardTitle>
                  <Icon className="size-5 text-brand-700" strokeWidth={1.5} aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <strong className="text-2xl text-ink-900">{value}</strong>
                </CardContent>
              </Card>
            ))}
          </div>
          {data.orders.length === 0 ? (
            <Card className="mt-6 border-line bg-surface shadow-none">
              <CardContent className="py-10 text-center">
                <h2 className="font-semibold">아직 주문 데이터가 없습니다.</h2>
                <p className="mt-2 text-sm text-text-muted">
                  스토어에서 모의 구매를 완료하면 이곳에 집계됩니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-6 border-line bg-surface shadow-none">
              <CardHeader>
                <CardTitle>최근 주문</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.orders.slice(0, 5).map((order) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 last:border-0"
                    key={order.id}
                  >
                    <div>
                      <p className="font-medium text-ink-900">{order.orderNo}</p>
                      <p className="text-xs text-text-muted">
                        {order.items.map((item) => item.title).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatWon(order.cashPaid)}</p>
                      <p className="text-xs text-text-muted">{order.status}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </section>
  );
}
