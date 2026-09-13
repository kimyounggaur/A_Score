"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createBrowserStorage } from "@/lib/stores/storage";
import { userRepository } from "@/lib/repositories/user-repository";

export type DemoProvider = "email" | "kakao" | "guest";
export type DemoRole = "user" | "admin";

export type DemoSession = {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  provider: DemoProvider;
  joinedAt: string;
  suspended?: boolean;
};

type SessionState = {
  session: DemoSession | null;
  hydrated: boolean;
  signIn: (provider: DemoProvider, role?: DemoRole) => Promise<DemoSession>;
  signOut: () => void;
  refreshSession: () => Promise<DemoSession | null>;
  setHydrated: (hydrated: boolean) => void;
};

function toDemoSession(
  session: Awaited<ReturnType<typeof userRepository.getSession>>,
): DemoSession | null {
  if (!session) return null;
  return {
    ...session,
    provider: session.provider === "demo" ? "guest" : session.provider,
  };
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      hydrated: false,
      signIn: async (provider, role = "user") => {
        const authenticated = await userRepository.signInDemo(
          provider === "guest" ? "demo" : provider,
          { role },
        );
        const session: DemoSession = { ...authenticated, provider };
        set({ session, hydrated: true });
        return session;
      },
      signOut: () => {
        set({ session: null });
        void userRepository.signOut();
      },
      refreshSession: async () => {
        try {
          const session = toDemoSession(await userRepository.getSession());
          set({ session });
          return session;
        } catch (error) {
          set({ session: null });
          throw error;
        }
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "ss.mock.session.v1",
      storage: createBrowserStorage(),
      partialize: ({ session }) => ({ session }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        void state
          .refreshSession()
          .catch(() => undefined)
          .finally(() => state.setHydrated(true));
      },
    },
  ),
);
