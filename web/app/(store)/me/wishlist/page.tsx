import type { Metadata } from "next";

import { WishlistView } from "@/components/account/wishlist-view";

export const metadata: Metadata = {
  title: "찜한 악보",
  description: "관심 있는 악보를 모아 확인해요.",
};

export default function WishlistPage() {
  return <WishlistView />;
}
