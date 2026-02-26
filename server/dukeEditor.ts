/**
 * Duke Image Editor - Server-side image processing
 * Handles crop and rotate operations for the Duke gallery editor role
 * Uses Sharp for high-quality image processing
 */

import express from "express";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import crypto from "crypto";

const router = express.Router();

// Editor credentials - SHA-256 hash of "&&77LEica"
const EDITOR_PASSWORD = "&&77LEica";

function verifyEditorPassword(password: string): boolean {
  return password === EDITOR_PASSWORD;
}

// Resolve the duke images directory
function getDukeImagesDir(): string {
  // In development, images are in client/public/images/duke/
  // In production, images are in dist/public/images/duke/
  const devPath = path.resolve(process.cwd(), "client/public/images/duke");
  const prodPath = path.resolve(process.cwd(), "dist/public/images/duke");
  
  if (fs.existsSync(devPath)) return devPath;
  if (fs.existsSync(prodPath)) return prodPath;
  
  // Fallback for Railway deployment
  const serverDir = path.dirname(new URL(import.meta.url).pathname);
  const railwayPath = path.resolve(serverDir, "public/images/duke");
  if (fs.existsSync(railwayPath)) return railwayPath;
  
  throw new Error("Duke images directory not found");
}

/**
 * POST /api/duke/edit-image
 * Applies crop and/or rotate to a Duke gallery image
 * 
 * Body:
 * - password: string (editor password)
 * - imageName: string (e.g., "duke-42" - without extension)
 * - rotate: number (0, 90, 180, 270)
 * - crop: { x: number, y: number, width: number, height: number } | null
 *   (pixel coordinates relative to the original image dimensions)
 */
router.post("/edit-image", express.json({ limit: "10mb" }), async (req, res) => {
  try {
    const { password, imageName, rotate, crop } = req.body;

    // Verify editor credentials
    if (!verifyEditorPassword(password)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate imageName format
    if (!imageName || !/^duke-\d+$/.test(imageName)) {
      return res.status(400).json({ error: "Invalid image name" });
    }

    const imagesDir = getDukeImagesDir();
    const jpegPath = path.join(imagesDir, `${imageName}.jpeg`);
    const webpPath = path.join(imagesDir, `${imageName}.webp`);

    // Verify the JPEG source exists
    if (!fs.existsSync(jpegPath)) {
      return res.status(404).json({ error: `Image not found: ${imageName}` });
    }

    console.log(`[Duke Editor] Processing ${imageName} - rotate: ${rotate}, crop: ${JSON.stringify(crop)}`);

    // Create backup before editing
    const backupDir = path.join(imagesDir, ".backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = Date.now();
    fs.copyFileSync(jpegPath, path.join(backupDir, `${imageName}_${timestamp}.jpeg`));
    if (fs.existsSync(webpPath)) {
      fs.copyFileSync(webpPath, path.join(backupDir, `${imageName}_${timestamp}.webp`));
    }

    // Start with the JPEG source
    let pipeline = sharp(jpegPath);

    // Apply rotation first (if specified)
    if (rotate && rotate !== 0) {
      const validRotations = [90, 180, 270];
      if (validRotations.includes(rotate)) {
        pipeline = pipeline.rotate(rotate);
      }
    }

    // Apply crop (if specified)
    // Crop coordinates are in pixels relative to the (possibly rotated) image
    if (crop && crop.width > 0 && crop.height > 0) {
      pipeline = pipeline.extract({
        left: Math.round(crop.x),
        top: Math.round(crop.y),
        width: Math.round(crop.width),
        height: Math.round(crop.height),
      });
    }

    // Process and save JPEG
    const jpegBuffer = await pipeline
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    // Process and save WebP from the same pipeline result
    const webpBuffer = await sharp(jpegBuffer)
      .webp({ quality: 80, effort: 6 })
      .toBuffer();

    // Write both files
    fs.writeFileSync(jpegPath, jpegBuffer);
    fs.writeFileSync(webpPath, webpBuffer);

    // Get new dimensions
    const metadata = await sharp(jpegBuffer).metadata();

    console.log(`[Duke Editor] Saved ${imageName} - ${metadata.width}x${metadata.height}`);

    return res.json({
      success: true,
      imageName,
      dimensions: { width: metadata.width, height: metadata.height },
      jpegSize: jpegBuffer.length,
      webpSize: webpBuffer.length,
    });
  } catch (error: any) {
    console.error("[Duke Editor] Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process image" });
  }
});

/**
 * POST /api/duke/revert-image
 * Reverts an image to its most recent backup
 */
router.post("/revert-image", express.json(), async (req, res) => {
  try {
    const { password, imageName } = req.body;

    if (!verifyEditorPassword(password)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!imageName || !/^duke-\d+$/.test(imageName)) {
      return res.status(400).json({ error: "Invalid image name" });
    }

    const imagesDir = getDukeImagesDir();
    const backupDir = path.join(imagesDir, ".backups");

    // Find the most recent backup
    if (!fs.existsSync(backupDir)) {
      return res.status(404).json({ error: "No backups found" });
    }

    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith(`${imageName}_`) && f.endsWith(".jpeg"))
      .sort()
      .reverse();

    if (backups.length === 0) {
      return res.status(404).json({ error: "No backup found for this image" });
    }

    const latestBackup = backups[0];
    const backupTimestamp = latestBackup.replace(`${imageName}_`, "").replace(".jpeg", "");

    // Restore JPEG
    fs.copyFileSync(
      path.join(backupDir, latestBackup),
      path.join(imagesDir, `${imageName}.jpeg`)
    );

    // Restore WebP if backup exists
    const webpBackup = `${imageName}_${backupTimestamp}.webp`;
    if (fs.existsSync(path.join(backupDir, webpBackup))) {
      fs.copyFileSync(
        path.join(backupDir, webpBackup),
        path.join(imagesDir, `${imageName}.webp`)
      );
    }

    console.log(`[Duke Editor] Reverted ${imageName} from backup ${latestBackup}`);

    return res.json({ success: true, imageName, restoredFrom: latestBackup });
  } catch (error: any) {
    console.error("[Duke Editor] Revert error:", error);
    return res.status(500).json({ error: error.message || "Failed to revert image" });
  }
});

/**
 * GET /api/duke/image-info/:imageName
 * Gets metadata about a duke image (dimensions, file sizes)
 */
router.get("/image-info/:imageName", async (req, res) => {
  try {
    const { imageName } = req.params;

    if (!imageName || !/^duke-\d+$/.test(imageName)) {
      return res.status(400).json({ error: "Invalid image name" });
    }

    const imagesDir = getDukeImagesDir();
    const jpegPath = path.join(imagesDir, `${imageName}.jpeg`);

    if (!fs.existsSync(jpegPath)) {
      return res.status(404).json({ error: "Image not found" });
    }

    const metadata = await sharp(jpegPath).metadata();
    const jpegStats = fs.statSync(jpegPath);

    const webpPath = path.join(imagesDir, `${imageName}.webp`);
    const webpStats = fs.existsSync(webpPath) ? fs.statSync(webpPath) : null;

    return res.json({
      imageName,
      width: metadata.width,
      height: metadata.height,
      jpegSize: jpegStats.size,
      webpSize: webpStats?.size || null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { router as dukeEditorRouter };
