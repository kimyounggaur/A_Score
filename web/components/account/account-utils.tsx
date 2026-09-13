import { Badge } from "@/components/ui/badge";
import { formatDate, formatPoint } from "@/lib/format";
import type { OrderStatus, PaymentMethod } from "@/lib/repositories/interfaces";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const statusCopy: Record<OrderStatus, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "결제 실패",
  canceled: "취소",
  refunded: "환불",
};

const statusClasses: Record<OrderStatus, string> = {
  pending: "bg-point-bg text-point-ink",
  paid: "bg-free-bg text-free",
  failed: "bg-sale-bg text-sale-ink",
  canceled: "bg-muted text-ink-600",
  refunded: "bg-brand-100 text-brand-800",
};

const paymentCopy: Record<PaymentMethod, string> = {
  card: "카드",
  "kakao-pay": "카카오페이",
  "naver-pay": "네이버페이",
  toss: "토스페이",
  points: "포인트 전액 결제",
  free: "무료 주문",
};

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatExpiry(value: string) {
  return `${formatDate(value)} 만료`;
}

export function formatSignedPoint(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatPoint(value)}`;
}

export function paymentMethodLabel(method: PaymentMethod) {
  return paymentCopy[method];
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={statusClasses[status]}>{statusCopy[status]}</Badge>;
}

export function AccountLoading({ label = "내 정보를 불러오고 있어요." }: { label?: string }) {
  return (
    <div
      className="flex min-h-52 items-center justify-center rounded-xl border border-line bg-surface text-sm text-text-muted"
      role="status"
    >
      <span
        className="mr-2 size-4 animate-spin rounded-full border-2 border-brand-100 border-t-cta"
        aria-hidden="true"
      />
      {label}
    </div>
  );
}

export function AccountError({ message }: { message: string }) {
  return (
    <p
      className="rounded-xl border border-sale/20 bg-sale-bg p-4 text-sm leading-6 text-sale-ink"
      role="alert"
    >
      {message}
    </p>
  );
}
