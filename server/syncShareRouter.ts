import { Router } from "express";
import { getSupabaseBaseUrl, joinUrl } from "../shared/supabaseUrl";

const SUPABASE_URL = getSupabaseBaseUrl({ fallback: "" });
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function isSafeStoragePath(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 1024 &&
    !value.includes("..") &&
    /^[A-Za-z0-9/_\-.]+$/.test(value)
  );
}

async function sbFetch(path: string, options: RequestInit = {}) {
  const url = joinUrl(SUPABASE_URL, "rest/v1", path);
  const res = await fetch(url, {
    ...options,
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers || {}),
    },
  });
  return res;
}

export const syncShareRouter = Router();

// GET /api/share/:token/info — returns metadata (is_public, expired) without files
syncShareRouter.get("/:token/info", async (req, res) => {
  try {
    const { token } = req.params;
    const r = await sbFetch(`/photo_video_sync_share_links?token=eq.${encodeURIComponent(token)}&select=id,is_public,expires_at,allow_download,label,project_name,shoot_date`);
    const rows = await r.json();
    if (!rows || rows.length === 0) { res.json({ error: "not_found" }); return; }
    const link = rows[0];
    if (link.expires_at && new Date(link.expires_at) < new Date()) { res.json({ error: "expired" }); return; }
    res.json({ is_public: link.is_public, allow_download: link.allow_download, label: link.label, project_name: link.project_name, shoot_date: link.shoot_date });
  } catch (e) {
    res.status(500).json({ error: "server_error" });
  }
});

// POST /api/share/:token/files — returns files (public: no password needed; protected: password required)
syncShareRouter.post("/:token/files", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body || {};

    // Fetch the link record
    const r = await sbFetch(`/photo_video_sync_share_links?token=eq.${encodeURIComponent(token)}&select=*`);
    const rows = await r.json();
    if (!rows || rows.length === 0) { res.json({ error: "not_found" }); return; }
    const link = rows[0];

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) { res.json({ error: "expired" }); return; }

    // Check password for protected links
    if (!link.is_public) {
      if (!password || password !== link.link_password) {
        res.json({ error: "wrong_password" }); return;
      }
    }

    // Increment access count and update last_accessed_at
    await sbFetch(`/photo_video_sync_share_links?id=eq.${link.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        access_count: (link.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      }),
    });

    // Fetch files for this shoot
    const filesR = await sbFetch(`/photo_video_sync_data_drops?shoot_id=eq.${encodeURIComponent(link.shoot_id)}&order=created_at.asc&select=id,field_name,original_filename,storage_path,file_size,file_type,mime_type,created_at`);
    const files = await filesR.json();

    res.json({
      label: link.label || link.project_name,
      project_name: link.project_name,
      shoot_date: link.shoot_date,
      is_public: link.is_public,
      allow_download: link.allow_download,
      files: files || [],
    });
  } catch (e) {
    res.status(500).json({ error: "server_error" });
  }
});

// POST /api/share/:token/download — generates a signed URL for a specific file
syncShareRouter.post("/:token/download", async (req, res) => {
  try {
    const { token } = req.params;
    const { storage_path, password } = req.body || {};

    if (!storage_path) { res.status(400).json({ error: "storage_path required" }); return; }
    if (!isSafeStoragePath(storage_path)) { res.status(400).json({ error: "invalid storage_path" }); return; }

    // Verify the link
    const r = await sbFetch(`/photo_video_sync_share_links?token=eq.${encodeURIComponent(token)}&select=*`);
    const rows = await r.json();
    if (!rows || rows.length === 0) { res.json({ error: "not_found" }); return; }
    const link = rows[0];

    if (link.expires_at && new Date(link.expires_at) < new Date()) { res.json({ error: "expired" }); return; }
    if (!link.allow_download) { res.json({ error: "download_not_allowed" }); return; }
    if (!link.is_public && (!password || password !== link.link_password)) {
      res.json({ error: "wrong_password" }); return;
    }

    // Generate signed URL (24 hours)
    const signRes = await fetch(joinUrl(SUPABASE_URL, "storage/v1/object/sign/sync-data-drops", storage_path), {
      method: "POST",
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 86400 }),
    });
    const signData = await signRes.json();
    if (signData.signedURL) {
      res.json({ signedUrl: joinUrl(SUPABASE_URL, "storage/v1", signData.signedURL) });
    } else {
      res.status(500).json({ error: "Could not generate signed URL" });
    }
  } catch (e) {
    res.status(500).json({ error: "server_error" });
  }
});
