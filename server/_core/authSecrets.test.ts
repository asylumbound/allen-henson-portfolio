import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = {
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  EDIT_PASSWORD: process.env.EDIT_PASSWORD,
  EDITOR_PASSWORD: process.env.EDITOR_PASSWORD,
};

async function importAuthSecrets() {
  vi.resetModules();
  return import("./authSecrets");
}

describe("authSecrets", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (ORIGINAL_ENV.ADMIN_PASSWORD === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = ORIGINAL_ENV.ADMIN_PASSWORD;
    }

    if (ORIGINAL_ENV.EDIT_PASSWORD === undefined) {
      delete process.env.EDIT_PASSWORD;
    } else {
      process.env.EDIT_PASSWORD = ORIGINAL_ENV.EDIT_PASSWORD;
    }

    if (ORIGINAL_ENV.EDITOR_PASSWORD === undefined) {
      delete process.env.EDITOR_PASSWORD;
    } else {
      process.env.EDITOR_PASSWORD = ORIGINAL_ENV.EDITOR_PASSWORD;
    }
  });

  it("uses configured env values when present", async () => {
    process.env.ADMIN_PASSWORD = "admin-from-env";
    process.env.EDIT_PASSWORD = "edit-from-env";
    process.env.EDITOR_PASSWORD = "editor-from-env";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const authSecrets = await importAuthSecrets();

    expect(authSecrets.ADMIN_PASSWORD).toBe("admin-from-env");
    expect(authSecrets.EDIT_PASSWORD).toBe("edit-from-env");
    expect(authSecrets.EDITOR_PASSWORD).toBe("editor-from-env");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("falls back to legacy defaults and warns once per missing env var", async () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.EDIT_PASSWORD;
    delete process.env.EDITOR_PASSWORD;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const authSecrets = await importAuthSecrets();

    expect(authSecrets.ADMIN_PASSWORD).toBe(authSecrets.LEGACY_ADMIN_PASSWORD);
    expect(authSecrets.EDIT_PASSWORD).toBe(authSecrets.LEGACY_EDIT_PASSWORD);
    expect(authSecrets.EDITOR_PASSWORD).toBe(authSecrets.LEGACY_EDITOR_PASSWORD);
    expect(warnSpy).toHaveBeenCalledTimes(3);
    expect(warnSpy.mock.calls.flat()).toEqual(
      expect.arrayContaining([
        expect.stringContaining("ADMIN_PASSWORD not set in environment"),
        expect.stringContaining("EDIT_PASSWORD not set in environment"),
        expect.stringContaining("EDITOR_PASSWORD not set in environment"),
      ])
    );
  });

  it("authorizes both admin and edit passwords", async () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.EDIT_PASSWORD;
    delete process.env.EDITOR_PASSWORD;

    const authSecrets = await importAuthSecrets();

    expect(authSecrets.isAuthorized(authSecrets.LEGACY_ADMIN_PASSWORD)).toBe(true);
    expect(authSecrets.isAuthorized(authSecrets.LEGACY_EDIT_PASSWORD)).toBe(true);
    expect(authSecrets.isAuthorized("wrong-password")).toBe(false);
  });

  it("accepts both editor and edit passwords for duke editor checks", async () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.EDIT_PASSWORD;
    delete process.env.EDITOR_PASSWORD;

    const authSecrets = await importAuthSecrets();

    expect(authSecrets.verifyEditorPassword(authSecrets.LEGACY_EDITOR_PASSWORD)).toBe(true);
    expect(authSecrets.verifyEditorPassword(authSecrets.LEGACY_EDIT_PASSWORD)).toBe(true);
    expect(authSecrets.verifyEditorPassword("wrong-password")).toBe(false);
  });

  it("does not throw when comparing passwords with different lengths", async () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.EDIT_PASSWORD;
    delete process.env.EDITOR_PASSWORD;

    const authSecrets = await importAuthSecrets();

    expect(() => authSecrets.isAdminPassword("x")).not.toThrow();
    expect(authSecrets.isAdminPassword("x")).toBe(false);
  });
});
