import { describe, it, expect } from "vitest";

describe("Supabase secrets validation", () => {
  it("VITE_SUPABASE_URL is set and valid", () => {
    const url = process.env.VITE_SUPABASE_URL;
    expect(url).toBeDefined();
    expect(url).not.toBe("");
    expect(url).toContain("supabase.co");
  });

  it("VITE_SUPABASE_ANON_KEY is set", () => {
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
  });

  it("SUPABASE_SERVICE_ROLE_KEY is set and is a JWT", () => {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    // Service role key should be a JWT with 3 parts
    const parts = key!.split(".");
    expect(parts.length).toBe(3);
  });

  it("can connect to Supabase health endpoint", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: serviceKey!,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    // 200 means we can reach the API with the service role key
    expect(response.status).toBe(200);
  });
});
