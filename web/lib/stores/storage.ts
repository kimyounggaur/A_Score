"use client";

import { createJSONStorage, type StateStorage } from "zustand/middleware";

const memoryValues = new Map<string, string>();
const memoryStorage: StateStorage = {
  getItem: (name) => memoryValues.get(name) ?? null,
  setItem: (name, value) => {
    memoryValues.set(name, value);
  },
  removeItem: (name) => {
    memoryValues.delete(name);
  },
};

export function createBrowserStorage() {
  return createJSONStorage(() => (typeof window === "undefined" ? memoryStorage : localStorage));
}
