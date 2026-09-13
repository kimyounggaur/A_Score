import { DEMO_ADMIN_EMAIL } from "@/lib/config/demo-account";
import type { NotificationItem, SessionUser } from "@/lib/repositories/interfaces";

export const DEMO_USER: SessionUser = {
  id: "demo-user",
  name: "김연주",
  email: "player@example.com",
  role: "user",
  provider: "demo",
  joinedAt: "2026-03-01T00:00:00Z",
};

export const DEMO_ADMIN: SessionUser = {
  id: "demo-admin",
  name: "ScoreStore 관리자",
  email: DEMO_ADMIN_EMAIL,
  role: "admin",
  provider: "demo",
  joinedAt: "2026-03-01T00:00:00Z",
};

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notice-welcome",
    userId: DEMO_USER.id,
    title: "ScoreStore에 오신 것을 환영해요",
    message: "무료 악보부터 둘러보세요.",
    href: "/scores?price=free",
    readAt: null,
    createdAt: "2026-09-01T00:00:00Z",
  },
];
