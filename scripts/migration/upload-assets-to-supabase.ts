/**
 * upload-assets-to-supabase.ts
 *
 * Phase 2 Migration Script — Step 2 of 3
 *
 * Uploads all downloaded assets (status: "downloaded") from
 * /tmp/migration-downloads/ to Supabase Storage buckets as defined
 * in /docs/migration/asset-manifest.json.
 *
 * Prerequisites:
 *   - Run download-manus-assets.ts first
 *   - Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 *
 * Usage:
 *   VITE_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=service_role_key_here \
 *   pnpm tsx scripts/migration/upload-assets-to-supabase.ts
 *
 *   # Dry run (default — does NOT upload):
 *   pnpm tsx scripts/migration/upload-assets-to-supabase.ts --dry-run
 *
 *   # Live upload:
 *   pnpm tsx scripts/migration/upload-assets-to-supabase.ts --live
 *
 *   # Upload specific bucket only:
 *   pnpm tsx scripts/migration/upload-assets-to-supabase.ts --live --bucket gallery
 *
 * Output:
 *   Updates asset-manifest.json status: "downloaded" → "uploaded" | "error"
 *   Writes /docs/migration/url-map.json (source URL → Supabase public URL)
 *
 * NOTE: Large files (video) require extended timeouts. The video bucket upload
 *       may take several minutes.
 */

import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Config ───────────────────────────────────────────────────────────────────

const MANIFEST_PATH = path.resolve("docs/migration/asset-manifest.json");
const URL_MAP_PATH = path.resolve("docs/migration/url-map.json");
const DOWNLOAD_DIR = "/tmp/migration-downloads";

const IS_DRY_RUN = !process.argv.includes("--live");
const BUCKET_FILTER = (() => {
  const idx = process.argv.indexOf("--bucket");
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

// MIME type map
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManifestEntry {
  sourceUrl: string;
  sourceLocation: string;
  lineNumber?: number;
  assetType: string;
  targetBucket: string;
  targetPath: string;
  status: "pending" | "downloaded" | "uploaded" | "skipped" | "error" | "duplicate";
  uploadedUrl?: string;
  errorMessage?: string;
}

type UrlMap = Record<string, string>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

function getPublicUrl(supabase: SupabaseClient, bucket: string, storagePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function uploadToSupabase(
  supabase: SupabaseClient,
  bucket: string,
  storagePath: string,
  localPath: string
): Promise<{ publicUrl: string }> {
  const fileBuffer = fs.readFileSync(localPath);
  const contentType = getContentType(localPath);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true, // overwrite if exists
    });

  if (error) {
    throw new Error(`Supabase upload error: ${error.message}`);
  }

  const publicUrl = getPublicUrl(supabase, bucket, storagePath);
  return { publicUrl };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Phase 2 Migration — upload-assets-to-supabase.ts");
  console.log(`  Mode: ${IS_DRY_RUN ? "DRY RUN (pass --live to execute)" : "LIVE"}`);
  if (BUCKET_FILTER) {
    console.log(`  Bucket filter: ${BUCKET_FILTER}`);
  }
  console.log("═══════════════════════════════════════════════════\n");

  // Validate env vars
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "❌ VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
    process.exit(1);
  }

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Load manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Manifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }
  const manifest: ManifestEntry[] = JSON.parse(
    fs.readFileSync(MANIFEST_PATH, "utf-8")
  );

  // Load existing URL map or create new one
  const urlMap: UrlMap = fs.existsSync(URL_MAP_PATH)
    ? JSON.parse(fs.readFileSync(URL_MAP_PATH, "utf-8"))
    : {};

  const toUpload = manifest.filter(
    (e) =>
      e.status === "downloaded" &&
      (!BUCKET_FILTER || e.targetBucket === BUCKET_FILTER)
  );

  console.log(`📋 Manifest entries: ${manifest.length}`);
  console.log(`⬆  Ready to upload: ${toUpload.length}\n`);

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  // Group by bucket for logging
  const buckets = [...new Set(toUpload.map((e) => e.targetBucket))];
  console.log(`📦 Buckets: ${buckets.join(", ")}\n`);

  for (const entry of manifest) {
    if (entry.status !== "downloaded") {
      if (entry.status === "uploaded") skipped++;
      continue;
    }

    if (BUCKET_FILTER && entry.targetBucket !== BUCKET_FILTER) {
      skipped++;
      continue;
    }

    const localPath = path.join(DOWNLOAD_DIR, entry.targetPath);

    if (!fs.existsSync(localPath)) {
      console.error(`  ❌ MISSING local file: ${localPath}`);
      entry.status = "error";
      entry.errorMessage = `Downloaded file not found: ${localPath}. Run download-manus-assets.ts first.`;
      errors++;
      continue;
    }

    const stat = fs.statSync(localPath);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(2);

    // Extract storage path (remove bucket prefix from targetPath)
    // targetPath format: "<bucket>/<rest/of/path>"
    const storagePath = entry.targetPath.replace(
      new RegExp(`^${entry.targetBucket}/`),
      ""
    );

    console.log(
      `  ⬆  [${entry.targetBucket}] ${storagePath} (${sizeMB} MB)`
    );

    if (!IS_DRY_RUN) {
      try {
        const { publicUrl } = await uploadToSupabase(
          supabase,
          entry.targetBucket,
          storagePath,
          localPath
        );
        entry.status = "uploaded";
        entry.uploadedUrl = publicUrl;
        urlMap[entry.sourceUrl] = publicUrl;
        uploaded++;
        console.log(`      ✅ ${publicUrl}`);
      } catch (err) {
        entry.status = "error";
        entry.errorMessage = String(err);
        errors++;
        console.error(`      ❌ ${err}`);
      }
    } else {
      const dryPublicUrl = `${supabaseUrl}/storage/v1/object/public/${entry.targetPath}`;
      console.log(`      [dry-run] would upload → ${dryPublicUrl}`);
      uploaded++;
    }
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log(`  ✅ Uploaded: ${uploaded}`);
  console.log(`  ⏭  Skipped: ${skipped}`);
  console.log(`  ❌ Errors:  ${errors}`);
  console.log("═══════════════════════════════════════════════════\n");

  if (!IS_DRY_RUN) {
    // Write updated manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`📝 Updated manifest: ${MANIFEST_PATH}`);

    // Write URL map
    fs.writeFileSync(URL_MAP_PATH, JSON.stringify(urlMap, null, 2));
    console.log(`🗺  URL map written: ${URL_MAP_PATH}`);
  } else {
    console.log("[dry-run] Manifest and URL map not modified.");
  }

  console.log("\nNext step: run generate-url-map.ts to finalize the URL map");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
