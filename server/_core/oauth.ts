import type { Express, Request, Response } from "express";

/**
 * Supabase Auth callback handler.
 * After Supabase email confirmation or OAuth provider redirect,
 * the user is sent to /api/auth/callback with a code that we exchange
 * for a session. The session is then stored client-side by the Supabase JS client.
 * 
 * For this portfolio site, auth is primarily used for the admin panel.
 * The main auth flow is handled client-side by the Supabase JS SDK.
 * This server route handles the OAuth callback redirect.
 */
export function registerOAuthRoutes(app: Express) {
  // Supabase auth callback - handles the redirect after email confirmation
  // or OAuth provider login. The actual token exchange is done client-side
  // by the Supabase JS SDK.
  app.get("/api/auth/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined;
    const next = (req.query.next as string) || "/";

    if (code) {
      // The code exchange will be handled by the Supabase client on the frontend.
      // We just redirect to the frontend with the code in the URL hash.
      const redirectUrl = `${next}#code=${code}`;
      res.redirect(redirectUrl);
    } else {
      // No code provided, redirect to home
      res.redirect("/");
    }
  });

  // Keep the old OAuth callback path for backwards compatibility
  // (in case any bookmarks or links point to it)
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect("/login");
  });
}
