import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getImageOrder, saveImageOrder, getAllBlogPosts, getBlogPostBySlug, seedBlogPosts, getAllProducts, getProductBySlug, seedProducts } from "./db";
import { TRPCError } from "@trpc/server";
import { createCheckoutSession, getOrderBySessionId } from "./stripe";
import { storagePut } from "./storage";
import { generateResponsiveImages } from "./imageProcessing";
import { generateAltText } from "./altTextGenerator";

// Admin password for the /edit page
const ADMIN_PASSWORD = "&&77VAnguard";

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
        if (input.password === ADMIN_PASSWORD) {
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
        gallery: z.enum(["photos", "journal", "product-photography"]),
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded
        contentType: z.string(),
        password: z.string(),
        generateResponsive: z.boolean().optional().default(true), // Auto-generate responsive variants
      }))
      .mutation(async ({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
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
        if (input.generateResponsive && (input.contentType === "image/webp" || input.contentType === "image/jpeg" || input.contentType === "image/png")) {
          try {
            // Generate responsive images (400w, 800w, 1200w) + original
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
            };
          } catch (error) {
            console.error("Failed to generate responsive images, falling back to single upload:", error);
            // Fall through to single upload
          }
        }
        
        // Fallback: Upload single image without responsive variants
        const extension = input.contentType === "image/webp" ? ".webp" : 
                         input.contentType === "image/png" ? ".png" : ".jpg";
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
        
        return { success: true, url, fileKey, variants: [], altText: altTextResult };
      }),
    
    // Delete an image (removes from order, actual S3 deletion optional)
    deleteImage: publicProcedure
      .input(z.object({
        gallery: z.enum(["photos", "journal", "product-photography"]),
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
      .input(z.object({ gallery: z.enum(["photos", "journal", "product-photography"]) }))
      .query(async ({ input }) => {
        const result = await getImageOrder(input.gallery);
        if (result) {
          return { order: JSON.parse(result.imageOrder) as string[] };
        }
        return { order: null };
      }),
    
    saveOrder: publicProcedure
      .input(z.object({
        gallery: z.enum(["photos", "journal", "product-photography"]),
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
    
    // Generate alt text for an existing image
    generateAltText: publicProcedure
      .input(z.object({
        imageUrl: z.string(),
        context: z.string().optional(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }
        
        const result = await generateAltText(input.imageUrl, input.context);
        return result;
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
