import { describe, expect, it } from "vitest";

import { DEMO_ADMIN } from "@/data/mock/seed-user";
import { DEMO_ADMIN_EMAIL } from "@/lib/config/demo-account";
import type { RepositoryError } from "@/lib/repositories/interfaces";
import { createMockRepositories } from "@/lib/repositories/mock";
import { createMemoryStorage } from "@/lib/repositories/mock/storage";

function setup() {
  return createMockRepositories({ storage: createMemoryStorage() });
}

describe("administrator continuity", () => {
  it("uses the administrator email advertised by the demo login", () => {
    expect(DEMO_ADMIN.email).toBe(DEMO_ADMIN_EMAIL);
  });

  it("does not let the signed-in administrator remove their own authority", async () => {
    const repositories = setup();
    const current = await repositories.user.signInDemo("email", { role: "admin" });

    await expect(
      repositories.admin.upsertUser({ ...current, suspended: true }),
    ).rejects.toMatchObject<Partial<RepositoryError>>({ code: "CURRENT_ADMIN_REQUIRED" });
    await expect(repositories.user.getSession()).resolves.toMatchObject({
      id: current.id,
      role: "admin",
      suspended: false,
    });
  });

  it("keeps at least one active administrator at the repository boundary", async () => {
    const repositories = setup();
    const administrator = (await repositories.admin.listUsers()).find(
      (user) => user.role === "admin" && !user.suspended,
    );
    expect(administrator).toBeDefined();

    await expect(
      repositories.admin.upsertUser({ ...administrator!, suspended: true }),
    ).rejects.toMatchObject<Partial<RepositoryError>>({ code: "LAST_ACTIVE_ADMIN_REQUIRED" });
    await expect(repositories.admin.listUsers()).resolves.toContainEqual(administrator);
  });

  it("does not let the signed-in administrator disable their own authority", async () => {
    const repositories = setup();
    const session = await repositories.user.signInDemo("email", { role: "admin" });

    await expect(
      repositories.admin.upsertUser({ ...session, suspended: true }),
    ).rejects.toMatchObject<Partial<RepositoryError>>({ code: "CURRENT_ADMIN_REQUIRED" });
    await expect(repositories.user.getSession()).resolves.toMatchObject({
      id: session.id,
      role: "admin",
      suspended: false,
    });
  });

  it("still allows an administrator to suspend and restore a regular member", async () => {
    const repositories = setup();
    const member = (await repositories.admin.listUsers()).find((user) => user.role === "user");
    expect(member).toBeDefined();

    await expect(
      repositories.admin.upsertUser({ ...member!, suspended: true }),
    ).resolves.toMatchObject({ id: member?.id, suspended: true });
    await expect(
      repositories.admin.upsertUser({ ...member!, suspended: false }),
    ).resolves.toMatchObject({ id: member?.id, suspended: false });
  });
});
