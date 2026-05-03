/**
 * Sync Sheet Data Drop Router
 * Handles multipart file uploads to Supabase Storage (sync-data-drops bucket)
 * Stores metadata in photo_video_sync_data_drops table
 *
 * Uses multer diskStorage so large video files are written to /tmp instead of
 * being buffered in RAM. Files are then streamed to Supabase and cleaned up.
 *
 * Supports all file types — photos, videos, LUTs, audio, documents, etc.
 */

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createReadStream } from "fs";

const router = express.Router();

const ADMIN_PASSWORD = "&&77JFR";
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://frgdgcpmrshimyxsamdr.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUCKET = "sync-data-drops";

// ── Multer: disk storage so large video files don't exhaust RAM ───────────────

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = "/tmp/sync-drops";
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      // Unique temp name to avoid collisions
      cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.originalname}`);
    },
  }),
  // No hard limit — allow large video files. The client shows progress.
  // Supabase Storage handles the actual storage constraints.
  limits: {
    fileSize: 4 * 1024 * 1024 * 1024, // 4 GB ceiling (generous for video)
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._\-]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

/**
 * Stream a file from disk to Supabase Storage.
 * Uses Node.js ReadStream so the entire file is never held in RAM.
 */
async function uploadToSupabase(
  storagePath: string,
  filePath: string,
  fileSize: number,
  mimeType: string
): Promise<boolean> {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;

  const fileStream = createReadStream(filePath);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": mimeType || "application/octet-stream",
      "Content-Length": String(fileSize),
      "x-upsert": "true",
    },
    // @ts-ignore — Node 18+ fetch accepts ReadableStream as body
    body: fileStream,
    // @ts-ignore — required for Node fetch to stream the body
    duplex: "half",
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[DataDrop] Supabase upload failed (${res.status}): ${err}`);
    return false;
  }
  return true;
}

async function saveMetadata(record: {
  shoot_id: string;
  project_name: string;
  shoot_date?: string;
  field_name: string;
  original_filename: string;
  storage_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  uploaded_by: string;
}): Promise<{ id: string } | null> {
  const url = `${SUPABASE_URL}/rest/v1/photo_video_sync_data_drops`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[DataDrop] Metadata save failed: ${err}`);
    return null;
  }
  const data = await res.json();
  return data?.[0] || null;
}

/** Remove temp file from disk, ignoring errors */
function cleanupTempFile(filePath: string) {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
}

// ── Upload endpoint ───────────────────────────────────────────────────────────

router.post(
  "/upload",
  upload.array("files"),
  async (req: express.Request, res: express.Response) => {
    const tempFiles: string[] = [];
    try {
      const { password, shoot_id, project_name, shoot_date, field_name, uploaded_by } = req.body;

      // Auth check
      if (password !== ADMIN_PASSWORD) {
        res.status(401).json({ error: "Invalid password" });
        return;
      }

      if (!shoot_id || !project_name || !field_name) {
        res.status(400).json({ error: "shoot_id, project_name, and field_name are required" });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: "No files provided" });
        return;
      }

      // Track temp file paths for cleanup
      for (const f of files) {
        if (f.path) tempFiles.push(f.path);
      }

      const results: { filename: string; success: boolean; id?: string; error?: string }[] = [];

      for (const file of files) {
        const safeName = sanitizeFilename(file.originalname);
        const timestamp = Date.now();
        const storagePath = `${shoot_id}/${field_name.replace(/[^a-zA-Z0-9_\-]/g, "_")}/${timestamp}_${safeName}`;
        const ext = path.extname(file.originalname).toLowerCase().replace(".", "") || "bin";

        // Determine MIME type — multer may return application/octet-stream for
        // some video formats on iOS; try to infer from extension if needed.
        let mimeType = file.mimetype;
        if (!mimeType || mimeType === "application/octet-stream") {
          mimeType = inferMimeType(ext) || "application/octet-stream";
        }

        // Stream file to Supabase Storage
        const uploaded = await uploadToSupabase(storagePath, file.path, file.size, mimeType);
        if (!uploaded) {
          results.push({ filename: file.originalname, success: false, error: "Storage upload failed" });
          continue;
        }

        // Save metadata to DB
        const meta = await saveMetadata({
          shoot_id,
          project_name,
          shoot_date: shoot_date || undefined,
          field_name,
          original_filename: file.originalname,
          storage_path: storagePath,
          file_size: file.size,
          file_type: ext,
          mime_type: mimeType,
          uploaded_by: uploaded_by || "admin",
        });

        results.push({
          filename: file.originalname,
          success: true,
          id: meta?.id,
        });
      }

      const allSuccess = results.every(r => r.success);
      res.status(allSuccess ? 200 : 207).json({ results });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[DataDrop] Upload error:", message);
      res.status(500).json({ error: message });
    } finally {
      // Always clean up temp files from disk
      for (const p of tempFiles) {
        cleanupTempFile(p);
      }
    }
  }
);

// ── MIME type inference from extension ───────────────────────────────────────

function inferMimeType(ext: string): string | null {
  const map: Record<string, string> = {
    // Video
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    webm: "video/webm",
    mts: "video/mp2t",
    m2ts: "video/mp2t",
    mxf: "application/mxf",
    r3d: "application/octet-stream",
    braw: "application/octet-stream",
    // Photo
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    tiff: "image/tiff",
    tif: "image/tiff",
    dng: "image/x-adobe-dng",
    cr2: "image/x-canon-cr2",
    cr3: "image/x-canon-cr3",
    arw: "image/x-sony-arw",
    nef: "image/x-nikon-nef",
    raf: "image/x-fuji-raf",
    // Audio
    wav: "audio/wav",
    mp3: "audio/mpeg",
    aac: "audio/aac",
    flac: "audio/flac",
    aif: "audio/aiff",
    aiff: "audio/aiff",
    // LUT / Color
    cube: "application/octet-stream",
    lut: "application/octet-stream",
    // Documents
    pdf: "application/pdf",
    xml: "application/xml",
    csv: "text/csv",
    txt: "text/plain",
    zip: "application/zip",
  };
  return map[ext.toLowerCase()] || null;
}

// ── Signed URL endpoint (for downloading private files) ──────────────────────

router.post("/signed-url", express.json(), async (req: express.Request, res: express.Response) => {
  try {
    const { password, storage_path } = req.body;
    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }
    if (!storage_path) {
      res.status(400).json({ error: "storage_path is required" });
      return;
    }

    const url = `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${storage_path}`;
    const supaRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 3600 }), // 1 hour
    });

    if (!supaRes.ok) {
      const err = await supaRes.text();
      res.status(500).json({ error: err });
      return;
    }

    const data = await supaRes.json();
    const signedUrl = `${SUPABASE_URL}/storage/v1${data.signedURL}`;
    res.json({ signedUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export { router as syncDataDropRouter };
