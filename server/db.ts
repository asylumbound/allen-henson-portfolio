import { eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, imageOrders, InsertImageOrder, blogPosts, InsertBlogPost, BlogPost, products, InsertProduct, Product } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Image order queries
export async function getImageOrder(gallery: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get image order: database not available");
    return null;
  }

  const result = await db.select().from(imageOrders).where(eq(imageOrders.gallery, gallery)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function saveImageOrder(gallery: string, order: string[]) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save image order: database not available");
    return null;
  }

  const orderJson = JSON.stringify(order);
  
  // Check if record exists
  const existing = await db.select().from(imageOrders).where(eq(imageOrders.gallery, gallery)).limit(1);
  
  if (existing.length > 0) {
    await db.update(imageOrders).set({ imageOrder: orderJson }).where(eq(imageOrders.gallery, gallery));
  } else {
    await db.insert(imageOrders).values({ gallery, imageOrder: orderJson });
  }
  
  return { success: true };
}

// Blog post queries
export async function getAllBlogPosts() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get blog posts: database not available");
    return [];
  }

  const result = await db.select().from(blogPosts).where(eq(blogPosts.published, 1)).orderBy(desc(blogPosts.publishedAt));
  return result;
}

export async function getBlogPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get blog post: database not available");
    return null;
  }

  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createBlogPost(post: InsertBlogPost) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create blog post: database not available");
    return null;
  }

  await db.insert(blogPosts).values(post);
  return { success: true };
}

export async function seedBlogPosts(posts: InsertBlogPost[]) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot seed blog posts: database not available");
    return null;
  }

  // Check if posts already exist
  const existing = await db.select().from(blogPosts).limit(1);
  if (existing.length > 0) {
    return { success: true, message: "Posts already seeded" };
  }

  await db.insert(blogPosts).values(posts);
  return { success: true };
}

// Product queries
export async function getAllProducts() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get products: database not available");
    return [];
  }

  const result = await db.select().from(products).orderBy(asc(products.sortOrder));
  return result;
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get product: database not available");
    return null;
  }

  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function seedProducts(productList: InsertProduct[]) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot seed products: database not available");
    return null;
  }

  // Check if products already exist
  const existing = await db.select().from(products).limit(1);
  if (existing.length > 0) {
    return { success: true, message: "Products already seeded" };
  }

  await db.insert(products).values(productList);
  return { success: true };
}
