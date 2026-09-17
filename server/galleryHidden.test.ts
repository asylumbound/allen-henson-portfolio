import { describe, expect, it } from "vitest";
import { applyPhotosOrder, photosImages } from "../client/src/pages/Photos";
import { applyJournalOrder, journalImages } from "../client/src/pages/Journal";
import { applyProductOrder, productPhotographyImages } from "../client/src/pages/ProductPhotography";

// Deleting in the /edit CMS hides an image from the public gallery without
// destroying anything. The regression these cover: bundled images are declared
// in the client source, and the applyXOrder helpers re-append any bundled image
// missing from the saved order — so removing a src from the order alone put the
// image straight back on the page.
describe("gallery hidden-image filtering", () => {
  it("keeps a bundled photo hidden even though it is absent from the saved order", () => {
    const target = photosImages[0].src;
    const orderWithoutTarget = photosImages.slice(1).map(img => img.src);

    // Without a hidden list the bundled fallback re-appends it.
    expect(applyPhotosOrder(orderWithoutTarget).map(i => i.src)).toContain(target);

    // With it recorded as hidden, it stays off the page.
    expect(applyPhotosOrder(orderWithoutTarget, [target]).map(i => i.src)).not.toContain(target);
  });

  it("hides a journal image regardless of the saved order", () => {
    const target = journalImages[0].src;
    expect(applyJournalOrder(null, [target]).map(i => i.src)).not.toContain(target);
    expect(applyJournalOrder(journalImages.map(i => i.src), [target]).map(i => i.src)).not.toContain(target);
  });

  it("hides a product image when no order has been saved yet", () => {
    const target = productPhotographyImages[0].src;
    expect(applyProductOrder(null, [target]).map(i => i.src)).not.toContain(target);
  });

  it("leaves the gallery untouched when nothing is hidden", () => {
    expect(applyPhotosOrder(null, []).map(i => i.src)).toEqual(photosImages.map(i => i.src));
    expect(applyPhotosOrder(null, undefined).map(i => i.src)).toEqual(photosImages.map(i => i.src));
  });
});
