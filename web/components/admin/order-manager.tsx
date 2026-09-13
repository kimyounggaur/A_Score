"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, RotateCcw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

import { formatDateTime, paymentMethodLabel } from "@/components/account/account-utils";
import { useListQueryNavigation } from "@/components/navigation/use-list-query-navigation";
import { ListSearchField } from "@/components/navigation/list-search-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPoint } from "@/lib/format";
import { parseAdminOrderListQuery } from "@/lib/navigation/list-query";
import { formatWon } from "@/lib/pricing";
import { adminRepository } from "@/lib/repositories/admin-repository";
import type { Order, RefundRequest } from "@/lib/repositories/interfaces";

const PAGE_SIZE = 10;

const reasonOptions = [
  { id: "change-of-mind", label: "단순 변심" },
  { id: "duplicate", label: "중복 결제" },
  { id: "file-error", label: "파일 오류" },
  { id: "other", label: "기타" },
] as const satisfies readonly { id: RefundRequest["reason"]; label: string }[];

const statusLabels: Record<Order["status"], string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "실패",
  canceled: "취소",
  refunded: "환불",
};

function StatusBadge({ order }: { order: Order }) {
  return (
    <Badge
      variant={
        order.status === "paid"
          ? "free"
          : order.status === "failed" || order.status === "refunded"
            ? "sale"
            : "secondary"
      }
    >
      {statusLabels[order.status]}
    </Badge>
  );
}

export function OrderManager() {
  const { searchParams, replaceFilters, pushPage } = useListQueryNavigation();
  const pathname = usePathname();
  const router = useRouter();
  const { q: query, status, sort, page } = parseAdminOrderListQuery(searchParams);
  const dialogAction = searchParams.get("dialog");
  const dialogOrderId = searchParams.get("order");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);
  const [reason, setReason] = useState<RefundRequest["reason"] | "">("");
  const [detail, setDetail] = useState("");
  const [restorePoints, setRestorePoints] = useState(true);
  const [processing, setProcessing] = useState(false);
  const dialogOpenedHere = useRef(false);
  const hydratedDialogKey = useRef<string | null>(null);
  const closingDialog = useRef(false);

  const navigateDialog = useCallback(
    (action: "detail" | "refund", orderId: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("dialog", action);
      next.set("order", orderId);
      dialogOpenedHere.current = true;
      closingDialog.current = false;
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const replaceWithoutDialog = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("dialog");
    next.delete("order");
    const href = next.size > 0 ? `${pathname}?${next.toString()}` : pathname;
    router.replace(href, { scroll: false });
  }, [pathname, router, searchParams]);

  const closeDialogUrl = useCallback(() => {
    hydratedDialogKey.current = null;
    if (dialogOpenedHere.current) {
      dialogOpenedHere.current = false;
      router.back();
      return;
    }
    replaceWithoutDialog();
  }, [replaceWithoutDialog, router]);

  const reload = () =>
    adminRepository.listOrders().then((next) => {
      setOrders(next);
      setLoaded(true);
    });

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;

      if (!dialogAction) {
        closingDialog.current = false;
        hydratedDialogKey.current = null;
        dialogOpenedHere.current = false;
        setDetailOrder(null);
        setRefundTarget(null);
        setReason("");
        setDetail("");
        if (dialogOrderId) replaceWithoutDialog();
        return;
      }

      if (closingDialog.current) return;

      const target = dialogOrderId ? orders.find((order) => order.id === dialogOrderId) : undefined;
      const isValid =
        (dialogAction === "detail" && Boolean(target)) ||
        (dialogAction === "refund" && target?.status === "paid");
      if (!isValid) {
        hydratedDialogKey.current = null;
        dialogOpenedHere.current = false;
        setDetailOrder(null);
        setRefundTarget(null);
        setReason("");
        setDetail("");
        replaceWithoutDialog();
        return;
      }

      const key = `${dialogAction}:${dialogOrderId}`;
      if (hydratedDialogKey.current === key) return;
      hydratedDialogKey.current = key;
      setDetailOrder(dialogAction === "detail" ? (target ?? null) : null);
      setRefundTarget(dialogAction === "refund" ? (target ?? null) : null);
      setReason("");
      setDetail("");
      setRestorePoints(true);
    });
    return () => {
      cancelled = true;
    };
  }, [dialogAction, dialogOrderId, loaded, orders, replaceWithoutDialog]);

  const normalized = query.toLocaleLowerCase("ko-KR");
  const filtered = orders.filter(
    (order) =>
      (status === "all" || order.status === status) &&
      (!normalized ||
        `${order.orderNo} ${order.items.map((item) => item.title).join(" ")}`
          .toLocaleLowerCase("ko-KR")
          .includes(normalized)),
  );
  const sorted = filtered.toSorted((a, b) => {
    if (sort === "oldest") return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    if (sort === "amount-desc") return b.totalAmount - a.totalAmount;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleOrders = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const validReason = Boolean(reason) && (reason !== "other" || detail.trim().length > 0);

  const openRefund = (order: Order) => {
    if (order.status !== "paid") return;
    navigateDialog("refund", order.id);
  };

  const closeRefund = () => {
    closingDialog.current = true;
    setRefundTarget(null);
    setReason("");
    setDetail("");
    closeDialogUrl();
  };

  const openDetail = (order: Order) => {
    navigateDialog("detail", order.id);
  };

  const closeDetail = () => {
    closingDialog.current = true;
    setDetailOrder(null);
    closeDialogUrl();
  };

  const confirmRefund = async () => {
    if (!refundTarget || refundTarget.status !== "paid" || !reason || !validReason) return;
    setProcessing(true);
    try {
      await adminRepository.refundOrder({
        orderId: refundTarget.id,
        reason,
        detail,
        restorePoints,
      });
      await reload();
      closeRefund();
      toast.success("환불 처리되었습니다 (데모)");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "환불 처리에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">주문 관리</h1>
        <p className="mt-1 text-sm text-text-muted">주문 상태와 환불 영향을 확인합니다.</p>
      </header>

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_auto_auto]">
        <div>
          <ListSearchField
            key={query}
            id="order-search"
            label="주문 검색"
            placeholder="주문번호 또는 상품명"
            query={query}
            onCommit={(value) => replaceFilters({ q: value || null })}
          />
        </div>
        <div>
          <Label className="sr-only" htmlFor="order-status">
            주문 상태
          </Label>
          <select
            id="order-status"
            className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
            value={status}
            onChange={(event) => replaceFilters({ status: event.target.value })}
          >
            <option value="all">전체 상태</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="sr-only" htmlFor="order-sort">
            주문 정렬
          </Label>
          <select
            id="order-sort"
            className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
            value={sort}
            onChange={(event) => replaceFilters({ sort: event.target.value })}
          >
            <option value="newest">최근 주문순</option>
            <option value="oldest">오래된 주문순</option>
            <option value="amount-desc">금액 높은순</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>주문번호</TableHead>
              <TableHead>상품</TableHead>
              <TableHead>총액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>일시</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loaded ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-text-muted">
                  주문을 불러오는 중입니다.
                </TableCell>
              </TableRow>
            ) : null}
            {loaded && visibleOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-text-muted">
                  조건에 맞는 주문이 없습니다.
                </TableCell>
              </TableRow>
            ) : null}
            {visibleOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderNo}</TableCell>
                <TableCell className="max-w-56 truncate">
                  {order.items.map((item) => item.title).join(", ")}
                </TableCell>
                <TableCell>{formatWon(order.totalAmount)}</TableCell>
                <TableCell>
                  <StatusBadge order={order} />
                </TableCell>
                <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`${order.orderNo} 주문 상세`}
                      onClick={() => openDetail(order)}
                    >
                      <Eye aria-hidden="true" /> 상세
                    </Button>
                    {order.status === "paid" ? (
                      <Button
                        type="button"
                        variant="outline"
                        aria-label={`${order.orderNo} 주문 환불`}
                        onClick={() => openRefund(order)}
                      >
                        <RotateCcw aria-hidden="true" /> 환불
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sorted.length > PAGE_SIZE ? (
        <nav className="mt-4 flex items-center justify-center gap-3" aria-label="주문 관리 페이지">
          <Button
            type="button"
            variant="outline"
            disabled={safePage <= 1}
            onClick={() => pushPage(Math.max(1, safePage - 1))}
          >
            이전
          </Button>
          <span className="text-sm text-text-muted" aria-live="polite">
            {safePage} / {pageCount} 페이지
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={safePage >= pageCount}
            onClick={() => pushPage(Math.min(pageCount, safePage + 1))}
          >
            다음
          </Button>
        </nav>
      ) : null}

      <Dialog open={Boolean(detailOrder)} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>주문 상세</DialogTitle>
            <DialogDescription>
              {detailOrder ? `주문번호 ${detailOrder.orderNo}` : "주문 정보를 확인합니다."}
            </DialogDescription>
          </DialogHeader>
          {detailOrder ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted p-4">
                <span className="text-sm text-text-muted">현재 상태</span>
                <StatusBadge order={detailOrder} />
              </div>

              <section aria-labelledby="admin-order-items">
                <h3 className="font-semibold text-ink-900" id="admin-order-items">
                  주문 상품
                </h3>
                <ul className="mt-2 divide-y divide-line rounded-lg border border-line px-4">
                  {detailOrder.items.map((item) => (
                    <li
                      className="flex items-start justify-between gap-4 py-3"
                      key={`${item.type}-${item.productId}`}
                    >
                      <span className="font-medium text-ink-900">{item.title}</span>
                      <span className="shrink-0 text-sm">{formatWon(item.paidPrice)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-text-muted">결제 수단</dt>
                  <dd className="mt-1 font-medium">
                    {paymentMethodLabel(detailOrder.paymentMethod)}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted">할인 후 총액</dt>
                  <dd className="mt-1 font-medium">{formatWon(detailOrder.totalAmount)}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">현금 결제</dt>
                  <dd className="mt-1 font-medium">{formatWon(detailOrder.cashPaid)}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">사용 포인트</dt>
                  <dd className="mt-1 font-medium">{formatPoint(detailOrder.pointsUsed)}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">주문 일시</dt>
                  <dd className="mt-1 font-medium">{formatDateTime(detailOrder.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">처리 일시</dt>
                  <dd className="mt-1 font-medium">
                    {detailOrder.finalizedAt ? formatDateTime(detailOrder.finalizedAt) : "처리 전"}
                  </dd>
                </div>
                {detailOrder.failureCode ? (
                  <div>
                    <dt className="text-text-muted">실패 코드</dt>
                    <dd className="mt-1 font-medium text-sale-ink">{detailOrder.failureCode}</dd>
                  </div>
                ) : null}
                {detailOrder.refundReason ? (
                  <div>
                    <dt className="text-text-muted">환불 사유</dt>
                    <dd className="mt-1 font-medium">{detailOrder.refundReason}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDetail}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(refundTarget)}
        onOpenChange={(open) => {
          if (!open) closeRefund();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환불 처리 확인</DialogTitle>
            <DialogDescription>
              환불 사유와 사용자 데이터에 미치는 영향을 확인한 뒤 처리합니다.
            </DialogDescription>
          </DialogHeader>
          {refundTarget ? (
            <div className="space-y-4">
              <dl className="rounded-lg bg-muted p-4 text-sm">
                <div className="flex justify-between">
                  <dt>현금 환불 예정</dt>
                  <dd className="font-semibold">{formatWon(refundTarget.cashPaid)}</dd>
                </div>
                <div className="mt-2 flex justify-between">
                  <dt>사용 포인트</dt>
                  <dd>{formatPoint(refundTarget.pointsUsed)}</dd>
                </div>
              </dl>
              <div className="space-y-2">
                <Label htmlFor="refund-reason">환불 사유</Label>
                <select
                  id="refund-reason"
                  className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
                  value={reason}
                  onChange={(event) => setReason(event.target.value as typeof reason)}
                >
                  <option value="">사유를 선택하세요</option>
                  {reasonOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {reason === "other" ? (
                <div className="space-y-2">
                  <Label htmlFor="refund-detail">기타 사유</Label>
                  <Input
                    id="refund-detail"
                    value={detail}
                    onChange={(event) => setDetail(event.target.value)}
                    required
                    aria-describedby="refund-detail-help"
                  />
                  <p id="refund-detail-help" className="text-xs text-text-muted">
                    기타를 선택하면 구체적인 사유를 입력해야 합니다.
                  </p>
                </div>
              ) : null}
              <Label className="flex cursor-pointer items-start gap-3" htmlFor="restore-points">
                <Checkbox
                  id="restore-points"
                  checked={restorePoints}
                  onCheckedChange={(checked) => setRestorePoints(checked === true)}
                />
                <span>사용 포인트 {formatPoint(refundTarget.pointsUsed)}를 복원합니다.</span>
              </Label>
              <p className="rounded-lg bg-sale-bg p-3 text-sm leading-6 text-sale-ink">
                확정하면 주문이 환불 상태로 바뀌고 보관함의 해당 주문 악보에 더 이상 접근할 수
                없습니다.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={closeRefund}>
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!validReason || processing || refundTarget?.status !== "paid"}
              onClick={confirmRefund}
            >
              {processing ? "처리 중" : "환불 처리"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
