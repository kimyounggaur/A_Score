import { DEMO_NOTIFICATIONS } from "@/data/mock/seed-user";
import type { NotificationItem, NotificationRepository } from "@/lib/repositories/interfaces";
import { MOCK_STORAGE_KEYS, type VersionedMockStorage } from "@/lib/repositories/mock/storage";

export class MockNotificationRepository implements NotificationRepository {
  constructor(
    private readonly store: VersionedMockStorage,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private readAll(): NotificationItem[] {
    if (!this.store.available) return [];
    return this.store.read<NotificationItem[]>(MOCK_STORAGE_KEYS.notifications, DEMO_NOTIFICATIONS);
  }

  private writeAll(items: NotificationItem[]): void {
    this.store.write(MOCK_STORAGE_KEYS.notifications, items);
  }

  async list(userId: string): Promise<NotificationItem[]> {
    return this.readAll()
      .filter((item) => item.userId === userId)
      .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    const readAt = this.now().toISOString();
    this.writeAll(
      this.readAll().map((item) =>
        item.userId === userId && item.id === notificationId ? { ...item, readAt } : item,
      ),
    );
  }

  async markAllRead(userId: string): Promise<void> {
    const readAt = this.now().toISOString();
    this.writeAll(
      this.readAll().map((item) =>
        item.userId === userId && !item.readAt ? { ...item, readAt } : item,
      ),
    );
  }
}
