/**
 * Duke Image Editor - Server-side image processing
 * Handles crop and rotate operations for the Duke gallery editor role
 * Uses Sharp for high-quality image processing
 * Persists edited images to Supabase Storage for production durability
 */

import express from "express";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const router = express.Router();

// Editor credentials
const EDITOR_PASSWORD = "&&77LEica";

// Supabase Storage config — uses env vars in production, fallback for dev
const SUPABASE_URL = process.env.SUPABASE_URL || "https://frgdgcpmrshimyxsamdr.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
const EDITS_BUCKET = "duke-edits";
const BACKUPS_BUCKET = "duke-backups";

function verifyEditorPassword(password: string): boolean {
  return password === EDITOR_PASSWORD;
}

// Resolve the duke images directory (local static files)
function getDukeImagesDir(): string {
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

// ─── Supabase Storage Helpers ───────────────────────────────────────────────

async function uploadToSupabase(
  bucket: string,
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<boolean> {
  if (!SUPABASE_SERVICE_KEY) {
    console.warn("[Duke Editor] No Supabase service key — skipping cloud upload");
    return false;
  }

  try {
    // Use upsert (PUT) to overwrite if exists
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: buffer,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[Duke Editor] Supabase upload failed for ${bucket}/${filePath}:`, err);
      return false;
    }

    console.log(`[Duke Editor] Uploaded to Supabase: ${bucket}/${filePath}`);
    return true;
  } catch (error: any) {
    console.error(`[Duke Editor] Supabase upload error:`, error.message);
    return false;
  }
}

async function downloadFromSupabase(
  bucket: string,
  filePath: string
): Promise<Buffer | null> {
  if (!SUPABASE_SERVICE_KEY) return null;

  try {
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function deleteFromSupabase(
  bucket: string,
  filePaths: string[]
): Promise<boolean> {
  if (!SUPABASE_SERVICE_KEY) return false;

  try {
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: filePaths }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function supabaseFileExists(
  bucket: string,
  filePath: string
): Promise<boolean> {
  if (!SUPABASE_SERVICE_KEY) return false;

  try {
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

// Get the source image buffer — prefer Supabase edited version, fall back to local
async function getSourceImage(imageName: string): Promise<{ buffer: Buffer; source: "supabase" | "local" }> {
  // First check if there's an edited version in Supabase
  const supabaseBuffer = await downloadFromSupabase(EDITS_BUCKET, `${imageName}.jpeg`);
  if (supabaseBuffer) {
    console.log(`[Duke Editor] Using Supabase edited version for ${imageName}`);
    return { buffer: supabaseBuffer, source: "supabase" };
  }

  // Fall back to local file
  const imagesDir = getDukeImagesDir();
  const jpegPath = path.join(imagesDir, `${imageName}.jpeg`);
  if (!fs.existsSync(jpegPath)) {
    throw new Error(`Image not found: ${imageName}`);
  }

  return { buffer: fs.readFileSync(jpegPath), source: "local" };
}

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/duke/edit-image
 * Applies crop and/or rotate to a Duke gallery image
 * Saves result to both local filesystem AND Supabase Storage
 */
router.post("/edit-image", express.json({ limit: "10mb" }), async (req, res) => {
  try {
    const { password, imageName, rotate, crop } = req.body;

    if (!verifyEditorPassword(password)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!imageName || !/^duke-\d+$/.test(imageName)) {
      return res.status(400).json({ error: "Invalid image name" });
    }

    console.log(`[Duke Editor] Processing ${imageName} - rotate: ${rotate}, crop: ${JSON.stringify(crop)}`);

    // Get the source image (prefers Supabase edited version if exists)
    const { buffer: sourceBuffer, source } = await getSourceImage(imageName);
    console.log(`[Duke Editor] Source: ${source} for ${imageName}`);

    // Backup the current version to Supabase before editing
    const timestamp = Date.now();
    await uploadToSupabase(
      BACKUPS_BUCKET,
      `${imageName}_${timestamp}.jpeg`,
      sourceBuffer,
      "image/jpeg"
    );

    // Also backup locally if possible
    try {
      const imagesDir = getDukeImagesDir();
      const backupDir = path.join(imagesDir, ".backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.writeFileSync(path.join(backupDir, `${imageName}_${timestamp}.jpeg`), sourceBuffer);
    } catch {
      // Local backup is best-effort
    }

    // Build Sharp pipeline from the source buffer
    let pipeline = sharp(sourceBuffer);

    // Apply rotation first (if specified)
    if (rotate && rotate !== 0) {
      const normalized = ((rotate % 360) + 360) % 360;
      if ([90, 180, 270].includes(normalized)) {
        pipeline = pipeline.rotate(normalized);
      }
    }

    // Apply crop (if specified)
    if (crop && crop.width > 0 && crop.height > 0) {
      pipeline = pipeline.extract({
        left: Math.round(crop.x),
        top: Math.round(crop.y),
        width: Math.round(crop.width),
        height: Math.round(crop.height),
      });
    }

    // Process to JPEG
    const jpegBuffer = await pipeline
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    // Process to WebP
    const webpBuffer = await sharp(jpegBuffer)
      .webp({ quality: 80, effort: 6 })
      .toBuffer();

    // Save to Supabase Storage (persistent — survives redeploys)
    const [jpegUploaded, webpUploaded] = await Promise.all([
      uploadToSupabase(EDITS_BUCKET, `${imageName}.jpeg`, jpegBuffer, "image/jpeg"),
      uploadToSupabase(EDITS_BUCKET, `${imageName}.webp`, webpBuffer, "image/webp"),
    ]);

    // Also save locally (for immediate serving, even if ephemeral)
    try {
      const imagesDir = getDukeImagesDir();
      fs.writeFileSync(path.join(imagesDir, `${imageName}.jpeg`), jpegBuffer);
      fs.writeFileSync(path.join(imagesDir, `${imageName}.webp`), webpBuffer);
    } catch {
      // Local save is best-effort in production
    }

    const metadata = await sharp(jpegBuffer).metadata();

    console.log(`[Duke Editor] Saved ${imageName} - ${metadata.width}x${metadata.height} (supabase: ${jpegUploaded})`);

    return res.json({
      success: true,
      imageName,
      dimensions: { width: metadata.width, height: metadata.height },
      jpegSize: jpegBuffer.length,
      webpSize: webpBuffer.length,
      supabaseUploaded: jpegUploaded && webpUploaded,
    });
  } catch (error: any) {
    console.error("[Duke Editor] Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process image" });
  }
});

/**
 * POST /api/duke/revert-image
 * Reverts an image to the original (removes Supabase edited version)
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

    // Delete the edited versions from Supabase — this reverts to the original static file
    await deleteFromSupabase(EDITS_BUCKET, [
      `${imageName}.jpeg`,
      `${imageName}.webp`,
    ]);

    // Also try to restore locally from backup
    try {
      const imagesDir = getDukeImagesDir();
      const backupDir = path.join(imagesDir, ".backups");

      if (fs.existsSync(backupDir)) {
        const backups = fs.readdirSync(backupDir)
          .filter(f => f.startsWith(`${imageName}_`) && f.endsWith(".jpeg"))
          .sort()
          .reverse();

        if (backups.length > 0) {
          const latestBackup = backups[0];
          const backupTimestamp = latestBackup.replace(`${imageName}_`, "").replace(".jpeg", "");

          fs.copyFileSync(
            path.join(backupDir, latestBackup),
            path.join(imagesDir, `${imageName}.jpeg`)
          );

          const webpBackup = `${imageName}_${backupTimestamp}.webp`;
          if (fs.existsSync(path.join(backupDir, webpBackup))) {
            fs.copyFileSync(
              path.join(backupDir, webpBackup),
              path.join(imagesDir, `${imageName}.webp`)
            );
          }
        }
      }
    } catch {
      // Local revert is best-effort
    }

    console.log(`[Duke Editor] Reverted ${imageName} — removed Supabase edits`);

    return res.json({ success: true, imageName });
  } catch (error: any) {
    console.error("[Duke Editor] Revert error:", error);
    return res.status(500).json({ error: error.message || "Failed to revert image" });
  }
});

/**
 * GET /api/duke/edited-images
 * Returns a map of which images have edited versions in Supabase Storage
 * The client uses this to know which images to serve from Supabase vs static
 */
router.get("/edited-images", async (_req, res) => {
  if (!SUPABASE_SERVICE_KEY) {
    return res.json({ editedImages: {} });
  }

  try {
    // List all files in the duke-edits bucket
    const url = `${SUPABASE_URL}/storage/v1/object/list/${EDITS_BUCKET}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefix: "", limit: 1000 }),
    });

    if (!response.ok) {
      return res.json({ editedImages: {} });
    }

    const files: Array<{ name: string }> = await response.json();

    // Build a map: imageName -> { jpeg: publicUrl, webp: publicUrl }
    const editedImages: Record<string, { jpeg?: string; webp?: string }> = {};
    const publicBase = `${SUPABASE_URL}/storage/v1/object/public/${EDITS_BUCKET}`;

    for (const file of files) {
      if (!file.name) continue;
      const match = file.name.match(/^(duke-\d+)\.(jpeg|webp)$/);
      if (match) {
        const [, name, ext] = match;
        if (!editedImages[name]) editedImages[name] = {};
        (editedImages[name] as any)[ext] = `${publicBase}/${file.name}`;
      }
    }

    return res.json({ editedImages });
  } catch (error: any) {
    console.error("[Duke Editor] List edited images error:", error);
    return res.json({ editedImages: {} });
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

    // Try Supabase first
    const supabaseBuffer = await downloadFromSupabase(EDITS_BUCKET, `${imageName}.jpeg`);
    if (supabaseBuffer) {
      const metadata = await sharp(supabaseBuffer).metadata();
      return res.json({
        imageName,
        width: metadata.width,
        height: metadata.height,
        jpegSize: supabaseBuffer.length,
        source: "supabase",
      });
    }

    // Fall back to local
    const imagesDir = getDukeImagesDir();
    const jpegPath = path.join(imagesDir, `${imageName}.jpeg`);

    if (!fs.existsSync(jpegPath)) {
      return res.status(404).json({ error: "Image not found" });
    }

    const metadata = await sharp(jpegPath).metadata();
    const jpegStats = fs.statSync(jpegPath);

    return res.json({
      imageName,
      width: metadata.width,
      height: metadata.height,
      jpegSize: jpegStats.size,
      source: "local",
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/duke/save-order
 * Persists the gallery image order to both local file AND Supabase Storage
 */
router.post("/save-order", express.json({ limit: "2mb" }), async (req, res) => {
  try {
    const { password, order } = req.body;

    if (!verifyEditorPassword(password)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: "Invalid order array" });
    }

    for (const name of order) {
      if (!/^duke-\d+$/.test(name)) {
        return res.status(400).json({ error: `Invalid image name in order: ${name}` });
      }
    }

    const orderData = JSON.stringify({ order, updatedAt: new Date().toISOString() }, null, 2);
    const orderBuffer = Buffer.from(orderData, "utf-8");

    // Save to Supabase (persistent)
    await uploadToSupabase(EDITS_BUCKET, "order.json", orderBuffer, "application/json");

    // Save locally (best-effort)
    try {
      const imagesDir = getDukeImagesDir();
      fs.writeFileSync(path.join(imagesDir, "order.json"), orderData);
    } catch {
      // Local save is best-effort
    }

    console.log(`[Duke Editor] Saved image order — ${order.length} images`);

    return res.json({ success: true, count: order.length });
  } catch (error: any) {
    console.error("[Duke Editor] Save order error:", error);
    return res.status(500).json({ error: error.message || "Failed to save order" });
  }
});

/**
 * GET /api/duke/get-order
 * Returns the saved gallery image order — prefers Supabase, falls back to local
 */
router.get("/get-order", async (_req, res) => {
  try {
    // Try Supabase first (persistent)
    const supabaseBuffer = await downloadFromSupabase(EDITS_BUCKET, "order.json");
    if (supabaseBuffer) {
      const data = JSON.parse(supabaseBuffer.toString("utf-8"));
      return res.json({ order: data.order || null, updatedAt: data.updatedAt || null, source: "supabase" });
    }

    // Fall back to local file
    const imagesDir = getDukeImagesDir();
    const orderFilePath = path.join(imagesDir, "order.json");

    if (!fs.existsSync(orderFilePath)) {
      return res.json({ order: null });
    }

    const data = JSON.parse(fs.readFileSync(orderFilePath, "utf-8"));
    return res.json({ order: data.order || null, updatedAt: data.updatedAt || null, source: "local" });
  } catch (error: any) {
    console.error("[Duke Editor] Get order error:", error);
    return res.json({ order: null });
  }
});

export { router as dukeEditorRouter };
