import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { extractAccessToken, getSupabaseAdmin } from "./supabase";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const accessToken = extractAccessToken(opts.req);

    if (accessToken) {
      const supabase = getSupabaseAdmin();

      // Verify the JWT and get the Supabase user
      const {
        data: { user: supabaseUser },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (supabaseUser && !error) {
        // Look up the user in our database by their Supabase ID (stored as openId)
        let dbUser = await db.getUserByOpenId(supabaseUser.id);

        // If user doesn't exist in our DB yet, create them
        if (!dbUser) {
          await db.upsertUser({
            openId: supabaseUser.id,
            name:
              supabaseUser.user_metadata?.full_name ||
              supabaseUser.user_metadata?.name ||
              supabaseUser.email?.split("@")[0] ||
              null,
            email: supabaseUser.email ?? null,
            loginMethod: supabaseUser.app_metadata?.provider ?? "email",
            lastSignedIn: new Date(),
          });
          dbUser = await db.getUserByOpenId(supabaseUser.id);
        } else {
          // Update last signed in
          await db.upsertUser({
            openId: supabaseUser.id,
            lastSignedIn: new Date(),
          });
        }

        user = dbUser ?? null;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.error("[Auth] Error verifying Supabase token:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
