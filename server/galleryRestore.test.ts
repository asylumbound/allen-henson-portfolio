import { describe, expect, it } from "vitest";
import { applyPhotosOrder, photosImages } from "../client/src/pages/Photos";

// Restore is the inverse of the hide recorded by gallery.deleteImage. The two
// cases behave differently on the client, which is why restoreImage also
// re-adds the src to the saved order server-side:
//   - a bundled image reappears via the applyXOrder fallback on its own
//   - an uploaded image exists ONLY in the saved order, so without that
//     re-add it would stay invisible even once unhidden
describe("gallery restore", () => {
  const uploaded = "https://example.supabase.co/storage/v1/object/public/portfolio-images/uploads/x.webp";

  it("brings a bundled image back once it is no longer hidden", () => {
    const target = photosImages[0].src;
    const order = photosImages.slice(1).map(img => img.src);

    expect(applyPhotosOrder(order, [target]).map(i => i.src)).not.toContain(target);
    // Unhidden: the bundled fallback re-appends it without touching the order.
    expect(applyPhotosOrder(order, []).map(i => i.src)).toContain(target);
  });

  it("needs the src back in the order for an uploaded image to reappear", () => {
    const orderWithout = photosImages.map(img => img.src);
    // Unhidden but absent from the order — no bundled fallback exists for it.
    expect(applyPhotosOrder(orderWithout, []).map(i => i.src)).not.toContain(uploaded);

    // This is what restoreImage now persists: the src appended to the order.
    const orderWith = [...orderWithout, uploaded];
    expect(applyPhotosOrder(orderWith, []).map(i => i.src)).toContain(uploaded);
  });

  it("keeps an uploaded image hidden while it is on the hidden list", () => {
    const order = [...photosImages.map(img => img.src), uploaded];
    expect(applyPhotosOrder(order, [uploaded]).map(i => i.src)).not.toContain(uploaded);
  });
});
