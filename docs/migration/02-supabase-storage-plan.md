# 02 — Supabase Storage Migration Plan
**Allen Henson Portfolio — Migration Preparation**
**Branch:** `copilot/sandboxrailway-edit`
**Prepared:** 2026-05-02

---

## Overview

This document details the plan to migrate all media assets from Manus Forge CDN / local static files to Supabase Storage. This is Phase 4 of the migration away from Manus dependencies.

**Supabase Project:** `frgdgcpmrshimyxsamdr`

---

## 1. Bucket Topology

| Bucket | Visibility | Purpose | Notes |
|---|---|---|---|
| `gallery` | **public** | All portfolio gallery images (photos, journal, product-photography) | Replaces Manus Forge for `server/storage.ts` |
| `app-assets` | **public** | Site UI assets (logos, icons, sales product images) | Static assets currently in `client/public/` |
| `video` | **public** | Video content | Reserved; no files currently |
| `duke-edits` | **public** | Duke editor processed images | Already created ✅ |
| `duke-backups` | **private** | Duke editor backup originals | Already created ✅ |
| `agency-private` | **private** | Agency database private assets | Reserved |

---

## 2. Path Structure

### `gallery` bucket

```
gallery/
├── photos/          ← main editorial/fashion photography
│   ├── 1J3A0044-Edit-Edit.png
│   ├── AHP_2616-Edit.png
│   └── ...
├── journal/         ← journal photography
│   ├── 1.png
│   └── ...
└── product-photography/  ← product photography
    ├── AHP-0019_v3.png
    └── ...
```

### `app-assets` bucket

```
app-assets/
├── icons/           ← site logos and icons
│   ├── AH-Icon.png
│   └── AHP-Logo.png
└── sales/           ← product images (with responsive variants)
    ├── ap-royal-oak.webp
    ├── ap-royal-oak-400.webp
    ├── ap-royal-oak-800.webp
    ├── ap-royal-oak-1200.webp
    └── ...
```

### `duke-edits` bucket (existing)

```
duke-edits/
├── duke/            ← migrated from local filesystem
└── order.json       ← image display order
```

---

## 3. URL Format

After migration, Supabase Storage public URLs follow this pattern:

```
https://{SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/{bucket}/{path}
```

Example:
```
# Before (Manus CDN):
https://files.manuscdn.com/storage/v1/gallery/photos/1J3A0044-Edit-Edit.png

# After (Supabase Storage):
https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/gallery/gallery/photos/1J3A0044-Edit-Edit.png
```

---

## 4. Migration Phases

### Phase 4A — Bucket Creation (current)
- Script: `scripts/migration/create-supabase-buckets.ts`
- Dry-run by default; requires `--apply` to create buckets
- Idempotent: safe to run multiple times

### Phase 4B — Asset Upload (current)
- Script: `scripts/migration/upload-assets-to-supabase.ts`
- Reads `docs/migration/asset-manifest.json`
- Dry-run by default; requires `--apply` to upload
- Writes `docs/migration/upload-plan.json` in dry-run
- Writes `docs/migration/url-map.json` when applied

### Phase 4C — URL Update (future)
- Update `server/storage.ts` to use Supabase Storage
- Update any hardcoded Manus CDN URLs in database
- Use `docs/migration/url-map.json` to map old URLs → new URLs

### Phase 4D — Database URL Update (future — post DB migration)
After Phase 2 (database migration to Supabase PostgreSQL):
```sql
-- Update image orders
UPDATE image_orders SET imageOrder = replace(imageOrder, 'files.manuscdn.com', 'frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public');

-- Update blog hero images
UPDATE blog_posts SET heroImage = replace(heroImage, 'files.manuscdn.com', 'frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/gallery') WHERE heroImage LIKE '%manuscdn.com%';

-- Update product images  
UPDATE products SET image = replace(image, 'files.manuscdn.com', 'frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/gallery') WHERE image LIKE '%manuscdn.com%';
```

---

## 5. Required Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Railway + local `.env` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Railway + local `.env` | Service role key for admin storage operations |
| `VITE_SUPABASE_ANON_KEY` | Railway + local `.env` | Anon key (already set) |

---

## 6. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `duke-edits` / `duke-backups` already exist with different settings | Low | Script reports warning, does not modify |
| Large file count (1,780 files) causes timeout | Medium | Use `--limit N` to batch |
| Duplicate uploads waste bandwidth | Low | `upsert: true` skips if same content |
| Manus CDN goes offline before download | High | Download ASAP once DB is migrated |
| Public bucket exposes private images | Low | Duke/agency buckets are private |

---

## 7. Rollback Plan

Storage changes are additive only:
- No files are deleted from local static directory
- No database URLs are changed until Phase 4D
- Buckets can be deleted from Supabase dashboard if needed
- Application continues to serve from `client/public/images/` until `server/storage.ts` is updated

**No rollback is needed for Phase 4 — it does not change runtime behavior.**
