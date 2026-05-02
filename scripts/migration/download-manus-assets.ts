/**
 * download-manus-assets.ts
 *
 * Phase 2 Migration Script — Step 1 of 3
 *
 * Downloads all assets listed in /docs/migration/asset-manifest.json from their
 * source locations. Supports two source types:
 *   1. Local static files in client/public/ (most assets)
 *   2. Remote HTTP/S URLs (video reel, SEO images already on allenhenson.com)
 *
 * Usage:
 *   pnpm tsx scripts/migration/download-manus-assets.ts
 *   pnpm tsx scripts/migration/download-manus-assets.ts --dry-run    (default)
 *   pnpm tsx scripts/migration/download-manus-assets.ts --live
 *
 * Output:
 *   /tmp/migration-downloads/<targetBucket>/<targetPath>
 *   Updates asset-manifest.json status: "pending" → "downloaded" | "error"
 *
 * NOTE: This script does NOT run automatically. Review dry-run output before
 *       running with --live.
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { pipeline } from "stream/promises";

// ─── Config ───────────────────────────────────────────────────────────────────

const MANIFEST_PATH = path.resolve("docs/migration/asset-manifest.json");
const REPO_ROOT = path.resolve(".");
const STATIC_BASE = path.join(REPO_ROOT, "client/public");
const DOWNLOAD_DIR = "/tmp/migration-downloads";

const IS_DRY_RUN = !process.argv.includes("--live");

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManifestEntry {
  sourceUrl: string;
  sourceLocation: string;
  lineNumber?: number;
  assetType: string;
  targetBucket: string;
  targetPath: string;
  status: "pending" | "downloaded" | "skipped" | "error" | "duplicate";
  errorMessage?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isRemoteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function resolveLocalPath(sourceUrl: string): string | null {
  // e.g. /images/AHP-Logo.png → client/public/images/AHP-Logo.png
  if (sourceUrl.startsWith("/")) {
    return path.join(STATIC_BASE, sourceUrl);
  }
  return null;
}

function buildDownloadPath(entry: ManifestEntry): string {
  return path.join(DOWNLOAD_DIR, entry.targetPath);
}

async function downloadRemote(url: string, destPath: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  const file = fs.createWriteStream(destPath);
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https://") ? https : http;
    client
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(destPath);
          downloadRemote(response.headers.location!, destPath)
            .then(resolve)
            .catch(reject);
          return;
        }
        if (response.statusCode !== 200) {
          reject(
            new Error(`HTTP ${response.statusCode} for ${url}`)
          );
          return;
        }
        pipeline(response, file).then(resolve).catch(reject);
      })
      .on("error", reject);
  });
}

async function copyLocal(sourcePath: string, destPath: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  await fs.promises.copyFile(sourcePath, destPath);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Phase 2 Migration — download-manus-assets.ts");
  console.log(`  Mode: ${IS_DRY_RUN ? "DRY RUN (pass --live to execute)" : "LIVE"}`);
  console.log("═══════════════════════════════════════════════════\n");

  // Load manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Manifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }
  const manifest: ManifestEntry[] = JSON.parse(
    fs.readFileSync(MANIFEST_PATH, "utf-8")
  );

  const pending = manifest.filter(
    (e) => e.status === "pending"
  );

  console.log(`📋 Manifest entries: ${manifest.length}`);
  console.log(`⏳ Pending downloads: ${pending.length}\n`);

  let downloaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of manifest) {
    if (entry.status === "duplicate") {
      console.log(`  ⏭  SKIP (duplicate): ${entry.sourceUrl}`);
      skipped++;
      continue;
    }

    if (entry.status !== "pending") {
      skipped++;
      continue;
    }

    const destPath = buildDownloadPath(entry);

    // Skip if already downloaded
    if (fs.existsSync(destPath)) {
      console.log(`  ✅ EXISTS: ${entry.targetPath}`);
      entry.status = "downloaded";
      skipped++;
      continue;
    }

    if (isRemoteUrl(entry.sourceUrl)) {
      // Remote download
      console.log(`  ⬇  REMOTE: ${entry.sourceUrl}`);
      console.log(`         → ${destPath}`);

      if (!IS_DRY_RUN) {
        try {
          await downloadRemote(entry.sourceUrl, destPath);
          entry.status = "downloaded";
          downloaded++;
          console.log(`      ✅ Downloaded`);
        } catch (err) {
          entry.status = "error";
          entry.errorMessage = String(err);
          errors++;
          console.error(`      ❌ Error: ${err}`);
        }
      } else {
        console.log(`      [dry-run] would download`);
        downloaded++;
      }
    } else {
      // Local file copy
      const localPath = resolveLocalPath(entry.sourceUrl);

      if (!localPath) {
        console.log(`  ⚠️  UNKNOWN source: ${entry.sourceUrl}`);
        entry.status = "error";
        entry.errorMessage = "Cannot resolve source path";
        errors++;
        continue;
      }

      if (!fs.existsSync(localPath)) {
        console.log(`  ⚠️  MISSING local file: ${localPath}`);
        entry.status = "error";
        entry.errorMessage = `Local file not found: ${localPath}`;
        errors++;
        continue;
      }

      const stat = fs.statSync(localPath);
      console.log(
        `  📁 LOCAL: ${entry.sourceUrl} (${(stat.size / 1024).toFixed(1)} KB)`
      );
      console.log(`       → ${destPath}`);

      if (!IS_DRY_RUN) {
        try {
          await copyLocal(localPath, destPath);
          entry.status = "downloaded";
          downloaded++;
        } catch (err) {
          entry.status = "error";
          entry.errorMessage = String(err);
          errors++;
          console.error(`      ❌ Error: ${err}`);
        }
      } else {
        downloaded++;
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log(`  ✅ Downloaded: ${downloaded}`);
  console.log(`  ⏭  Skipped:   ${skipped}`);
  console.log(`  ❌ Errors:    ${errors}`);
  console.log("═══════════════════════════════════════════════════\n");

  // Write updated manifest
  if (!IS_DRY_RUN) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`📝 Updated manifest: ${MANIFEST_PATH}`);
  } else {
    console.log("[dry-run] Manifest not modified.");
  }

  console.log(`\nNext step: run upload-assets-to-supabase.ts`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
