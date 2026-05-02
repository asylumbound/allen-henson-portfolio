# 01 — Asset Inventory
**Allen Henson Portfolio — Migration Preparation**
**Branch:** `copilot/sandboxrailway-edit`
**Prepared:** 2026-05-02

---

## Overview

This document inventories all static media assets currently stored in the repository under `client/public/images/` that must be migrated to Supabase Storage as part of Phase 4.

**Machine-readable manifest:** `docs/migration/asset-manifest.json`

---

## Summary Table

| Asset Type | Directory | Count | Target Bucket | Target Path Prefix |
|---|---|---|---|---|
| `gallery-photos` | `client/public/images/*.{jpg,png,webp}` (root) | 173 | `gallery` | `gallery/photos/` |
| `gallery-journal` | `client/public/images/journal/` | 167 | `gallery` | `gallery/journal/` |
| `gallery-product-photography` | `client/public/images/product/` | 204 | `gallery` | `gallery/product-photography/` |
| `sales` | `client/public/images/sales/` | 426 | `app-assets` | `sales/` |
| `duke` | `client/public/images/duke/` | 808 | `duke-edits` | `duke/` |
| `app-asset` | `client/public/images/` (logos/icons) | 2 | `app-assets` | `icons/` |
| **TOTAL** | | **1,780** | | |

---

## Bucket Assignment Rationale

### `gallery` (public)
All portfolio photography that needs to be publicly accessible via CDN URL. Subdivided into:
- `gallery/photos/` — main editorial/fashion photography
- `gallery/journal/` — journal/documentary photography
- `gallery/product-photography/` — product photography

### `app-assets` (public)
Non-gallery assets needed for the site UI:
- `icons/` — `AH-Icon.png`, `AHP-Logo.png`
- `sales/` — product images for the e-commerce sales section (webp variants at 400, 800, 1200px)

### `duke-edits` (public)
Private editor content for the `/duke` page. These are managed via the Duke image editor (`server/dukeEditor.ts`) which already uses Supabase Storage directly.

### `duke-backups` (private)
Backup copies of Duke images before edit operations. Created automatically by `POST /api/duke/revert-image`.

### `agency-private` (private)
Reserved for agency database assets. No local files currently assigned.

### `video` (public)
Reserved for video assets. No video files found in `client/public/images/`. Video assets may exist as Manus CDN URLs in the database.

---

## File Format Distribution

| Format | Count | Notes |
|---|---|---|
| `.webp` | 628 | Sales product images (responsive variants: 400, 800, 1200px) |
| `.png` | 262 | High-res gallery images |
| `.jpg` / `.jpeg` | 82 | Compressed gallery images |

---

## Manus CDN Assets (Not Locally Available)

The following asset URLs may exist in the PostgreSQL database (currently unreachable due to TiDB wire-protocol mismatch) pointing to `files.manuscdn.com`:

- `image_orders.imageOrder` — JSON arrays of gallery image URLs
- `blog_posts.heroImage` — blog hero image URLs
- `products.image` — product primary image URLs
- `products.galleryImages` — product gallery image arrays

**These cannot be inventoried or downloaded until the database is migrated to Supabase PostgreSQL.**

Post-DB migration action:
```sql
SELECT imageOrder FROM image_orders;
SELECT heroImage FROM blog_posts WHERE heroImage LIKE '%manuscdn.com%';
SELECT image, galleryImages FROM products WHERE image LIKE '%manuscdn.com%';
```

---

## Notes on Duke Assets

The `client/public/images/duke/` directory contains 808 files. The Duke editor (`server/dukeEditor.ts`) already uploads to Supabase `duke-edits` bucket directly. These local static files are the source copies; edited/processed versions live in Supabase.

**Duke files do NOT need to be re-uploaded** if the Supabase `duke-edits` bucket already has current versions. Verify before uploading.

---

## Next Steps

1. Create Supabase buckets → `scripts/migration/create-supabase-buckets.ts`
2. Download remote Manus CDN assets → `scripts/migration/download-manus-assets.ts`
3. Upload local assets to Supabase → `scripts/migration/upload-assets-to-supabase.ts`
4. Generate URL mapping for DB update → `scripts/migration/generate-url-map.ts`
