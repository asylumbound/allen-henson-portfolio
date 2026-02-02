/**
 * Image Processing Utility
 * Generates responsive image variants (400w, 800w, 1200w) for uploaded images
 */

import sharp from "sharp";
import { storagePut } from "./storage";

// Responsive image sizes
const RESPONSIVE_SIZES = [400, 800, 1200];

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
  // Determine output format based on content type
  const isWebp = contentType === "image/webp";
  const extension = isWebp ? ".webp" : ".jpg";
  
  // Upload original image
  const originalKey = `${baseFileKey}${extension}`;
  const { url: originalUrl } = await storagePut(originalKey, buffer, contentType);
  
  // Generate and upload responsive variants
  const variants: Array<{ width: number; url: string; fileKey: string }> = [];
  
  for (const width of RESPONSIVE_SIZES) {
    try {
      // Resize image while maintaining aspect ratio
      let resizedBuffer: Buffer;
      
      if (isWebp) {
        resizedBuffer = await sharp(buffer)
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
      } else {
        resizedBuffer = await sharp(buffer)
          .resize(width, null, { withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
      }
      
      // Upload variant
      const variantKey = `${baseFileKey}-${width}${extension}`;
      const { url: variantUrl } = await storagePut(variantKey, resizedBuffer, contentType);
      
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
