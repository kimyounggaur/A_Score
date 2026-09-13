import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { CheckoutSuccess } from "@/components/checkout/checkout-success";

export const metadata: Metadata = { title: "결제 완료", robots: { index: false, follow: false } };

type SuccessPageProps = {
  searchParams: Promise<{ orderId?: string; paymentKey?: string; amount?: string }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  return (
    <RequireAuth>
      <CheckoutSuccess
        orderId={params.orderId ?? ""}
        paymentKey={params.paymentKey ?? ""}
        amount={Number(params.amount)}
      />
    </RequireAuth>
  );
}
