import { describe, expect, it } from "vitest";
import { normalizeBaseUrl } from "../shared/supabaseUrl";

describe("normalizeBaseUrl", () => {
  it("keeps urls without trailing slash", () => {
    expect(normalizeBaseUrl("https://example.supabase.co")).toBe(
      "https://example.supabase.co"
    );
  });

  it("removes a single trailing slash", () => {
    expect(normalizeBaseUrl("https://example.supabase.co/")).toBe(
      "https://example.supabase.co"
    );
  });

  it("removes multiple trailing slashes", () => {
    expect(normalizeBaseUrl("https://example.supabase.co////")).toBe(
      "https://example.supabase.co"
    );
  });

  it("keeps empty strings unchanged", () => {
    expect(normalizeBaseUrl("")).toBe("");
  });
});
