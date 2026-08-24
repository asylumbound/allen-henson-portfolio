import { describe, expect, it } from "vitest";
import { getImageOrderFromDb, saveImageOrderToDb } from "./db";

function createImageOrderDbFake() {
  const rows = new Map<string, { id: number; gallery: string; imageOrder: string; updatedAt: Date }>();
  let nextId = 1;

  const client = {
    insert: () => ({
      values: ({ gallery, imageOrder }: { gallery: string; imageOrder: string }) => ({
        onConflictDoUpdate: async ({ set }: { set: { imageOrder: string; updatedAt: Date } }) => {
          const existing = rows.get(gallery);
          if (existing) {
            rows.set(gallery, {
              ...existing,
              imageOrder: set.imageOrder,
              updatedAt: set.updatedAt,
            });
            return;
          }

          rows.set(gallery, {
            id: nextId++,
            gallery,
            imageOrder,
            updatedAt: new Date(),
          });
        },
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async (count: number) =>
              Array.from(rows.values())
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || b.id - a.id)
                .slice(0, count),
          }),
        }),
      }),
    }),
  };

  return { client, rows };
}

describe("image order persistence", () => {
  it("creates a destinations order record when none exists", async () => {
    const { client, rows } = createImageOrderDbFake();

    await saveImageOrderToDb(client as never, "destinations", ["https://example.com/a.webp"]);

    expect(rows.get("destinations")).toMatchObject({
      gallery: "destinations",
      imageOrder: JSON.stringify(["https://example.com/a.webp"]),
    });
  });

  it("updates an existing destinations order record on repeat saves", async () => {
    const { client, rows } = createImageOrderDbFake();

    await saveImageOrderToDb(client as never, "destinations", ["https://example.com/a.webp"]);
    await saveImageOrderToDb(client as never, "destinations", ["https://example.com/b.webp"]);

    expect(rows.size).toBe(1);
    expect(rows.get("destinations")?.imageOrder).toBe(JSON.stringify(["https://example.com/b.webp"]));
    expect(await getImageOrderFromDb(client as never, "destinations")).toMatchObject({
      gallery: "destinations",
      imageOrder: JSON.stringify(["https://example.com/b.webp"]),
    });
  });
});
