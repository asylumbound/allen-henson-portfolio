import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with service role key.
 * Use this for admin operations (user management, bypassing RLS).
 */
let _adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    const url = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      throw new Error(
        "VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
      );
    }

    _adminClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _adminClient;
}

/**
 * Create a Supabase client scoped to a specific user's access token.
 * Use this to verify the user's JWT and get their session.
 */
export function getSupabaseForUser(accessToken: string): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set");
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Extract the Supabase access token from the request.
 * Checks Authorization header first, then falls back to cookie.
 */
export function extractAccessToken(req: {
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
}): string | null {
  // Check Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Check for Supabase auth cookie (sb-<ref>-auth-token)
  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader === "string") {
    // Supabase stores tokens in sb-<project-ref>-auth-token cookie
    const projectRef = (process.env.VITE_SUPABASE_URL || "")
      .replace("https://", "")
      .split(".")[0];
    
    const cookieName = `sb-${projectRef}-auth-token`;
    const cookies = parseCookies(cookieHeader);
    const tokenCookie = cookies[cookieName];
    
    if (tokenCookie) {
      try {
        // The cookie value is a JSON-encoded object with access_token
        const parsed = JSON.parse(decodeURIComponent(tokenCookie));
        if (parsed?.access_token) {
          return parsed.access_token;
        }
        // Sometimes it's stored as a base64-encoded array
        if (Array.isArray(parsed) && parsed[0]) {
          return parsed[0];
        }
      } catch {
        // If it's just a raw token string
        return tokenCookie;
      }
    }
  }

  return null;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) {
      cookies[name.trim()] = rest.join("=").trim();
    }
  });
  return cookies;
}
