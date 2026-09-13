import { MockNotificationRepository } from "@/lib/repositories/mock/notification";
import { runtimeMockStore, runtimeNow } from "@/lib/repositories/runtime-store";

export const notificationRepository = new MockNotificationRepository(runtimeMockStore, runtimeNow);
