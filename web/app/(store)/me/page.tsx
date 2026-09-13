import type { Metadata } from "next";

import { AccountOverview } from "@/components/account/account-overview";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "보관함과 주문, 포인트, 찜한 악보를 확인해요.",
};

export default function MePage() {
  return <AccountOverview />;
}
