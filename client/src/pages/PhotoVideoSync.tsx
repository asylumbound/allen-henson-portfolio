import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Lock, Camera, Video, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp,
  Check, AlertTriangle, X, Settings, BookOpen, Clock, Zap, Copy, Save,
  Eye, EyeOff, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

// ── Types ────────────────────────────────────────────────────────────────────

interface Shoot {
  id: string;
  project_name: string;
  shoot_id: string;
  date?: string;
  location?: string;
  lighting_condition?: string;
  creative_intent?: string;
  lead_dp?: string;
  capture_mode: "photo" | "video" | "hybrid";
  notes?: string;
  is_locked: boolean;
  is_archived: boolean;
  created_at: string;
}

interface MasterSettings {
  id: string;
  shoot_id: string;
  photo_iso?: string;
  photo_aperture?: string;
  photo_shutter_speed?: string;
  photo_white_balance?: string;
  photo_color_profile?: string;
  photo_focus_mode?: string;
  photo_metering_mode?: string;
  photo_lens?: string;
  photo_file_format?: string;
  video_resolution?: string;
  video_frame_rate?: string;
  video_shutter_angle?: string;
  video_shutter_speed?: string;
  video_iso?: string;
  video_aperture?: string;
  video_white_balance?: string;
  video_color_profile?: string;
  video_lut_reference?: string;
  video_codec?: string;
  video_bit_depth?: string;
  video_bitrate?: string;
  video_nd_filter?: string;
  video_stabilization?: string;
  video_timecode_sync?: string;
  video_audio_sample_rate?: string;
  video_audio_bit_depth?: string;
  updated_by?: string;
}

interface OperatorCard {
  id: string;
  shoot_id: string;
  operator_name: string;
  role: string;
  camera_body?: string;
  lens?: string;
  sync_status: "synced" | "partial" | "diverged";
  is_intentional_deviation: boolean;
  deviation_reason?: string;
  deviation_explanation?: string;
  operator_notes?: string;
  photo_iso?: string;
  photo_aperture?: string;
  photo_shutter_speed?: string;
  photo_white_balance?: string;
  photo_color_profile?: string;
  photo_focus_mode?: string;
  photo_metering_mode?: string;
  photo_file_format?: string;
  video_resolution?: string;
  video_frame_rate?: string;
  video_shutter_angle?: string;
  video_shutter_speed?: string;
  video_iso?: string;
  video_aperture?: string;
  video_white_balance?: string;
  video_color_profile?: string;
  video_lut_reference?: string;
  video_codec?: string;
  video_bit_depth?: string;
  video_bitrate?: string;
  video_nd_filter?: string;
  video_stabilization?: string;
  video_timecode_sync?: string;
  video_audio_sample_rate?: string;
  video_audio_bit_depth?: string;
}

interface Preset {
  id: string;
  name: string;
  description?: string;
  capture_mode: string;
  settings: Record<string, string>;
  is_builtin: boolean;
}

interface ChangeLogEntry {
  id: string;
  changed_by: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  context?: string;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = "&&77VAnguard";

const PHOTO_FIELDS = [
  { key: "photo_iso", label: "ISO" },
  { key: "photo_aperture", label: "Aperture" },
  { key: "photo_shutter_speed", label: "Shutter Speed" },
  { key: "photo_white_balance", label: "White Balance" },
  { key: "photo_color_profile", label: "Color Profile" },
  { key: "photo_focus_mode", label: "Focus Mode" },
  { key: "photo_metering_mode", label: "Metering Mode" },
  { key: "photo_lens", label: "Lens" },
  { key: "photo_file_format", label: "File Format" },
];

const VIDEO_FIELDS = [
  { key: "video_resolution", label: "Resolution" },
  { key: "video_frame_rate", label: "Frame Rate" },
  { key: "video_shutter_angle", label: "Shutter Angle" },
  { key: "video_shutter_speed", label: "Shutter Speed" },
  { key: "video_iso", label: "ISO" },
  { key: "video_aperture", label: "Aperture" },
  { key: "video_white_balance", label: "White Balance" },
  { key: "video_color_profile", label: "Color Profile / LUT" },
  { key: "video_lut_reference", label: "LUT Reference" },
  { key: "video_codec", label: "Codec" },
  { key: "video_bit_depth", label: "Bit Depth" },
  { key: "video_bitrate", label: "Bitrate" },
  { key: "video_nd_filter", label: "ND Filter" },
  { key: "video_stabilization", label: "Stabilization" },
  { key: "video_timecode_sync", label: "Timecode Sync" },
  { key: "video_audio_sample_rate", label: "Audio Sample Rate" },
  { key: "video_audio_bit_depth", label: "Audio Bit Depth" },
];

// ── Helper Components ────────────────────────────────────────────────────────

function SyncBadge({ status }: { status: string }) {
  if (status === "synced") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-900/40 text-green-300 border border-green-700/40">
        <Check size={10} /> SYNCED
      </span>
    );
  }
  if (status === "diverged") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/40">
        <X size={10} /> DIVERGED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-900/40 text-yellow-300 border border-yellow-700/40">
      <AlertTriangle size={10} /> PARTIAL
    </span>
  );
}

function CaptureModeIcon({ mode }: { mode: string }) {
  if (mode === "photo") return <Camera size={14} className="text-blue-400" />;
  if (mode === "video") return <Video size={14} className="text-purple-400" />;
  return (
    <span className="inline-flex gap-0.5">
      <Camera size={12} className="text-blue-400" />
      <Video size={12} className="text-purple-400" />
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PhotoVideoSync() {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // View state
  const [activeTab, setActiveTab] = useState<"shoots" | "presets" | "log">("shoots");
  const [selectedShootId, setSelectedShootId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showCreateShoot, setShowCreateShoot] = useState(false);
  const [showCreateOperator, setShowCreateOperator] = useState(false);
  const [showMasterEdit, setShowMasterEdit] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  // Forms
  const [newShoot, setNewShoot] = useState({
    project_name: "", shoot_id: "", date: "", location: "",
    lighting_condition: "", creative_intent: "", lead_dp: "",
    capture_mode: "hybrid" as "photo" | "video" | "hybrid", notes: ""
  });
  const [newOperator, setNewOperator] = useState({
    operator_name: "", role: "A Cam", camera_body: "", lens: "", operator_notes: ""
  });
  const [masterDraft, setMasterDraft] = useState<Partial<MasterSettings>>({});

  // Prevent indexing
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  // ── tRPC queries ──────────────────────────────────────────────────────────

  const shootsQuery = trpc.syncSheet.getShoots.useQuery(
    { includeArchived: false },
    { enabled: isAuthenticated }
  );

  const selectedShoot = shootsQuery.data?.find(s => s.id === selectedShootId) as Shoot | undefined;

  const masterQuery = trpc.syncSheet.getMasterSettings.useQuery(
    { shoot_id: selectedShootId! },
    { enabled: !!selectedShootId && isAuthenticated }
  );

  const operatorsQuery = trpc.syncSheet.getOperatorCards.useQuery(
    { shoot_id: selectedShootId! },
    { enabled: !!selectedShootId && isAuthenticated }
  );

  const presetsQuery = trpc.syncSheet.getPresets.useQuery(
    {},
    { enabled: isAuthenticated }
  );

  const changeLogQuery = trpc.syncSheet.getChangeLog.useQuery(
    { shoot_id: selectedShootId!, limit: 50 },
    { enabled: !!selectedShootId && isAuthenticated && activeTab === "log" }
  );

  // ── tRPC mutations ────────────────────────────────────────────────────────

  const createShootMut = trpc.syncSheet.createShoot.useMutation({
    onSuccess: () => { shootsQuery.refetch(); setShowCreateShoot(false); toast.success("Shoot created"); },
    onError: (e) => toast.error(e.message),
  });

  const upsertMasterMut = trpc.syncSheet.upsertMasterSettings.useMutation({
    onSuccess: () => {
      masterQuery.refetch(); operatorsQuery.refetch();
      setShowMasterEdit(false); toast.success("Master settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const createOperatorMut = trpc.syncSheet.createOperatorCard.useMutation({
    onSuccess: () => { operatorsQuery.refetch(); setShowCreateOperator(false); toast.success("Operator card added"); },
    onError: (e) => toast.error(e.message),
  });

  const syncOperatorMut = trpc.syncSheet.syncOperatorFromMaster.useMutation({
    onSuccess: () => { operatorsQuery.refetch(); toast.success("Synced from master"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteOperatorMut = trpc.syncSheet.deleteOperatorCard.useMutation({
    onSuccess: () => { operatorsQuery.refetch(); toast.success("Operator card removed"); },
    onError: (e) => toast.error(e.message),
  });

  const applyPresetMut = trpc.syncSheet.applyPresetToMaster.useMutation({
    onSuccess: () => {
      masterQuery.refetch(); operatorsQuery.refetch();
      setShowPresetPicker(false); toast.success("Preset applied to master settings");
    },
    onError: (e) => toast.error(e.message),
  });

  const archiveShootMut = trpc.syncSheet.updateShoot.useMutation({
    onSuccess: () => { shootsQuery.refetch(); setSelectedShootId(null); toast.success("Shoot archived"); },
    onError: (e) => toast.error(e.message),
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  const handleAuth = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password");
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateShoot = () => {
    if (!newShoot.project_name || !newShoot.shoot_id) {
      toast.error("Project name and Shoot ID are required");
      return;
    }
    createShootMut.mutate({ password: ADMIN_PASSWORD, ...newShoot, created_by: "admin" });
  };

  const handleSaveMaster = () => {
    if (!selectedShootId) return;
    upsertMasterMut.mutate({
      password: ADMIN_PASSWORD,
      shoot_id: selectedShootId,
      updated_by: "admin",
      ...masterDraft,
    });
  };

  const handleCreateOperator = () => {
    if (!selectedShootId || !newOperator.operator_name) {
      toast.error("Operator name is required");
      return;
    }
    createOperatorMut.mutate({
      password: ADMIN_PASSWORD,
      shoot_id: selectedShootId,
      ...newOperator,
      last_updated_by: "admin",
    });
  };

  const handleSyncOperator = (cardId: string) => {
    if (!selectedShootId) return;
    syncOperatorMut.mutate({
      password: ADMIN_PASSWORD,
      operator_card_id: cardId,
      shoot_id: selectedShootId,
      synced_by: "admin",
    });
  };

  const handleApplyPreset = (presetId: string) => {
    if (!selectedShootId) return;
    applyPresetMut.mutate({
      password: ADMIN_PASSWORD,
      preset_id: presetId,
      shoot_id: selectedShootId,
      applied_by: "admin",
    });
  };

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openMasterEdit = () => {
    const master = (masterQuery.data ?? null) as unknown as MasterSettings | null;
    setMasterDraft(master ? { ...master } : {});
    setShowMasterEdit(true);
  };

  // ── Auth Gate ─────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Camera size={20} className="text-white/60" />
              <Video size={20} className="text-white/60" />
            </div>
            <h1 className="text-white text-xl font-light tracking-widest uppercase mb-1">
              Photo / Video Sync
            </h1>
            <p className="text-white/40 text-xs tracking-wider">PRODUCTION TOOL — RESTRICTED ACCESS</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
              placeholder="Enter access code"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 text-sm focus:outline-none focus:border-white/30 rounded"
            />
            {authError && <p className="text-red-400 text-xs">{authError}</p>}
            <button
              onClick={handleAuth}
              className="w-full bg-white text-black py-3 text-sm font-medium tracking-widest uppercase hover:bg-white/90 transition-colors rounded"
            >
              Access
            </button>
          </div>
          <div className="mt-6 text-center">
            <Link href="/" className="text-white/20 text-xs hover:text-white/40 transition-colors">
              ← Back to site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  const shoots = (shootsQuery.data || []) as unknown as Shoot[];
  const master = (masterQuery.data ?? null) as unknown as MasterSettings | null;
  const operators = (operatorsQuery.data || []) as unknown as OperatorCard[];
  const presets = (presetsQuery.data || []) as unknown as Preset[];
  const changeLog = (changeLogQuery.data || []) as unknown as ChangeLogEntry[];

  const showPhotoFields = !selectedShoot || selectedShoot.capture_mode !== "video";
  const showVideoFields = !selectedShoot || selectedShoot.capture_mode !== "photo";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Camera size={16} className="text-blue-400" />
              <Video size={16} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-sm font-medium tracking-widest uppercase text-white">
                Photo / Video Sync Sheet
              </h1>
              <p className="text-white/30 text-xs">Camera settings synchronization</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors">
              ← Site
            </Link>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-white/30 text-xs hover:text-white/60 transition-colors flex items-center gap-1"
            >
              <Lock size={10} /> Lock
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">

        {/* ── Left Panel: Shoots List ──────────────────────────────────── */}
        <div className="w-72 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs tracking-widest uppercase">Shoots</span>
            <button
              onClick={() => setShowCreateShoot(!showCreateShoot)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Create Shoot Form */}
          {showCreateShoot && (
            <div className="mb-4 p-3 border border-white/10 rounded bg-white/3 space-y-2">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-2">New Shoot</p>
              {[
                { key: "project_name", label: "Project Name *" },
                { key: "shoot_id", label: "Shoot ID *" },
                { key: "date", label: "Date (YYYY-MM-DD)" },
                { key: "location", label: "Location" },
                { key: "lead_dp", label: "Lead DP" },
                { key: "lighting_condition", label: "Lighting" },
                { key: "creative_intent", label: "Creative Intent" },
              ].map(f => (
                <input
                  key={f.key}
                  placeholder={f.label}
                  value={(newShoot as Record<string, string>)[f.key] || ""}
                  onChange={e => setNewShoot(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 text-white placeholder-white/20 px-3 py-1.5 text-xs rounded focus:outline-none focus:border-white/30"
                />
              ))}
              <select
                value={newShoot.capture_mode}
                onChange={e => setNewShoot(prev => ({ ...prev, capture_mode: e.target.value as "photo" | "video" | "hybrid" }))}
                className="w-full bg-black/40 border border-white/10 text-white px-3 py-1.5 text-xs rounded focus:outline-none"
              >
                <option value="hybrid">Hybrid (Photo + Video)</option>
                <option value="photo">Photo Only</option>
                <option value="video">Video Only</option>
              </select>
              <textarea
                placeholder="Notes"
                value={newShoot.notes}
                onChange={e => setNewShoot(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 text-white placeholder-white/20 px-3 py-1.5 text-xs rounded focus:outline-none h-16 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateShoot}
                  disabled={createShootMut.isPending}
                  className="flex-1 bg-white text-black py-1.5 text-xs font-medium rounded hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {createShootMut.isPending ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => setShowCreateShoot(false)}
                  className="px-3 border border-white/10 text-white/50 text-xs rounded hover:border-white/30 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Shoots List */}
          <div className="space-y-1.5">
            {shootsQuery.isLoading && (
              <p className="text-white/30 text-xs">Loading...</p>
            )}
            {shoots.map(shoot => (
              <button
                key={shoot.id}
                onClick={() => { setSelectedShootId(shoot.id); setActiveTab("shoots"); }}
                className={`w-full text-left p-3 rounded border transition-all ${
                  selectedShootId === shoot.id
                    ? "border-white/30 bg-white/8"
                    : "border-white/5 bg-white/2 hover:border-white/15 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-xs font-medium truncate">{shoot.project_name}</span>
                  <CaptureModeIcon mode={shoot.capture_mode} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/30 text-xs font-mono">{shoot.shoot_id}</span>
                  {shoot.date && (
                    <span className="text-white/20 text-xs">{shoot.date}</span>
                  )}
                </div>
                {shoot.location && (
                  <p className="text-white/25 text-xs mt-0.5 truncate">{shoot.location}</p>
                )}
              </button>
            ))}
            {!shootsQuery.isLoading && shoots.length === 0 && (
              <p className="text-white/20 text-xs text-center py-4">No shoots yet</p>
            )}
          </div>
        </div>

        {/* ── Right Panel: Shoot Detail ────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {!selectedShootId ? (
            <div className="flex items-center justify-center h-64 border border-white/5 rounded">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3 opacity-20">
                  <Camera size={24} />
                  <Video size={24} />
                </div>
                <p className="text-white/30 text-sm">Select a shoot to view settings</p>
                <p className="text-white/15 text-xs mt-1">or create a new one</p>
              </div>
            </div>
          ) : (
            <>
              {/* Shoot Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-white text-lg font-light">{selectedShoot?.project_name}</h2>
                    <CaptureModeIcon mode={selectedShoot?.capture_mode || "hybrid"} />
                    {selectedShoot?.is_locked && (
                      <span className="text-white/30 text-xs flex items-center gap-1">
                        <Lock size={10} /> Locked
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-white/30 text-xs">
                    <span className="font-mono">{selectedShoot?.shoot_id}</span>
                    {selectedShoot?.date && <span>{selectedShoot.date}</span>}
                    {selectedShoot?.location && <span>{selectedShoot.location}</span>}
                    {selectedShoot?.lead_dp && <span>DP: {selectedShoot.lead_dp}</span>}
                  </div>
                  {selectedShoot?.creative_intent && (
                    <p className="text-white/25 text-xs mt-1 italic">{selectedShoot.creative_intent}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("log")}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors flex items-center gap-1 ${
                      activeTab === "log" ? "border-white/30 text-white" : "border-white/10 text-white/40 hover:border-white/20"
                    }`}
                  >
                    <Clock size={10} /> Log
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Archive this shoot?")) {
                        archiveShootMut.mutate({ password: ADMIN_PASSWORD, id: selectedShootId, is_archived: true });
                      }
                    }}
                    className="text-xs px-3 py-1.5 rounded border border-white/10 text-white/30 hover:border-white/20 hover:text-white/50 transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>

              {/* Tab: Main Shoot View */}
              {activeTab !== "log" && (
                <>
                  {/* Master Settings Card */}
                  <div className="border border-white/10 rounded mb-4">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Settings size={14} className="text-white/40" />
                        <span className="text-white text-sm font-medium">Master Settings</span>
                        {master?.updated_by && (
                          <span className="text-white/25 text-xs">— last by {master.updated_by}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPresetPicker(!showPresetPicker)}
                          className="text-xs px-3 py-1 rounded border border-white/10 text-white/40 hover:border-white/25 hover:text-white/70 transition-colors flex items-center gap-1"
                        >
                          <Zap size={10} /> Preset
                        </button>
                        <button
                          onClick={openMasterEdit}
                          className="text-xs px-3 py-1 rounded border border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors flex items-center gap-1"
                        >
                          <Save size={10} /> Edit
                        </button>
                      </div>
                    </div>

                    {/* Preset Picker */}
                    {showPresetPicker && (
                      <div className="px-4 py-3 border-b border-white/5 bg-white/2">
                        <p className="text-white/40 text-xs mb-2 uppercase tracking-widest">Apply Preset to Master</p>
                        <div className="grid grid-cols-2 gap-2">
                          {presets.map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleApplyPreset(p.id)}
                              disabled={applyPresetMut.isPending}
                              className="text-left p-2 border border-white/10 rounded hover:border-white/25 transition-colors"
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <CaptureModeIcon mode={p.capture_mode} />
                                <span className="text-white text-xs font-medium">{p.name}</span>
                                {p.is_builtin && <span className="text-white/20 text-xs">built-in</span>}
                              </div>
                              {p.description && (
                                <p className="text-white/30 text-xs">{p.description}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Master Settings Display */}
                    <div className="px-4 py-3">
                      {!master ? (
                        <p className="text-white/20 text-xs text-center py-3">
                          No master settings yet — click Edit to add
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {showPhotoFields && (
                            <div>
                              <p className="text-blue-400/60 text-xs uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Camera size={10} /> Photo
                              </p>
                              <div className="space-y-1">
                                {PHOTO_FIELDS.map(f => {
                                  const val = (master as unknown as Record<string, string>)[f.key];
                                  if (!val) return null;
                                  return (
                                    <div key={f.key} className="flex items-center justify-between">
                                      <span className="text-white/30 text-xs">{f.label}</span>
                                      <span className="text-white/80 text-xs font-mono">{val}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {showVideoFields && (
                            <div>
                              <p className="text-purple-400/60 text-xs uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Video size={10} /> Video
                              </p>
                              <div className="space-y-1">
                                {VIDEO_FIELDS.map(f => {
                                  const val = (master as unknown as Record<string, string>)[f.key];
                                  if (!val) return null;
                                  return (
                                    <div key={f.key} className="flex items-center justify-between">
                                      <span className="text-white/30 text-xs">{f.label}</span>
                                      <span className="text-white/80 text-xs font-mono">{val}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Master Edit Modal */}
                  {showMasterEdit && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                      <div className="bg-[#111] border border-white/15 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                          <h3 className="text-white font-medium">Edit Master Settings</h3>
                          <button onClick={() => setShowMasterEdit(false)} className="text-white/40 hover:text-white">
                            <X size={16} />
                          </button>
                        </div>
                        <div className="p-5 space-y-5">
                          {showPhotoFields && (
                            <div>
                              <p className="text-blue-400/70 text-xs uppercase tracking-widest mb-3 flex items-center gap-1">
                                <Camera size={10} /> Photo Settings
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                {PHOTO_FIELDS.map(f => (
                                  <div key={f.key}>
                                    <label className="text-white/40 text-xs block mb-1">{f.label}</label>
                                    <input
                                      value={(masterDraft as Record<string, string>)[f.key] || ""}
                                      onChange={e => setMasterDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                                      className="w-full bg-black/40 border border-white/10 text-white px-3 py-1.5 text-xs rounded focus:outline-none focus:border-white/30"
                                      placeholder={f.label}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {showVideoFields && (
                            <div>
                              <p className="text-purple-400/70 text-xs uppercase tracking-widest mb-3 flex items-center gap-1">
                                <Video size={10} /> Video Settings
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                {VIDEO_FIELDS.map(f => (
                                  <div key={f.key}>
                                    <label className="text-white/40 text-xs block mb-1">{f.label}</label>
                                    <input
                                      value={(masterDraft as Record<string, string>)[f.key] || ""}
                                      onChange={e => setMasterDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                                      className="w-full bg-black/40 border border-white/10 text-white px-3 py-1.5 text-xs rounded focus:outline-none focus:border-white/30"
                                      placeholder={f.label}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="px-5 py-4 border-t border-white/10 flex gap-3">
                          <button
                            onClick={handleSaveMaster}
                            disabled={upsertMasterMut.isPending}
                            className="flex-1 bg-white text-black py-2 text-sm font-medium rounded hover:bg-white/90 transition-colors disabled:opacity-50"
                          >
                            {upsertMasterMut.isPending ? "Saving..." : "Save Master Settings"}
                          </button>
                          <button
                            onClick={() => setShowMasterEdit(false)}
                            className="px-4 border border-white/15 text-white/50 text-sm rounded hover:border-white/30 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Operator Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/50 text-xs tracking-widest uppercase">Operator Cards</span>
                      <button
                        onClick={() => setShowCreateOperator(!showCreateOperator)}
                        className="text-white/40 hover:text-white transition-colors flex items-center gap-1 text-xs"
                      >
                        <Plus size={12} /> Add Operator
                      </button>
                    </div>

                    {/* Create Operator Form */}
                    {showCreateOperator && (
                      <div className="mb-4 p-3 border border-white/10 rounded bg-white/2 space-y-2">
                        <p className="text-white/40 text-xs uppercase tracking-widest">New Operator</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            placeholder="Operator Name *"
                            value={newOperator.operator_name}
                            onChange={e => setNewOperator(prev => ({ ...prev, operator_name: e.target.value }))}
                            className="bg-black/40 border border-white/10 text-white placeholder-white/20 px-3 py-1.5 text-xs rounded focus:outline-none focus:border-white/30"
                          />
                          <select
                            value={newOperator.role}
                            onChange={e => setNewOperator(prev => ({ ...prev, role: e.target.value }))}
                            className="bg-black/40 border border-white/10 text-white px-3 py-1.5 text-xs rounded focus:outline-none"
                          >
                            {["A Cam", "B Cam", "C Cam", "Photo 1", "Photo 2", "Photo 3", "Drone", "GoPro", "BTS"].map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <input
                            placeholder="Camera Body"
                            value={newOperator.camera_body}
                            onChange={e => setNewOperator(prev => ({ ...prev, camera_body: e.target.value }))}
                            className="bg-black/40 border border-white/10 text-white placeholder-white/20 px-3 py-1.5 text-xs rounded focus:outline-none focus:border-white/30"
                          />
                          <input
                            placeholder="Lens"
                            value={newOperator.lens}
                            onChange={e => setNewOperator(prev => ({ ...prev, lens: e.target.value }))}
                            className="bg-black/40 border border-white/10 text-white placeholder-white/20 px-3 py-1.5 text-xs rounded focus:outline-none focus:border-white/30"
                          />
                        </div>
                        <textarea
                          placeholder="Notes"
                          value={newOperator.operator_notes}
                          onChange={e => setNewOperator(prev => ({ ...prev, operator_notes: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 text-white placeholder-white/20 px-3 py-1.5 text-xs rounded focus:outline-none h-12 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateOperator}
                            disabled={createOperatorMut.isPending}
                            className="flex-1 bg-white text-black py-1.5 text-xs font-medium rounded hover:bg-white/90 disabled:opacity-50"
                          >
                            {createOperatorMut.isPending ? "Adding..." : "Add Operator"}
                          </button>
                          <button
                            onClick={() => setShowCreateOperator(false)}
                            className="px-3 border border-white/10 text-white/40 text-xs rounded hover:border-white/25"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Operator Cards List */}
                    <div className="space-y-2">
                      {operatorsQuery.isLoading && (
                        <p className="text-white/20 text-xs">Loading operators...</p>
                      )}
                      {operators.map(card => (
                        <div key={card.id} className="border border-white/10 rounded">
                          {/* Card Header */}
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleCard(card.id)}
                                className="text-white/30 hover:text-white transition-colors"
                              >
                                {expandedCards.has(card.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm font-medium">{card.operator_name}</span>
                                  <span className="text-white/30 text-xs border border-white/10 px-1.5 py-0.5 rounded">
                                    {card.role}
                                  </span>
                                  <SyncBadge status={card.sync_status} />
                                </div>
                                {(card.camera_body || card.lens) && (
                                  <p className="text-white/25 text-xs mt-0.5">
                                    {[card.camera_body, card.lens].filter(Boolean).join(" · ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {card.sync_status !== "synced" && master && (
                                <button
                                  onClick={() => handleSyncOperator(card.id)}
                                  disabled={syncOperatorMut.isPending}
                                  className="text-xs px-2.5 py-1 rounded border border-white/15 text-white/50 hover:border-white/30 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-40"
                                  title="Sync from master settings"
                                >
                                  <RefreshCw size={10} /> Sync
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm(`Remove ${card.operator_name}?`)) {
                                    deleteOperatorMut.mutate({ password: ADMIN_PASSWORD, id: card.id });
                                  }
                                }}
                                className="text-white/20 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Card Settings */}
                          {expandedCards.has(card.id) && (
                            <div className="px-4 pb-4 border-t border-white/5">
                              {card.is_intentional_deviation && card.deviation_reason && (
                                <div className="mt-3 mb-3 p-2 border border-yellow-700/30 rounded bg-yellow-900/10">
                                  <p className="text-yellow-400/80 text-xs font-medium mb-0.5">
                                    Intentional Deviation: {card.deviation_reason}
                                  </p>
                                  {card.deviation_explanation && (
                                    <p className="text-yellow-400/50 text-xs">{card.deviation_explanation}</p>
                                  )}
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4 mt-3">
                                {showPhotoFields && (
                                  <div>
                                    <p className="text-blue-400/50 text-xs uppercase tracking-widest mb-2 flex items-center gap-1">
                                      <Camera size={9} /> Photo
                                    </p>
                                    <div className="space-y-1">
                                      {PHOTO_FIELDS.map(f => {
                                        const opVal = (card as unknown as Record<string, string>)[f.key];
                                        const masterVal = master ? (master as unknown as Record<string, string>)[f.key] : null;
                                        const isDiff = masterVal && opVal && opVal !== masterVal;
                                        if (!opVal && !masterVal) return null;
                                        return (
                                          <div key={f.key} className="flex items-center justify-between">
                                            <span className="text-white/25 text-xs">{f.label}</span>
                                            <span className={`text-xs font-mono ${isDiff ? "text-yellow-400" : "text-white/70"}`}>
                                              {opVal || <span className="text-white/20 italic">—</span>}
                                              {isDiff && masterVal && (
                                                <span className="text-white/20 ml-1">(M: {masterVal})</span>
                                              )}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                {showVideoFields && (
                                  <div>
                                    <p className="text-purple-400/50 text-xs uppercase tracking-widest mb-2 flex items-center gap-1">
                                      <Video size={9} /> Video
                                    </p>
                                    <div className="space-y-1">
                                      {VIDEO_FIELDS.map(f => {
                                        const opVal = (card as unknown as Record<string, string>)[f.key];
                                        const masterVal = master ? (master as unknown as Record<string, string>)[f.key] : null;
                                        const isDiff = masterVal && opVal && opVal !== masterVal;
                                        if (!opVal && !masterVal) return null;
                                        return (
                                          <div key={f.key} className="flex items-center justify-between">
                                            <span className="text-white/25 text-xs">{f.label}</span>
                                            <span className={`text-xs font-mono ${isDiff ? "text-yellow-400" : "text-white/70"}`}>
                                              {opVal || <span className="text-white/20 italic">—</span>}
                                              {isDiff && masterVal && (
                                                <span className="text-white/20 ml-1">(M: {masterVal})</span>
                                              )}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {card.operator_notes && (
                                <p className="text-white/25 text-xs mt-3 italic border-t border-white/5 pt-2">
                                  {card.operator_notes}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {!operatorsQuery.isLoading && operators.length === 0 && (
                        <p className="text-white/15 text-xs text-center py-6 border border-white/5 rounded">
                          No operators yet — add the first one above
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Tab: Change Log */}
              {activeTab === "log" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/50 text-xs tracking-widest uppercase flex items-center gap-1.5">
                      <Clock size={12} /> Change Log
                    </span>
                    <button
                      onClick={() => setActiveTab("shoots")}
                      className="text-white/30 text-xs hover:text-white/60 transition-colors"
                    >
                      ← Back
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {changeLogQuery.isLoading && (
                      <p className="text-white/20 text-xs">Loading...</p>
                    )}
                    {changeLog.map(entry => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 border border-white/5 rounded">
                        <div className="text-white/20 text-xs font-mono mt-0.5 whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleString("en-US", {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-white/60 text-xs font-medium">{entry.changed_by}</span>
                            <span className="text-white/25 text-xs">changed</span>
                            <span className="text-white/50 text-xs font-mono">{entry.field_changed}</span>
                          </div>
                          {(entry.old_value || entry.new_value) && (
                            <div className="flex items-center gap-2 text-xs">
                              {entry.old_value && (
                                <span className="text-red-400/60 font-mono">{entry.old_value}</span>
                              )}
                              {entry.old_value && entry.new_value && (
                                <ArrowRight size={10} className="text-white/20" />
                              )}
                              {entry.new_value && (
                                <span className="text-green-400/60 font-mono">{entry.new_value}</span>
                              )}
                            </div>
                          )}
                          {entry.context && (
                            <p className="text-white/20 text-xs mt-0.5 italic">{entry.context}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {!changeLogQuery.isLoading && changeLog.length === 0 && (
                      <p className="text-white/15 text-xs text-center py-6 border border-white/5 rounded">
                        No changes logged yet
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
