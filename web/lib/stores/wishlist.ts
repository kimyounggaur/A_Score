"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createBrowserStorage } from "@/lib/stores/storage";

type WishlistState = {
  productIds: number[];
  toggle: (productId: number) => void;
  has: (productId: number) => boolean;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      has: (productId) => get().productIds.includes(productId),
    }),
    { name: "ss.mock.wishlist.v1", storage: createBrowserStorage() },
  ),
);
