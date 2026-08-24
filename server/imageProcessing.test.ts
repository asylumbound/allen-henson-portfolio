import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string) => ({
    key,
    url: `https://example.com/${key}`,
  })),
}));

import { storagePut } from "./storage";
import {
  generateResponsiveImages,
  MAX_IMAGE_DIMENSION,
  ORIGINAL_IMAGE_QUALITY,
  VARIANT_IMAGE_QUALITY,
} from "./imageProcessing";

describe("generateResponsiveImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("optimizes uploaded originals and stores responsive webp variants", async () => {
    const sourceBuffer = await sharp({
      create: {
        width: 3200,
        height: 1800,
        channels: 3,
        background: { r: 120, g: 80, b: 60 },
      },
    })
      .jpeg({ quality: 96 })
      .withMetadata({ exif: { IFD0: { Copyright: "Allen Henson" } } })
      .toBuffer();

    const uploads: Array<{ key: string; buffer: Buffer; contentType: string }> = [];
    vi.mocked(storagePut).mockImplementation(async (key, data, contentType = "application/octet-stream") => {
      uploads.push({ key, buffer: Buffer.from(data as Buffer), contentType });
      return { key, url: `https://example.com/${key}` };
    });

    const result = await generateResponsiveImages(sourceBuffer, "gallery/destinations/test-image", "image/jpeg");

    expect(result.original.fileKey).toBe("gallery/destinations/test-image.webp");
    expect(result.variants.map((variant) => variant.width)).toEqual([400, 800, 1200]);
    expect(uploads).toHaveLength(4);
    expect(uploads.every((upload) => upload.contentType === "image/webp")).toBe(true);
    expect(uploads[0].key).toBe("gallery/destinations/test-image.webp");
    expect(uploads.slice(1).map((upload) => upload.key)).toEqual([
      "gallery/destinations/test-image-400.webp",
      "gallery/destinations/test-image-800.webp",
      "gallery/destinations/test-image-1200.webp",
    ]);

    const originalMetadata = await sharp(uploads[0].buffer).metadata();
    expect(originalMetadata.format).toBe("webp");
    expect(originalMetadata.width).toBe(MAX_IMAGE_DIMENSION);
    expect(originalMetadata.height).toBe(1350);
    expect(originalMetadata.exif).toBeUndefined();

    const variantMetadata = await Promise.all(uploads.slice(1).map((upload) => sharp(upload.buffer).metadata()));
    expect(variantMetadata.map((metadata) => metadata.width)).toEqual([400, 800, 1200]);
    expect(variantMetadata.every((metadata) => metadata.format === "webp")).toBe(true);

    expect(ORIGINAL_IMAGE_QUALITY).toBeGreaterThan(VARIANT_IMAGE_QUALITY);
  });

  it("keeps portrait variant widths aligned with advertised srcset widths", async () => {
    const sourceBuffer = await sharp({
      create: {
        width: 1800,
        height: 3200,
        channels: 3,
        background: { r: 30, g: 30, b: 30 },
      },
    })
      .jpeg({ quality: 96 })
      .toBuffer();

    const uploads: Buffer[] = [];
    vi.mocked(storagePut).mockImplementation(async (key, data) => {
      uploads.push(Buffer.from(data as Buffer));
      return { key, url: `https://example.com/${key}` };
    });

    await generateResponsiveImages(sourceBuffer, "gallery/destinations/portrait", "image/jpeg");

    const variantMetadata = await Promise.all(uploads.slice(1).map((upload) => sharp(upload).metadata()));
    expect(variantMetadata.map((metadata) => metadata.width)).toEqual([400, 800, 1200]);
  });
});
