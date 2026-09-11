/**
 * Shared resolution of a saved gallery order against a page's image list.
 *
 * Saved orders are written at different times and can therefore hold different
 * URL formats for the same image — e.g. the product order was saved before the
 * Supabase CDN migration and stores "/images/product/rolex-yacht-master.webp",
 * while the page's list now generates the absolute CDN URL for that same file.
 * Matching on the exact string alone silently drops every such entry.
 *
 * So entries are matched on the exact src first, then on the file name. That
 * keeps curated orders working across URL-format changes, and is used by both
 * the live gallery pages and the /edit CMS so the two never disagree.
 */

/** File name of an image src, ignoring any query string. */
export function imageKey(src: string): string {
  const path = src.split("?")[0];
  return path.substring(path.lastIndexOf("/") + 1);
}

export function resolveGalleryOrder<T extends { src: string }>(
  order: string[] | null | undefined,
  images: T[],
  options: {
    /** Append images not present in the saved order (false = order is authoritative,
     *  so deletions made in the CMS stay deleted). */
    appendRemaining: boolean;
    /** Build an entry for an uploaded image that isn't in the static list.
     *  NoInfer keeps T pinned to the `images` element type, so a page whose
     *  images carry extra fields (e.g. webSrc) doesn't get them inferred away. */
    makeUploaded: (src: string) => NoInfer<T>;
  }
): T[] {
  if (!order || order.length === 0) return images;

  const bySrc = new Map(images.map((img) => [img.src, img]));
  const byName = new Map(images.map((img) => [imageKey(img.src), img]));
  const used = new Set<T>();

  const ordered = order
    .map((src) => {
      const known = bySrc.get(src) ?? byName.get(imageKey(src));
      if (known) {
        used.add(known);
        return known;
      }
      // Absolute storage URL = image uploaded via the /edit CMS
      if (src.startsWith("http")) return options.makeUploaded(src);
      return undefined; // unknown local path with no matching image — drop
    })
    .filter((img): img is T => img !== undefined);

  if (!options.appendRemaining) return ordered;

  // Track by identity, not by src string, so an image matched by file name
  // isn't appended a second time.
  return [...ordered, ...images.filter((img) => !used.has(img))];
}
