import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpdate = vi.fn();
const captured: { config: { events?: { linkAccount?: (payload: unknown) => Promise<void> } } | null } = {
  config: null,
};

vi.mock("next-auth", () => ({
  default: (config: { events?: { linkAccount?: (payload: unknown) => Promise<void> } }) => {
    captured.config = config;
    return { handlers: {}, auth: vi.fn() };
  },
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: (options: Record<string, unknown>) => ({ id: "credentials", ...options }),
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("@/config/auth.config", () => ({
  default: {
    providers: [],
    callbacks: {},
  },
}));

vi.mock("@/config/db", () => ({
  db: {
    user: {
      update: (...args: unknown[]) => mockUpdate(...args),
      findUnique: vi.fn(),
    },
  },
  isDatabaseConfigured: true,
}));

vi.mock("@/lib/validations/auth", () => ({
  loginSchema: {
    safeParse: vi.fn(() => ({ success: false })),
  },
}));

vi.mock("@/lib/constants", () => ({
  TOKEN_VERSION_CHECK_INTERVAL_MS: 60000,
}));

vi.mock("@/lib/admin", () => ({
  isAdminEmail: vi.fn(() => false),
}));

describe("auth OAuth linkAccount event", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    captured.config = null;
    vi.resetModules();
    await import("@/config/auth");
  });

  it("marks Google-linked users as email verified", async () => {
    const linkAccount = captured.config?.events?.linkAccount;
    expect(linkAccount).toBeTypeOf("function");

    await linkAccount!({
      user: { id: "u1" },
      account: { provider: "google" },
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          emailVerified: expect.any(Date),
        }),
      }),
    );
  });

  it("does not update verification for non-Google providers", async () => {
    const linkAccount = captured.config?.events?.linkAccount;
    expect(linkAccount).toBeTypeOf("function");

    await linkAccount!({
      user: { id: "u1" },
      account: { provider: "credentials" },
    });

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

