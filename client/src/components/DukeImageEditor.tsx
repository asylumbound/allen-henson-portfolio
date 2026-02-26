/**
 * DukeImageEditor - Full-screen image editor for the Duke gallery
 * Features: Crop (react-easy-crop), Rotate (90° increments), Save to server
 * Only accessible when logged in as "editor" role
 */

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";

interface DukeImageEditorProps {
  imageSrc: string; // Full URL to the JPEG image
  imageName: string; // e.g., "duke-42"
  editorPassword: string;
  onClose: () => void;
  onSaved: () => void; // Called after successful save to refresh gallery
}

export default function DukeImageEditor({
  imageSrc,
  imageName,
  editorPassword,
  onClose,
  onSaved,
}: DukeImageEditorProps) {
  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Rotate state
  const [rotation, setRotation] = useState(0);

  // UI state
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      const body: any = {
        password: editorPassword,
        imageName,
        rotate: rotation,
        crop: null,
      };

      // Only send crop if user has been cropping
      if (isCropping && croppedAreaPixels) {
        body.crop = {
          x: croppedAreaPixels.x,
          y: croppedAreaPixels.y,
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height,
        };
      }

      const response = await fetch("/api/duke/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({
          type: "success",
          message: `Saved — ${result.dimensions.width}×${result.dimensions.height}`,
        });
        // Reset editor state
        setRotation(0);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setIsCropping(false);
        // Notify parent to refresh
        setTimeout(() => {
          onSaved();
        }, 1200);
      } else {
        setStatus({ type: "error", message: result.error || "Save failed" });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = async () => {
    setReverting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/duke/revert-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: editorPassword,
          imageName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({ type: "success", message: "Reverted to backup" });
        setRotation(0);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setIsCropping(false);
        setTimeout(() => {
          onSaved();
        }, 1200);
      } else {
        setStatus({ type: "error", message: result.error || "Revert failed" });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Network error" });
    } finally {
      setReverting(false);
    }
  };

  const hasChanges = rotation !== 0 || (isCropping && croppedAreaPixels);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[60] bg-black flex flex-col"
    >
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-black/90 border-b border-white/10 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-xs tracking-cinematic text-white/70 hover:text-white cinematic-transition px-3 py-1.5 border border-white/20 hover:border-white/40"
          >
            CANCEL
          </button>
          <span className="text-xs tracking-cinematic text-gold font-light">
            EDITING: {imageName.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Revert button */}
          <button
            onClick={handleRevert}
            disabled={reverting}
            className="text-xs tracking-cinematic text-white/50 hover:text-white cinematic-transition px-3 py-1.5 border border-white/10 hover:border-white/30 disabled:opacity-30"
          >
            {reverting ? "REVERTING..." : "REVERT"}
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="text-xs tracking-cinematic text-background font-medium bg-gold hover:bg-gold/90 cinematic-transition px-4 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </div>

      {/* Tool bar */}
      <div className="flex items-center justify-center gap-6 px-4 py-3 bg-black/80 border-b border-white/5">
        {/* Crop toggle */}
        <button
          onClick={() => {
            setIsCropping(!isCropping);
            if (!isCropping) {
              setZoom(1);
              setCrop({ x: 0, y: 0 });
            }
          }}
          className={`flex items-center gap-2 text-xs tracking-cinematic cinematic-transition px-3 py-1.5 border ${
            isCropping
              ? "text-gold border-gold/50 bg-gold/10"
              : "text-white/60 border-white/10 hover:text-white hover:border-white/30"
          }`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 2v14a2 2 0 0 0 2 2h14" />
            <path d="M18 22V8a2 2 0 0 0-2-2H2" />
          </svg>
          CROP
        </button>

        {/* Rotate buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRotate(-90)}
            className="flex items-center gap-1.5 text-xs tracking-cinematic text-white/60 hover:text-white cinematic-transition px-3 py-1.5 border border-white/10 hover:border-white/30"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
            </svg>
            -90°
          </button>
          <button
            onClick={() => handleRotate(90)}
            className="flex items-center gap-1.5 text-xs tracking-cinematic text-white/60 hover:text-white cinematic-transition px-3 py-1.5 border border-white/10 hover:border-white/30"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: "scaleX(-1)" }}
            >
              <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
            </svg>
            +90°
          </button>
        </div>

        {/* Rotation indicator */}
        {rotation !== 0 && (
          <span className="text-xs tracking-cinematic text-gold/70">
            {rotation}°
          </span>
        )}

        {/* Zoom (only when cropping) */}
        {isCropping && (
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-cinematic text-white/40">
              ZOOM
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-24 h-1 accent-gold appearance-none bg-white/20 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
            />
            <span className="text-xs tracking-cinematic text-white/40 w-8">
              {zoom.toFixed(1)}x
            </span>
          </div>
        )}
      </div>

      {/* Image area */}
      <div className="flex-1 relative">
        {isCropping ? (
          <Cropper
            image={imageSrc + "?t=" + Date.now()} // Cache bust
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: {
                background: "#000",
              },
              cropAreaStyle: {
                border: "2px solid #C9A96E",
                color: "rgba(0, 0, 0, 0.6)",
              },
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <img
              src={imageSrc + "?t=" + Date.now()}
              alt={`Editing ${imageName}`}
              className="max-w-[90%] max-h-[90%] object-contain select-none"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: "transform 0.3s ease",
              }}
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 text-sm tracking-cinematic font-light z-20 ${
              status.type === "success"
                ? "bg-green-900/80 text-green-200 border border-green-500/30"
                : "bg-red-900/80 text-red-200 border border-red-500/30"
            }`}
          >
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
