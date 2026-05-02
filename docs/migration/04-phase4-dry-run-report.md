# 04 — Phase 4 Dry-Run Report
**Allen Henson Portfolio — Migration Preparation**
**Branch:** `copilot/verify-migration-files-existence`
**Generated:** 2026-05-02

---

## 1. Files Created / Changed

### New Documentation Files

| File | Status |
|---|---|
| `docs/migration/01-asset-inventory.md` | ✅ Created |
| `docs/migration/asset-manifest.json` | ✅ Created (1,780 entries) |
| `docs/migration/02-supabase-storage-plan.md` | ✅ Created |
| `docs/migration/03-supabase-db-prep.md` | ✅ Created |
| `docs/migration/04-phase4-dry-run-report.md` | ✅ Created (this file) |

### New Migration Scripts

| File | Status |
|---|---|
| `scripts/migration/create-supabase-buckets.ts` | ✅ Created |
| `scripts/migration/download-manus-assets.ts` | ✅ Created |
| `scripts/migration/upload-assets-to-supabase.ts` | ✅ Created |
| `scripts/migration/generate-url-map.ts` | ✅ Created |

### Generated Output Files (dry-run only)

| File | Status |
|---|---|
| `docs/migration/upload-plan.json` | ✅ Created (10 entries — limited with --limit 10) |
| `docs/migration/url-map.json` | ✅ Created (10 entries — limited with --limit 10) |

### `.gitignore` Change

**No change needed.** `tmp/` was already ignored, which covers `tmp/migration-downloads/`.

---

## 2. Bucket Setup Script Behavior

Script: `scripts/migration/create-supabase-buckets.ts`

### Design
- **Dry-run by default** — shows planned bucket topology without connecting to Supabase
- **`--apply` required** to actually create or update buckets
- **Idempotent** — if a bucket already exists with the correct visibility, no action is taken
- **Warning (not error)** if bucket exists with wrong visibility in dry-run; in `--apply` mode it updates with `updateBucket()`
- **Never deletes buckets or files**

### Offline Dry-Run Output (no env vars set)

```
Bucket         | Desired Visibility | Exists  | Action | Status
---------------+--------------------+---------+--------+----------------
gallery        | public             | unknown | CREATE | dry-run-create
app-assets     | public             | unknown | CREATE | dry-run-create
video          | public             | unknown | CREATE | dry-run-create
duke-edits     | public             | unknown | CREATE | dry-run-create
duke-backups   | private            | unknown | CREATE | dry-run-create
agency-private | private            | unknown | CREATE | dry-run-create
```

### Bucket Definitions

| Bucket | Visibility | Purpose |
|---|---|---|
| `gallery` | public | Portfolio photography (photos, journal, product-photography) |
| `app-assets` | public | Site UI assets (logos, icons, sales product images) |
| `video` | public | Video content (reserved) |
| `duke-edits` | public | Duke editor processed images |
| `duke-backups` | private | Duke editor backup originals |
| `agency-private` | private | Agency database private assets |

---

## 3. Download Dry-Run Results

Script: `scripts/migration/download-manus-assets.ts --limit 10`

```
🔍 DRY-RUN MODE — no files will be written.

Limiting to 10 entries
Total manifest entries: 1780
Entries to process: 10

[DRY-RUN] would-copy: client/public/images/1-2-scaled.jpg
    → tmp/migration-downloads/gallery/photos/1-2-scaled.jpg
[DRY-RUN] would-copy: client/public/images/1075842E-5BB5-49D3-9345-D3996E9C31C9.png
    → tmp/migration-downloads/gallery/photos/1075842E-5BB5-49D3-9345-D3996E9C31C9.png
... (10 total)

Would download (remote): 0
Would copy (local):      10
Total:                   10
```

**Note:** All 1,780 manifest entries are local static files (`client/public/images/`). There are currently 0 remote Manus CDN URLs in the manifest because the database is unreachable (TiDB wire-protocol mismatch). Remote Manus CDN URLs stored in the database (`image_orders.imageOrder`, `blog_posts.heroImage`, `products.image`) cannot be inventoried until the database is migrated to Supabase PostgreSQL.

---

## 4. Upload Dry-Run Results

Script: `scripts/migration/upload-assets-to-supabase.ts --limit 10`

```
🔍 DRY-RUN MODE — no files will be uploaded.

Limiting to 10 entries
Total manifest entries: 1780
Entries to process: 10

✅ Upload plan written to: docs/migration/upload-plan.json
Total pending: 10
```

---

## 5. Total Manifest Entries

| Asset Type | Count | Target Bucket | Path Prefix |
|---|---|---|---|
| `gallery-photos` | 173 | `gallery` | `gallery/photos/` |
| `gallery-journal` | 167 | `gallery` | `gallery/journal/` |
| `gallery-product-photography` | 204 | `gallery` | `gallery/product-photography/` |
| `sales` | 426 | `app-assets` | `sales/` |
| `duke` | 808 | `duke-edits` | `duke/` |
| `app-asset` | 2 | `app-assets` | `icons/` |
| **TOTAL** | **1,780** | | |

---

## 6. First 10 Planned Upload Entries

Source: `docs/migration/upload-plan.json`

| # | Source | Bucket | Target Path | Status |
|---|---|---|---|---|
| 1 | `client/public/images/1-2-scaled.jpg` | `gallery` | `gallery/photos/1-2-scaled.jpg` | pending |
| 2 | `client/public/images/1075842E-5BB5-49D3-9345-D3996E9C31C9.png` | `gallery` | `gallery/photos/1075842E-5BB5-49D3-9345-D3996E9C31C9.png` | pending |
| 3 | `client/public/images/1E55A0DC-6817-4165-B0EC-A3982798EA60.png` | `gallery` | `gallery/photos/1E55A0DC-6817-4165-B0EC-A3982798EA60.png` | pending |
| 4 | `client/public/images/1J3A0044-Edit-Edit.png` | `gallery` | `gallery/photos/1J3A0044-Edit-Edit.png` | pending |
| 5 | `client/public/images/1J3A0083-Edit.jpg` | `gallery` | `gallery/photos/1J3A0083-Edit.jpg` | pending |
| 6 | `client/public/images/1J3A0475-Edit-Edit-Edit-Edit-Edit.png` | `gallery` | `gallery/photos/1J3A0475-Edit-Edit-Edit-Edit-Edit.png` | pending |
| 7 | `client/public/images/1J3A0778-Edit-Edit-Edit-2-Edit-Edit.png` | `gallery` | `gallery/photos/1J3A0778-Edit-Edit-Edit-2-Edit-Edit.png` | pending |
| 8 | `client/public/images/1J3A1882-Edit.png` | `gallery` | `gallery/photos/1J3A1882-Edit.png` | pending |
| 9 | `client/public/images/1J3A2008.png` | `gallery` | `gallery/photos/1J3A2008.png` | pending |
| 10 | `client/public/images/1J3A2144-1-scaled.jpg` | `gallery` | `gallery/photos/1J3A2144-1-scaled.jpg` | pending |

---

## 7. Required Railway / Supabase Environment Variables

### Must Set Before `--apply`

| Variable | Where to Find | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key | Admin key for storage operations |

### Already Set in Railway (verify)

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_ANON_KEY` | Public anon key (already configured) |
| `DATABASE_URL` | Must be updated to Supabase PostgreSQL URL (Phase 3 prerequisite) |

---

## 8. Commands to Run for Real Apply Mode

**Step 1: Create buckets**
```bash
# First verify credentials are set in your local .env or environment
VITE_SUPABASE_URL=https://frgdgcpmrshimyxsamdr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Create buckets
npx tsx scripts/migration/create-supabase-buckets.ts --apply
```

**Step 2: Upload all assets (in batches)**
```bash
# Upload gallery photos (173 files)
npx tsx scripts/migration/upload-assets-to-supabase.ts --apply --asset-type gallery-photos

# Upload gallery journal (167 files)
npx tsx scripts/migration/upload-assets-to-supabase.ts --apply --asset-type gallery-journal

# Upload gallery product-photography (204 files)
npx tsx scripts/migration/upload-assets-to-supabase.ts --apply --asset-type gallery-product-photography

# Upload sales images (426 files)
npx tsx scripts/migration/upload-assets-to-supabase.ts --apply --asset-type sales

# Upload duke images (808 files)
npx tsx scripts/migration/upload-assets-to-supabase.ts --apply --asset-type duke

# Upload app assets (2 files)
npx tsx scripts/migration/upload-assets-to-supabase.ts --apply --asset-type app-asset
```

**Step 3: Generate complete URL map**
```bash
npx tsx scripts/migration/generate-url-map.ts
```

**Or upload everything at once:**
```bash
npx tsx scripts/migration/upload-assets-to-supabase.ts --apply
```

---

## 9. pnpm check Result

**Status: FAILS (2 pre-existing errors — not caused by Phase 4 changes)**

```
client/src/pages/Duke.tsx:794:5 - error TS2304: Cannot find name 'setLightboxIndex'.
server/dukeEditor.ts:67:7 - error TS2769: No overload matches this call.
  Type 'Buffer<ArrayBufferLike>' is not assignable to type 'BodyInit | null | undefined'.
```

These errors existed before Phase 4. The migration scripts in `scripts/migration/` are not included in the TypeScript project (`tsconfig.json` targets `client/` and `server/` only). The scripts use `npx tsx` (ts-node runtime) and do not affect the build.

---

## 10. pnpm build Result

**Status: ✅ PASSES**

```
vite v7.1.9 building for production...
✓ 2378 modules transformed.
../dist/public/index.html                   368.35 kB │ gzip: 105.73 kB
../dist/public/assets/index-*.css           125.44 kB │ gzip:  19.66 kB
../dist/public/assets/index-*.js          1,165.45 kB │ gzip: 321.40 kB
✓ built in 20.05s

  dist/index.js  95.8kb
Done in 8ms
```

---

## 11. Risks Before Apply

| Risk | Severity | Notes |
|---|---|---|
| `duke-edits` bucket already exists in Supabase | Low | Script handles idempotently with warning |
| Service role key has insufficient permissions | Medium | Must be `service_role` not `anon` key |
| Large batch (1,780 files) causes rate limit | Medium | Use `--asset-type` batching |
| Files already in Supabase Storage get overwritten | Low | `upsert: true` is safe — updates if changed |
| `SUPABASE_SERVICE_ROLE_KEY` committed to git | **CRITICAL** | Never commit — keep in Railway env vars only |
| Manus CDN assets in DB not yet downloadable | High | Requires DB migration first (Phase 3 prerequisite) |

---

## 12. Validation Checklist After Apply

- [ ] `npx tsx scripts/migration/create-supabase-buckets.ts --apply` exits 0
- [ ] All 6 buckets visible in Supabase Dashboard → Storage
- [ ] `gallery` bucket has `gallery/photos/`, `gallery/journal/`, `gallery/product-photography/` folders
- [ ] `app-assets` bucket has `icons/` and `sales/` folders
- [ ] `duke-edits` bucket is public ✓
- [ ] `duke-backups` bucket is private ✓
- [ ] `agency-private` bucket is private ✓
- [ ] Sample public URL resolves: `{SUPABASE_URL}/storage/v1/object/public/gallery/gallery/photos/AH-Icon.png`
- [ ] `docs/migration/url-map.json` shows `status: "uploaded"` for all entries
- [ ] `pnpm build` still passes after uploads
- [ ] Application still serves from `client/public/images/` (no runtime behavior changed)

---

## 13. Confirmation: No Files Uploaded, No Runtime Behavior Changed

✅ **No files were uploaded** — all scripts ran in dry-run mode only.
✅ **No runtime behavior changed** — `server/storage.ts`, `server/routers.ts`, and all application code are untouched.
✅ **No database changes** — no SQL executed, no schema changes.
✅ **No Stripe/auth/routing/SendGrid changes** — all untouched.
✅ **No Manus dependencies removed** — all untouched.
✅ **`.gitignore` unchanged** — `tmp/` was already ignored.
✅ **`pnpm build` passes** — build output unchanged.
