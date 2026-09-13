"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ProductType } from "@/lib/catalog/taxonomy";
import { createBrowserStorage } from "@/lib/stores/storage";

export type CartItem = {
  productId: number;
  type: ProductType;
  addedAt: string;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "addedAt">) => void;
  remove: (productId: number) => void;
  removeMany: (productIds: number[]) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) =>
          state.items.some(({ productId }) => productId === item.productId)
            ? state
            : { items: [...state.items, { ...item, addedAt: new Date().toISOString() }] },
        ),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),
      removeMany: (productIds) =>
        set((state) => ({
          items: state.items.filter((item) => !productIds.includes(item.productId)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "ss.mock.cart.v1", storage: createBrowserStorage() },
  ),
);
