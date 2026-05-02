# 02 — Supabase Storage Bucket Plan
**Allen Henson Portfolio — Phase 2 Migration Preparation**
**Audit date:** 2026-05-02
**Supabase project:** `frgdgcpmrshimyxsamdr`

---

## Overview

Six Supabase Storage buckets are recommended based on the asset inventory in `01-asset-inventory.md`. The split separates public portfolio content from private Duke collections, providing clear access-control boundaries and independent lifecycle management.

---

## Bucket Definitions

### 1. `gallery` — Public

**Purpose:**
Store all publicly visible portfolio photography: editorial/fashion shoots, journal snapshots, product photography showcase images, and sales product images (print gallery). This is the largest bucket and the primary migration target.

**Public/Private:** **Public** — all objects readable without authentication via the Supabase CDN URL.

**Path Conventions:**
```
gallery/
├── photos/           ← editorial portfolio (Photos page) — ~175 files
├── journal/          ← journal/personal shots (Journal page) — ~167 files
├── product-photography/ ← product showcase (ProductPhotography page) — ~204 files
└── sales/            ← fine-art print product images (Sales / ProductDetail pages) — ~426 files
```

**Files migrated from:** `client/public/images/` (root), `client/public/images/journal/`, `client/public/images/product/`, `client/public/images/sales/`

**Code references to update after migration:**
- `client/src/pages/Photos.tsx` — `photosImages[]` array paths (lines 19–189)
- `client/src/pages/Journal.tsx` — `journalImages[]` array paths (lines 18–185)
- `client/src/pages/ProductPhotography.tsx` — product showcase array (lines 29–113)
- `client/src/pages/ProductEdit.tsx` — same product images (lines 55–107)
- `client/src/data/productImages.ts` — `productImageGalleries` map (lines 7–540)
- `server/routers.ts` line 65: `gallery/${input.gallery}/${timestamp}-${cleanFileName}` — upload key (already correct format, just change storage target)
- `server/storage.ts` — replace Manus Forge proxy with Supabase Storage client

**Migration risks:**
- Large total file count (~972 files) — bulk upload may time out; use chunked uploads or `supabase storage cp --recursive`
- Filenames contain spaces, special characters, uppercase — must be URL-encoded or sanitized
- `image_orders.imageOrder` in the DB stores path strings — if paths change format, all stored orders will break
- `products.image` and `products.galleryImages` in DB store relative paths — must update DB rows alongside file migration

**Validation tests:**
- Verify CDN URL resolves: `curl -I https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/gallery/photos/XUQX2322-scaled.jpg`
- Spot-check 10 random images from each subfolder render in browser
- After migration: update `photosImages[0].src` in Photos.tsx to Supabase URL and confirm Photos page loads
- Verify `image_orders` JSON paths still match migrated URLs
- Run `SELECT image, galleryImages FROM products WHERE image IS NOT NULL LIMIT 10` and confirm URLs are still valid

---

### 2. `app-assets` — Public

**Purpose:**
Store static application assets that are not part of the portfolio gallery: the site logo, about page portrait, SEO structured data images, and blog hero images. These are small in number but high-visibility.

**Public/Private:** **Public** — served via CDN for SEO crawlers and social sharing.

**Path Conventions:**
```
app-assets/
├── logo/             ← AHP-Logo.png, AHP_logo_white.png — site logos
├── about/            ← allen-about-new.png — about page portrait
├── blog/             ← blog hero images (~20 files, named by filename)
└── seo/              ← canonical og:image, structured data images
```

**Files migrated from:** `client/public/images/` (root logos), blog hero images from `client/public/images/`

**Code references to update after migration:**
- `client/src/components/Layout.tsx` line 71: `src="/images/AHP-Logo.png"` → Supabase URL
- `client/src/pages/About.tsx` lines 21, 57: `src="/images/allen-about-new.png"` → Supabase URL
- `client/src/components/StructuredData.tsx` lines 22, 89, 341: hardcoded `allenhenson.com` image URLs → Supabase URLs
- `scripts/seed-blog.mjs` — update heroImage paths before next seed run
- `blog_posts.heroImage` DB column values — update via SQL after migration

**Migration risks:**
- Blog hero image paths are stored in the DB (`blog_posts.heroImage`) — updating the files alone is not enough; must run `UPDATE blog_posts SET heroImage = ...` for each row
- `VITE_APP_LOGO` env var points to `files.manuscdn.com` but is NOT consumed in current code (no `import.meta.env.VITE_APP_LOGO` anywhere) — low risk, but env var should be removed to avoid confusion

**Validation tests:**
- Verify logo renders in navigation bar after URL update
- Verify About page portrait loads
- Hit `/blog` and `/blog/:slug` routes and confirm hero images load from Supabase
- Check `<head>` og:image tags in page source for SEO URLs
- Run Lighthouse to verify image accessibility

---

### 3. `video` — Public

**Purpose:**
Host video reel assets. Currently one file (`allen_henson_the_reel_1080p.mp4`) already exists in a **different** Supabase project (`vvfkredvyestpjmfyafh`). This bucket consolidates all video under the primary project `frgdgcpmrshimyxsamdr`.

**Public/Private:** **Public** — streamed directly in the browser via `<video>` element.

**Path Conventions:**
```
video/
├── allen_henson_the_reel_1080p.mp4     ← primary reel
└── <future-video-slug>.mp4             ← additional reels
```

**Files migrated from:** `https://vvfkredvyestpjmfyafh.supabase.co/storage/v1/object/public/video-assets/allen_henson_the_reel_1080p.mp4`

**Code references to update after migration:**
- `client/src/pages/Home.tsx` line 51: hardcoded Supabase URL
- `client/src/pages/Video.tsx` line 62: hardcoded Supabase URL

**Migration risks:**
- 1080p MP4 may be several hundred MB — download from `vvfkredvyestpjmfyafh` then re-upload to `frgdgcpmrshimyxsamdr`; large file upload requires streaming or `tus` resumable upload
- Both Home and Video pages have the URL hardcoded separately — must update both files
- CORS headers must be set on the `video` bucket to allow cross-origin video playback
- Supabase default upload limit is 50MB per file — must increase via Supabase dashboard (Storage → Settings → File size limit)

**Validation tests:**
- Verify video plays on Home page (hero section) in Chrome and Safari
- Verify video plays on `/video` page
- Check HTTP response headers include `Accept-Ranges: bytes` (required for video seeking)
- Confirm `Content-Type: video/mp4` is returned

---

### 4. `duke-edits` — Public

**Purpose:**
Mirror of edited Duke gallery images. The Duke system already uses Supabase Storage on project `frgdgcpmrshimyxsamdr`. This bucket stores post-crop, post-rotate JPEG and WebP versions generated by `server/dukeEditor.ts`.

**Public/Private:** **Public** — Duke page fetches edited images from this bucket's public URLs.

**Path Conventions:**
```
duke-edits/
├── duke-1.jpeg       ← edited version (JPEG)
├── duke-1.webp       ← edited version (WebP)
├── duke-2.jpeg
├── duke-2.webp
└── ...               ← pattern: duke-<n>.<ext>
```

**Files migrated from:** Already in Supabase `frgdgcpmrshimyxsamdr/duke-edits` bucket (partially — only images that have been edited). Local static copies in `client/public/images/duke/` serve as the source of truth for unedited images.

**Code references (already correct — no migration needed for bucket name):**
- `server/dukeEditor.ts` line 21: `const EDITS_BUCKET = "duke-edits"` ✅
- `server/dukeEditor.ts` line 374: public base URL construction ✅

**Migration risks:**
- `SUPABASE_URL` is hardcoded as fallback in `dukeEditor.ts:19` (`https://frgdgcpmrshimyxsamdr.supabase.co`) — if project URL changes, this breaks
- `SUPABASE_SERVICE_ROLE_KEY` must be set in env — if missing, uploads silently fail (line 58 warning)
- Edited images in this bucket take precedence over local static files at `/images/duke/duke-<n>.jpeg` — must ensure consistency

**Validation tests:**
- Perform a test crop on Duke image via `/duke` editor; confirm new JPEG appears at `duke-edits/duke-<n>.jpeg`
- Verify `GET /api/duke/edited-images` returns the uploaded file list
- Confirm revert operation removes file from `duke-edits` bucket

---

### 5. `duke-backups` — Private

**Purpose:**
Pre-edit backups of Duke images. Written by the editor at crop/rotate time before modification. Used to restore originals via the "Revert" operation.

**Public/Private:** **Private** — backup files must not be publicly accessible. Requires service role key to read.

**Path Conventions:**
```
duke-backups/
├── duke-1.jpeg.backup    ← or duke-1.jpeg depending on dukeEditor naming
├── duke-2.jpeg.backup
└── ...
```

**Files migrated from:** `server/dukeEditor.ts` uploads originals here before editing (line 198).

**Code references:**
- `server/dukeEditor.ts` line 22: `const BACKUPS_BUCKET = "duke-backups"` ✅

**Migration risks:**
- Bucket must be created with `public: false` in Supabase dashboard — do not accidentally make it public
- Service role key is required for all read/write operations — must not be exposed to client
- If bucket does not exist, backup step fails silently (upload returns false) and proceeding edit will overwrite without backup

**Validation tests:**
- After a Duke edit operation, verify a file exists in `duke-backups` with the correct name
- Attempt to access backup URL without authentication — should return 401/403
- Confirm revert operation successfully downloads from `duke-backups` and restores local file

---

### 6. `agency-private` — Private

**Purpose:**
Store any private/sensitive agency documents, contact exports, or commission agreements referenced from the Agency (`/agency`) admin page. Currently no files from this page are in Supabase — all agency data is in-memory TypeScript arrays in `client/src/data/agencyData.ts`. This bucket is reserved for future use.

**Public/Private:** **Private** — agency communications, contact details, and business documents are confidential.

**Path Conventions:**
```
agency-private/
├── contacts/         ← exported agency contact sheets
├── communications/   ← logged communication records
└── documents/        ← contracts, agreements
```

**Files migrated from:** No current files — `agencyData.ts` contains only in-memory TypeScript data. Bucket is speculative/forward-looking.

**Migration risks:**
- No current code writes to this bucket — will require new server-side routes to be added
- Agency page (`/agency`) uses a hardcoded password (`EDITOR_PASSWORD`) for access — must be replaced with proper admin auth before storing sensitive data here
- RLS (Row Level Security) policies must be configured if per-user access control is needed

**Validation tests:**
- Verify bucket is not publicly listable
- Attempt anonymous read — should return 401/403
- Verify admin upload via service role key succeeds

---

## Bucket Configuration Summary

| Bucket | Public | File Size Limit | CORS | RLS |
|---|---|---|---|---|
| `gallery` | ✅ Yes | 50MB (default) | `*` | None (public) |
| `app-assets` | ✅ Yes | 10MB | `*` | None (public) |
| `video` | ✅ Yes | 500MB+ (increase required) | `*` | None (public) |
| `duke-edits` | ✅ Yes | 50MB | `*` | None (public) |
| `duke-backups` | ❌ Private | 50MB | None | Service role only |
| `agency-private` | ❌ Private | 10MB | None | Service role only |

---

## Migration Execution Order

1. **`app-assets`** — smallest, lowest risk, unblocks logo + blog pages
2. **`gallery/sales`** — unblocks product pages (revenue-critical)
3. **`gallery/photos`** + **`gallery/journal`** — portfolio pages
4. **`gallery/product-photography`** — product showcase
5. **`video`** — large file; schedule for off-peak hours
6. **`duke-edits`** / **`duke-backups`** — already partially live; validate existing data
7. **`agency-private`** — future use; create bucket but no file upload needed now

---

## Supabase CLI Commands (reference)

```bash
# Create buckets (run once via Supabase dashboard or CLI)
supabase storage create gallery --public
supabase storage create app-assets --public
supabase storage create video --public
supabase storage create duke-edits --public
supabase storage create duke-backups
supabase storage create agency-private

# Bulk upload gallery photos
supabase storage cp -r client/public/images/ supabase://gallery/photos/ --project-ref frgdgcpmrshimyxsamdr
supabase storage cp -r client/public/images/journal/ supabase://gallery/journal/ --project-ref frgdgcpmrshimyxsamdr
supabase storage cp -r client/public/images/sales/ supabase://gallery/sales/ --project-ref frgdgcpmrshimyxsamdr
supabase storage cp -r client/public/images/product/ supabase://gallery/product-photography/ --project-ref frgdgcpmrshimyxsamdr
```
