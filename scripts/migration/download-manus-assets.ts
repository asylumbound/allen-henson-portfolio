/**
 * scripts/migration/download-manus-assets.ts
 *
 * Downloads remote Manus CDN assets (and optionally copies local static files)
 * into tmp/migration-downloads/ for later upload to Supabase Storage.
 *
 * Usage:
 *   npx tsx scripts/migration/download-manus-assets.ts              # dry-run (default)
 *   npx tsx scripts/migration/download-manus-assets.ts --apply      # actually write files
 *   npx tsx scripts/migration/download-manus-assets.ts --limit 10   # limit to first N entries
 *   npx tsx scripts/migration/download-manus-assets.ts --filter gallery  # filter by bucket
 *   npx tsx scripts/migration/download-manus-assets.ts --asset-type gallery-photos
 *
 * Source types:
 *   - Remote URLs (https://):  download via HTTP
 *   - Local paths (client/public/...): copy from filesystem
 *
 * Output directory: tmp/migration-downloads/
 * Note: tmp/ is in .gitignore — downloaded files are never committed.
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

interface DownloadResult {
  sourceLocation: string;
  targetPath: string;
  localPath: string;
  status: "downloaded" | "copied" | "skipped" | "failed" | "pending";
  error?: string;
}

const MANIFEST_PATH = "docs/migration/asset-manifest.json";
const DOWNLOAD_DIR = "tmp/migration-downloads";

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

async function downloadUrl(
  url: string,
  destPath: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buffer);
    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function copyLocalFile(
  sourcePath: string,
  destPath: string
): { ok: boolean; error?: string } {
  try {
    if (!fs.existsSync(sourcePath)) {
      return { ok: false, error: `Source file not found: ${sourcePath}` };
    }
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(sourcePath, destPath);
    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main(): Promise<void> {
  if (DRY_RUN) {
    console.log(
      "\n🔍 DRY-RUN MODE — no files will be written. Pass --apply to execute.\n"
    );
  } else {
    console.log(`\n🚀 APPLY MODE — writing files to ${DOWNLOAD_DIR}/\n`);
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

  const results: DownloadResult[] = [];
  let downloaded = 0;
  let copied = 0;
  let failed = 0;
  let skipped = 0;

  for (const entry of entries) {
    const isRemote = entry.sourceLocation.startsWith("http");
    const localDestPath = path.join(DOWNLOAD_DIR, entry.targetPath);

    if (DRY_RUN) {
      const action = isRemote ? "would-download" : "would-copy";
      console.log(`  [DRY-RUN] ${action}: ${entry.sourceLocation} → ${localDestPath}`);
      results.push({
        sourceLocation: entry.sourceLocation,
        targetPath: entry.targetPath,
        localPath: localDestPath,
        status: "pending",
      });
      continue;
    }

    // Skip if already exists
    if (fs.existsSync(localDestPath)) {
      results.push({
        sourceLocation: entry.sourceLocation,
        targetPath: entry.targetPath,
        localPath: localDestPath,
        status: "skipped",
      });
      skipped++;
      continue;
    }

    if (isRemote) {
      const result = await downloadUrl(entry.sourceLocation, localDestPath);
      if (result.ok) {
        downloaded++;
        results.push({
          sourceLocation: entry.sourceLocation,
          targetPath: entry.targetPath,
          localPath: localDestPath,
          status: "downloaded",
        });
        console.log(`  ✅ Downloaded: ${entry.sourceLocation}`);
      } else {
        failed++;
        results.push({
          sourceLocation: entry.sourceLocation,
          targetPath: entry.targetPath,
          localPath: localDestPath,
          status: "failed",
          error: result.error,
        });
        console.log(`  ❌ Failed: ${entry.sourceLocation} — ${result.error}`);
      }
    } else {
      const result = copyLocalFile(entry.sourceLocation, localDestPath);
      if (result.ok) {
        copied++;
        results.push({
          sourceLocation: entry.sourceLocation,
          targetPath: entry.targetPath,
          localPath: localDestPath,
          status: "copied",
        });
      } else {
        failed++;
        results.push({
          sourceLocation: entry.sourceLocation,
          targetPath: entry.targetPath,
          localPath: localDestPath,
          status: "failed",
          error: result.error,
        });
        console.log(`  ❌ Failed to copy: ${entry.sourceLocation} — ${result.error}`);
      }
    }
  }

  console.log("\n--- Summary ---");
  if (DRY_RUN) {
    const remoteCount = entries.filter((e) =>
      e.sourceLocation.startsWith("http")
    ).length;
    const localCount = entries.length - remoteCount;
    console.log(`  Would download (remote): ${remoteCount}`);
    console.log(`  Would copy (local):      ${localCount}`);
    console.log(`  Total:                   ${entries.length}`);
    console.log(
      `\n  Run with --apply to write files to ${DOWNLOAD_DIR}/\n`
    );
  } else {
    console.log(`  Downloaded: ${downloaded}`);
    console.log(`  Copied:     ${copied}`);
    console.log(`  Skipped:    ${skipped}`);
    console.log(`  Failed:     ${failed}`);
    console.log(`  Total:      ${entries.length}\n`);
  }
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
