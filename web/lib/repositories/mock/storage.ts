export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface StoredDocument<T> {
  version: number;
  data: T;
}

const STORAGE_PREFIX = "ss.mock.";
const SCHEMA_VERSION = 1;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class VersionedMockStorage {
  constructor(private readonly storage: StorageLike | null) {}

  get available(): boolean {
    return this.storage !== null;
  }

  has(name: string): boolean {
    return this.storage?.getItem(`${STORAGE_PREFIX}${name}`) != null;
  }

  read<T>(name: string, fallback: T): T {
    if (!this.storage) return clone(fallback);
    const key = `${STORAGE_PREFIX}${name}`;
    const raw = this.storage.getItem(key);
    if (!raw) return clone(fallback);
    try {
      const document = JSON.parse(raw) as Partial<StoredDocument<T>>;
      if (document.version !== SCHEMA_VERSION || !("data" in document)) {
        this.storage.removeItem(key);
        return clone(fallback);
      }
      return clone(document.data as T);
    } catch {
      this.storage.removeItem(key);
      return clone(fallback);
    }
  }

  write<T>(name: string, value: T): void {
    if (!this.storage) return;
    const document: StoredDocument<T> = { version: SCHEMA_VERSION, data: value };
    this.storage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(document));
  }

  remove(name: string): void {
    this.storage?.removeItem(`${STORAGE_PREFIX}${name}`);
  }
}

export function getBrowserStorage(): StorageLike | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

let idSequence = 0;

export function createMockId(prefix: string, now: Date): string {
  idSequence += 1;
  return `${prefix}-${now.getTime().toString(36)}-${idSequence.toString(36)}`;
}

export const MOCK_STORAGE_KEYS = Object.freeze({
  session: "session",
  users: "users",
  products: "products",
  orders: "orders",
  library: "library",
  pointLots: "point-lots",
  pointTransactions: "point-transactions",
  wishlists: "wishlists",
  notifications: "notifications",
  settings: "settings",
});
