# 03 — Supabase Database Preparation
**Allen Henson Portfolio — Migration Preparation**
**Branch:** `copilot/sandboxrailway-edit`
**Prepared:** 2026-05-02

---

## Overview

This document covers database preparation steps needed before and after migrating from TiDB Cloud (MySQL) to Supabase PostgreSQL. The application's Drizzle schema is already written in pure PostgreSQL, making the schema migration straightforward.

---

## 1. Current State

| Item | Status |
|---|---|
| ORM | Drizzle ORM v0.44.5 |
| Driver | `postgres` npm v3.4.8 (PostgreSQL wire protocol) |
| `DATABASE_URL` target | TiDB Cloud — MySQL, port 4000 — **INCOMPATIBLE** |
| Effective DB state | **Non-functional** — all DB operations fail silently |
| Schema dialect | `postgresql` — ready for Supabase ✅ |
| Migration SQL | `drizzle/0000_good_bishop.sql` — pure Postgres ✅ |

---

## 2. Required Steps to Connect Supabase PostgreSQL

### Step 1: Get Supabase connection string

In the Supabase Dashboard → Project `frgdgcpmrshimyxsamdr` → Settings → Database → Connection string:

Use the **Transaction Pooler** URL (port 6543) for serverless/edge:
```
postgres://postgres.frgdgcpmrshimyxsamdr:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Or **Direct Connection** (port 5432) for long-lived server:
```
postgresql://postgres:[PASSWORD]@db.frgdgcpmrshimyxsamdr.supabase.co:5432/postgres
```

For Railway deployment with a persistent Express server, use the **direct connection** (port 5432).

### Step 2: Set Railway environment variable

```bash
# In Railway dashboard or CLI:
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.frgdgcpmrshimyxsamdr.supabase.co:5432/postgres
```

### Step 3: Run schema migration

```bash
pnpm db:push
# Runs: drizzle-kit generate && drizzle-kit migrate
```

This will create all tables in the Supabase PostgreSQL database.

---

## 3. Schema Tables to Create

The migration SQL at `drizzle/0000_good_bishop.sql` creates:

```sql
CREATE TYPE "public"."role" AS ENUM('user', 'admin');

CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
  "openId" varchar(64) NOT NULL UNIQUE,
  "name" text,
  "email" varchar(320),
  "loginMethod" varchar(64),
  "role" "role" DEFAULT 'user' NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now(),
  "lastSignedIn" timestamp DEFAULT now()
);

CREATE TABLE "image_orders" (
  "id" serial PRIMARY KEY,
  "gallery" varchar(50) NOT NULL,
  "imageOrder" text NOT NULL,
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE "blog_posts" (
  "id" serial PRIMARY KEY,
  "slug" varchar(255) NOT NULL UNIQUE,
  "title" varchar(500) NOT NULL,
  "excerpt" text,
  "content" text NOT NULL,
  "heroImage" varchar(500),
  "published" integer DEFAULT 1 NOT NULL,
  "publishedAt" timestamp DEFAULT now(),
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE "products" (
  "id" serial PRIMARY KEY,
  "slug" varchar(255) NOT NULL UNIQUE,
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
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE "orders" (
  "id" serial PRIMARY KEY,
  "userId" integer,
  "stripeSessionId" varchar(255) NOT NULL UNIQUE,
  "stripePaymentIntentId" varchar(255),
  "customerEmail" varchar(320) NOT NULL,
  "customerName" varchar(255),
  "productSlug" varchar(255) NOT NULL,
  "productName" varchar(500) NOT NULL,
  "amount" integer NOT NULL,
  "currency" varchar(10) DEFAULT 'usd',
  "status" varchar(50) DEFAULT 'pending',
  "shippingAddress" text,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);
```

---

## 4. Post-Migration Fixes Required

### 4a. Fix Admin Role Assignment

Current `OWNER_OPEN_ID` value is a Manus OAuth ID (`eVUiibodwAkat77ZQkBy9z`), not a Supabase UUID. Admin assignment is broken.

**Fix option 1 — Update env var:**
1. Find Allen's Supabase UUID: Supabase Dashboard → Authentication → Users
2. Set `OWNER_OPEN_ID=<supabase-uuid>` in Railway

**Fix option 2 — Direct SQL after user first login:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'allen@allenhenson.com';
```

### 4b. Seed Initial Data

After schema migration, seed blog posts and products:
```bash
# Via tRPC endpoints (password protected):
# POST /api/trpc/blog.seed   — with admin password
# POST /api/trpc/products.seed — with admin password

# Or via scripts:
node scripts/seed-blog.mjs
```

### 4c. Set Initial Image Orders

Gallery image orders are stored as JSON text in `image_orders`. They will be empty until set via the admin gallery editor (`/edit`) or seeded manually.

---

## 5. Row Level Security (RLS) Considerations

The app uses Drizzle ORM via the **service role** Supabase client (`server/_core/supabase.ts`), which bypasses RLS. This is acceptable for server-side operations.

However, if direct table access via `VITE_SUPABASE_ANON_KEY` is ever added, RLS policies must be configured:

```sql
-- Users can read their own record
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid()::text = "openId");

-- Blog posts are publicly readable when published
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_public_read" ON blog_posts FOR SELECT USING (published = 1);

-- Products are publicly readable
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON products FOR SELECT TO anon USING (true);
```

**For now:** No RLS changes needed. The server-side service role bypasses all RLS.

---

## 6. Validation Checklist (Post DB Migration)

- [ ] `DATABASE_URL` updated to Supabase PostgreSQL URL in Railway
- [ ] `pnpm db:push` runs without errors
- [ ] Server starts without `[Database] Failed to connect` errors
- [ ] `GET /api/trpc/system.health` returns `{ status: 'ok' }`
- [ ] `GET /api/trpc/blog.list` returns data (after seeding)
- [ ] `GET /api/trpc/products.list` returns data (after seeding)
- [ ] Admin login at `/login` works with Supabase email/password
- [ ] `OWNER_OPEN_ID` updated to correct Supabase UUID
- [ ] Stripe checkout creates order record in `orders` table
