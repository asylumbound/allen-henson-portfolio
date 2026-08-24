/**
 * Asset URL helper — resolves image paths to Supabase CDN when configured,
 * falls back to local Railway-served paths for zero-downtime migration.
 *
 * Usage:
 *   import { assetUrl } from "@/lib/assets";
 *   <img src={assetUrl("/images/AHP-Logo.png")} />
 *
 * Bucket mapping (Supabase project: frgdgcpmrshimyxsamdr):
 *   /images/<file>          → portfolio-images/<file>
 *   /images/journal/<file>  → journal-images/<file>
 *   /images/product/<file>  → product-images/<file>
 *   /images/sales/<file>    → sales-images/<file>
 *   /images/duke/<file>     → duke-images/<file>
 */

import { normalizeBaseUrl } from "@shared/supabaseUrl";

const CDN_BASE = normalizeBaseUrl(
  (import.meta.env.VITE_SUPABASE_CDN_URL as string | undefined) ?? ""
);
const STORAGE_PATH = "/storage/v1/object/public";

// Files with special characters that were renamed on upload
const SANITIZED_NAMES: Record<string, string> = {
  "a_walk_to_the_Cafe_-_Paris_June_[CAFE001-015]-400.webp": "a_walk_to_the_Cafe_-_Paris_June_CAFE001-015-400.webp",
  "a_walk_to_the_Cafe_-_Paris_June_[CAFE001-015]-800.webp": "a_walk_to_the_Cafe_-_Paris_June_CAFE001-015-800.webp",
  "a_walk_to_the_Cafe_-_Paris_June_[CAFE001-015].webp":     "a_walk_to_the_Cafe_-_Paris_June_CAFE001-015.webp",
};

function getBucketAndKey(path: string): { bucket: string; key: string } | null {
  // path must start with /images/
  if (!path.startsWith("/images/")) return null;

  const rest = path.slice("/images/".length); // e.g. "journal/foo.jpg" or "AHP-Logo.png"
  const slashIdx = rest.indexOf("/");

  const subfolders = ["journal", "product", "sales", "duke"];

  if (slashIdx !== -1) {
    const folder = rest.slice(0, slashIdx);
    if (subfolders.includes(folder)) {
      const filename = rest.slice(slashIdx + 1);
      const sanitized = SANITIZED_NAMES[filename] ?? filename;
      return { bucket: `${folder}-images`, key: sanitized };
    }
  }

  // Root-level portfolio image
  const sanitized = SANITIZED_NAMES[rest] ?? rest;
  return { bucket: "portfolio-images", key: sanitized };
}

/**
 * Resolves a local /images/ path to the appropriate CDN URL.
 * Returns the original path unchanged if CDN is not configured
 * or if the path is not an /images/ path.
 */
export function assetUrl(path: string): string {
  if (!CDN_BASE || !path) return path;

  const resolved = getBucketAndKey(path);
  if (!resolved) return path;

  return `${CDN_BASE}${STORAGE_PATH}/${resolved.bucket}/${resolved.key}`;
}

/**
 * Same as assetUrl but for WebP variants.
 * Handles paths that may already have a .webp extension.
 */
export function assetUrlWebp(path: string): string {
  return assetUrl(path);
}
