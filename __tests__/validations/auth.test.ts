import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "@/lib/validations/auth";

/* ─── Helper ─────────────────────────────────────────────── */
const validPassword = "SecurePass1";
const weakPasswords = [
  { pw: "short1A", reason: "too short (< 8)" },
  { pw: "alllowercase1", reason: "no uppercase" },
  { pw: "ALLUPPERCASE1", reason: "no lowercase" },
  { pw: "NoDigitsHere", reason: "no number" },
];

/* ═══════════════════════════════════════════════════════════
   registerSchema
   ═══════════════════════════════════════════════════════════ */
describe("registerSchema", () => {
  const valid = {
    name: "John Doe",
    email: "john@example.com",
    password: validPassword,
    confirmPassword: validPassword,
  };

  it("accepts valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("lowercases email", () => {
    const result = registerSchema.safeParse({
      ...valid,
      email: "JOHN@Example.COM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("john@example.com");
    }
  });

  it("rejects email with leading/trailing spaces", () => {
    const result = registerSchema.safeParse({
      ...valid,
      email: "  john@example.com  ",
    });
    expect(result.success).toBe(false);
  });

  it("trims name", () => {
    const result = registerSchema.safeParse({
      ...valid,
      name: "  John Doe  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("John Doe");
    }
  });

  it("rejects name shorter than 2 chars", () => {
    const result = registerSchema.safeParse({ ...valid, name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 chars", () => {
    const result = registerSchema.safeParse({ ...valid, name: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it.each(weakPasswords)("rejects $reason password", ({ pw }) => {
    const result = registerSchema.safeParse({
      ...valid,
      password: pw,
      confirmPassword: pw,
    });
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 128 chars", () => {
    const longPw = "Aa1" + "x".repeat(126);
    const result = registerSchema.safeParse({
      ...valid,
      password: longPw,
      confirmPassword: longPw,
    });
    expect(result.success).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════
   loginSchema
   ═══════════════════════════════════════════════════════════ */
describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "bad",
      password: "anything",
    });
    expect(result.success).toBe(false);
  });

  it("lowercases email", () => {
    const result = loginSchema.safeParse({
      email: "User@Example.COM",
      password: "anything",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });
});

/* ═══════════════════════════════════════════════════════════
   forgotPasswordSchema
   ═══════════════════════════════════════════════════════════ */
describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "a@b.com" }).success
    ).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "nope" }).success
    ).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════
   resetPasswordSchema
   ═══════════════════════════════════════════════════════════ */
describe("resetPasswordSchema", () => {
  const valid = {
    token: "abc123",
    password: validPassword,
    confirmPassword: validPassword,
  };

  it("accepts valid input", () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty token", () => {
    expect(
      resetPasswordSchema.safeParse({ ...valid, token: "" }).success
    ).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        ...valid,
        confirmPassword: "Mismatch1",
      }).success
    ).toBe(false);
  });

  it.each(weakPasswords)("rejects $reason password", ({ pw }) => {
    expect(
      resetPasswordSchema.safeParse({
        ...valid,
        password: pw,
        confirmPassword: pw,
      }).success
    ).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════
   updateProfileSchema
   ═══════════════════════════════════════════════════════════ */
describe("updateProfileSchema", () => {
  it("accepts valid name", () => {
    expect(
      updateProfileSchema.safeParse({ name: "Jane" }).success
    ).toBe(true);
  });

  it("rejects name too short", () => {
    expect(
      updateProfileSchema.safeParse({ name: "X" }).success
    ).toBe(false);
  });

  it("trims name", () => {
    const result = updateProfileSchema.safeParse({ name: "  Jane  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Jane");
  });
});

/* ═══════════════════════════════════════════════════════════
   changePasswordSchema
   ═══════════════════════════════════════════════════════════ */
describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "OldPassword1",
    newPassword: validPassword,
    confirmPassword: validPassword,
  };

  it("accepts valid input", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty currentPassword", () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, currentPassword: "" }).success
    ).toBe(false);
  });

  it("rejects mismatched new passwords", () => {
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        confirmPassword: "Mismatch1",
      }).success
    ).toBe(false);
  });

  it.each(weakPasswords)("rejects $reason new password", ({ pw }) => {
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        newPassword: pw,
        confirmPassword: pw,
      }).success
    ).toBe(false);
  });
});
