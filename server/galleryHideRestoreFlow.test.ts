import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { LEGACY_EDIT_PASSWORD } from "./_core/authSecrets";
import type { TrpcContext } from "./_core/context";
import { applyPhotosOrder, photosImages } from "../client/src/pages/Photos";

// Exercises the real router procedures end to end against an in-memory store
// standing in for the database, then feeds the persisted state through the
// same helper the live gallery page uses. This is the full delete -> hide ->
// restore round trip, not a stub of it.
vi.mock("./db", () => {
  const orders = new Map<string, string>();
  return {
    __store: orders,
    getDb: vi.fn(),
    upsertUser: vi.fn(),
    getUserByOpenId: vi.fn(),
    getImageOrder: vi.fn(async (gallery: string) =>
      orders.has(gallery)
        ? { id: 1, gallery, imageOrder: orders.get(gallery)!, updatedAt: new Date() }
        : null
    ),
    saveImageOrder: vi.fn(async (gallery: string, order: string[]) => {
      orders.set(gallery, JSON.stringify(order));
      return { success: true as const };
    }),
    getHiddenImages: vi.fn(async (gallery: string) => {
      const raw = orders.get(`${gallery}:hidden`);
      return raw ? (JSON.parse(raw) as string[]) : [];
    }),
    saveHiddenImages: vi.fn(async (gallery: string, hidden: string[]) => {
      orders.set(`${gallery}:hidden`, JSON.stringify(hidden));
      return { success: true as const };
    }),
  };
});

const db = (await import("./db")) as any;

function ctx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn(), setHeader: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const caller = () => appRouter.createCaller(ctx());
const password = LEGACY_EDIT_PASSWORD;

describe("delete -> hide -> restore round trip", () => {
  beforeEach(() => db.__store.clear());

  it("hides a bundled image from the live gallery and puts it back on restore", async () => {
    const target = photosImages[0].src;
    const c = caller();

    // Starts visible.
    let hidden = (await c.gallery.getHidden({ gallery: "photos" })).hidden;
    expect(applyPhotosOrder(null, hidden).map(i => i.src)).toContain(target);

    // Delete hides it.
    await c.gallery.deleteImage({ gallery: "photos", imageSrc: target, password });
    hidden = (await c.gallery.getHidden({ gallery: "photos" })).hidden;
    expect(hidden).toEqual([target]);
    expect(applyPhotosOrder(null, hidden).map(i => i.src)).not.toContain(target);

    // Restore brings it back.
    await c.gallery.restoreImage({ gallery: "photos", imageSrc: target, password });
    hidden = (await c.gallery.getHidden({ gallery: "photos" })).hidden;
    expect(hidden).toEqual([]);
    expect(applyPhotosOrder(null, hidden).map(i => i.src)).toContain(target);
  });

  it("restores an uploaded image by putting it back in the saved order", async () => {
    const uploaded = "https://x.supabase.co/storage/v1/object/public/portfolio-images/uploads/a.webp";
    const c = caller();
    await c.gallery.saveOrder({ gallery: "photos", order: [uploaded], password });

    await c.gallery.deleteImage({ gallery: "photos", imageSrc: uploaded, password });
    let order = (await c.gallery.getOrder({ gallery: "photos" })).order;
    let hidden = (await c.gallery.getHidden({ gallery: "photos" })).hidden;
    expect(order).not.toContain(uploaded);
    expect(applyPhotosOrder(order, hidden).map(i => i.src)).not.toContain(uploaded);

    // An uploaded image has no bundled fallback, so restore must re-add it to
    // the order or it would stay invisible forever.
    await c.gallery.restoreImage({ gallery: "photos", imageSrc: uploaded, password });
    order = (await c.gallery.getOrder({ gallery: "photos" })).order;
    hidden = (await c.gallery.getHidden({ gallery: "photos" })).hidden;
    expect(order).toContain(uploaded);
    expect(applyPhotosOrder(order, hidden).map(i => i.src)).toContain(uploaded);
  });

  it("is idempotent and rejects a bad password", async () => {
    const target = photosImages[1].src;
    const c = caller();
    await c.gallery.deleteImage({ gallery: "photos", imageSrc: target, password });
    await c.gallery.deleteImage({ gallery: "photos", imageSrc: target, password });
    expect((await c.gallery.getHidden({ gallery: "photos" })).hidden).toEqual([target]);

    await expect(
      c.gallery.restoreImage({ gallery: "photos", imageSrc: target, password: "wrong" })
    ).rejects.toThrow();
    expect((await c.gallery.getHidden({ gallery: "photos" })).hidden).toEqual([target]);
  });
});
