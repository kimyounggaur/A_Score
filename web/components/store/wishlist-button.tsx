"use client";

import { Heart } from "lucide-react";

import { useWishlistStore } from "@/lib/stores/wishlist";

export function WishlistButton({ productId, title }: { productId: number; title: string }) {
  const wished = useWishlistStore((state) => state.productIds.includes(productId));
  const toggleWishlist = useWishlistStore((state) => state.toggle);

  return (
    <button
      className="absolute left-2 top-2 inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface/95 text-ink-700 shadow-sm hover:text-sale"
      type="button"
      aria-label={wished ? `${title} 찜 해제` : `${title} 찜하기`}
      aria-pressed={wished}
      onClick={() => toggleWishlist(productId)}
    >
      <Heart
        className={`size-5 ${wished ? "fill-sale text-sale" : ""}`}
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </button>
  );
}
