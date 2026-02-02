import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getImageOrder, saveImageOrder, getAllBlogPosts, getBlogPostBySlug, seedBlogPosts, getAllProducts, getProductBySlug, seedProducts } from "./db";
import { TRPCError } from "@trpc/server";
import { createCheckoutSession, getOrderBySessionId } from "./stripe";
import { storagePut } from "./storage";

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

  // Image management (upload, delete, reorder)
  gallery: router({
    // Upload a new image to S3
    uploadImage: publicProcedure
      .input(z.object({
        gallery: z.enum(["photos", "journal"]),
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded
        contentType: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        
        // Decode base64 to buffer
        const buffer = Buffer.from(input.fileData, "base64");
        
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const cleanFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
        const fileKey = `gallery/${input.gallery}/${timestamp}-${cleanFileName}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.contentType);
        
        return { success: true, url, fileKey };
      }),
    
    // Delete an image (removes from order, actual S3 deletion optional)
    deleteImage: publicProcedure
      .input(z.object({
        gallery: z.enum(["photos", "journal"]),
        imageSrc: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        
        // Get current order
        const currentOrder = await getImageOrder(input.gallery);
        if (currentOrder) {
          const order = JSON.parse(currentOrder.imageOrder) as string[];
          const newOrder = order.filter(src => src !== input.imageSrc);
          await saveImageOrder(input.gallery, newOrder);
        }
        
        return { success: true };
      }),

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
        if (input.password !== ADMIN_PASSWORD) {
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
        message: z.string().min(10, "Message must be at least 10 characters"),
      }))
      .mutation(async ({ input }) => {
        const { notifyOwner } = await import("./_core/notification");
        
        const title = `New Contact Form Submission from ${input.name}`;
        const content = `
**Name:** ${input.name}
**Email:** ${input.email}

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
