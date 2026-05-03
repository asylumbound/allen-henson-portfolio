/**
 * Sync Sheet Data Drop Router
 * Handles multipart file uploads to Supabase Storage (sync-data-drops bucket)
 * Stores metadata in photo_video_sync_data_drops table
 * Uses multer for in-memory multipart parsing, streams to Supabase via fetch
 */

import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

const ADMIN_PASSWORD = "&&77VAnguard";
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://frgdgcpmrshimyxsamdr.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUCKET = "sync-data-drops";

// Store files in memory (no disk I/O) — fine for typical file sizes
// For very large files this could be swapped to disk temp storage
const upload = multer({
  storage: multer.memoryStorage(),
  // No file size limit — as requested
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._\-]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

async function uploadToSupabase(
  storagePath: string,
  buffer: Buffer,
  mimeType: string
): Promise<boolean> {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": mimeType || "application/octet-stream",
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[DataDrop] Supabase upload failed: ${err}`);
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

// ── Upload endpoint ───────────────────────────────────────────────────────────

router.post(
  "/upload",
  upload.array("files"),
  async (req: express.Request, res: express.Response) => {
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

      const results: { filename: string; success: boolean; id?: string; error?: string }[] = [];

      for (const file of files) {
        const safeName = sanitizeFilename(file.originalname);
        const timestamp = Date.now();
        // Folder structure: {shoot_id}/{field_name}/{timestamp}_{filename}
        const storagePath = `${shoot_id}/${field_name.replace(/[^a-zA-Z0-9_\-]/g, "_")}/${timestamp}_${safeName}`;
        const ext = path.extname(file.originalname).toLowerCase().replace(".", "") || "bin";

        // Upload to Supabase Storage
        const uploaded = await uploadToSupabase(storagePath, file.buffer, file.mimetype);
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
          mime_type: file.mimetype,
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
    }
  }
);

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
