import { describe, expect, it } from "vitest";
import {
  applyProductOrder,
  normalizeProductOrderSource,
  productPhotographyImages,
} from "../client/src/pages/ProductPhotography";

describe("ProductPhotography saved-order mapping", () => {
  it("normalizes a Supabase public object URL to the CMS product path", () => {
    expect(
      normalizeProductOrderSource(
        "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/product-images/cartier-tank.webp"
      )
    ).toBe("/images/product/cartier-tank.webp");
  });

  it("matches a Supabase CDN URL to its master image metadata rather than treating it as an upload", () => {
    const cdnUrl =
      "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/product-images/cartier-tank.webp";
    const expected = productPhotographyImages.find(
      (image) => normalizeProductOrderSource(image.src) === "/images/product/cartier-tank.webp"
    );

    expect(applyProductOrder([cdnUrl])).toEqual([expected]);
  });

  it("matches a local CMS order path after catalogue paths have resolved to the Supabase CDN", () => {
    const expectedUrl =
      "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/product-images/cartier-tank.webp";

    expect(productPhotographyImages.find((image) => image.src === expectedUrl)).toBeDefined();
    expect(applyProductOrder(["/images/product/cartier-tank.webp"])).toEqual([
      expect.objectContaining({
        src: expectedUrl,
        alt: "Cartier Tank",
      }),
    ]);
  });
});
