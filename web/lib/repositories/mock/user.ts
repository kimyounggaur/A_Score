import { DEMO_ADMIN, DEMO_USER } from "@/data/mock/seed-user";
import type {
  AuthProvider,
  SessionUser,
  UserRepository,
  UserRole,
} from "@/lib/repositories/interfaces";
import { RepositoryError } from "@/lib/repositories/interfaces";
import { MOCK_STORAGE_KEYS, type VersionedMockStorage } from "@/lib/repositories/mock/storage";

export interface ManagedUserStore {
  listManagedUsers(): Promise<SessionUser[]>;
  upsertManagedUser(user: SessionUser): Promise<SessionUser>;
  deleteManagedUser(userId: string): Promise<void>;
}

export class MockUserRepository implements UserRepository {
  constructor(private readonly store: VersionedMockStorage) {}

  async getSession(): Promise<SessionUser | null> {
    if (!this.store.available) return null;
    const storedSession = this.store.read<SessionUser | null>(MOCK_STORAGE_KEYS.session, null);
    if (!storedSession) return null;

    try {
      const account = await this.assertActive(storedSession.id);
      return { ...account, provider: storedSession.provider };
    } catch (error) {
      if (
        error instanceof RepositoryError &&
        (error.code === "USER_NOT_FOUND" || error.code === "USER_SUSPENDED")
      ) {
        this.store.remove(MOCK_STORAGE_KEYS.session);
        return null;
      }
      throw error;
    }
  }

  async assertActive(userId: string): Promise<SessionUser> {
    const account = (await this.listManagedUsers()).find((user) => user.id === userId);
    if (!account) {
      throw new RepositoryError(
        "USER_NOT_FOUND",
        "회원 정보를 찾을 수 없어요. 다시 로그인해 주세요.",
      );
    }
    if (account.suspended) {
      throw new RepositoryError(
        "USER_SUSPENDED",
        "이용이 정지된 계정이에요. 관리자에게 문의해 주세요.",
      );
    }
    return structuredClone(account);
  }

  async signInDemo(
    provider: AuthProvider,
    options: { role?: UserRole } = {},
  ): Promise<SessionUser> {
    const base = options.role === "admin" ? DEMO_ADMIN : DEMO_USER;
    const users = await this.listManagedUsers();
    const existing = users.find((user) => user.id === base.id);
    if (existing?.suspended) {
      throw new RepositoryError(
        "USER_SUSPENDED",
        "이용이 정지된 계정이에요. 관리자에게 문의해 주세요.",
      );
    }

    const session: SessionUser = { ...base, ...existing, provider, suspended: false };
    this.store.write(MOCK_STORAGE_KEYS.session, session);

    const nextUsers = users.filter((user) => user.id !== session.id).concat(session);
    this.store.write(MOCK_STORAGE_KEYS.users, nextUsers);
    return structuredClone(session);
  }

  async signOut(): Promise<void> {
    this.store.remove(MOCK_STORAGE_KEYS.session);
  }

  async listManagedUsers(): Promise<SessionUser[]> {
    if (!this.store.available) return [];
    return this.store.read<SessionUser[]>(MOCK_STORAGE_KEYS.users, [DEMO_USER, DEMO_ADMIN]);
  }

  async upsertManagedUser(user: SessionUser): Promise<SessionUser> {
    const users = await this.listManagedUsers();
    const existing = users.find((candidate) => candidate.id === user.id);
    const currentSession = this.store.read<SessionUser | null>(MOCK_STORAGE_KEYS.session, null);
    const removesActiveAdmin =
      existing?.role === "admin" &&
      !existing.suspended &&
      (user.role !== "admin" || user.suspended === true);

    if (removesActiveAdmin && currentSession?.id === user.id) {
      throw new RepositoryError(
        "CURRENT_ADMIN_REQUIRED",
        "현재 로그인한 관리자 계정은 정지하거나 일반 회원으로 바꿀 수 없습니다. 다른 관리자 계정에서 처리하십시오.",
      );
    }
    if (
      removesActiveAdmin &&
      !users.some(
        (candidate) =>
          candidate.id !== user.id && candidate.role === "admin" && !candidate.suspended,
      )
    ) {
      throw new RepositoryError(
        "LAST_ACTIVE_ADMIN_REQUIRED",
        "활성 관리자를 최소 1명 유지해야 합니다. 다른 관리자를 활성화한 뒤 다시 시도하십시오.",
      );
    }

    const nextUsers = users.filter((candidate) => candidate.id !== user.id).concat(user);
    this.store.write(MOCK_STORAGE_KEYS.users, nextUsers);

    if (currentSession?.id === user.id) {
      if (user.suspended) {
        this.store.remove(MOCK_STORAGE_KEYS.session);
      } else {
        this.store.write(MOCK_STORAGE_KEYS.session, {
          ...user,
          provider: currentSession.provider,
        });
      }
    }
    return structuredClone(user);
  }

  async deleteManagedUser(userId: string): Promise<void> {
    const users = await this.listManagedUsers();
    this.store.write(
      MOCK_STORAGE_KEYS.users,
      users.filter((user) => user.id !== userId),
    );
    const currentSession = this.store.read<SessionUser | null>(MOCK_STORAGE_KEYS.session, null);
    if (currentSession?.id === userId) this.store.remove(MOCK_STORAGE_KEYS.session);
  }
}
