# 00 — Current Architecture Audit
**Allen Henson Portfolio — Migration Preparation**
**Branch audited:** `copilot/sandboxrailway-edit`
**Audit date:** 2026-05-02
**Prepared for:** Migration away from Manus dependencies toward Supabase-owned database, auth, and storage.

---

## 1. Executive Summary

**What this app is:**
Allen Henson Photography Portfolio — a full-stack TypeScript monorepo serving a public-facing portfolio site (photography, video, blog, sales) with an admin panel for gallery editing, product management, and blog authoring. It includes a Stripe-powered fine-art print sales system.

**Current deployment model:**
Single Express.js process serving both the API and the pre-built React frontend. Deployed to Railway. Build output at `dist/`.

**Architecture:**
- **Frontend:** React 19, Vite 7, TailwindCSS v4, Wouter routing, tRPC client
- **Backend:** Express.js 4, tRPC 11, Drizzle ORM
- **Database:** Drizzle ORM configured with `postgres-js` driver (PostgreSQL dialect) — but the live `DATABASE_URL` currently points to **TiDB Cloud (MySQL)**, creating a critical wire-protocol mismatch
- **Auth:** Supabase Auth (email/password) — Manus OAuth has been removed from the auth flow but Manus env vars remain active
- **Storage:** Manus Forge proxy (`server/storage.ts`) — **not yet migrated to Supabase Storage**
- **Payments:** Stripe (hardcoded price map + DB orders table)
- **Email:** SendGrid (order confirmations, contact form)
- **Notifications:** Manus Forge WebDevService (`server/_core/notification.ts`) — **not yet migrated**

**Architecture type:** Hybrid monolith — single deployable with Vite dev proxy in development and Express static serving in production.

**Top migration concerns:**
1. `DATABASE_URL` points to MySQL/TiDB but the code uses a PostgreSQL-only driver — the database is likely non-functional in production
2. `server/storage.ts` still calls Manus Forge for all gallery image uploads and reads
3. `server/_core/notification.ts` calls the Manus `WebDevService/SendNotification` endpoint
4. `STRIPE_PUBLISHABLE_KEY_LIVE` env var contains an actual **live secret key** (`sk_live_`), not a publishable key — severe security exposure
5. Manus Forge API key is leaked to the client bundle via `VITE_FRONTEND_FORGE_API_KEY`
6. Admin gallery operations are protected only by a hardcoded plaintext password in `server/routers.ts`
7. `VITE_APP_LOGO` references `files.manuscdn.com` — Manus CDN logo will break when Manus is decommissioned

---

## 2. Repository Structure

```
allen-henson-portfolio/
├── client/
│   ├── index.html                      Vite root; Umami analytics script tags
│   ├── public/
│   │   ├── images/                     Static portfolio images (duke, AH-Icon, etc.)
│   │   └── __manus__/
│   │       └── debug-collector.js      MANUS: browser debug/analytics collector
│   └── src/
│       ├── main.tsx                    React 19 createRoot + tRPC QueryClient provider
│       ├── App.tsx                     Router (wouter Switch/Route) + providers
│       ├── pages/                      20 page components (see §3)
│       ├── components/                 33 shared components
│       │   └── ManusDialog.tsx         MANUS: dead code — never imported
│       ├── _core/hooks/
│       │   └── useAuth.ts              Supabase auth hook
│       └── lib/
│           ├── supabase.ts             Supabase JS client (uses VITE_SUPABASE_*)
│           └── trpc.ts                 tRPC client singleton
├── server/
│   ├── index.ts                        Re-exports _core/index.ts
│   ├── _core/
│   │   ├── index.ts                    Express app startup, port detection
│   │   ├── env.ts                      Central ENV object — reads all process.env
│   │   ├── context.ts                  tRPC context: Supabase JWT → DB user lookup
│   │   ├── supabase.ts                 Admin + user-scoped Supabase clients
│   │   ├── trpc.ts                     publicProcedure / protectedProcedure / adminProcedure
│   │   ├── systemRouter.ts             health + notifyOwner (Manus)
│   │   ├── oauth.ts                    Auth callback redirect (Supabase-native)
│   │   ├── notification.ts             MANUS: Forge WebDevService/SendNotification
│   │   ├── llm.ts                      MANUS: Forge LLM proxy (gemini-2.5-flash)
│   │   ├── imageGeneration.ts          MANUS: Forge image generation (dead code)
│   │   ├── dataApi.ts                  MANUS: Forge data API (dead code)
│   │   ├── voiceTranscription.ts       MANUS: Forge voice transcription (dead code)
│   │   └── map.ts                      MANUS: Forge Google Maps proxy (dead code)
│   ├── routers.ts                      All tRPC procedures
│   ├── db.ts                           Drizzle DB queries (lazy init)
│   ├── storage.ts                      MANUS: Forge file storage proxy — PRIMARY BLOCKER
│   ├── dukeEditor.ts                   Express routes; uses Supabase Storage directly ✅
│   ├── altTextGenerator.ts             AI alt text via Forge LLM
│   ├── imageProcessing.ts              Sharp resize → storagePut (Manus)
│   ├── stripe.ts                       Stripe checkout + webhook + productPrices map
│   └── email.ts                        SendGrid email (order confirm, contact form)
├── shared/
│   ├── const.ts                        Cookie name, error messages
│   ├── productVariants.ts              Product size variants + pricing (shared)
│   └── types.ts                        Shared TypeScript types
├── drizzle/
│   ├── schema.ts                       All table definitions (Postgres dialect)
│   ├── 0000_good_bishop.sql            Migration SQL
│   └── relations.ts                    Drizzle relations (empty — no FK declared)
├── drizzle.config.ts                   Drizzle Kit config — reads DATABASE_URL
├── vite.config.ts                      Vite build config; contains Manus plugins
├── package.json                        Dependencies; includes vite-plugin-manus-runtime
├── tsconfig.json                       Strict TS; paths: @/* → client/src/, @shared/* → shared/
└── scripts/                            Seed and admin utility scripts
```

---

## 3. Frontend Architecture

**Framework:** React 19 (createRoot)
**Router:** Wouter 3.x (hash-less client-side routing)
**Styling:** TailwindCSS v4 + tw-animate-css + Framer Motion

### Page Routes

| Path | Component | Layout | Access |
|---|---|---|---|
| `/` | Home | Layout (header+footer) | Public |
| `/photos` | Photos | Layout | Public |
| `/video` | Video | Layout | Public |
| `/about` | About | Layout | Public |
| `/contact` | Contact | Layout | Public |
| `/journal` | Journal | Layout | Public |
| `/blog` | Blog | Layout | Public |
| `/blog/:slug` | BlogPost | Layout | Public |
| `/sales` | Sales | Layout | Public |
| `/sales/:slug` | ProductDetail | Layout | Public |
| `/sales/success` | CheckoutSuccess | Layout | Public |
| `/product-photography` | ProductPhotography | Layout | Public |
| `/login` | Login | None (own layout) | Public |
| `/edit` | Edit | None (own layout) | ADMIN_PASSWORD |
| `/product_edit` | ProductEdit | None (own layout) | ADMIN_PASSWORD |
| `/duke` | Duke | None (own layout) | Editor password |
| `/agency` | Agency | None (own layout) | Editor password |
| `/data-security-incident-notice` | DataSecurityIncidentNotice | Layout | Public |
| `/privacy-policy` | PrivacyPolicy | Layout | Public |
| `/terms-of-service` | TermsOfService | Layout | Public |
| `/404`, `/*` | NotFound | Layout | Public |

### Private/Admin Pages
- `/edit` — gallery editor; authenticated by hardcoded `ADMIN_PASSWORD = "&&77VAnguard"` via `trpc.admin.verifyPassword`
- `/product_edit` — product editor; same password
- `/duke` — private photo collection; authenticated by hardcoded `EDITOR_PASSWORD = "&&77LEica"` in `server/dukeEditor.ts`
- `/agency` — agency database; password-protected
- `/login` — Supabase email/password login (redirects to `/edit` on success)

### Environment Variables Exposed to Frontend (VITE_*)

| Variable | Purpose | Manus? |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | No ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key | No ✅ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe test publishable key (pk_test_*) | No ✅ |
| `VITE_APP_ID` | Manus app identifier | **YES — REMOVE** |
| `VITE_OAUTH_PORTAL_URL` | `https://manus.im` — Manus OAuth portal | **YES — REMOVE** |
| `VITE_ANALYTICS_ENDPOINT` | `https://manus-analytics.com` — Manus analytics host | **YES — REMOVE** |
| `VITE_ANALYTICS_WEBSITE_ID` | Manus analytics site ID | **YES — REMOVE** |
| `VITE_APP_TITLE` | App title string | No |
| `VITE_APP_LOGO` | `https://files.manuscdn.com/...` — Manus CDN logo | **YES — REMOVE** |
| `VITE_FRONTEND_FORGE_API_URL` | Manus Forge base URL — **client-side exposure of API endpoint** | **YES — REMOVE** |
| `VITE_FRONTEND_FORGE_API_KEY` | Manus Forge API key — **client-side secret key exposure in JS bundle** | **YES — REMOVE** |

### Manus-Specific Frontend References

- `client/public/__manus__/debug-collector.js` — full Manus browser debug/analytics collector (820 lines); injected into HTML by `vitePluginManusDebugCollector()` at build time
- `client/src/components/ManusDialog.tsx` — "Login with Manus" dialog component; **never imported** — dead code
- `client/index.html:29-30` — Umami analytics script pointing to `%VITE_ANALYTICS_ENDPOINT%/umami`
- `vite.config.ts:174-178` — `allowedHosts` includes `.manuspre.computer`, `.manus.computer`, `.manus-asia.computer`, `.manuscomputer.ai`, `.manusvm.computer`

---

## 4. Backend Architecture

### Express Entrypoint (`server/_core/index.ts`)

```
startServer()
  ├── 5× webhook test handlers (Manus platform workaround — all 5 paths)
  │     POST /api/stripe/webhook
  │     POST /api/webhooks/stripe
  │     POST /api/webhooks/stripe/webhook
  │     POST /webhook
  │     POST /api/webhook
  ├── app.use("/api/stripe", stripeRouter)        Stripe checkout + real webhook
  ├── app.use("/api/duke", dukeEditorRouter)       Duke image editor
  ├── express.json({ limit: "50mb" })
  ├── express.urlencoded({ limit: "50mb" })
  ├── registerOAuthRoutes(app)                     Auth callbacks
  ├── app.use("/api/trpc", tRPC middleware)
  └── NODE_ENV=development → Vite dev server
      NODE_ENV=production  → serveStatic (dist/public)
```

Port: `process.env.PORT || 3000` with auto-increment if occupied.

### Middleware Order

1. Raw body parser (webhook paths only — `express.raw`)
2. Manus platform test webhook short-circuit (returns `{verified:true}` if no `stripe-signature`)
3. Real Stripe webhook handler (verifies signature)
4. Duke image editor routes
5. JSON + URL-encoded body parsers (50MB limit)
6. OAuth callback routes
7. tRPC middleware (context creation → Supabase JWT verification → DB user lookup)
8. Static file serving (production) or Vite dev server (development)

### OAuth/Auth Callback

- `GET /api/auth/callback` — Redirects to `{next}#code={code}`; Supabase JS client handles code exchange client-side
- `GET /api/oauth/callback` — Legacy path; redirects to `/login`
- No active Manus OAuth flow — fully replaced by Supabase

### Duke/Editor Routes (`server/dukeEditor.ts`)

- `POST /api/duke/edit-image` — Downloads from Supabase Storage / local FS, applies Sharp transforms (crop/rotate), uploads to Supabase `duke-edits` bucket
- `POST /api/duke/revert-image` — Reverts to backup in Supabase `duke-backups` bucket
- `POST /api/duke/delete-image` — Moves to `deleted/` prefix in `duke-backups` + removes from local FS
- `POST /api/duke/save-order` — Saves `order.json` to Supabase `duke-edits` bucket
- Authentication: hardcoded `EDITOR_PASSWORD = "&&77LEica"` — plaintext in source

**Note:** Duke routes already use Supabase Storage directly (not Manus Forge). This section is already migrated.

---

## 5. API / tRPC Map

All procedures are mounted at `/api/trpc`. Base router: `appRouter`.

### `system` (via systemRouter)

| Procedure | Access | Inputs | Data Touched | External Services | Risk |
|---|---|---|---|---|---|
| `system.health` | Public | `{ timestamp: number }` | None | None | Low |
| `system.notifyOwner` | **Admin** | `{ title, content }` | None | **Manus Forge WebDevService** | **HIGH — Manus dependency** |

### `auth`

| Procedure | Access | Inputs | Data Touched | External Services | Risk |
|---|---|---|---|---|---|
| `auth.me` | Public | None | `users` table (via context) | Supabase Auth | Low |
| `auth.logout` | Public | None | None (client-side) | None | Low |

### `admin`

| Procedure | Access | Inputs | Data Touched | External Services | Risk |
|---|---|---|---|---|---|
| `admin.verifyPassword` | Public | `{ password }` | None | None | **MEDIUM — plaintext password in source** |

### `gallery`

| Procedure | Access | Inputs | Data Touched | External Services | Risk |
|---|---|---|---|---|---|
| `gallery.uploadImage` | Public + password | gallery, fileName, fileData (b64), contentType, password, generateResponsive | `image_orders` | **Manus Forge storage**, Sharp, **Manus Forge LLM** (alt text) | **HIGH — Manus storage** |
| `gallery.deleteImage` | Public + password | gallery, imageSrc, password | `image_orders` | None | Medium |
| `gallery.getOrder` | Public | `{ gallery }` | `image_orders` | None | Low |
| `gallery.saveOrder` | Public + password | gallery, order[], password | `image_orders` | None | Medium |
| `gallery.generateAltText` | Public + password | imageUrl, context?, password | None | **Manus Forge LLM** | **HIGH — Manus LLM** |

### `blog`

| Procedure | Access | Inputs | Data Touched | External Services | Risk |
|---|---|---|---|---|---|
| `blog.list` | Public | None | `blog_posts` | None | Low |
| `blog.getBySlug` | Public | `{ slug }` | `blog_posts` | None | Low |
| `blog.seed` | Public + password | password, posts[] | `blog_posts` | None | Medium |

### `products`

| Procedure | Access | Inputs | Data Touched | External Services | Risk |
|---|---|---|---|---|---|
| `products.list` | Public | None | `products` | None | Low |
| `products.getBySlug` | Public | `{ slug }` | `products` | None | Low |
| `products.seed` | Public + password | password, products[] | `products` | None | Medium |

### `contact`

| Procedure | Access | Inputs | Data Touched | External Services | Risk |
|---|---|---|---|---|---|
| `contact.submit` | Public | name, email, subject?, projectType?, message | None | SendGrid (primary), **Manus Forge notification (fallback)** | **MEDIUM — Manus fallback** |

### `checkout`

| Procedure | Access | Inputs | Data Touched | External Services | Risk |
|---|---|---|---|---|---|
| `checkout.createSession` | Public | productSlug, variantId?, customerEmail?, customerName? | `orders` (insert) | Stripe API | Medium |
| `checkout.getOrder` | Public | `{ sessionId }` | `orders` (select) | Stripe API (live fetch) | Low |

---

## 6. Database Architecture

### ORM and Driver

- **ORM:** Drizzle ORM (`drizzle-orm` v0.44.5)
- **DB Adapter:** `drizzle-orm/postgres-js` (PostgreSQL-only)
- **DB Driver:** `postgres` npm package v3.4.8 (speaks PostgreSQL wire protocol, port 5432/6543)

### Drizzle Config (`drizzle.config.ts`)

```ts
dialect: "postgresql"
schema: "./drizzle/schema.ts"
out: "./drizzle"
dbCredentials: { url: process.env.DATABASE_URL }
```

### ⚠️ CRITICAL: DATABASE_URL Dialect Mismatch

**Actual `DATABASE_URL` in production:**
```
mysql://[user]:[password]@gateway03.us-east-1.prod.aws.tidbcloud.com:4000/[dbname]?ssl={"rejectUnauthorized":true}
```

**This is TiDB Cloud (MySQL-compatible), port 4000, MySQL wire protocol.**

The `postgres` npm driver and `drizzle-orm/postgres-js` speak the **PostgreSQL wire protocol**. They cannot connect to a MySQL endpoint. When the server starts, `getDb()` will throw an error and silently fall back to `_db = null`. All database operations will fail silently:

```
[Database] Failed to connect: [error]
[Database] Cannot get blog posts: database not available
[Database] Cannot upsert user: database not available
```

**The application is running without database connectivity in production.** Blog posts, gallery order, user records, and orders are all non-functional.

**Required action for Phase 2:** Replace `DATABASE_URL` with a Supabase PostgreSQL connection string (Transaction Pooler URL from Supabase project `frgdgcpmrshimyxsamdr`).

### Schema Tables

#### `users`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | Internal auto-increment |
| `openId` | varchar(64) | NOT NULL, UNIQUE | Supabase user UUID (was Manus OAuth ID) |
| `name` | text | nullable | Display name |
| `email` | varchar(320) | nullable | User email |
| `loginMethod` | varchar(64) | nullable | "email", "google", "github" |
| `role` | enum(user\|admin) | DEFAULT 'user', NOT NULL | Authorization role |
| `createdAt` | timestamp | DEFAULT NOW() | |
| `updatedAt` | timestamp | DEFAULT NOW() | |
| `lastSignedIn` | timestamp | DEFAULT NOW() | Updated on login |

**Admin assignment:** `server/db.ts:60` — if `user.openId === ENV.ownerOpenId`, role is forced to `'admin'` on upsert. `OWNER_OPEN_ID` currently holds a Manus OAuth identifier (`eVUiibodwAkat77ZQkBy9z`) — not a Supabase UUID. Admin assignment is broken.

#### `image_orders`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | |
| `gallery` | varchar(50) | NOT NULL | 'photos', 'journal', 'product-photography' |
| `imageOrder` | text | NOT NULL | **JSON as text** — `JSON.stringify(string[])` of image URLs |
| `updatedAt` | timestamp | DEFAULT NOW() | |

#### `blog_posts`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | |
| `slug` | varchar(255) | NOT NULL, UNIQUE | |
| `title` | varchar(500) | NOT NULL | |
| `excerpt` | text | nullable | |
| `content` | text | NOT NULL | Full markdown |
| `heroImage` | varchar(500) | nullable | URL string |
| `published` | integer | DEFAULT 1, NOT NULL | 1=published, 0=draft (not boolean) |
| `publishedAt` | timestamp | DEFAULT NOW() | |
| `createdAt` | timestamp | DEFAULT NOW() | |
| `updatedAt` | timestamp | DEFAULT NOW() | |

#### `products`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | |
| `slug` | varchar(255) | NOT NULL, UNIQUE | |
| `name` | varchar(500) | NOT NULL | |
| `description` | text | nullable | |
| `price` | integer | NOT NULL | Cents |
| `priceMax` | integer | nullable | For price ranges |
| `image` | varchar(500) | nullable | URL string |
| `category` | varchar(100) | nullable | 'book', 'print', 'boxset' |
| `status` | varchar(50) | DEFAULT 'available' | 'available', 'presale', 'sold_out', 'in_production' |
| `details` | text | nullable | Size options/materials |
| `galleryImages` | text | nullable | **JSON as text** — array of additional image URLs |
| `sortOrder` | integer | DEFAULT 0 | |
| `createdAt` | timestamp | DEFAULT NOW() | |
| `updatedAt` | timestamp | DEFAULT NOW() | |

#### `orders`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | |
| `userId` | integer | nullable | Logical FK to `users.id` (not declared as DB constraint) |
| `stripeSessionId` | varchar(255) | NOT NULL, UNIQUE | |
| `stripePaymentIntentId` | varchar(255) | nullable | |
| `customerEmail` | varchar(320) | NOT NULL | |
| `customerName` | varchar(255) | nullable | |
| `productSlug` | varchar(255) | NOT NULL | |
| `productName` | varchar(500) | NOT NULL | |
| `amount` | integer | NOT NULL | Cents |
| `currency` | varchar(10) | DEFAULT 'usd' | |
| `status` | varchar(50) | DEFAULT 'pending' | pending, paid, fulfilled, cancelled |
| `shippingAddress` | text | nullable | **JSON as text** — shipping address object |
| `createdAt` | timestamp | DEFAULT NOW() | |
| `updatedAt` | timestamp | DEFAULT NOW() | |

### Enums

```sql
CREATE TYPE "public"."role" AS ENUM('user', 'admin');
```

### Relationships

No formal foreign keys are declared in the schema or migration SQL. `orders.userId` references `users.id` in intent only — no database-enforced constraint.

### JSON Stored as Text

| Table | Column | Content |
|---|---|---|
| `image_orders` | `imageOrder` | `string[]` of image URLs |
| `products` | `galleryImages` | `string[]` of image URLs |
| `orders` | `shippingAddress` | Shipping address object |

### Migration Risks (TiDB → Supabase Postgres)

- ✅ Schema is pure Postgres — no MySQL-specific syntax in migration SQL
- ✅ No `AUTO_INCREMENT` (MySQL); uses `serial` (Postgres)
- ✅ Column types: serial, text, varchar, timestamp, pgEnum — all native Postgres
- ⚠️ **No live data to migrate** — DB is unreachable due to wire-protocol mismatch; if data exists on TiDB it cannot be accessed via current code
- ⚠️ `OWNER_OPEN_ID` is a Manus OAuth ID, not a Supabase UUID — admin role broken until updated
- ⚠️ `published` column is `integer` (0/1) not `boolean` — ensure seeded data uses integer values
- ⚠️ No FK constraints — adding them post-migration requires all referential data to be consistent

---

## 7. Storage Architecture

### Current Provider

**Manus Forge Storage Proxy** (`server/storage.ts`)
- Upload: `POST {BUILT_IN_FORGE_API_URL}/v1/storage/upload?path={key}` (multipart form)
- Download URL: `GET {BUILT_IN_FORGE_API_URL}/v1/storage/downloadUrl?path={key}` → `{ url: string }`
- Auth: `Authorization: Bearer {BUILT_IN_FORGE_API_KEY}`
- **Hard-coded error if `BUILT_IN_FORGE_API_URL` or `BUILT_IN_FORGE_API_KEY` are missing**

### Upload Flows

| Caller | File Path Pattern | Content Type | Notes |
|---|---|---|---|
| `imageProcessing.ts:35` | `gallery/{type}/{ts}-{name}.{ext}` | image/webp or image/jpeg | Original image |
| `imageProcessing.ts:59` | `gallery/{type}/{ts}-{name}-400.{ext}` | image/webp or image/jpeg | 400px variant |
| `imageProcessing.ts:59` | `gallery/{type}/{ts}-{name}-800.{ext}` | image/webp or image/jpeg | 800px variant |
| `imageProcessing.ts:59` | `gallery/{type}/{ts}-{name}-1200.{ext}` | image/webp or image/jpeg | 1200px variant |
| `routers.ts:99` | `gallery/{type}/{ts}-{name}.{ext}` | from input | Fallback single upload |
| `_core/imageGeneration.ts:84` | `generated/{timestamp}.png` | from AI | Dead code — not called |

### Image Processing Pipeline

1. Buffer received as base64 from client
2. Sharp: resize to 400w, 800w, 1200w + original (JPEG or WebP)
3. Each variant: `storagePut(key, buffer, contentType)` → Manus Forge
4. Returns array of `{ url, fileKey, width }` objects
5. Alt text generated via Manus Forge LLM (see §10)

**Duke editor pipeline (already Supabase ✅):**
1. Load from Supabase `duke-edits` bucket or local `/images/duke/` filesystem
2. Sharp: crop, rotate, MOZJPEG compression (quality 82)
3. Upload to Supabase `duke-edits` bucket

### `storageGet` Usage

`storageGet` is exported but has **zero callers** in active code. Dead export.

### Where File URLs Are Persisted

| Location | Field | Format | Risk |
|---|---|---|---|
| `image_orders.imageOrder` | JSON array | Full Manus Forge CDN URL | Will break when Manus is decommissioned |
| `blog_posts.heroImage` | varchar | URL string | May reference Manus CDN |
| `products.image` | varchar | URL string | May reference Manus CDN |
| `products.galleryImages` | JSON text | Full URL array | May reference Manus CDN |

### Supabase Storage Replacement

**Buckets to create:**

```
gallery          (public)    ← replace Manus Forge for all gallery images
  gallery/photos/
  gallery/journal/
  gallery/product-photography/

duke-edits       (public)    ← already exists ✅
duke-backups     (private)   ← already exists ✅
```

**Migration strategy:**
1. Create `gallery` public bucket in Supabase project `frgdgcpmrshimyxsamdr`
2. Rewrite `server/storage.ts` to use `supabase.storage.from('gallery').upload()` + `getPublicUrl()`
3. Re-upload all existing gallery images (download from Manus Forge CDN → upload to Supabase)
4. Update all `image_orders.imageOrder` JSON arrays to reference new Supabase URLs
5. Remove `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` from environment

---

## 8. Auth Architecture

### Supabase Auth (Active)

- Client: `supabase.auth.signInWithPassword({ email, password })` — email/password login at `/login`
- Session: stored in browser localStorage/cookie by Supabase JS SDK
- Token extraction (`server/_core/supabase.ts`): checks `Authorization: Bearer` header first, then `sb-{projectRef}-auth-token` cookie
- Server verification: `supabase.auth.getUser(accessToken)` via admin client
- User creation: on first verified request, `upsertUser()` is called with Supabase UUID as `openId`

### Manus OAuth (Removed from Flow, Env Vars Still Present)

The active auth flow has no Manus OAuth dependency. The test at `server/supabase-auth.test.ts:117` explicitly verifies `oauth.ts` does not import any Manus SDK. However, the following Manus auth env vars are still present and should be removed:

| Env Var | Current Value | Status |
|---|---|---|
| `VITE_APP_ID` | Manus app ID | Dead — remove |
| `OAUTH_SERVER_URL` | `https://api.manus.im` | Dead — remove |
| `VITE_OAUTH_PORTAL_URL` | `https://manus.im` | Dead — remove |
| `OWNER_OPEN_ID` | Manus OAuth user ID | **Must update to Supabase UUID** |

### Owner/Admin Assignment

```ts
// server/db.ts:60
} else if (user.openId === ENV.ownerOpenId) {
  values.role = 'admin';
  updateSet.role = 'admin';
}
```

`OWNER_OPEN_ID` is currently set to `eVUiibodwAkat77ZQkBy9z` — a Manus OAuth identifier. Since Supabase UUIDs have the format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`, this value will never match any Supabase user. **Admin role assignment is broken.**

To fix: find Allen's Supabase user UUID in the Supabase Dashboard → Authentication → Users, then set `OWNER_OPEN_ID=<supabase-uuid>`, or directly run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'allen@allenhenson.com';
```

### `protectedProcedure` / `adminProcedure`

```ts
// server/_core/trpc.ts
protectedProcedure — requires ctx.user !== null
adminProcedure     — requires ctx.user.role === 'admin'
```

**Note:** Gallery upload/delete/reorder, blog seed, and product seed use `publicProcedure` with an in-procedure password check, not `protectedProcedure`. This is architecturally inconsistent — these operations are not protected by Supabase auth.

### Public Admin Password

```ts
// server/routers.ts:12
const ADMIN_PASSWORD = "&&77VAnguard";
// server/dukeEditor.ts:16
const EDITOR_PASSWORD = "&&77LEica";
```

Both passwords are hardcoded in plaintext source code. Anyone with repo access knows the admin password. **Recommend moving to `process.env.ADMIN_PASSWORD` and `process.env.EDITOR_PASSWORD`**, or replacing the password mechanism with Supabase role-based checks.

### Recommended Final Auth Model

1. No changes needed for Supabase email/password login — already working
2. Update `OWNER_OPEN_ID` to Allen's Supabase UUID on Railway
3. Move gallery/blog/product mutations from password-in-procedure to `protectedProcedure` + `adminProcedure` 
4. Move `ADMIN_PASSWORD` and `EDITOR_PASSWORD` to environment variables
5. Remove all Manus OAuth env vars

---

## 9. Commerce Architecture

### Stripe Integration

- SDK: `stripe` npm v20.3.0
- API version: `2026-01-28.clover`
- Lazy initialization: `getStripe()` throws at checkout time if `STRIPE_SECRET_KEY` not set
- Webhook verification: `stripe.webhooks.constructEvent(req.body, sig, webhookSecret)`

### ⚠️ CRITICAL: Live Secret Key Misnamed as Publishable

```
STRIPE_PUBLISHABLE_KEY_LIVE = "sk_live_516EUVvHkq..."
```

This variable name suggests a publishable key (`pk_live_*`) but its value is a **live secret key** (`sk_live_*`). Secret keys must never be exposed client-side or stored with misleading names. This env var is not referenced in code (the live key has no current code consumer), but its presence in the env file is a security concern.

**Action required:** Rotate this key in the Stripe dashboard immediately; remove from environment.

### Active Stripe Env Vars in Code

| Var | Used In | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | `server/stripe.ts:16` | Creates checkout sessions, retrieves sessions |
| `STRIPE_WEBHOOK_SECRET` | `server/stripe.ts:125` | Verifies webhook signatures |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Not found in code (may be client-side unused) | Test publishable key |

### Product Source of Truth — Two Systems

The application maintains product data in two parallel, potentially inconsistent systems:

**System 1 — Hardcoded price map (authoritative for checkout)**
```ts
// server/stripe.ts:productPrices — 81 products
export const productPrices: Record<string, { price: number; name: string }> = { ... };
```
`createCheckoutSession()` reads exclusively from this map.

**System 2 — DB `products` table (for display only)**
Seeded via `trpc.products.seed`; read by `trpc.products.list` and `trpc.products.getBySlug` for the Sales page.

**System 3 — Shared product variants**
```ts
// shared/productVariants.ts — 21 products with size variants
export const productVariants: Record<string, ProductVariant[]> = { ... };
```
Used by checkout to apply variant-specific pricing.

**Risk:** A product price can be updated in the DB `products` table without updating `productPrices` in `stripe.ts`, creating a pricing discrepancy. There is no synchronization mechanism.

### Checkout Flow

```
trpc.checkout.createSession
  → lookup productPrices[slug]   (hardcoded, authoritative)
  → apply variant pricing if applicable
  → stripe.checkout.sessions.create(...)
  → db.insert(orders, { status: 'pending' })
  → return { url, sessionId }

Client → Stripe hosted checkout → stripe-signature verified webhook
  → db.update(orders, { status: 'paid', amount, email })
  → notifyOwner() (Manus Forge)
  → sendOrderConfirmation() (SendGrid)
```

### Order Table

`orders` table in Drizzle schema (Postgres). Currently non-functional due to DATABASE_URL mismatch. All orders are pending and unrecorded.

### Webhook Behavior

- 5 duplicate webhook paths registered for Manus platform compatibility
- If `stripe-signature` header is absent, returns `{verified:true}` immediately (Manus test mode)
- Real webhook only processes `checkout.session.completed` and `payment_intent.succeeded`

### Test vs Live Key Risks

| Key | Status | Risk |
|---|---|---|
| `STRIPE_SECRET_KEY` = `sk_test_*` | Test key active | OK for staging |
| `STRIPE_PUBLISHABLE_KEY_LIVE` = `sk_live_*` | **Misnamed live secret key** | **CRITICAL — rotate immediately** |
| `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_test_*` | Test publishable key | OK for staging |

---

## 10. Email / Notification Architecture

### SendGrid

- Package: `@sendgrid/mail` v8.1.6
- API key: `process.env.SENDGRID_API_KEY` (must start with `SG.` to pass `isEmailConfigured()` check)
- From address: `process.env.SENDGRID_FROM_EMAIL || "noreply@allenhenson.com"`

**Email types:**
| Function | Trigger | To | Via |
|---|---|---|---|
| `sendOrderConfirmation()` | Stripe webhook `checkout.session.completed` | Customer email | SendGrid |
| `sendContactFormEmail()` | `contact.submit` tRPC mutation | `allen@allenhenson.com` | SendGrid |
| `sendContactAutoReply()` | `contact.submit` tRPC mutation | Form submitter | SendGrid |

### Manus Forge Notification (Active Dependency)

`server/_core/notification.ts` — `notifyOwner()` — calls `{BUILT_IN_FORGE_API_URL}/webdevtoken.v1.WebDevService/SendNotification`.

**Active callers:**
1. `server/stripe.ts:178` — on successful order (new order alert to owner)
2. `server/routers.ts:307` — contact form fallback when SendGrid fails or is unconfigured
3. `server/_core/systemRouter.ts:17` — `system.notifyOwner` admin procedure

**Replacement:** Rewrite `notifyOwner()` to call `sendEmail({ to: 'allen@allenhenson.com', ... })` via SendGrid. The `SENDGRID_API_KEY` is already configured.

---

## 11. Build / Deployment Architecture

### Package Manager

`pnpm` v10.x (enforced via `engines` in `package.json`)

### Scripts (`package.json`)

| Script | Command | Notes |
|---|---|---|
| `dev` | `NODE_ENV=development tsx watch server/_core/index.ts` | Runs Vite dev server inside Express |
| `build` | `vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist` | Frontend then server bundle |
| `start` | `NODE_ENV=production node dist/index.js` | Production runtime |
| `check` | `tsc --noEmit` | TypeScript validation |
| `db:push` | `drizzle-kit generate && drizzle-kit migrate` | Schema migration |

### Build Command Results

**`pnpm check` — FAILS** (2 pre-existing errors):

```
client/src/pages/Duke.tsx:794:5
  error TS2304: Cannot find name 'setLightboxIndex'.

server/dukeEditor.ts:67:7
  error TS2769: No overload matches this call.
  Type 'Buffer<ArrayBufferLike>' is not assignable to type 'BodyInit | null | undefined'.
```

**`pnpm build` — SUCCEEDS** with warnings:

```
(!) %VITE_ANALYTICS_ENDPOINT% is not defined in env variables found in /index.html.
(!) %VITE_ANALYTICS_WEBSITE_ID% is not defined in env variables found in /index.html.

Output:
  dist/public/index.html       368.35 kB
  dist/public/assets/*.css     125.44 kB (gzip: 19.66 kB)
  dist/public/assets/*.js    1,165.45 kB (gzip: 321.40 kB)  ← >500 kB chunk warning
  dist/index.js                 95.8 kB
```

**Analysis:**
- TypeScript errors are pre-existing and do not block the esbuild-based server bundle
- Umami `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%` substitution fails because Vite does not replace `%VAR%` HTML patterns unless `envPrefix` is configured — these tags remain as literal strings in the build output

### Railway Deployment Assumptions

- Railway sets `PORT` environment variable automatically
- `NODE_ENV=production` must be set explicitly
- Start command: `node dist/index.js` (after `pnpm build`)
- Static files are served from `dist/public/` by `server/_core/vite.ts:serveStatic()`

### Manus Runtime/Plugin Dependencies

| Package | Type | Used For | Remove? |
|---|---|---|---|
| `vite-plugin-manus-runtime` v0.0.57 | devDependency | Injects Manus platform runtime into Vite build | **YES — Remove** |
| `@builder.io/vite-plugin-jsx-loc` v0.1.1 | devDependency | JSX location tracking (Manus tooling) | **YES — Remove** |

### Vite Plugins (`vite.config.ts:153`)

```ts
const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),               // Manus tooling — remove
  vitePluginManusRuntime(),     // Manus runtime — remove
  vitePluginManusDebugCollector()  // Manus debug collector injection — remove
];
```

### Manus Allowed Hosts

```ts
// vite.config.ts:174-178
allowedHosts: [
  "localhost", "127.0.0.1",
  ".manuspre.computer",     // remove
  ".manus.computer",        // remove
  ".manus-asia.computer",   // remove
  ".manuscomputer.ai",      // remove
  ".manusvm.computer",      // remove
]
```

---

## 12. Environment Variable Inventory

| Variable | Required | Scope | Purpose | Manus? | Replace / Action |
|---|---|---|---|---|---|
| `DATABASE_URL` | ✅ Required | Server | PostgreSQL connection string | No | **Replace with Supabase Transaction Pooler URL** |
| `JWT_SECRET` | ✅ Required | Server | Cookie signing secret | No | Keep |
| `NODE_ENV` | Optional | Server | `production` or `development` | No | Keep |
| `PORT` | Optional | Server | HTTP port (Railway sets auto) | No | Keep |
| `VITE_SUPABASE_URL` | ✅ Required | Public | Supabase project URL | No | Keep |
| `VITE_SUPABASE_ANON_KEY` | ✅ Required | Public | Supabase publishable JWT | No | Keep |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Required | Server | Supabase admin JWT | No | Keep |
| `SUPABASE_URL` | Optional | Server | Redundant with `VITE_SUPABASE_URL`; used in `dukeEditor.ts` only | No | Remove — consolidate to `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_KEY` | Optional | Server | Redundant with `SUPABASE_SERVICE_ROLE_KEY`; used in `dukeEditor.ts` only | No | Remove — consolidate |
| `STRIPE_SECRET_KEY` | ✅ Required | Server | Stripe API secret (currently test key) | No | Keep (promote to live key for production) |
| `STRIPE_WEBHOOK_SECRET` | ✅ Required | Server | Webhook signature verification | No | Keep |
| `STRIPE_PUBLISHABLE_KEY_LIVE` | ⚠️ DANGER | — | **`sk_live_*` live SECRET key misnamed as publishable** | No | **ROTATE KEY IMMEDIATELY — remove from env** |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | Public | Stripe test publishable key | No | Keep (update to `pk_live_*` for production) |
| `SENDGRID_API_KEY` | ✅ Required | Server | Email sending | No | Keep |
| `SENDGRID_FROM_EMAIL` | Optional | Server | Defaults to `noreply@allenhenson.com` | No | Keep |
| `OWNER_OPEN_ID` | ✅ Required | Server | Admin role assignment on login | **Manus ID** | **Replace value with Allen's Supabase UUID** |
| `OWNER_NAME` | Optional | Server | Display name (not used in code) | Manus metadata | Remove |
| `BUILT_IN_FORGE_API_URL` | ❌ Remove | Server | Manus Forge base URL (`https://forge.manus.ai`) | **YES** | **Remove after storage + notification migration** |
| `BUILT_IN_FORGE_API_KEY` | ❌ Remove | Server | Manus Forge server-side API key | **YES** | **Remove after migration** |
| `VITE_FRONTEND_FORGE_API_URL` | ❌ Remove | Public | Manus Forge URL **bundled into client JS** | **YES** | **Remove immediately — no code reference found** |
| `VITE_FRONTEND_FORGE_API_KEY` | ❌ Remove | Public | **Manus Forge API key bundled into client JS** — security risk | **YES** | **Remove immediately — secret key in public bundle** |
| `VITE_APP_ID` | ❌ Remove | Public | Manus app identifier | **YES** | Remove |
| `OAUTH_SERVER_URL` | ❌ Remove | Server | `https://api.manus.im` — Manus OAuth (dead) | **YES** | Remove |
| `VITE_OAUTH_PORTAL_URL` | ❌ Remove | Public | `https://manus.im` — Manus OAuth portal (dead) | **YES** | Remove |
| `VITE_ANALYTICS_ENDPOINT` | ❌ Remove | Public | `https://manus-analytics.com` — Manus analytics host | **YES** | Remove or replace with self-hosted Umami |
| `VITE_ANALYTICS_WEBSITE_ID` | ❌ Remove | Public | Manus analytics site ID | **YES** | Remove or replace |
| `VITE_APP_TITLE` | Optional | Public | App title string | No | Keep |
| `VITE_APP_LOGO` | Optional | Public | `https://files.manuscdn.com/...` — Manus CDN logo | **YES** | Replace with self-hosted image or Supabase Storage URL |

**To add post-migration:**

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Optional | Replace Manus Forge LLM for alt text generation |
| `ADMIN_PASSWORD` | ✅ Required | Move hardcoded gallery admin password to env |
| `EDITOR_PASSWORD` | ✅ Required | Move hardcoded Duke editor password to env |

---

## 13. Current Risk Register

| Risk | Severity | Evidence / File | Why It Matters | Recommended Phase |
|---|---|---|---|---|
| **DATABASE_URL dialect mismatch** — live DB is TiDB MySQL, code expects PostgreSQL | 🔴 CRITICAL | `DATABASE_URL` env var (`mysql://tidbcloud.com:4000`), `server/db.ts`, `drizzle.config.ts` | All DB operations fail silently. Blog, gallery order, users, and orders are non-functional in production. | Phase 2 — Priority 0 |
| **Live Stripe secret key misnamed as publishable** (`sk_live_*` in `STRIPE_PUBLISHABLE_KEY_LIVE`) | 🔴 CRITICAL | Environment variable `STRIPE_PUBLISHABLE_KEY_LIVE` | A live secret key with a misleading name that looks like a publishable key. Risk of accidental client-side exposure or logging. | Immediate — rotate and remove |
| **Manus Forge API key in client JS bundle** (`VITE_FRONTEND_FORGE_API_KEY`) | 🔴 CRITICAL | `VITE_FRONTEND_FORGE_API_KEY` env var | Any `VITE_*` env var is baked into the Vite-built JS bundle and visible to any user who downloads it. Forge API key is a server-side credential. | Immediate — remove from env |
| **Manus Forge storage dependency** — all gallery uploads use Forge proxy | 🔴 HIGH | `server/storage.ts`, `server/imageProcessing.ts`, `server/routers.ts` | When Manus is decommissioned, gallery image upload will throw hard errors. Existing Forge CDN URLs in `image_orders` table will return 404. | Phase 3 |
| **Manus notification service** — `notifyOwner()` calls Forge WebDevService | 🔴 HIGH | `server/_core/notification.ts`, called from `stripe.ts` and `routers.ts` | Order confirmations to the owner and contact form fallback will fail when Manus is decommissioned. | Phase 5 |
| **Manus Forge LLM** — alt text generation calls Forge LLM | 🟡 MEDIUM | `server/_core/llm.ts:215` (`forge.manus.im`), `server/altTextGenerator.ts` | Alt text generation silently fails with fallback text. Not blocking but loses AI capability. | Phase 4 |
| **Manus analytics and logo** (`VITE_ANALYTICS_ENDPOINT`, `VITE_APP_LOGO`) | 🟡 MEDIUM | `client/index.html`, env vars | Analytics stop reporting; logo image 404s when Manus CDN is decommissioned | Phase 8 |
| **Manus runtime/plugin build dependency** | 🟡 MEDIUM | `vite.config.ts:153`, `package.json` devDeps | Adds `client/public/__manus__/debug-collector.js` to all builds; injects Manus script tag; unnecessary build overhead | Phase 2 |
| **OWNER_OPEN_ID is a Manus OAuth ID** — admin role assignment broken | 🟡 MEDIUM | `server/db.ts:60`, `ENV.ownerOpenId`, env var value `eVUiibodwAkat77ZQkBy9z` | No user will ever receive the `admin` role via the automatic assignment path | Phase 6 |
| **Hardcoded admin passwords in source code** | 🟡 MEDIUM | `server/routers.ts:12` (`&&77VAnguard`), `server/dukeEditor.ts:16` (`&&77LEica`) | Any contributor with repo access knows the admin credentials; not managed as secrets | Phase 8 |
| **Gallery admin uses `publicProcedure` with password** — not Supabase auth | 🟡 MEDIUM | `server/routers.ts` — all `gallery.*`, `blog.*`, `products.*` procedures | Inconsistent auth model; password can be brute-forced; should use `adminProcedure` | Phase 8 |
| **Stripe product source-of-truth drift** — 81-product hardcoded map vs DB table | 🟡 MEDIUM | `server/stripe.ts:productPrices`, `drizzle/schema.ts:products` | Price changes in DB are not reflected in checkout; price changes in `stripe.ts` are not reflected in the display layer | Phase 6 |
| **JSON stored as text** — no `jsonb` columns | 🟢 LOW | `image_orders.imageOrder`, `products.galleryImages`, `orders.shippingAddress` | Cannot query inside JSON at DB level; no JSON schema validation | Phase 7 |
| **No formal FK constraints** | 🟢 LOW | `drizzle/schema.ts` — `orders.userId` references `users.id` without FK | Data integrity not enforced at DB level; orphaned orders possible | Phase 7 |
| **1.16 MB frontend bundle** | 🟢 LOW | `pnpm build` output | Above Vite's 500 kB threshold; slow initial load; should be code-split | Phase 8 |
| **`pnpm check` TypeScript errors** (2 pre-existing) | 🟢 LOW | `Duke.tsx:794`, `dukeEditor.ts:67` | Does not block build but indicates code quality issues | Phase 9 |

---

## 14. Recommended Phase 2 Inputs

The following items are the highest-priority inputs required for the next phase of migration work:

### Immediate Actions (Before Phase 2 Work Begins)

- [ ] **ROTATE** `STRIPE_PUBLISHABLE_KEY_LIVE` (`sk_live_*`) in Stripe Dashboard — this is a live secret key stored under a misleading name
- [ ] **REMOVE** `VITE_FRONTEND_FORGE_API_KEY` and `VITE_FRONTEND_FORGE_API_URL` from Railway environment variables — Forge API credentials are being bundled into client-side JavaScript

### Phase 2 Audit / Migration Checklist

**Database:**
- [ ] Replace `DATABASE_URL` on Railway with Supabase Transaction Pooler URL (`postgresql://postgres.frgdgcpmrshimyxsamdr:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)
- [ ] Run `pnpm db:push` against Supabase Postgres to create schema
- [ ] Seed `blog_posts` and `products` tables
- [ ] Verify `pnpm check` errors in `Duke.tsx` and `dukeEditor.ts` are fixed

**Auth:**
- [ ] Find Allen's Supabase UUID in Supabase Dashboard → Auth → Users
- [ ] Update `OWNER_OPEN_ID` on Railway to the Supabase UUID (or run `UPDATE users SET role='admin' WHERE email='allen@allenhenson.com'`)
- [ ] Move `ADMIN_PASSWORD` and `EDITOR_PASSWORD` to Railway env vars (remove hardcoded values)

**Storage:**
- [ ] Create `gallery` public bucket in Supabase project `frgdgcpmrshimyxsamdr`
- [ ] Rewrite `server/storage.ts` to use `@supabase/supabase-js` storage client
- [ ] Re-upload existing gallery images from Manus Forge CDN to Supabase Storage
- [ ] Update `image_orders.imageOrder` URL arrays to new Supabase Storage URLs

**Manus dependency removal:**
- [ ] Remove `vite-plugin-manus-runtime` and `@builder.io/vite-plugin-jsx-loc` from `package.json`
- [ ] Remove `vitePluginManusDebugCollector()` function and Manus allowed hosts from `vite.config.ts`
- [ ] Delete `client/public/__manus__/` directory
- [ ] Delete dead server files: `_core/imageGeneration.ts`, `_core/dataApi.ts`, `_core/voiceTranscription.ts`, `_core/map.ts`
- [ ] Delete `client/src/components/ManusDialog.tsx`
- [ ] Rewrite `server/_core/notification.ts` to use SendGrid instead of Forge WebDevService
- [ ] Replace Manus LLM in `server/_core/llm.ts` with OpenAI API (`OPENAI_API_KEY`)
- [ ] Remove Manus env vars: `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_NAME`, `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`
- [ ] Update `VITE_APP_LOGO` to a Supabase Storage URL or bundled asset
- [ ] Update `server/stripe.ts` comments referencing Manus platform

**Inventory:**
- [ ] Document all Manus Forge CDN URLs currently referenced in `image_orders` and `products` tables
- [ ] Plan data migration for Stripe orders (currently lost due to DB mismatch)
- [ ] Verify Supabase Storage `duke-edits` and `duke-backups` buckets exist with correct public/private settings
- [ ] Verify SendGrid `SENDGRID_API_KEY` is working and from-email is verified in SendGrid

---

*This document was created as part of Phase 1 of the Manus → Supabase migration audit.*
*No application code was modified. No migrations were run. No env files were changed.*
