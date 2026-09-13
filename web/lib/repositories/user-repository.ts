import { MockUserRepository } from "@/lib/repositories/mock/user";
import { runtimeMockStore } from "@/lib/repositories/runtime-store";

export const userRepository = new MockUserRepository(runtimeMockStore);
