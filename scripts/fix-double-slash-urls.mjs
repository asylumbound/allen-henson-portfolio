#!/usr/bin/env node
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");
const DRY_RUN = !APPLY;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is required");
  process.exit(1);
}

const db = postgres(process.env.DATABASE_URL, { ssl: "require" });

function normalizeStorageUrlPath(url) {
  if (typeof url !== "string" || !url.includes("supabase.co")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const normalizedPath = parsed.pathname.replace(/\/{2,}/g, "/");
    if (normalizedPath === parsed.pathname) {
      return url;
    }
    parsed.pathname = normalizedPath;
    return parsed.toString();
  } catch {
    return url;
  }
}

function printDiff(table, rowId, before, after, context = "") {
  console.log(`\n[${table}] row=${rowId}${context ? ` ${context}` : ""}`);
  console.log(`- ${before}`);
  console.log(`+ ${after}`);
}

async function main() {
  const summary = {
    rowsScanned: 0,
    rowsChanged: 0,
    urlsFixed: 0,
  };

  console.log(
    DRY_RUN
      ? "🔎 Running in DRY-RUN mode (no writes). Pass --apply to persist changes."
      : "⚠️ Running in APPLY mode (writes enabled)."
  );
  console.log(
    "ℹ️  Normalization only touches duplicate slashes in URL pathname (after host); protocol separators like https:// are preserved."
  );

  const imageOrderRows = await db`
    select id, gallery, "imageOrder"
    from image_orders
    order by id asc
  `;
  summary.rowsScanned += imageOrderRows.length;

  for (const row of imageOrderRows) {
    let parsed;
    try {
      parsed = JSON.parse(row.imageOrder);
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) {
      continue;
    }

    let rowFixes = 0;
    const normalized = parsed.map((entry) => {
      if (typeof entry !== "string") return entry;
      const fixed = normalizeStorageUrlPath(entry);
      if (fixed !== entry) rowFixes += 1;
      return fixed;
    });

    if (rowFixes === 0) continue;

    const before = JSON.stringify(parsed);
    const after = JSON.stringify(normalized);

    printDiff("image_orders", row.id, before, after, `(gallery=${row.gallery})`);
    summary.rowsChanged += 1;
    summary.urlsFixed += rowFixes;

    if (!DRY_RUN) {
      await db`
        update image_orders
        set "imageOrder" = ${after},
            "updatedAt" = now()
        where id = ${row.id}
      `;
    }
  }

  const blogRows = await db`
    select id, slug, "heroImage"
    from blog_posts
    where "heroImage" is not null and "heroImage" <> ''
    order by id asc
  `;
  summary.rowsScanned += blogRows.length;

  for (const row of blogRows) {
    const fixed = normalizeStorageUrlPath(row.heroImage);
    if (fixed === row.heroImage) continue;

    printDiff("blog_posts", row.id, row.heroImage, fixed, `(slug=${row.slug})`);
    summary.rowsChanged += 1;
    summary.urlsFixed += 1;

    if (!DRY_RUN) {
      await db`
        update blog_posts
        set "heroImage" = ${fixed},
            "updatedAt" = now()
        where id = ${row.id}
      `;
    }
  }

  const productRows = await db`
    select id, slug, image, "galleryImages"
    from products
    order by id asc
  `;
  summary.rowsScanned += productRows.length;

  for (const row of productRows) {
    let changed = false;
    let rowFixes = 0;
    let nextImage = row.image;
    let nextGalleryImages = row.galleryImages;

    if (typeof row.image === "string" && row.image.length > 0) {
      const fixedImage = normalizeStorageUrlPath(row.image);
      if (fixedImage !== row.image) {
        printDiff("products.image", row.id, row.image, fixedImage, `(slug=${row.slug})`);
        nextImage = fixedImage;
        changed = true;
        rowFixes += 1;
      }
    }

    if (typeof row.galleryImages === "string" && row.galleryImages.length > 0) {
      try {
        const parsed = JSON.parse(row.galleryImages);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((entry) => {
            if (typeof entry !== "string") return entry;
            const fixed = normalizeStorageUrlPath(entry);
            if (fixed !== entry) rowFixes += 1;
            return fixed;
          });
          const before = JSON.stringify(parsed);
          const after = JSON.stringify(normalized);
          if (before !== after) {
            printDiff("products.galleryImages", row.id, before, after, `(slug=${row.slug})`);
            nextGalleryImages = after;
            changed = true;
          }
        }
      } catch {
        // Ignore malformed JSON
      }
    }

    if (!changed) continue;

    summary.rowsChanged += 1;
    summary.urlsFixed += rowFixes;

    if (!DRY_RUN) {
      await db`
        update products
        set image = ${nextImage},
            "galleryImages" = ${nextGalleryImages},
            "updatedAt" = now()
        where id = ${row.id}
      `;
    }
  }

  const syncChecks = await db`
    select
      coalesce(sum(case when storage_path like 'http://%' or storage_path like 'https://%' then 1 else 0 end), 0)::int as full_url_storage_paths,
      coalesce(sum(case when storage_path ~ 'supabase\\.co//+storage/' then 1 else 0 end), 0)::int as malformed_storage_paths
    from photo_video_sync_data_drops
  `.catch(() => null);

  if (syncChecks) {
    const check = syncChecks[0];
    console.log(
      `\n[check] photo_video_sync_data_drops.storage_path full_urls=${check.full_url_storage_paths} malformed_supabase_urls=${check.malformed_storage_paths}`
    );
  } else {
    console.log("\n[check] photo_video_sync_data_drops not available in this database — skipped");
  }

  console.log("\nSummary");
  console.log(`- rows scanned: ${summary.rowsScanned}`);
  console.log(`- rows changed: ${summary.rowsChanged}`);
  console.log(`- urls fixed: ${summary.urlsFixed}`);
  console.log(`- mode: ${DRY_RUN ? "dry-run" : "apply"}`);
}

main()
  .catch((error) => {
    console.error("❌ URL cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end({ timeout: 5 });
  });
