// Storage helpers backed by Supabase Storage.
// Gallery uploads land in the same public buckets the site already serves
// images from (see client/src/lib/assets.ts for the serving-side mapping).

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://frgdgcpmrshimyxsamdr.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Upload keys arrive as "gallery/<gallery>/<file>" (see routers.ts and
// imageProcessing.ts). Map each gallery to its serving bucket; uploads get an
// "uploads/" prefix so CMS-added files never collide with migrated assets.
const GALLERY_BUCKETS: Record<string, string> = {
  photos: "portfolio-images",
  journal: "journal-images",
  "product-photography": "product-images",
};

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function resolveBucketAndPath(relKey: string): { bucket: string; path: string } {
  const key = normalizeKey(relKey);
  const match = key.match(/^gallery\/([^/]+)\/(.+)$/);
  if (match && GALLERY_BUCKETS[match[1]]) {
    return { bucket: GALLERY_BUCKETS[match[1]], path: `uploads/${match[2]}` };
  }
  // Anything else goes into the portfolio bucket under its full key
  return { bucket: "portfolio-images", path: `misc/${key}` };
}

function publicUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error(
      "Storage credentials missing: set SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  const key = normalizeKey(relKey);
  const { bucket, path } = resolveBucketAndPath(key);
  const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body,
    }
  );

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }

  return { key, url: publicUrl(bucket, path) };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const { bucket, path } = resolveBucketAndPath(key);
  return { key, url: publicUrl(bucket, path) };
}
