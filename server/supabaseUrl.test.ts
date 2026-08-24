import { describe, expect, it } from "vitest";
import { joinUrl, normalizeBaseUrl } from "../shared/supabaseUrl";

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

describe("joinUrl", () => {
  it("joins normalized base and multiple segments", () => {
    expect(
      joinUrl(
        "https://example.supabase.co/",
        "/storage/v1/object/public/",
        "/bucket/",
        "path/to/file.webp"
      )
    ).toBe("https://example.supabase.co/storage/v1/object/public/bucket/path/to/file.webp");
  });

  it("returns rooted path when base is empty", () => {
    expect(joinUrl("", "rest/v1", "/blog_posts?select=*")).toBe(
      "/rest/v1/blog_posts?select=*"
    );
  });

  it("collapses duplicate slashes inside segments", () => {
    expect(
      joinUrl("https://example.supabase.co", "storage//v1/object", "bucket", "foo//bar")
    ).toBe("https://example.supabase.co/storage/v1/object/bucket/foo/bar");
  });
});
