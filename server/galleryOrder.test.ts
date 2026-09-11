/**
 * Tests for gallery order resolution (client/src/lib/galleryOrder.ts).
 *
 * Regression: the product gallery's saved order predates the Supabase CDN
 * migration and stores "/images/product/<file>", while the page's image list
 * now generates absolute CDN URLs for the same files. Exact-string matching
 * dropped all 42 entries and rendered an empty gallery.
 */

import { describe, it, expect } from "vitest";
import { imageKey, resolveGalleryOrder } from "@/lib/galleryOrder";

const CDN = "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public";

const productImages = [
  { src: `${CDN}/product-images/rolex-yacht-master.webp`, alt: "Rolex" },
  { src: `${CDN}/product-images/don-julio-tequila.webp`, alt: "Don Julio" },
  { src: `${CDN}/product-images/mclaren-wheel.webp`, alt: "McLaren" },
];

const makeUploaded = (src: string) => ({ src, alt: "Uploaded" });

describe("imageKey", () => {
  it("reduces a src to its file name", () => {
    expect(imageKey("/images/product/rolex-yacht-master.webp")).toBe("rolex-yacht-master.webp");
    expect(imageKey(`${CDN}/product-images/rolex-yacht-master.webp`)).toBe("rolex-yacht-master.webp");
  });

  it("ignores a query string", () => {
    expect(imageKey(`${CDN}/product-images/a.webp?width=400&quality=60`)).toBe("a.webp");
  });
});

describe("resolveGalleryOrder", () => {
  it("matches pre-CDN local paths against CDN-based image srcs", () => {
    const order = [
      "/images/product/mclaren-wheel.webp",
      "/images/product/rolex-yacht-master.webp",
      "/images/product/don-julio-tequila.webp",
    ];

    const result = resolveGalleryOrder(order, productImages, {
      appendRemaining: false,
      makeUploaded,
    });

    expect(result).toHaveLength(3);
    expect(result.map((i) => i.alt)).toEqual(["McLaren", "Rolex", "Don Julio"]);
  });

  it("preserves the curated order for exact matches", () => {
    const order = [productImages[2].src, productImages[0].src];

    const result = resolveGalleryOrder(order, productImages, {
      appendRemaining: false,
      makeUploaded,
    });

    expect(result.map((i) => i.alt)).toEqual(["McLaren", "Rolex"]);
  });

  it("keeps uploaded images that are not in the static list", () => {
    const uploaded = `${CDN}/product-images/uploads/1787623317805-new.webp`;
    const order = [uploaded, "/images/product/rolex-yacht-master.webp"];

    const result = resolveGalleryOrder(order, productImages, {
      appendRemaining: false,
      makeUploaded,
    });

    expect(result.map((i) => i.src)).toEqual([uploaded, productImages[0].src]);
  });

  it("drops unknown local paths with no matching image", () => {
    const order = ["/images/product/deleted-image.webp", "/images/product/rolex-yacht-master.webp"];

    const result = resolveGalleryOrder(order, productImages, {
      appendRemaining: false,
      makeUploaded,
    });

    expect(result.map((i) => i.alt)).toEqual(["Rolex"]);
  });

  it("does not duplicate an image matched by file name when appending remaining", () => {
    const order = ["/images/product/rolex-yacht-master.webp"];

    const result = resolveGalleryOrder(order, productImages, {
      appendRemaining: true,
      makeUploaded,
    });

    expect(result).toHaveLength(productImages.length);
    expect(result.filter((i) => i.alt === "Rolex")).toHaveLength(1);
    expect(result[0].alt).toBe("Rolex");
  });

  it("returns the full list when no order is saved", () => {
    expect(resolveGalleryOrder(null, productImages, { appendRemaining: false, makeUploaded })).toEqual(productImages);
    expect(resolveGalleryOrder([], productImages, { appendRemaining: false, makeUploaded })).toEqual(productImages);
  });
});
