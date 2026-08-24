/**
 * Image Processing Utility
 * Optimizes uploaded images for web delivery and generates responsive variants.
 */

import sharp from "sharp";
import { storagePut } from "./storage";

// Responsive image sizes
const RESPONSIVE_SIZES = [400, 800, 1200];
export const MAX_IMAGE_DIMENSION = 2400;
export const ORIGINAL_IMAGE_QUALITY = 84;
export const VARIANT_IMAGE_QUALITY = 80;
const OUTPUT_CONTENT_TYPE = "image/webp";

interface ResponsiveImageResult {
  original: { url: string; fileKey: string };
  variants: Array<{ width: number; url: string; fileKey: string }>;
}

/**
 * Process an uploaded image and generate responsive variants
 * @param buffer - Original image buffer
 * @param baseFileKey - Base S3 key (without extension)
 * @param contentType - MIME type of the image
 * @returns URLs for original and all responsive variants
 */
export async function generateResponsiveImages(
  buffer: Buffer,
  baseFileKey: string,
  contentType: string
): Promise<ResponsiveImageResult> {
  const originalKey = `${baseFileKey}.webp`;
  const optimizedOriginal = await sharp(buffer)
    .rotate()
    .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: ORIGINAL_IMAGE_QUALITY, effort: 4 })
    .toBuffer();
  const { url: originalUrl } = await storagePut(originalKey, optimizedOriginal, OUTPUT_CONTENT_TYPE);

  // Generate and upload responsive variants
  const variants: Array<{ width: number; url: string; fileKey: string }> = [];

  for (const width of RESPONSIVE_SIZES) {
    try {
      const resizedBuffer = await sharp(buffer)
        .rotate()
        .resize(width, width, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: VARIANT_IMAGE_QUALITY, effort: 4 })
        .toBuffer();

      // Upload variant
      const variantKey = `${baseFileKey}-${width}.webp`;
      const { url: variantUrl } = await storagePut(variantKey, resizedBuffer, OUTPUT_CONTENT_TYPE);

      variants.push({
        width,
        url: variantUrl,
        fileKey: variantKey,
      });
    } catch (error) {
      console.error(`Failed to generate ${width}w variant:`, error);
      // Continue with other sizes even if one fails
    }
  }
  
  return {
    original: { url: originalUrl, fileKey: originalKey },
    variants,
  };
}

/**
 * Convert an image buffer to WebP format
 * @param buffer - Original image buffer
 * @param quality - WebP quality (0-100)
 * @returns WebP buffer
 */
export async function convertToWebp(buffer: Buffer, quality: number = 85): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .webp({ quality })
    .toBuffer();
}

/**
 * Get image metadata
 * @param buffer - Image buffer
 * @returns Image metadata (width, height, format)
 */
export async function getImageMetadata(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  };
}
