import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Download, File, Folder, Lock, Globe, AlertTriangle, Eye } from "lucide-react";

interface ShareFile {
  id: string;
  field_name: string;
  original_filename: string;
  storage_path: string;
  file_size?: number;
  file_type?: string;
  mime_type?: string;
  created_at: string;
}

interface SharePageData {
  label: string;
  project_name: string;
  shoot_date?: string;
  is_public: boolean;
  allow_download: boolean;
  files: ShareFile[];
}

export default function SyncSharePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [status, setStatus] = useState<"loading" | "auth" | "ready" | "expired" | "notfound" | "error">("loading");
  const [data, setData] = useState<SharePageData | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Prevent indexing
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  // Initial load — check if public or needs password
  useEffect(() => {
    if (!token) { setStatus("notfound"); return; }
    fetch(`/api/share/${token}/info`)
      .then(r => r.json())
      .then(d => {
        if (d.error === "not_found") { setStatus("notfound"); return; }
        if (d.error === "expired") { setStatus("expired"); return; }
        if (d.is_public) {
          // Auto-load files for public links
          fetch(`/api/share/${token}/files`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
            .then(r => r.json())
            .then(fd => {
              if (fd.error) { setStatus("error"); return; }
              setData(fd);
              setStatus("ready");
            });
        } else {
          setStatus("auth");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleAuth = () => {
    if (!linkPassword) { setAuthError("Password required"); return; }
    fetch(`/api/share/${token}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: linkPassword }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error === "wrong_password") { setAuthError("Incorrect password"); return; }
        if (d.error) { setStatus("error"); return; }
        setData(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  const handleDownload = async (file: ShareFile) => {
    setDownloadingId(file.id);
    try {
      const res = await fetch(`/api/share/${token}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storage_path: file.storage_path, password: linkPassword }),
      });
      const d = await res.json();
      if (d.signedUrl) {
        const a = document.createElement("a");
        a.href = d.signedUrl;
        a.download = file.original_filename;
        a.click();
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Group files by field
  const grouped = data?.files.reduce((acc, f) => {
    if (!acc[f.field_name]) acc[f.field_name] = [];
    acc[f.field_name].push(f);
    return acc;
  }, {} as Record<string, ShareFile[]>) || {};

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/20 text-sm">Loading...</p>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <AlertTriangle size={24} className="text-white/20" />
        <p className="text-white/40 text-sm">This link does not exist or has been removed.</p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <AlertTriangle size={24} className="text-yellow-400/40" />
        <p className="text-white/40 text-sm">This share link has expired.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <AlertTriangle size={24} className="text-red-400/40" />
        <p className="text-white/40 text-sm">Something went wrong. Please try again.</p>
      </div>
    );
  }

  if (status === "auth") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <p className="text-white/20 text-xs tracking-widest uppercase mb-1">Allen Henson</p>
            <p className="text-white/10 text-xs">Secure File Share</p>
          </div>
          <div className="border border-white/10 rounded p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} className="text-white/30" />
              <p className="text-white/50 text-sm">This link is password protected</p>
            </div>
            <input
              type="password"
              value={linkPassword}
              onChange={e => setLinkPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
              placeholder="Enter password"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white/70 text-sm placeholder:text-white/15 focus:outline-none focus:border-white/20"
              autoFocus
            />
            {authError && <p className="text-red-400/60 text-xs">{authError}</p>}
            <button
              onClick={handleAuth}
              className="w-full bg-white/10 hover:bg-white/15 border border-white/15 text-white/70 text-sm py-2 rounded transition-colors"
            >
              Access Files
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Ready: show files ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/20 text-xs tracking-widest uppercase mb-4">Allen Henson · File Share</p>
          <h1 className="text-white/80 text-xl font-light mb-1">{data?.label || data?.project_name}</h1>
          <div className="flex items-center gap-3 text-white/25 text-xs">
            {data?.shoot_date && <span>{new Date(data.shoot_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>}
            <span className="flex items-center gap-1">
              {data?.is_public ? <Globe size={10} /> : <Lock size={10} />}
              {data?.is_public ? "Public link" : "Protected link"}
            </span>
            {!data?.allow_download && (
              <span className="flex items-center gap-1 text-yellow-400/40">
                <Eye size={10} /> View only
              </span>
            )}
          </div>
        </div>

        {/* Files */}
        {Object.keys(grouped).length === 0 && (
          <div className="border border-white/5 rounded p-8 text-center">
            <p className="text-white/20 text-sm">No files have been added to this share yet.</p>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(grouped).map(([field, files]) => (
            <div key={field} className="border border-white/8 rounded overflow-hidden">
              {/* Field header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/3 border-b border-white/5">
                <Folder size={12} className="text-white/25" />
                <span className="text-white/40 text-xs font-medium tracking-wide">{field}</span>
                <span className="text-white/15 text-xs">({files.length} file{files.length !== 1 ? "s" : ""})</span>
              </div>

              {/* Files */}
              {files.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <File size={14} className="text-white/20 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/65 text-sm truncate">{f.original_filename}</p>
                    <p className="text-white/20 text-xs mt-0.5">
                      {f.file_type?.toUpperCase()}
                      {f.file_size ? ` · ${formatSize(f.file_size)}` : ""}
                      {f.created_at ? ` · ${new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                    </p>
                  </div>
                  {data?.allow_download && (
                    <button
                      onClick={() => handleDownload(f)}
                      disabled={downloadingId === f.id}
                      className="flex items-center gap-1.5 text-white/30 hover:text-white/70 text-xs border border-white/10 hover:border-white/20 px-2.5 py-1 rounded transition-colors disabled:opacity-40"
                    >
                      <Download size={11} />
                      {downloadingId === f.id ? "..." : "Download"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-white/5 text-center">
          <p className="text-white/10 text-xs">
            Shared via <a href="https://allenhenson.com" className="hover:text-white/25 transition-colors">allenhenson.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
