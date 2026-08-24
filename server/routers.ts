import { systemRouter } from "./_core/systemRouter";
import { syncSheetRouter } from "./syncSheetRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getImageOrder, saveImageOrder, getAllBlogPosts, getBlogPostBySlug, seedBlogPosts, getAllProducts, getProductBySlug, seedProducts } from "./db";
import { TRPCError } from "@trpc/server";
import { createCheckoutSession, getOrderBySessionId } from "./stripe";
import { storagePut } from "./storage";
import { generateResponsiveImages } from "./imageProcessing";
import { generateAltText } from "./altTextGenerator";
import { GALLERY_KEYS, type GalleryKey } from "../shared/const";
import { findSqlStateCode, isDbUnavailableCause, logErrorCauseChain } from "./_core/errorDetail";
import { isAdminPassword, isAuthorized } from "./_core/authSecrets";
import { getSupabaseBaseUrl, joinUrl } from "../shared/supabaseUrl";
const BLOG_SUPABASE_URL = getSupabaseBaseUrl({ fallback: "" });

const gallerySchema = z.enum(GALLERY_KEYS);

// Machine-readable discriminators for DB failure classes (safe to send to client).
type DbErrorCode = "DB_CONSTRAINT_MISSING" | "DB_SCHEMA_MISSING" | "DB_UNAVAILABLE" | "DB_ERROR";

/** Error subclass carrying a non-sensitive DB failure discriminator as the TRPCError cause. */
export class GalleryDbError extends Error {
  readonly dbErrorCode: DbErrorCode;
  constructor(message: string, dbErrorCode: DbErrorCode) {
    super(message);
    this.name = "GalleryDbError";
    this.dbErrorCode = dbErrorCode;
  }
}

/** Map a Postgres error code to a human-readable hint and DbErrorCode discriminator. */
function pgHint(pgCode: string): { hint: string; dbErrorCode: DbErrorCode } | undefined {
  if (pgCode === "42P10") {
    return {
      hint: "The unique constraint on image_orders.gallery is missing — migration drizzle/0001_tidy_image_orders.sql has likely not been applied to this database.",
      dbErrorCode: "DB_CONSTRAINT_MISSING",
    };
  }
  if (pgCode === "42P01") {
    return {
      hint: "Migrations have not been run; one or more required tables do not exist.",
      dbErrorCode: "DB_SCHEMA_MISSING",
    };
  }
  return undefined;
}

function throwGalleryInternalError(action: string, gallery: GalleryKey, error: unknown, message: string): never {
  const prefix = `[Gallery] ${action} failed for "${gallery}"`;
  const levels = logErrorCauseChain(prefix, error);
  const pgCode = findSqlStateCode(levels);
  const hinted = pgCode !== undefined ? pgHint(pgCode) : undefined;
  if (hinted !== undefined) {
    console.error(`[Gallery] ${action} diagnostics: pg_code=${pgCode} hint=${hinted.hint}`);
  }

  let dbErrorCode: DbErrorCode = "DB_ERROR";
  if (hinted !== undefined) {
    dbErrorCode = hinted.dbErrorCode;
  } else if (isDbUnavailableCause(levels)) {
    dbErrorCode = "DB_UNAVAILABLE";
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
    cause: new GalleryDbError(message, dbErrorCode),
  });
}

/**
 * Content types that Sharp can decode and for which we generate responsive WebP variants.
 * HEIC, HEIF, and AVIF are intentionally excluded: they require optional native libvips
 * plugins that may not be present in all deployment environments.
 */
export const OPTIMIZABLE_CONTENT_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Extension map for the non-optimizable (single-file) upload path.
 * SVG is deliberately omitted: if served inline from the same origin it is an XSS
 * vector; the storage layer (storage.ts) uses Supabase public URLs which do serve
 * files inline, so SVG uploads are not safe to accept here.
 */
const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/png": ".png",
  "image/gif": ".gif",
};
const DEFAULT_EXTENSION = ".bin";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      // With Supabase Auth, logout is handled client-side by the Supabase JS SDK.
      // The server just confirms the action. The client will call supabase.auth.signOut().
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
        if (isAuthorized(input.password)) {
          return { success: true, token: "admin-verified" };
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
      }),
  }),

  // Image management (upload, delete, reorder)
  gallery: router({
    // Upload a new image to S3 with automatic responsive variants
    uploadImage: publicProcedure
      .input(z.object({
        gallery: gallerySchema,
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded
        contentType: z.string(),
        password: z.string(),
        generateResponsive: z.boolean().optional().default(true), // Auto-generate responsive variants
      }))
      .mutation(async ({ input }) => {
        if (!isAuthorized(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        
        // Decode base64 to buffer
        const buffer = Buffer.from(input.fileData, "base64");
        
        // Generate unique filename with timestamp (without extension)
        const timestamp = Date.now();
        const cleanFileName = input.fileName
          .replace(/\.[^/.]+$/, "") // Remove extension
          .replace(/[^a-zA-Z0-9.-]/g, "-")
          .toLowerCase();
        const baseFileKey = `gallery/${input.gallery}/${timestamp}-${cleanFileName}`;
        
        // Check if we should generate responsive variants
        try {
          if (input.generateResponsive && OPTIMIZABLE_CONTENT_TYPES.has(input.contentType)) {
            // Generate responsive images (400w, 800w, 1200w) + optimized original.
            // If Sharp fails the error propagates to the outer handler — no silent fallback.
            const result = await generateResponsiveImages(buffer, baseFileKey, input.contentType);
            
            // Generate AI alt text for the uploaded image
            let altTextResult = null;
            try {
              altTextResult = await generateAltText(result.original.url, input.gallery);
              console.log(`[Upload] Generated alt text: "${altTextResult.altText}"`);
            } catch (altError) {
              console.error("[Upload] Failed to generate alt text:", altError);
            }
            
            return {
              success: true,
              url: result.original.url,
              fileKey: result.original.fileKey,
              variants: result.variants,
              altText: altTextResult,
              optimized: true,
            };
          }
          
          // Non-optimizable path: upload the original buffer with an explicit extension.
          const extension = EXTENSION_MAP[input.contentType] ?? DEFAULT_EXTENSION;
          const fileKey = `${baseFileKey}${extension}`;
          const { url } = await storagePut(fileKey, buffer, input.contentType);
          
          // Generate AI alt text for the uploaded image
          let altTextResult = null;
          try {
            altTextResult = await generateAltText(url, input.gallery);
            console.log(`[Upload] Generated alt text: "${altTextResult.altText}"`);
          } catch (altError) {
            console.error("[Upload] Failed to generate alt text:", altError);
          }
          
          return { success: true, url, fileKey, variants: [], altText: altTextResult, optimized: false };
        } catch (error) {
          throwGalleryInternalError("upload", input.gallery, error, "Failed to upload image. Please try again.");
        }
      }),
    
    // Delete an image (removes from order, actual S3 deletion optional)
    deleteImage: publicProcedure
      .input(z.object({
        gallery: gallerySchema,
        imageSrc: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (!isAuthorized(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }

        try {
          const currentOrder = await getImageOrder(input.gallery);
          if (currentOrder) {
            const order = JSON.parse(currentOrder.imageOrder) as string[];
            const newOrder = order.filter(src => src !== input.imageSrc);
            await saveImageOrder(input.gallery, newOrder);
          }
        } catch (error) {
          throwGalleryInternalError("delete", input.gallery, error, "Failed to update gallery image order.");
        }

        return { success: true };
      }),

    getOrder: publicProcedure
      .input(z.object({ gallery: gallerySchema }))
      .query(async ({ input }) => {
        try {
          const result = await getImageOrder(input.gallery);
          if (result) {
            return { order: JSON.parse(result.imageOrder) as string[] };
          }
          return { order: null };
        } catch (error) {
          throwGalleryInternalError("load order", input.gallery, error, "Failed to load gallery image order.");
        }
      }),
    
    saveOrder: publicProcedure
      .input(z.object({
        gallery: gallerySchema,
        order: z.array(z.string()),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Verify password
        if (!isAuthorized(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        
        try {
          await saveImageOrder(input.gallery, input.order);
          return { success: true };
        } catch (error) {
          throwGalleryInternalError("save order", input.gallery, error, "Failed to save image order. Please try again.");
        }
      }),
    
    // Generate alt text for an existing image
    generateAltText: publicProcedure
      .input(z.object({
        imageUrl: z.string(),
        context: z.string().optional(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (!isAuthorized(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        
        const result = await generateAltText(input.imageUrl, input.context);
        return result;
      }),
  }),

  // Blog posts — served from Supabase (postgres), not TiDB
  blog: router({
    list: publicProcedure.query(async () => {
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      const res = await fetch(joinUrl(BLOG_SUPABASE_URL, "rest/v1/blog_posts?select=id,slug,title,excerpt,content,heroImage,published,publishedAt,createdAt,updatedAt&published=eq.1&order=publishedAt.desc"), {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      });
      if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch blog posts" });
      return res.json();
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
        const res = await fetch(joinUrl(BLOG_SUPABASE_URL, `rest/v1/blog_posts?select=id,slug,title,excerpt,content,heroImage,published,publishedAt,createdAt,updatedAt&slug=eq.${encodeURIComponent(input.slug)}&limit=1`), {
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        });
        if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch blog post" });
        const rows = await res.json();
        return rows.length > 0 ? rows[0] : null;
      }),

    // List ALL posts including drafts (admin only)
    listAll: publicProcedure
      .input(z.object({ password: z.string() }))
      .query(async ({ input }) => {
        if (!isAuthorized(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
        const res = await fetch(joinUrl(BLOG_SUPABASE_URL, "rest/v1/blog_posts?select=id,slug,title,excerpt,content,heroImage,published,publishedAt,createdAt,updatedAt&order=updatedAt.desc"), {
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        });
        if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch blog posts" });
        return res.json();
      }),

    // Create a new blog post
    create: publicProcedure
      .input(z.object({
        password: z.string(),
        slug: z.string(),
        title: z.string(),
        excerpt: z.string().optional(),
        content: z.string(),
        heroImage: z.string().optional(),
        published: z.number().optional().default(0),
      }))
      .mutation(async ({ input }) => {
        if (!isAuthorized(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
        const now = new Date().toISOString();
        const post = {
          slug: input.slug,
          title: input.title,
          excerpt: input.excerpt || "",
          content: input.content,
          heroImage: input.heroImage || "",
          published: input.published,
          publishedAt: input.published === 1 ? now : null,
          createdAt: now,
          updatedAt: now,
        };
        const res = await fetch(joinUrl(BLOG_SUPABASE_URL, "rest/v1/blog_posts"), {
          method: "POST",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(post),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to create blog post: ${errText}` });
        }
        const rows = await res.json();
        return rows[0] || post;
      }),

    // Update an existing blog post by id
    update: publicProcedure
      .input(z.object({
        password: z.string(),
        id: z.number(),
        slug: z.string().optional(),
        title: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        heroImage: z.string().optional(),
        published: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        if (!isAuthorized(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
        const { password, id, ...updates } = input;
        const body: Record<string, any> = { ...updates, updatedAt: new Date().toISOString() };
        // If publishing for the first time, set publishedAt
        if (updates.published === 1) {
          body.publishedAt = new Date().toISOString();
        }
        const res = await fetch(joinUrl(BLOG_SUPABASE_URL, `rest/v1/blog_posts?id=eq.${id}`), {
          method: "PATCH",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to update blog post: ${errText}` });
        }
        const rows = await res.json();
        return rows[0] || null;
      }),

    // Delete a blog post by id
    delete: publicProcedure
      .input(z.object({
        password: z.string(),
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        if (!isAuthorized(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
        const res = await fetch(joinUrl(BLOG_SUPABASE_URL, `rest/v1/blog_posts?id=eq.${input.id}`), {
          method: "DELETE",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        });
        if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete blog post" });
        return { success: true };
      }),

    // Toggle publish status
    togglePublish: publicProcedure
      .input(z.object({
        password: z.string(),
        id: z.number(),
        published: z.number(),
      }))
      .mutation(async ({ input }) => {
        if (!isAuthorized(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
        const now = new Date().toISOString();
        const body: Record<string, any> = { published: input.published, updatedAt: now };
        if (input.published === 1) body.publishedAt = now;
        const res = await fetch(joinUrl(BLOG_SUPABASE_URL, `rest/v1/blog_posts?id=eq.${input.id}`), {
          method: "PATCH",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to toggle publish" });
        const rows = await res.json();
        return rows[0] || null;
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
        if (!isAuthorized(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
        const postsWithDefaults = input.posts.map(p => ({ ...p, published: 1, publishedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
        const res = await fetch(joinUrl(BLOG_SUPABASE_URL, "rest/v1/blog_posts"), {
          method: "POST",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify(postsWithDefaults),
        });
        if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to seed blog posts" });
        return { success: true };
      }),
  }),

  // Products for sales page
  products: router({
    list: publicProcedure.query(async () => {
      const productList = await getAllProducts();
      return productList;
    }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = await getProductBySlug(input.slug);
        return product;
      }),
    
    seed: publicProcedure
      .input(z.object({
        password: z.string(),
        products: z.array(z.object({
          slug: z.string(),
          name: z.string(),
          description: z.string().optional(),
          price: z.number(),
          priceMax: z.number().optional(),
          image: z.string().optional(),
          category: z.string().optional(),
          status: z.string().optional(),
          details: z.string().optional(),
          sortOrder: z.number().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        if (!isAdminPassword(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        await seedProducts(input.products);
        return { success: true };
      }),
  }),

  // Contact form
  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        subject: z.string().optional(),
        projectType: z.string().optional(),
        message: z.string().min(10, "Message must be at least 10 characters"),
      }))
      .mutation(async ({ input }) => {
        const { sendContactFormEmail, sendContactAutoReply, isEmailConfigured } = await import("./email");
        const { notifyOwner } = await import("./_core/notification");
        
        // Try SendGrid first if configured
        if (isEmailConfigured()) {
          try {
            // Send email to Allen
            const emailSent = await sendContactFormEmail({
              name: input.name,
              email: input.email,
              subject: input.subject || "Website Inquiry",
              message: input.message,
              projectType: input.projectType,
            });
            
            if (emailSent) {
              // Send auto-reply to the person who submitted the form
              await sendContactAutoReply({
                name: input.name,
                email: input.email,
              });
              
              return { success: true };
            }
          } catch (emailError) {
            console.error("[Contact] SendGrid failed, falling back to notification:", emailError);
          }
        }
        
        // Fallback to owner notification if SendGrid fails or isn't configured
        const title = `New Contact Form Submission from ${input.name}`;
        const content = `
**Name:** ${input.name}
**Email:** ${input.email}
${input.projectType ? `**Project Type:** ${input.projectType}` : ""}
${input.subject ? `**Subject:** ${input.subject}` : ""}

**Message:**
${input.message}

---
*Submitted via allenhenson.com contact form*
        `.trim();
        
        const success = await notifyOwner({ title, content });
        
        if (!success) {
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "Failed to send message. Please try again or email directly." 
          });
        }
        
        return { success: true };
      }),
  }),

  // Stripe checkout
  syncSheet: syncSheetRouter,

  checkout: router({
    createSession: publicProcedure
      .input(z.object({
        productSlug: z.string(),
        variantId: z.string().optional(),
        customerEmail: z.string().email().optional(),
        customerName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const origin = ctx.req.headers.origin || "https://www.allenhenson.com";
        const userId = ctx.user?.id;
        
        const result = await createCheckoutSession(
          input.productSlug,
          input.variantId,
          input.customerEmail || ctx.user?.email || undefined,
          input.customerName || ctx.user?.name || undefined,
          userId,
          origin
        );
        
        return result;
      }),
    
    getOrder: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const order = await getOrderBySessionId(input.sessionId);
        return order;
      }),
  }),
});

export type AppRouter = typeof appRouter;
