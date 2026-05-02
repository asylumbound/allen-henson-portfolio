/**
 * scripts/migration/generate-url-map.ts
 *
 * Generates a URL mapping from old source URLs to new Supabase Storage URLs.
 * Reads the asset manifest and builds the mapping without uploading anything.
 *
 * Usage:
 *   npx tsx scripts/migration/generate-url-map.ts              # all entries
 *   npx tsx scripts/migration/generate-url-map.ts --limit 10
 *   npx tsx scripts/migration/generate-url-map.ts --filter gallery
 *   npx tsx scripts/migration/generate-url-map.ts --asset-type gallery-photos
 *
 * Output: docs/migration/url-map.json (preview — status will be "pending" until uploaded)
 *
 * Required env vars:
 *   VITE_SUPABASE_URL  (used to construct new URLs)
 */

import * as fs from "fs";
import * as path from "path";
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

interface UrlMap {
  generatedAt: string;
  sourceManifest: string;
  entries: UrlMapEntry[];
}

const MANIFEST_PATH = "docs/migration/asset-manifest.json";
const URL_MAP_PATH = "docs/migration/url-map.json";

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

function buildPublicUrl(
  supabaseUrl: string,
  bucket: string,
  filePath: string
): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "https://YOUR_PROJECT.supabase.co";

  if (!process.env.VITE_SUPABASE_URL) {
    console.log(
      "\n  ⚠️  VITE_SUPABASE_URL not set — URLs will use placeholder. Set the env var for real URLs.\n"
    );
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

  console.log(`\n  Total manifest entries: ${manifest.totalCount}`);
  console.log(`  Generating URL map for: ${entries.length} entries\n`);

  // If url-map.json already exists, merge uploaded/failed statuses
  const existingMap = new Map<string, UrlMapEntry>();
  if (fs.existsSync(URL_MAP_PATH)) {
    try {
      const existing: UrlMap = JSON.parse(
        fs.readFileSync(URL_MAP_PATH, "utf-8")
      );
      for (const e of existing.entries) {
        existingMap.set(e.targetPath, e);
      }
      console.log(
        `  Merging with existing url-map.json (${existingMap.size} entries)\n`
      );
    } catch {
      // ignore parse errors
    }
  }

  const urlMapEntries: UrlMapEntry[] = entries.map((entry) => {
    const newUrl = buildPublicUrl(supabaseUrl, entry.targetBucket, entry.targetPath);
    const existing = existingMap.get(entry.targetPath);

    return {
      sourceUrl: entry.sourceUrl,
      sourceLocation: entry.sourceLocation,
      assetType: entry.assetType,
      targetBucket: entry.targetBucket,
      targetPath: entry.targetPath,
      newUrl,
      status: existing?.status ?? "pending",
      error: existing?.error ?? null,
    };
  });

  const urlMap: UrlMap = {
    generatedAt: new Date().toISOString(),
    sourceManifest: MANIFEST_PATH,
    entries: urlMapEntries,
  };

  fs.writeFileSync(URL_MAP_PATH, JSON.stringify(urlMap, null, 2));

  const byStatus = urlMapEntries.reduce(
    (acc, e) => {
      acc[e.status] = (acc[e.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(`  ✅ URL map written to: ${URL_MAP_PATH}`);
  console.log(`  Status breakdown:`);
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`    ${status}: ${count}`);
  }

  console.log("\n  First 10 entries:");
  console.log(
    "  " + "-".repeat(80)
  );
  for (const entry of urlMapEntries.slice(0, 10)) {
    console.log(`  [${entry.status}] ${path.basename(entry.sourceLocation)}`);
    console.log(`    → ${entry.newUrl}`);
  }
  console.log("  " + "-".repeat(80) + "\n");
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
