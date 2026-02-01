import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getImageOrder, saveImageOrder, getAllBlogPosts, getBlogPostBySlug, seedBlogPosts } from "./db";
import { TRPCError } from "@trpc/server";

// Admin password for the /edit page - stored as env variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "allenhenson2026";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Admin authentication for /edit page
  admin: router({
    verifyPassword: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        if (input.password === ADMIN_PASSWORD) {
          return { success: true, token: "admin-verified" };
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }),
  }),

  // Image order management
  gallery: router({
    getOrder: publicProcedure
      .input(z.object({ gallery: z.enum(["photos", "journal"]) }))
      .query(async ({ input }) => {
        const result = await getImageOrder(input.gallery);
        if (result) {
          return { order: JSON.parse(result.imageOrder) as string[] };
        }
        return { order: null };
      }),
    
    saveOrder: publicProcedure
      .input(z.object({
        gallery: z.enum(["photos", "journal"]),
        order: z.array(z.string()),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Verify password
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        
        await saveImageOrder(input.gallery, input.order);
        return { success: true };
      }),
  }),

  // Blog posts
  blog: router({
    list: publicProcedure.query(async () => {
      const posts = await getAllBlogPosts();
      return posts;
    }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const post = await getBlogPostBySlug(input.slug);
        return post;
      }),
    
    seed: publicProcedure
      .input(z.object({
        password: z.string(),
        posts: z.array(z.object({
          slug: z.string(),
          title: z.string(),
          excerpt: z.string().optional(),
          content: z.string(),
          heroImage: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        await seedBlogPosts(input.posts);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
