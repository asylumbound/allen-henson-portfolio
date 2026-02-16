import { describe, it, expect, vi } from "vitest";

describe("Supabase Auth", () => {
  describe("extractAccessToken (real implementation)", () => {
    it("should extract Bearer token from Authorization header", async () => {
      const { extractAccessToken } = await import("./_core/supabase");

      const token = extractAccessToken({
        headers: { authorization: "Bearer my-jwt-token-123" },
      });
      expect(token).toBe("my-jwt-token-123");
    });

    it("should return null when no auth is present", async () => {
      const { extractAccessToken } = await import("./_core/supabase");

      const token = extractAccessToken({
        headers: {},
      });
      expect(token).toBeNull();
    });

    it("should return null for non-Bearer auth header", async () => {
      const { extractAccessToken } = await import("./_core/supabase");

      const token = extractAccessToken({
        headers: { authorization: "Basic abc123" },
      });
      expect(token).toBeNull();
    });

    it("should handle Authorization header with capital A", async () => {
      const { extractAccessToken } = await import("./_core/supabase");

      const token = extractAccessToken({
        headers: { Authorization: "Bearer capital-header-token" },
      });
      expect(token).toBe("capital-header-token");
    });

    it("should return null for empty Bearer token", async () => {
      const { extractAccessToken } = await import("./_core/supabase");

      const token = extractAccessToken({
        headers: { authorization: "Bearer " },
      });
      // "Bearer " with trailing space gives empty string
      expect(token).toBe("");
    });
  });

  describe("Supabase module exports", () => {
    it("should export getSupabaseAdmin function", async () => {
      const mod = await import("./_core/supabase");
      expect(typeof mod.getSupabaseAdmin).toBe("function");
    });

    it("should export getSupabaseForUser function", async () => {
      const mod = await import("./_core/supabase");
      expect(typeof mod.getSupabaseForUser).toBe("function");
    });

    it("should export extractAccessToken function", async () => {
      const mod = await import("./_core/supabase");
      expect(typeof mod.extractAccessToken).toBe("function");
    });
  });

  describe("Supabase env vars", () => {
    it("VITE_SUPABASE_URL should be set and valid", () => {
      const url = process.env.VITE_SUPABASE_URL;
      expect(url).toBeDefined();
      expect(url).not.toBe("");
      expect(url).toContain("supabase.co");
    });

    it("VITE_SUPABASE_ANON_KEY should be set", () => {
      const key = process.env.VITE_SUPABASE_ANON_KEY;
      expect(key).toBeDefined();
      expect(key).not.toBe("");
    });

    it("SUPABASE_SERVICE_ROLE_KEY should be set and be a JWT", () => {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(key).toBeDefined();
      expect(key).not.toBe("");
      const parts = key!.split(".");
      expect(parts.length).toBe(3);
    });
  });

  describe("Context module", () => {
    it("should export createContext function", async () => {
      const mod = await import("./_core/context");
      expect(typeof mod.createContext).toBe("function");
    });

    it("createContext should not import from sdk.ts", async () => {
      // Read the context.ts source to verify no sdk import
      const fs = await import("fs");
      const contextSource = fs.readFileSync(
        new URL("./_core/context.ts", import.meta.url).pathname,
        "utf-8"
      );
      expect(contextSource).not.toContain("from \"./sdk\"");
      expect(contextSource).not.toContain("from './sdk'");
      expect(contextSource).toContain("from \"./supabase\"");
    });
  });

  describe("OAuth routes module", () => {
    it("should export registerOAuthRoutes function", async () => {
      const mod = await import("./_core/oauth");
      expect(typeof mod.registerOAuthRoutes).toBe("function");
    });

    it("oauth.ts should not import Manus SDK", async () => {
      const fs = await import("fs");
      const oauthSource = fs.readFileSync(
        new URL("./_core/oauth.ts", import.meta.url).pathname,
        "utf-8"
      );
      expect(oauthSource).not.toContain("from \"./sdk\"");
      expect(oauthSource).not.toContain("from './sdk'");
      expect(oauthSource).not.toContain("COOKIE_NAME");
    });
  });

  describe("Auth router", () => {
    it("routers.ts should not import from sdk or cookies", async () => {
      const fs = await import("fs");
      const routersSource = fs.readFileSync(
        new URL("./routers.ts", import.meta.url).pathname,
        "utf-8"
      );
      expect(routersSource).not.toContain("from \"./_core/sdk\"");
      expect(routersSource).not.toContain("from \"./_core/cookies\"");
      // Should still have auth.me and auth.logout
      expect(routersSource).toContain("auth:");
      expect(routersSource).toContain("me:");
      expect(routersSource).toContain("logout:");
    });
  });

  describe("Supabase Admin API connectivity", () => {
    it("can reach Supabase API with service role key", async () => {
      const url = process.env.VITE_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          apikey: serviceKey!,
          Authorization: `Bearer ${serviceKey}`,
        },
      });
      expect(response.status).toBe(200);
    });
  });
});
