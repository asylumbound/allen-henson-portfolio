# 03 — Supabase Database Preparation
**Allen Henson Portfolio — Phase 2 Migration Preparation**
**Audit date:** 2026-05-02
**Current DB:** TiDB Cloud (MySQL) at `gateway03.us-east-1.prod.aws.tidbcloud.com`
**Target DB:** Supabase PostgreSQL (`frgdgcpmrshimyxsamdr`)

---

## 1. Current State Assessment

### 1.1 ORM & Schema Layer

| File | Purpose | Status |
|---|---|---|
| `drizzle/schema.ts` | Table definitions (PostgreSQL dialect) | ✅ PostgreSQL-ready |
| `drizzle/relations.ts` | Drizzle relational queries | Empty — no FK relations declared |
| `drizzle/0000_good_bishop.sql` | Initial migration SQL | ✅ Pure PostgreSQL syntax |
| `drizzle/meta/_journal.json` | Drizzle Kit migration journal | 1 migration (`0000_good_bishop`) |
| `drizzle.config.ts` | Drizzle Kit config | ✅ Reads `DATABASE_URL`, PostgreSQL dialect |
| `server/db.ts` | Database query layer | Uses `drizzle-orm/postgres-js` + `postgres` driver |

**Critical finding:** The ORM is configured for **PostgreSQL** (`drizzle-orm/pg-core`, `postgres-js` driver), but the **live `DATABASE_URL` points to TiDB Cloud (MySQL)** on `gateway03.us-east-1.prod.aws.tidbcloud.com` (confirmed from `.manus/db/` query files which show `mysql --host gateway03.us-east-1.prod.aws.tidbcloud.com`). This is a **wire-protocol mismatch** — the app is sending PostgreSQL wire protocol to a MySQL server, meaning the live database is likely non-functional or the tables were created by running the SQL directly in TiDB.

### 1.2 Live Data Snapshot

From `.manus/db/db-query-1770979134803.json` (row counts as of ~2026-05-01):

| Table | Row count | Notes |
|---|---|---|
| `products` | 0 | Not yet seeded; `productImages.ts` is the source of truth |
| `orders` | 7 | 7 Stripe orders — **must be preserved** |
| `users` | 1 | 1 admin user (Manus OpenId format) |
| `image_orders` | 1 | 1 gallery ordering record (photos or journal) |
| `blog_posts` | 20 | 20 posts seeded — **must be preserved** |

### 1.3 Migration Setup Status

- ✅ Drizzle Kit is installed (`drizzle-kit` in `devDependencies`)
- ✅ One migration exists: `drizzle/0000_good_bishop.sql`
- ✅ Schema uses PostgreSQL-specific types (`pgTable`, `pgEnum`, `serial`, `timestamp`)
- ❌ `DATABASE_URL` currently points to MySQL — must be updated to Supabase PostgreSQL connection string
- ❌ `drizzle.config.ts` will throw if `DATABASE_URL` is not set

---

## 2. Current Tables

### `users`
```sql
CREATE TABLE "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "openId" varchar(64) NOT NULL UNIQUE,    -- Manus OAuth identifier
  "name" text,
  "email" varchar(320),
  "loginMethod" varchar(64),
  "role" "role" DEFAULT 'user' NOT NULL,   -- pgEnum: 'user' | 'admin'
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "lastSignedIn" timestamp DEFAULT now() NOT NULL
);
```
> **Migration note:** `openId` stores the Manus OAuth sub. After migrating auth to Supabase, this should store the Supabase `auth.users.id` (UUID). The 1 existing user will need their `openId` updated.

### `image_orders`
```sql
CREATE TABLE "image_orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "gallery" varchar(50) NOT NULL,      -- 'photos' | 'journal' | 'product-photography'
  "imageOrder" text NOT NULL,          -- JSON array of image path strings
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
```
> **Migration note:** `imageOrder` stores local `/images/...` paths. After bucket migration, stored paths must be updated to Supabase CDN URLs.

### `blog_posts`
```sql
CREATE TABLE "blog_posts" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" varchar(255) NOT NULL UNIQUE,
  "title" varchar(500) NOT NULL,
  "excerpt" text,
  "content" text NOT NULL,
  "heroImage" varchar(500),            -- relative or absolute image URL
  "published" integer DEFAULT 1 NOT NULL,  -- 1=published, 0=draft
  "publishedAt" timestamp DEFAULT now() NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
```
> **Migration note:** 20 rows exist. `heroImage` stores relative paths like `/images/L1009868.jpg`. After asset migration, must update all 20 rows with Supabase CDN URLs.

### `products`
```sql
CREATE TABLE "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" varchar(255) NOT NULL UNIQUE,
  "name" varchar(500) NOT NULL,
  "description" text,
  "price" integer NOT NULL,          -- cents
  "priceMax" integer,
  "image" varchar(500),              -- primary image URL
  "category" varchar(100),           -- 'book' | 'print' | 'boxset'
  "status" varchar(50) DEFAULT 'available',
  "details" text,
  "galleryImages" text,              -- JSON array of image URLs
  "sortOrder" integer DEFAULT 0,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
```
> **Migration note:** Currently 0 rows. Products exist only in code (`productImages.ts`). Needs seeding with product data from `full-catalog.md` / `product-audit.md`.

### `orders`
```sql
CREATE TABLE "orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer,
  "stripeSessionId" varchar(255) NOT NULL UNIQUE,
  "stripePaymentIntentId" varchar(255),
  "customerEmail" varchar(320) NOT NULL,
  "customerName" varchar(255),
  "productSlug" varchar(255) NOT NULL,
  "productName" varchar(500) NOT NULL,
  "amount" integer NOT NULL,         -- cents
  "currency" varchar(10) DEFAULT 'usd' NOT NULL,
  "status" varchar(50) DEFAULT 'pending' NOT NULL,
  "shippingAddress" text,            -- JSON string
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
```
> **Migration note:** 7 real orders exist — **must be exported and re-imported** to Supabase.

---

## 3. Required Supabase Tables

The Supabase PostgreSQL instance (`frgdgcpmrshimyxsamdr`) needs all 5 tables. The existing `drizzle/0000_good_bishop.sql` can be run directly to create them.

### SQL Schema for Supabase

Run the following SQL in the Supabase SQL Editor (or via `pnpm drizzle-kit push` after setting `DATABASE_URL` to the Supabase connection string):

```sql
-- Create role enum
CREATE TYPE "public"."role" AS ENUM('user', 'admin');

-- users
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "openId" varchar(64) NOT NULL,
  "name" text,
  "email" varchar(320),
  "loginMethod" varchar(64),
  "role" "role" DEFAULT 'user' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "lastSignedIn" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_openId_unique" UNIQUE("openId")
);

-- image_orders
CREATE TABLE IF NOT EXISTS "image_orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "gallery" varchar(50) NOT NULL,
  "imageOrder" text NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- blog_posts
CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" varchar(255) NOT NULL,
  "title" varchar(500) NOT NULL,
  "excerpt" text,
  "content" text NOT NULL,
  "heroImage" varchar(500),
  "published" integer DEFAULT 1 NOT NULL,
  "publishedAt" timestamp DEFAULT now() NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);

-- products
CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" varchar(255) NOT NULL,
  "name" varchar(500) NOT NULL,
  "description" text,
  "price" integer NOT NULL,
  "priceMax" integer,
  "image" varchar(500),
  "category" varchar(100),
  "status" varchar(50) DEFAULT 'available',
  "details" text,
  "galleryImages" text,
  "sortOrder" integer DEFAULT 0,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "products_slug_unique" UNIQUE("slug")
);

-- orders
CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer,
  "stripeSessionId" varchar(255) NOT NULL,
  "stripePaymentIntentId" varchar(255),
  "customerEmail" varchar(320) NOT NULL,
  "customerName" varchar(255),
  "productSlug" varchar(255) NOT NULL,
  "productName" varchar(500) NOT NULL,
  "amount" integer NOT NULL,
  "currency" varchar(10) DEFAULT 'usd' NOT NULL,
  "status" varchar(50) DEFAULT 'pending' NOT NULL,
  "shippingAddress" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "orders_stripeSessionId_unique" UNIQUE("stripeSessionId")
);
```

---

## 4. Migration Process

### Step 1 — Export from TiDB

Export current live data from TiDB via the `.manus/db/` query results or a direct MySQL dump:

```bash
# Export blog_posts (20 rows)
mysqldump --host gateway03.us-east-1.prod.aws.tidbcloud.com \
  --port 4000 --user 2QmWxs7iH8DQva8.399ef5379b66 \
  --database hJWfWNqWwMf8C4JGAEuS5b \
  --tables blog_posts orders users image_orders \
  > /tmp/tidb-export.sql
```

### Step 2 — Convert MySQL → PostgreSQL

MySQL and PostgreSQL differ in dump format. Key differences to fix:
- `\`` backtick identifiers → `"` double-quote identifiers
- `AUTO_INCREMENT` → `SERIAL` (already handled by Drizzle schema)
- MySQL `datetime` → PostgreSQL `timestamp`
- Boolean representation may differ

Use `pgloader` or manual SQL conversion.

### Step 3 — Apply Schema to Supabase

```bash
# Set DATABASE_URL to Supabase Transaction Pooler URL
export DATABASE_URL="postgresql://postgres.frgdgcpmrshimyxsamdr:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"

# Push schema (creates tables)
pnpm drizzle-kit push
# OR run the SQL above directly in Supabase SQL Editor
```

### Step 4 — Import Data

```sql
-- Import orders (7 rows — revenue records, must preserve)
INSERT INTO orders (...) VALUES (...);

-- Import blog_posts (20 rows)
INSERT INTO blog_posts (...) VALUES (...);

-- Import users (1 row — note: openId will need update for Supabase auth)
INSERT INTO users (...) VALUES (...);

-- Import image_orders (1 row)
INSERT INTO image_orders (...) VALUES (...);
```

### Step 5 — Update Asset URLs

After storage migration, update DB paths:

```sql
-- Update blog hero image paths to Supabase Storage URLs
UPDATE blog_posts
SET "heroImage" = REPLACE("heroImage",
  '/images/',
  'https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/app-assets/blog/'
)
WHERE "heroImage" LIKE '/images/%';

-- Update image_orders (imageOrder is JSON — use jsonb operations or app-level update)
-- Note: imageOrder stores JSON arrays; requires app-level migration script
```

---

## 5. DATABASE_URL Migration Risks

| Risk | Severity | Details |
|---|---|---|
| Driver mismatch (PostgreSQL code → MySQL DB) | 🔴 CRITICAL | `server/db.ts` uses `postgres-js` driver; TiDB responds on port 4000 (MySQL protocol). Real queries may be failing silently. |
| TiDB → PostgreSQL SQL differences | 🟡 MEDIUM | `serial` primary keys, `timestamp` defaults, enum types differ between MySQL and PostgreSQL. Schema SQL must be reviewed. |
| `openId` format change | 🟡 MEDIUM | Manus OAuth `openId` in `users.openId` will not match Supabase `auth.users.id` (UUID format). The 1 existing user record must be updated. |
| `image_orders.imageOrder` path invalidation | 🟡 MEDIUM | Stored JSON arrays contain `/images/...` local paths. After bucket migration, all stored paths become invalid. |
| `blog_posts.heroImage` path invalidation | 🟡 MEDIUM | 20 rows store relative `/images/...` paths. Must update all rows to Supabase CDN URLs post-migration. |
| Missing `products` data | 🟡 MEDIUM | 0 products in DB — products page reads from DB. Must seed products before DB goes live. |
| Transaction Pooler vs Direct connection | 🟡 MEDIUM | Supabase recommends Transaction Pooler (port 6543) for serverless/Railway. Direct connection (port 5432) may cause connection limit issues. |
| `ssl: 'require'` in `server/db.ts:13` | ✅ OK | Supabase requires SSL; existing code already sets `ssl: 'require'`. |
| Drizzle push vs migrate | 🟡 LOW | `drizzle-kit push` for initial setup is fine; should switch to `drizzle-kit migrate` for production going forward. |

---

## 6. Environment Variable Changes Required

| Variable | Current value | Required new value |
|---|---|---|
| `DATABASE_URL` | `mysql://2QmWxs7iH8DQva8...@gateway03.us-east-1.prod.aws.tidbcloud.com:4000/hJWfWNqWwMf8C4JGAEuS5b` | `postgresql://postgres.frgdgcpmrshimyxsamdr:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` |
| `SUPABASE_URL` | Not set (uses hardcoded fallback in `dukeEditor.ts`) | `https://frgdgcpmrshimyxsamdr.supabase.co` |
| `VITE_SUPABASE_URL` | `https://frgdgcpmrshimyxsamdr.supabase.co` | ✅ Already correct |

---

## 7. Validation Tests

After switching `DATABASE_URL` to Supabase:

1. **Health check:** `GET /api/trpc/system.health` — should return `{ status: 'ok' }`
2. **Blog posts load:** `GET /blog` — should render 20 posts
3. **Image orders persist:** Save gallery order in `/edit`, reload — order should be preserved
4. **Orders preserved:** Query `SELECT COUNT(*) FROM orders` — should return 7
5. **Auth flow:** Login via Supabase email/password, confirm DB user is created/updated
6. **Product pages:** After product seeding, `GET /sales` should list products
7. **Drizzle migrations run cleanly:** `pnpm drizzle-kit status` should show no pending migrations
