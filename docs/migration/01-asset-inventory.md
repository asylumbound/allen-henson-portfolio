# 01 — Asset Inventory
**Allen Henson Portfolio — Phase 2 Migration Preparation**
**Audit date:** 2026-05-02
**Branch:** `copilot/phase-2-migration-prep-asset-inventory`

---

## Summary

| Asset Category | Count | Storage Source | Hardcoded? |
|---|---|---|---|
| Editorial / portfolio photos (root `/images/`) | 175 files | `client/public/images/` static | Hardcoded array in `Photos.tsx` (171 entries) |
| Journal photos | 167 files | `client/public/images/journal/` static | Hardcoded array in `Journal.tsx` (168 entries) |
| Blog hero images | 20 paths | `client/public/images/` static | DB-backed (`blog_posts.heroImage`) + seed SQL |
| Sales / print product images | 426 files | `client/public/images/sales/` static | Hardcoded map in `productImages.ts` (364 webp refs, 81 slugs) |
| Product photography showcase | 43 files | `client/public/images/product/` static | Hardcoded array in `ProductPhotography.tsx` + `ProductEdit.tsx` |
| Duke private gallery | 808 files | `client/public/images/duke/` static + Supabase `duke-edits` bucket | DB-backed (image name + Supabase cloud copy) |
| App logo | 1 file | `client/public/images/AHP-Logo.png` static | Hardcoded `<img>` in `Layout.tsx` |
| About page portrait | 1 file | `client/public/images/allen-about-new.png` static | Hardcoded in `About.tsx` |
| SEO / structured data photos | 2 URLs | `https://www.allenhenson.com/images/...` (external) | Hardcoded in `StructuredData.tsx` |
| Video reel | 1 file | `https://vvfkredvyestpjmfyafh.supabase.co/...` | Hardcoded in `Home.tsx` + `Video.tsx` |
| Manus CDN app logo (env var) | 1 URL | `files.manuscdn.com` (env var `VITE_APP_LOGO`) | Env var — not consumed in any code file |
| Manus Forge LLM endpoint | 1 URL | `https://forge.manus.im/v1/chat/completions` | Hardcoded in `server/_core/llm.ts` |

---

## Detailed Inventory

### 1. Editorial Portfolio Photos — `client/src/pages/Photos.tsx`

**Asset type:** `photo`
**Hardcoded:** YES — static TypeScript array `photosImages[]`
**Recommended Supabase bucket/path:** `gallery` (public) → `gallery/photos/<filename>`

| Line | Asset URL | Asset type |
|---|---|---|
| 19 | `/images/XUQX2322-scaled.jpg` | photo |
| 20 | `/images/AH4_1923.png` | photo |
| 21 | `/images/AHP_AHP_1J3A1859-2.png` | photo |
| 22 | `/images/DSC02981.png` | photo |
| 23 | `/images/BHL0538-Edit.jpg` | photo |
| 24 | `/images/L1009868.jpg` | photo |
| 25 | `/images/1J3A8159.png` | photo |
| 26 | `/images/Runway-Paris-5-Edit-1-scaled.jpg` | photo |
| 27 | `/images/C6B5C345-2774-43F0-867B-DD454DC72278.png` | photo |
| 28 | `/images/IMG_7891.png` | photo |
| 29 | `/images/OSCAR-056-Edit-scaled.jpeg` | photo |
| 30 | `/images/L1009242-2-scaled.jpg` | photo |
| 31 | `/images/S-NAVONA_RETOUCH2_CHANEL-Tether_-427.png` | photo |
| 32 | `/images/IMG-9096.jpg` | photo |
| 33 | `/images/Amelia13577-3-1.jpg` | photo |
| 34 | `/images/AHP_7343-Edit-Edit.png` | photo |
| 35 | `/images/AHP_9599-Edit.png` | photo |
| 36 | `/images/AHP-7473-Edit-Edit-Edit-Edit.jpg` | photo |
| 37 | `/images/AHP_2268-scaled.jpg` | photo |
| 38 | `/images/AHP_4510.png` | photo |
| 39 | `/images/IMG_4798.png` | photo |
| 40 | `/images/AHP-2183-scaled.jpg` | photo |
| 41 | `/images/AHP_5254-Edit-2-scaled.jpg` | photo |
| 42 | `/images/L1000431-2-1-scaled-*.jpg` | photo |
| 43 | `/images/S-NAVONA-FINAL_RETOUCH_CHANEL-Tether_-207-scaled.jpg` | photo |
| 44 | `/images/AHP_2616-Edit.png` | photo |
| 45 | `/images/WZVX7476-scaled.jpg` | photo |
| 46 | `/images/1J3A2008.png` | photo |
| 47 | `/images/1J3A1882-Edit.png` | photo |
| 48 | `/images/FACE-II_0365-Recovered-Edit-Edit.png` | photo |
| 49 | `/images/FACE-II_0304-Edit-Edit-Edit-scaled.jpg` | photo |
| 50 | `/images/AHP4049_SNAVONA_EDIT-Edit-2-scaled.jpg` | photo |
| _...171 total entries_ | _see `Photos.tsx` lines 19–189_ | photo |

**Files on disk:** 175 files in `client/public/images/` (root level, not subdirectory)

---

### 2. Journal Photos — `client/src/pages/Journal.tsx`

**Asset type:** `photo`
**Hardcoded:** YES — static TypeScript array `journalImages[]`
**Recommended Supabase bucket/path:** `gallery` (public) → `gallery/journal/<filename>`

| Line range | Asset URL pattern | Asset type |
|---|---|---|
| 18–185 | `/images/journal/<filename>.png` (168 entries) | photo |

**Sample entries (lines 18–35):**
```
/images/journal/1.png
/images/journal/11794449_10156000040900602_7743628154975280560_o.png
/images/journal/145-DSC09523.png
/images/journal/16-2.png
/images/journal/1J3A4168.png
...
```

**Files on disk:** 167 files in `client/public/images/journal/`

---

### 3. Blog Hero Images — `scripts/seed-blog.mjs` + `drizzle/schema.ts`

**Asset type:** `blog`
**Hardcoded:** PARTIALLY — paths are hardcoded in seed script; once seeded, the DB field `blog_posts.heroImage` becomes the source of truth
**Recommended Supabase bucket/path:** `app-assets` (public) → `app-assets/blog/<filename>`

| File | Line | Asset URL | Asset type | DB-backed? |
|---|---|---|---|---|
| `scripts/seed-blog.mjs` | 9 | `/images/L1009868.jpg` | blog | Yes (after seed) |
| `scripts/seed-blog.mjs` | 30 | `/images/BHL0538-Edit.jpg` | blog | Yes |
| `scripts/seed-blog.mjs` | 47 | `/images/1J3A7318-scaled.jpg` | blog | Yes |
| `scripts/seed-blog.mjs` | 64 | `/images/XUQX2322-scaled.jpg` | blog | Yes |
| `scripts/seed-blog.mjs` | 83 | `/images/S-NAVONA_RETOUCH2_CHANEL-Tether_-427.png` | blog | Yes |
| `scripts/seed-blog.mjs` | 102 | `/images/1J3A2144-1-scaled.jpg` | blog | Yes |
| `scripts/seed-blog.mjs` | 121 | `/images/1J3A2481-Edit-Edit-Edit-Edit-1-scaled.jpg` | blog | Yes |
| `scripts/seed-blog.mjs` | 140 | `/images/1J3A0083-Edit.jpg` | blog | Yes |
| `scripts/seed-blog.mjs` | 159 | `/images/1J3A2488-scaled.jpg` | blog | Yes |
| `scripts/seed-blog.mjs` | 178 | `/images/1-2-scaled.jpg` | blog | Yes |
| `scripts/seed-blog.mjs` | 197 | `/images/1J3A6732-Edit.png` | blog | Yes |
| `scripts/seed-blog.mjs` | 214 | `/images/1J3A3654-Edit-Edit.png` | blog | Yes |
| `scripts/seed-blog.mjs` | 231 | `/images/1J3A6777.png` | blog | Yes |
| `scripts/seed-blog.mjs` | 250 | `/images/1J3A7233.png` | blog | Yes |
| `scripts/seed-blog.mjs` | 269 | `/images/1J3A1882-Edit.png` | blog | Yes |
| `scripts/seed-blog.mjs` | 288 | `/images/1J3A3161-2.png` | blog | Yes |
| `scripts/seed-blog.mjs` | 307 | `/images/1J3A2552-Edit.png` | blog | Yes |
| `scripts/seed-blog.mjs` | 326 | `/images/1J3A0475-Edit-Edit-Edit-Edit-Edit.png` | blog | Yes |
| `scripts/seed-blog.mjs` | 345 | `/images/1J3A0778-Edit-Edit-Edit-2-Edit-Edit.png` | blog | Yes |
| `scripts/seed-blog.mjs` | 364 | `/images/1J3A0044-Edit-Edit.png` | blog | Yes |

**DB schema:** `drizzle/schema.ts` line 52: `heroImage: varchar("heroImage", { length: 500 })`
**DB-backed query:** `server/db.ts:getAllBlogPosts()`, `server/db.ts:getBlogPostBySlug()`
**Consumed in:** `client/src/pages/BlogPost.tsx` line 92 (`post.heroImage`), `client/src/pages/Blog.tsx` line 109

---

### 4. Sales / Print Product Images — `client/src/data/productImages.ts`

**Asset type:** `product`
**Hardcoded:** YES — `productImageGalleries` map with 81 product slugs → 364 `.webp` paths
**Recommended Supabase bucket/path:** `gallery` (public) → `gallery/sales/<slug>/<filename>`

| File | Lines | Asset URL pattern | Asset type |
|---|---|---|---|
| `client/src/data/productImages.ts` | 7–540 | `/images/sales/<slug>-<n>.webp` (364 entries across 81 slugs) | product |

**Sample entries:**
```
/images/sales/a-knight-of-bordeaux-kb7-0.webp
/images/sales/abscond-vol-i-france-i-of-vi-0.webp  ..  -19.webp  (20 variants)
/images/sales/agency-fees-07june2021-0.webp  ..  -1.webp
```

**Also referenced in DB schema:** `drizzle/schema.ts` lines 63–64:
```typescript
image: varchar("image", { length: 500 }),        // line 63 — primary product image
galleryImages: text("galleryImages"),              // line 64 — JSON array of additional URLs
```

**Consumed in:**
- `client/src/pages/Sales.tsx` line 236 (`product.image`)
- `client/src/pages/ProductDetail.tsx` line 1152 (`getProductImages(product.slug, ...)`)

**Files on disk:** 426 files in `client/public/images/sales/`

---

### 5. Product Photography Showcase — `client/src/pages/ProductPhotography.tsx` + `ProductEdit.tsx`

**Asset type:** `product`
**Hardcoded:** YES — static arrays in both files
**Recommended Supabase bucket/path:** `gallery` (public) → `gallery/product-photography/<filename>`

| File | Lines | Asset URL pattern | Count | Asset type |
|---|---|---|---|---|
| `client/src/pages/ProductPhotography.tsx` | 29–113 | `/images/product/*.webp` | 43 entries | product |
| `client/src/pages/ProductEdit.tsx` | 55–107 | `/images/product/*.webp` | 43 entries (same set) | product |

**Sample entries (ProductPhotography.tsx):**
```
line 29:  /images/product/rolex-yacht-master.webp
line 31:  /images/product/don-julio-tequila.webp
line 33:  /images/product/consumer-aesop-bottles.webp
line 35:  /images/product/mclaren-wheel.webp
line 37:  /images/product/fashion-lv-leather.webp
line 39:  /images/product/tech-bo-speaker.webp
line 41:  /images/product/ap-royal-oak.webp
...43 total
```

**Files on disk:** 204 files in `client/public/images/product/`

---

### 6. Duke Private Gallery — `server/dukeEditor.ts`

**Asset type:** `private`
**Hardcoded:** NO — file-system based with Supabase cloud mirror
**Recommended Supabase bucket/path:** `duke-edits` (public) for edits; `duke-backups` (private) for originals

| File | Line | Reference | Asset type |
|---|---|---|---|
| `server/dukeEditor.ts` | 19 | `const SUPABASE_URL = process.env.SUPABASE_URL \|\| "https://frgdgcpmrshimyxsamdr.supabase.co"` | private |
| `server/dukeEditor.ts` | 21 | `const EDITS_BUCKET = "duke-edits"` | private |
| `server/dukeEditor.ts` | 22 | `const BACKUPS_BUCKET = "duke-backups"` | private |
| `server/dukeEditor.ts` | 59 | `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}` (upload) | private |
| `server/dukeEditor.ts` | 91 | `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}` (download) | private |
| `server/dukeEditor.ts` | 114 | `${SUPABASE_URL}/storage/v1/object/${bucket}` (list) | private |
| `server/dukeEditor.ts` | 374 | `${SUPABASE_URL}/storage/v1/object/public/${EDITS_BUCKET}` (public base URL) | private |

**Files on disk:** 808 files in `client/public/images/duke/` (jpeg + webp pairs)
**Supabase project:** `frgdgcpmrshimyxsamdr` (hardcoded fallback in `dukeEditor.ts:19`)

---

### 7. App Logo — `client/src/components/Layout.tsx`

**Asset type:** `logo`
**Hardcoded:** YES — `<img src="/images/AHP-Logo.png" />`
**Recommended Supabase bucket/path:** `app-assets` (public) → `app-assets/logo/AHP-Logo.png`

| File | Line | Asset URL | Asset type |
|---|---|---|---|
| `client/src/components/Layout.tsx` | 71 | `/images/AHP-Logo.png` | logo |

**Files on disk:** `client/public/images/AHP-Logo.png` (confirmed present)

---

### 8. About Page Portrait — `client/src/pages/About.tsx`

**Asset type:** `photo`
**Hardcoded:** YES — `<img src="/images/allen-about-new.png" />`
**Recommended Supabase bucket/path:** `app-assets` (public) → `app-assets/about/allen-about-new.png`

| File | Line | Asset URL | Asset type |
|---|---|---|---|
| `client/src/pages/About.tsx` | 21 | `/images/allen-about-new.png` | photo |
| `client/src/pages/About.tsx` | 57 | `/images/allen-about-new.png` | photo |

---

### 9. SEO Structured Data Images — `client/src/components/StructuredData.tsx`

**Asset type:** `photo`
**Hardcoded:** YES — external production domain URLs
**Recommended Supabase bucket/path:** `app-assets` (public) → `app-assets/seo/<filename>`

| File | Line | Asset URL | Asset type |
|---|---|---|---|
| `client/src/components/StructuredData.tsx` | 22 | `https://www.allenhenson.com/images/allen-polaroid23gg.jpg` | photo |
| `client/src/components/StructuredData.tsx` | 89 | `https://www.allenhenson.com/images/AHP_logo_white.png` | logo |
| `client/src/components/StructuredData.tsx` | 341 | `https://www.allenhenson.com/images/allen-polaroid23gg.jpg` | photo |

---

### 10. Video Reel — `client/src/pages/Home.tsx` + `Video.tsx`

**Asset type:** `video`
**Hardcoded:** YES — hardcoded Supabase storage URL pointing to project `vvfkredvyestpjmfyafh`
**Recommended Supabase bucket/path:** `video` (public) → `video/allen_henson_the_reel_1080p.mp4`

| File | Line | Asset URL | Asset type |
|---|---|---|---|
| `client/src/pages/Home.tsx` | 51 | `https://vvfkredvyestpjmfyafh.supabase.co/storage/v1/object/public/video-assets/allen_henson_the_reel_1080p.mp4` | video |
| `client/src/pages/Video.tsx` | 62 | `https://vvfkredvyestpjmfyafh.supabase.co/storage/v1/object/public/video-assets/allen_henson_the_reel_1080p.mp4` | video |

> ⚠️ **NOTE:** The video is already in a Supabase storage bucket but under project `vvfkredvyestpjmfyafh`, which is **different** from the primary Supabase project `frgdgcpmrshimyxsamdr`. This is a **split-project risk** — the video will break if `vvfkredvyestpjmfyafh` is retired.

---

### 11. Gallery Upload Storage (Manus Forge Proxy) — `server/storage.ts` + `server/routers.ts`

**Asset type:** `photo` (uploaded via admin gallery editor)
**Hardcoded:** NO — dynamically uploaded; uses Manus Forge proxy
**Recommended Supabase bucket/path:** `gallery` (public) → `gallery/<gallery-name>/<timestamp>-<filename>`

| File | Line | Reference | Asset type |
|---|---|---|---|
| `server/storage.ts` | 13 | `const baseUrl = ENV.forgeApiUrl` (Manus Forge `BUILT_IN_FORGE_API_URL`) | photo |
| `server/storage.ts` | 20 | `new URL("v1/storage/upload", ...)` — Manus `/v1/storage/upload` endpoint | photo |
| `server/storage.ts` | 28 | `new URL("v1/storage/downloadUrl", ...)` — Manus download URL endpoint | photo |
| `server/routers.ts` | 65 | `gallery/${input.gallery}/${timestamp}-${cleanFileName}` — upload key format | photo |
| `server/routers.ts` | 99 | `await storagePut(fileKey, buffer, input.contentType)` — upload call | photo |

> ⚠️ **CRITICAL BLOCKER:** All gallery image uploads go through `server/storage.ts` which proxies to Manus Forge (`BUILT_IN_FORGE_API_URL`). This is the primary storage migration blocker. No Manus CDN URLs are currently stored in the DB — uploaded images get a Manus-generated URL returned by `storagePut()`.

---

### 12. Manus CDN App Logo (`VITE_APP_LOGO` env var)

**Asset type:** `logo`
**Hardcoded:** NO — env var only; not consumed in any code file (documented in `00-current-architecture.md`)
**Status:** Env var is set to `https://files.manuscdn.com/...` in deployment but **no code reads `import.meta.env.VITE_APP_LOGO`**. The logo actually served is `/images/AHP-Logo.png` (see item 7 above). This env var is dead code.

| File | Line | Reference | Notes |
|---|---|---|---|
| `docs/migration/00-current-architecture.md` | 153 | `VITE_APP_LOGO = https://files.manuscdn.com/...` | Documented as existing env var |
| _(no code file reads it)_ | — | — | Not consumed in current code |

---

### 13. Manus Forge LLM Endpoint — `server/_core/llm.ts`

**Asset type:** `unknown` (API endpoint, not a media asset)
**Hardcoded:** YES

| File | Line | Reference | Notes |
|---|---|---|---|
| `server/_core/llm.ts` | 215 | `"https://forge.manus.im/v1/chat/completions"` | LLM completions API |

> Used by `server/altTextGenerator.ts` for auto alt-text generation. Not a media asset but a Manus dependency.

---

### 14. DB Schema Fields That Reference Assets

| Field | Table | Column | DB File |
|---|---|---|---|
| `image_orders.imageOrder` | `image_orders` | `imageOrder TEXT` (JSON array of paths) | `drizzle/schema.ts:37` |
| `products.image` | `products` | `image varchar(500)` | `drizzle/schema.ts:63` |
| `products.galleryImages` | `products` | `galleryImages TEXT` (JSON array) | `drizzle/schema.ts:64` |
| `blog_posts.heroImage` | `blog_posts` | `heroImage varchar(500)` | `drizzle/schema.ts:52` |

---

## Asset Count Summary

| Bucket target | Asset count | Current location |
|---|---|---|
| `gallery/photos/` | 175 files | `client/public/images/` (root) |
| `gallery/journal/` | 167 files | `client/public/images/journal/` |
| `gallery/sales/` | 426 files | `client/public/images/sales/` |
| `gallery/product-photography/` | 204 files | `client/public/images/product/` |
| `duke-edits/` | 808 files | `client/public/images/duke/` + Supabase `frgdgcpmrshimyxsamdr` |
| `duke-backups/` | ~808 files | `client/public/images/duke/.backups/` |
| `app-assets/` | ~10 files | `client/public/images/` (logo, about, SEO) |
| `video/` | 1 file | Supabase `vvfkredvyestpjmfyafh` (already uploaded) |
| **Total** | **~2,599 files** | — |
