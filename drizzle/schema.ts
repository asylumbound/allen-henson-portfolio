import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Image order table for storing gallery image ordering
export const imageOrders = pgTable("image_orders", {
  id: serial("id").primaryKey(),
  gallery: varchar("gallery", { length: 50 }).notNull().unique(), // Supported gallery key
  imageOrder: text("imageOrder").notNull(), // JSON array of image paths in order
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ImageOrder = typeof imageOrders.$inferSelect;
export type InsertImageOrder = typeof imageOrders.$inferInsert;

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  heroImage: varchar("heroImage", { length: 500 }),
  published: integer("published").default(1).notNull(), // 1 = published, 0 = draft
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// Products table for sales
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in cents
  priceMax: integer("priceMax"), // For price ranges (e.g., $2,690 - $5,550)
  image: varchar("image", { length: 500 }),
  category: varchar("category", { length: 100 }), // 'book', 'print', 'boxset'
  status: varchar("status", { length: 50 }).default("available"), // 'available', 'presale', 'sold_out', 'in_production'
  details: text("details"), // Additional product details (size options, materials, etc.)
  galleryImages: text("galleryImages"), // JSON array of additional image URLs for gallery
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Orders table for tracking Stripe purchases
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId"), // Optional - for logged in users
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).notNull().unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  productSlug: varchar("productSlug", { length: 255 }).notNull(),
  productName: varchar("productName", { length: 500 }).notNull(),
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 10 }).default("usd").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, paid, fulfilled, cancelled
  shippingAddress: text("shippingAddress"), // JSON string of shipping details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
