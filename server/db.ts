import { eq, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, imageOrders, InsertImageOrder, blogPosts, InsertBlogPost, BlogPost, products, InsertProduct, Product } from "../drizzle/schema";
import { ENV } from './_core/env';
import type { GalleryKey } from "../shared/const";
import { logErrorCauseChain } from "./_core/errorDetail";

let _db: ReturnType<typeof drizzle> | null = null;

export class DatabaseUnavailableError extends Error {
  readonly code = "DB_UNAVAILABLE";

  constructor(message: string) {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

function parseDsnSummary(databaseUrl: string): { host: string; port: string; user: string; db: string; ssl: string } {
  const parsed = new URL(databaseUrl);
  const host = parsed.hostname || "<unknown>";
  const port = parsed.port || "5432";
  const user = parsed.username ? decodeURIComponent(parsed.username) : "<unknown>";
  const db = parsed.pathname.replace(/^\//, "") || "<unknown>";
  const ssl = parsed.searchParams.get("sslmode") ?? parsed.searchParams.get("ssl") ?? "require";
  return { host, port, user, db, ssl };
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { ssl: 'require' });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function probeDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("[Database] DATABASE_URL is not set; skipping connectivity probe");
    return;
  }

  try {
    const summary = parseDsnSummary(databaseUrl);
    console.log(`[Database] DSN host=${summary.host} port=${summary.port} user=${summary.user} db=${summary.db} ssl=${summary.ssl}`);
  } catch {
    console.warn("[Database] DSN could not be parsed safely");
  }

  try {
    const db = await getDb();
    if (!db) {
      throw new DatabaseUnavailableError("Database client is not available");
    }
    await db.execute(sql`select 1`);
    console.log("[Database] connectivity OK");
  } catch (error) {
    logErrorCauseChain("[Database] connectivity probe failed", error);
  }
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

    // Postgres uses onConflictDoUpdate instead of onDuplicateKeyUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
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
export async function getImageOrderFromDb(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, gallery: GalleryKey) {
  const result = await db
    .select()
    .from(imageOrders)
    .where(eq(imageOrders.gallery, gallery))
    .orderBy(desc(imageOrders.updatedAt), desc(imageOrders.id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getImageOrder(gallery: GalleryKey) {
  const db = await getDb();
  if (!db) {
    throw new DatabaseUnavailableError(`[Database] Cannot get image order for "${gallery}": database not available`);
  }

  return getImageOrderFromDb(db, gallery);
}

export async function saveImageOrderToDb(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  gallery: GalleryKey,
  order: string[]
) {
  const orderJson = JSON.stringify(order);

  await db.insert(imageOrders).values({ gallery, imageOrder: orderJson }).onConflictDoUpdate({
    target: imageOrders.gallery,
    set: {
      imageOrder: orderJson,
      updatedAt: new Date(),
    },
  });

  return { success: true as const };
}

export async function saveImageOrder(gallery: GalleryKey, order: string[]) {
  const db = await getDb();
  if (!db) {
    throw new DatabaseUnavailableError(`[Database] Cannot save image order for "${gallery}": database not available`);
  }

  return saveImageOrderToDb(db, gallery, order);
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
