/**
 * generate-url-map.ts
 *
 * Phase 2 Migration Script — Step 3 of 3
 *
 * Generates or finalizes /docs/migration/url-map.json — a complete mapping of
 * every source asset URL (relative path or external URL) to its new Supabase
 * Storage public URL. Also generates SQL UPDATE statements for DB rows that
 * reference old asset paths.
 *
 * This script can run in two modes:
 *   1. --from-manifest  (default): reads uploaded entries from asset-manifest.json
 *   2. --from-supabase: lists all files directly from Supabase Storage buckets
 *                       and builds the map from live data
 *
 * Usage:
 *   # Generate URL map from manifest (after upload step):
 *   VITE_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=service_role_key_here \
 *   pnpm tsx scripts/migration/generate-url-map.ts
 *
 *   # Generate URL map from live Supabase bucket listing:
 *   pnpm tsx scripts/migration/generate-url-map.ts --from-supabase
 *
 *   # Also generate SQL update statements for DB rows:
 *   pnpm tsx scripts/migration/generate-url-map.ts --emit-sql
 *
 * Output:
 *   /docs/migration/url-map.json
 *   /docs/migration/db-url-update.sql  (when --emit-sql is passed)
 *
 * NOTE: Dry-run by default. Pass --live to write output files.
 */

import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Config ───────────────────────────────────────────────────────────────────

const MANIFEST_PATH = path.resolve("docs/migration/asset-manifest.json");
const URL_MAP_PATH = path.resolve("docs/migration/url-map.json");
const SQL_OUTPUT_PATH = path.resolve("docs/migration/db-url-update.sql");

const IS_DRY_RUN = !process.argv.includes("--live");
const FROM_SUPABASE = process.argv.includes("--from-supabase");
const EMIT_SQL = process.argv.includes("--emit-sql");

const BUCKETS = ["gallery", "app-assets", "video", "duke-edits"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManifestEntry {
  sourceUrl: string;
  sourceLocation: string;
  assetType: string;
  targetBucket: string;
  targetPath: string;
  status: string;
  uploadedUrl?: string;
}

type UrlMap = Record<string, string>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build URL map from manifest entries that have been uploaded.
 */
function buildFromManifest(manifest: ManifestEntry[], supabaseUrl: string): UrlMap {
  const map: UrlMap = {};

  for (const entry of manifest) {
    if (entry.status !== "uploaded" && !entry.uploadedUrl) continue;

    const publicUrl =
      entry.uploadedUrl ||
      `${supabaseUrl}/storage/v1/object/public/${entry.targetPath}`;

    map[entry.sourceUrl] = publicUrl;
  }

  return map;
}

/**
 * Build URL map by listing all files from live Supabase Storage buckets.
 * More reliable than manifest if uploads were done outside this script.
 */
async function buildFromSupabase(
  supabase: SupabaseClient,
  supabaseUrl: string
): Promise<UrlMap> {
  const map: UrlMap = {};

  for (const bucket of BUCKETS) {
    console.log(`  📦 Listing bucket: ${bucket}`);

    // Supabase storage list has a max of 100 items per request; paginate
    let offset = 0;
    const pageSize = 100;

    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list("", {
        limit: pageSize,
        offset,
      });

      if (error) {
        console.error(`  ❌ Error listing ${bucket}: ${error.message}`);
        break;
      }

      if (!data || data.length === 0) break;

      for (const file of data) {
        // Reconstruct the original source URL from the storage path
        const storagePath = file.name;
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

        // Guess original source URL (relative path format)
        // Heuristic: gallery/photos/<file> → /images/<file>
        //            gallery/journal/<file> → /images/journal/<file>
        //            gallery/sales/<file> → /images/sales/<file>
        //            app-assets/logo/<file> → /images/<file>
        //            video/<file> → (full Supabase URL from old project)
        const sourceUrl = inferSourceUrl(bucket, storagePath);
        if (sourceUrl) {
          map[sourceUrl] = publicUrl;
        }

        // Always store the canonical mapping by target path
        map[`${bucket}/${storagePath}`] = publicUrl;
      }

      if (data.length < pageSize) break;
      offset += pageSize;
    }

    console.log(`    ✅ Processed ${offset} files from ${bucket}`);
  }

  return map;
}

/**
 * Infer original source URL from bucket + storage path.
 */
function inferSourceUrl(bucket: string, storagePath: string): string | null {
  const fileName = storagePath.split("/").pop() || storagePath;

  if (bucket === "gallery") {
    if (storagePath.startsWith("photos/")) {
      return `/images/${fileName}`;
    }
    if (storagePath.startsWith("journal/")) {
      return `/images/journal/${fileName}`;
    }
    if (storagePath.startsWith("sales/")) {
      return `/images/sales/${fileName}`;
    }
    if (storagePath.startsWith("product-photography/")) {
      return `/images/product/${fileName}`;
    }
  }

  if (bucket === "app-assets") {
    if (storagePath.startsWith("logo/") || storagePath.startsWith("about/")) {
      return `/images/${fileName}`;
    }
    if (storagePath.startsWith("blog/")) {
      return `/images/${fileName}`;
    }
  }

  if (bucket === "video") {
    // Old project URL
    return `https://vvfkredvyestpjmfyafh.supabase.co/storage/v1/object/public/video-assets/${fileName}`;
  }

  return null;
}

/**
 * Generate SQL UPDATE statements to update DB rows referencing old asset paths.
 * Targets:
 *   - blog_posts.heroImage (stored as relative /images/... paths)
 *   - image_orders.imageOrder (stored as JSON array of paths)
 *   - products.image and products.galleryImages
 */
function generateSql(urlMap: UrlMap): string {
  const lines: string[] = [
    "-- Auto-generated by generate-url-map.ts",
    "-- Run AFTER migrating assets to Supabase Storage",
    "-- Review carefully before executing in production",
    "",
    "-- ─── blog_posts.heroImage ───────────────────────────────────────────────",
    "",
  ];

  // blog_posts updates — each heroImage entry
  const blogEntries = Object.entries(urlMap).filter(([src]) =>
    src.startsWith("/images/") && !src.includes("/journal/") &&
    !src.includes("/sales/") && !src.includes("/product/")
  );

  for (const [oldUrl, newUrl] of blogEntries) {
    lines.push(
      `UPDATE blog_posts SET "heroImage" = '${newUrl}' WHERE "heroImage" = '${oldUrl}';`
    );
  }

  lines.push(
    "",
    "-- ─── products.image ───────────────────────────────────────────────────",
    ""
  );

  const salesEntries = Object.entries(urlMap).filter(([src]) =>
    src.startsWith("/images/sales/")
  );

  for (const [oldUrl, newUrl] of salesEntries) {
    lines.push(
      `UPDATE products SET "image" = '${newUrl}' WHERE "image" = '${oldUrl}';`
    );
  }

  lines.push(
    "",
    "-- ─── image_orders.imageOrder (JSON) ───────────────────────────────────",
    "-- NOTE: imageOrder is stored as a JSON text array. Use the application's",
    "-- saveImageOrder() function after updating photosImages[] arrays,",
    "-- or use jsonb_set for each path replacement:",
    ""
  );

  // Generic replacement hint
  for (const [oldUrl, newUrl] of blogEntries.slice(0, 3)) {
    lines.push(
      `-- UPDATE image_orders SET "imageOrder" = REPLACE("imageOrder", '${oldUrl}', '${newUrl}');`
    );
  }
  lines.push("-- ... (see full url-map.json for all replacements)");

  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Phase 2 Migration — generate-url-map.ts");
  console.log(`  Mode: ${IS_DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`  Source: ${FROM_SUPABASE ? "Supabase bucket listing" : "asset-manifest.json"}`);
  if (EMIT_SQL) console.log("  SQL: will emit db-url-update.sql");
  console.log("═══════════════════════════════════════════════════\n");

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error("❌ VITE_SUPABASE_URL must be set");
    process.exit(1);
  }

  let urlMap: UrlMap = {};

  if (FROM_SUPABASE) {
    if (!serviceRoleKey) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY must be set for --from-supabase");
      process.exit(1);
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log("📡 Listing files from Supabase Storage...\n");
    urlMap = await buildFromSupabase(supabase, supabaseUrl);
  } else {
    if (!fs.existsSync(MANIFEST_PATH)) {
      console.error(`❌ Manifest not found: ${MANIFEST_PATH}`);
      process.exit(1);
    }
    const manifest: ManifestEntry[] = JSON.parse(
      fs.readFileSync(MANIFEST_PATH, "utf-8")
    );

    // Merge with existing URL map if present
    const existing: UrlMap = fs.existsSync(URL_MAP_PATH)
      ? JSON.parse(fs.readFileSync(URL_MAP_PATH, "utf-8"))
      : {};

    urlMap = { ...existing, ...buildFromManifest(manifest, supabaseUrl) };
  }

  const entryCount = Object.keys(urlMap).length;
  console.log(`\n🗺  URL map entries: ${entryCount}`);

  // Print sample
  const sample = Object.entries(urlMap).slice(0, 5);
  console.log("\nSample mappings:");
  for (const [src, dest] of sample) {
    console.log(`  ${src}`);
    console.log(`    → ${dest}`);
  }

  if (!IS_DRY_RUN) {
    fs.writeFileSync(URL_MAP_PATH, JSON.stringify(urlMap, null, 2));
    console.log(`\n✅ URL map written: ${URL_MAP_PATH}`);

    if (EMIT_SQL) {
      const sql = generateSql(urlMap);
      fs.writeFileSync(SQL_OUTPUT_PATH, sql);
      console.log(`✅ SQL update statements written: ${SQL_OUTPUT_PATH}`);
    }
  } else {
    console.log("\n[dry-run] Files not written. Pass --live to write output.");
    if (EMIT_SQL) {
      const sql = generateSql(urlMap);
      console.log("\n── SQL Preview (first 20 lines) ──");
      console.log(sql.split("\n").slice(0, 20).join("\n"));
      console.log("...");
    }
  }

  console.log(`\n✅ Migration URL map complete.`);
  console.log(
    `   Use url-map.json to update hardcoded paths in client source files.`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
