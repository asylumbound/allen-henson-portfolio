/**
 * scripts/migration/upload-assets-to-supabase.ts
 *
 * Uploads assets from local filesystem to Supabase Storage.
 * Reads the asset manifest at docs/migration/asset-manifest.json.
 *
 * Usage:
 *   npx tsx scripts/migration/upload-assets-to-supabase.ts              # dry-run (default)
 *   npx tsx scripts/migration/upload-assets-to-supabase.ts --apply      # actually upload
 *   npx tsx scripts/migration/upload-assets-to-supabase.ts --limit 10
 *   npx tsx scripts/migration/upload-assets-to-supabase.ts --filter gallery
 *   npx tsx scripts/migration/upload-assets-to-supabase.ts --asset-type gallery-photos
 *
 * Dry-run output: docs/migration/upload-plan.json
 * Apply output:   docs/migration/url-map.json
 *
 * Required env vars:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

interface ManifestEntry {
  sourceUrl: string;
  sourceLocation: string;
  assetType: string;
  targetBucket: string;
  targetPath: string;
  status: string;
}

interface AssetManifest {
  generatedAt: string;
  totalCount: number;
  entries: ManifestEntry[];
}

interface UploadPlanEntry {
  sourceUrl: string;
  sourceLocation: string;
  assetType: string;
  targetBucket: string;
  targetPath: string;
  newUrl: string;
  status: "uploaded" | "skipped" | "failed" | "pending";
  error: string | null;
}

interface UploadPlan {
  generatedAt: string;
  sourceManifest: string;
  dryRun: boolean;
  totalManifestEntries: number;
  processedEntries: number;
  entries: UploadPlanEntry[];
}

interface UrlMap {
  generatedAt: string;
  sourceManifest: string;
  entries: UrlMapEntry[];
}

interface UrlMapEntry {
  sourceUrl: string;
  sourceLocation: string;
  assetType: string;
  targetBucket: string;
  targetPath: string;
  newUrl: string;
  status: "uploaded" | "skipped" | "failed" | "pending";
  error: string | null;
}

const MANIFEST_PATH = "docs/migration/asset-manifest.json";
const UPLOAD_PLAN_PATH = "docs/migration/upload-plan.json";
const URL_MAP_PATH = "docs/migration/url-map.json";

const DRY_RUN = !process.argv.includes("--apply");

function getLimit(): number | null {
  const idx = process.argv.indexOf("--limit");
  if (idx !== -1 && process.argv[idx + 1]) {
    const n = parseInt(process.argv[idx + 1], 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

function getFilter(): string | null {
  const idx = process.argv.indexOf("--filter");
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return null;
}

function getAssetType(): string | null {
  const idx = process.argv.indexOf("--asset-type");
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return null;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".pdf": "application/pdf",
    ".json": "application/json",
  };
  return mimeMap[ext] ?? "application/octet-stream";
}

function buildPublicUrl(supabaseUrl: string, bucket: string, filePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "https://YOUR_PROJECT.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!process.env.VITE_SUPABASE_URL) {
    console.log(
      "\n  ⚠️  VITE_SUPABASE_URL not set — URLs in plan will use placeholder.\n"
    );
  }

  if (!DRY_RUN && !serviceRoleKey) {
    console.error(
      "\n❌ Missing required env var for --apply: SUPABASE_SERVICE_ROLE_KEY\n"
    );
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log(
      "\n🔍 DRY-RUN MODE — no files will be uploaded. Pass --apply to execute.\n"
    );
  } else {
    console.log("\n🚀 APPLY MODE — uploading files to Supabase Storage.\n");
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Manifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const manifest: AssetManifest = JSON.parse(
    fs.readFileSync(MANIFEST_PATH, "utf-8")
  );

  const limit = getLimit();
  const filterBucket = getFilter();
  const filterAssetType = getAssetType();

  let entries = manifest.entries;

  if (filterBucket) {
    entries = entries.filter((e) => e.targetBucket === filterBucket);
    console.log(`  Filtering by bucket: ${filterBucket}`);
  }

  if (filterAssetType) {
    entries = entries.filter((e) => e.assetType === filterAssetType);
    console.log(`  Filtering by asset type: ${filterAssetType}`);
  }

  if (limit !== null) {
    entries = entries.slice(0, limit);
    console.log(`  Limiting to ${limit} entries`);
  }

  console.log(`  Total manifest entries: ${manifest.totalCount}`);
  console.log(`  Entries to process: ${entries.length}\n`);

  const supabase = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

  const planEntries: UploadPlanEntry[] = [];
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of entries) {
    const newUrl = buildPublicUrl(supabaseUrl, entry.targetBucket, entry.targetPath);

    if (DRY_RUN) {
      planEntries.push({
        sourceUrl: entry.sourceUrl,
        sourceLocation: entry.sourceLocation,
        assetType: entry.assetType,
        targetBucket: entry.targetBucket,
        targetPath: entry.targetPath,
        newUrl,
        status: "pending",
        error: null,
      });
      continue;
    }

    // APPLY mode: read file and upload
    if (!fs.existsSync(entry.sourceLocation)) {
      planEntries.push({
        sourceUrl: entry.sourceUrl,
        sourceLocation: entry.sourceLocation,
        assetType: entry.assetType,
        targetBucket: entry.targetBucket,
        targetPath: entry.targetPath,
        newUrl,
        status: "failed",
        error: `Source file not found: ${entry.sourceLocation}`,
      });
      failed++;
      console.log(`  ❌ Not found: ${entry.sourceLocation}`);
      continue;
    }

    try {
      const fileBuffer = fs.readFileSync(entry.sourceLocation);
      const contentType = getMimeType(entry.sourceLocation);

      const { error: uploadError } = await supabase!.storage
        .from(entry.targetBucket)
        .upload(entry.targetPath, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        planEntries.push({
          sourceUrl: entry.sourceUrl,
          sourceLocation: entry.sourceLocation,
          assetType: entry.assetType,
          targetBucket: entry.targetBucket,
          targetPath: entry.targetPath,
          newUrl,
          status: "failed",
          error: uploadError.message,
        });
        failed++;
        console.log(`  ❌ Upload failed: ${entry.targetPath} — ${uploadError.message}`);
      } else {
        planEntries.push({
          sourceUrl: entry.sourceUrl,
          sourceLocation: entry.sourceLocation,
          assetType: entry.assetType,
          targetBucket: entry.targetBucket,
          targetPath: entry.targetPath,
          newUrl,
          status: "uploaded",
          error: null,
        });
        uploaded++;
        console.log(`  ✅ Uploaded: ${entry.targetPath}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      planEntries.push({
        sourceUrl: entry.sourceUrl,
        sourceLocation: entry.sourceLocation,
        assetType: entry.assetType,
        targetBucket: entry.targetBucket,
        targetPath: entry.targetPath,
        newUrl,
        status: "failed",
        error: msg,
      });
      failed++;
      console.log(`  ❌ Error: ${entry.targetPath} — ${msg}`);
    }
  }

  const now = new Date().toISOString();

  if (DRY_RUN) {
    // Write upload plan
    const plan: UploadPlan = {
      generatedAt: now,
      sourceManifest: MANIFEST_PATH,
      dryRun: true,
      totalManifestEntries: manifest.totalCount,
      processedEntries: planEntries.length,
      entries: planEntries,
    };
    fs.writeFileSync(UPLOAD_PLAN_PATH, JSON.stringify(plan, null, 2));
    console.log(`\n  ✅ Upload plan written to: ${UPLOAD_PLAN_PATH}`);
    console.log(`  Total pending: ${planEntries.length}`);
    console.log(`\n  Run with --apply to execute uploads.\n`);
  } else {
    // Write URL map
    const urlMap: UrlMap = {
      generatedAt: now,
      sourceManifest: MANIFEST_PATH,
      entries: planEntries.map((e) => ({
        sourceUrl: e.sourceUrl,
        sourceLocation: e.sourceLocation,
        assetType: e.assetType,
        targetBucket: e.targetBucket,
        targetPath: e.targetPath,
        newUrl: e.newUrl,
        status: e.status,
        error: e.error,
      })),
    };
    fs.writeFileSync(URL_MAP_PATH, JSON.stringify(urlMap, null, 2));
    console.log(`\n  ✅ URL map written to: ${URL_MAP_PATH}`);
    console.log(`  Uploaded: ${uploaded}`);
    console.log(`  Skipped:  ${skipped}`);
    console.log(`  Failed:   ${failed}`);
    console.log(`  Total:    ${planEntries.length}\n`);
  }
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
