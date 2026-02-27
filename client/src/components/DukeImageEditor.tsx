/**
 * DukeImageEditor - Full-screen image editor for the Duke gallery
 * Features: Free-form crop (react-image-crop), Rotate (90° increments), Save to server
 * Optimized for desktop and iPad
 * Only accessible when logged in as "editor" role
 */

import { useState, useCallback, useEffect, useRef } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { motion, AnimatePresence } from "framer-motion";

interface DukeImageEditorProps {
  imageSrc: string; // Full URL to the JPEG image
  imageName: string; // e.g., "duke-42"
  editorPassword: string;
  onClose: () => void;
  onSaved: () => void; // Called after successful save to refresh gallery
  onDeleted: (imageName: string) => void; // Called after successful delete to remove from gallery
}

export default function DukeImageEditor({
  imageSrc,
  imageName,
  editorPassword,
  onClose,
  onSaved,
  onDeleted,
}: DukeImageEditorProps) {
  // Crop state — free-form (no locked aspect ratio)
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Rotate state
  const [rotation, setRotation] = useState(0);

  // UI state
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Responsive: detect touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  // Prevent body scroll when editor is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleRotate = (degrees: number) => {
    setRotation((prev) => ((prev + degrees) % 360 + 360) % 360);
  };

  // Convert the displayed crop coordinates to actual image pixel coordinates
  // accounting for the CSS scaling of the image in the viewport
  const getPixelCrop = useCallback((): {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null => {
    if (!completedCrop || !imgRef.current) return null;

    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    return {
      x: Math.round(completedCrop.x * scaleX),
      y: Math.round(completedCrop.y * scaleY),
      width: Math.round(completedCrop.width * scaleX),
      height: Math.round(completedCrop.height * scaleY),
    };
  }, [completedCrop]);

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

      // Only send crop if user has been cropping and has a valid selection
      if (isCropping && completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
        const pixelCrop = getPixelCrop();
        if (pixelCrop) {
          body.crop = pixelCrop;
        }
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
        setCrop(undefined);
        setCompletedCrop(null);
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
        setCrop(undefined);
        setCompletedCrop(null);
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

  const handleReset = () => {
    setRotation(0);
    setCrop(undefined);
    setCompletedCrop(null);
    setIsCropping(false);
    setStatus(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/duke/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: editorPassword,
          imageName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({ type: "success", message: `${imageName.toUpperCase()} deleted` });
        setShowDeleteConfirm(false);
        setTimeout(() => {
          onDeleted(imageName);
        }, 1000);
      } else {
        setStatus({ type: "error", message: result.error || "Delete failed" });
        setShowDeleteConfirm(false);
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Network error" });
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const hasChanges =
    rotation !== 0 ||
    (isCropping && completedCrop && completedCrop.width > 0 && completedCrop.height > 0);

  // Cache-busted image source
  const cacheBustedSrc = imageSrc + "?t=" + Date.now();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[60] bg-black flex flex-col"
      style={{ touchAction: "none" }}
    >
      {/* Top toolbar — responsive for desktop and iPad */}
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-black/90 border-b border-white/10 z-10 min-h-[48px] md:min-h-[52px]">
        {/* Left: Cancel + Image name */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onClose}
            className="text-[10px] sm:text-xs tracking-cinematic text-white/70 hover:text-white active:text-white cinematic-transition px-2 sm:px-3 py-1.5 sm:py-2 border border-white/20 hover:border-white/40 active:border-white/40 min-h-[36px] sm:min-h-[auto]"
          >
            CANCEL
          </button>
          <span className="text-[10px] sm:text-xs tracking-cinematic text-gold font-light hidden xs:inline sm:inline">
            EDITING: {imageName.toUpperCase()}
          </span>
        </div>

        {/* Right: Revert + Save */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reset button (clears without saving) */}
          {hasChanges && (
            <button
              onClick={handleReset}
              className="text-[10px] sm:text-xs tracking-cinematic text-white/40 hover:text-white/70 active:text-white/70 cinematic-transition px-2 sm:px-3 py-1.5 sm:py-2 border border-white/10 hover:border-white/20 min-h-[36px] sm:min-h-[auto]"
            >
              RESET
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting || saving}
            className="text-[10px] sm:text-xs tracking-cinematic text-red-400/70 hover:text-red-400 active:text-red-400 cinematic-transition px-2 sm:px-3 py-1.5 sm:py-2 border border-red-500/20 hover:border-red-500/40 active:border-red-500/40 disabled:opacity-30 min-h-[36px] sm:min-h-[auto]"
          >
            DELETE
          </button>

          {/* Revert button */}
          <button
            onClick={handleRevert}
            disabled={reverting}
            className="text-[10px] sm:text-xs tracking-cinematic text-white/50 hover:text-white active:text-white cinematic-transition px-2 sm:px-3 py-1.5 sm:py-2 border border-white/10 hover:border-white/30 active:border-white/30 disabled:opacity-30 min-h-[36px] sm:min-h-[auto]"
          >
            {reverting ? "..." : "REVERT"}
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="text-[10px] sm:text-xs tracking-cinematic text-background font-medium bg-gold hover:bg-gold/90 active:bg-gold/80 cinematic-transition px-3 sm:px-4 py-1.5 sm:py-2 disabled:opacity-30 disabled:cursor-not-allowed min-h-[36px] sm:min-h-[auto]"
          >
            {saving ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </div>

      {/* Tool bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 px-3 sm:px-4 py-2 sm:py-3 bg-black/80 border-b border-white/5 flex-wrap">
        {/* Crop toggle */}
        <button
          onClick={() => {
            if (isCropping) {
              // Exiting crop mode
              setIsCropping(false);
              setCrop(undefined);
              setCompletedCrop(null);
            } else {
              // Entering crop mode
              setIsCropping(true);
            }
          }}
          className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs tracking-cinematic cinematic-transition px-2.5 sm:px-3 py-1.5 sm:py-2 border min-h-[36px] sm:min-h-[auto] ${
            isCropping
              ? "text-gold border-gold/50 bg-gold/10"
              : "text-white/60 border-white/10 hover:text-white hover:border-white/30 active:text-white active:border-white/30"
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
          {isCropping && (
            <span className="text-[9px] text-gold/60 ml-1">FREE</span>
          )}
        </button>

        {/* Rotate buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => handleRotate(-90)}
            className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs tracking-cinematic text-white/60 hover:text-white active:text-white cinematic-transition px-2.5 sm:px-3 py-1.5 sm:py-2 border border-white/10 hover:border-white/30 active:border-white/30 min-h-[36px] sm:min-h-[auto]"
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
            className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs tracking-cinematic text-white/60 hover:text-white active:text-white cinematic-transition px-2.5 sm:px-3 py-1.5 sm:py-2 border border-white/10 hover:border-white/30 active:border-white/30 min-h-[36px] sm:min-h-[auto]"
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
          <span className="text-[10px] sm:text-xs tracking-cinematic text-gold/70">
            {rotation}°
          </span>
        )}

        {/* Crop dimensions indicator */}
        {isCropping && completedCrop && completedCrop.width > 0 && (
          <span className="text-[10px] sm:text-xs tracking-cinematic text-white/40">
            {Math.round(completedCrop.width)}×{Math.round(completedCrop.height)}px
          </span>
        )}
      </div>

      {/* Image name on mobile */}
      <div className="xs:hidden sm:hidden text-center py-1 bg-black/60">
        <span className="text-[9px] tracking-cinematic text-gold/60 font-light">
          {imageName.toUpperCase()}
        </span>
      </div>

      {/* Image area — fills remaining space */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black p-4 sm:p-6 md:p-8">
        {isCropping ? (
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            style={{ maxHeight: "100%", maxWidth: "100%" }}
            className="duke-crop-area"
          >
            <img
              ref={imgRef}
              src={cacheBustedSrc}
              alt={`Editing ${imageName}`}
              style={{
                maxHeight: "calc(100vh - 180px)",
                maxWidth: "100%",
                objectFit: "contain",
                transform: `rotate(${rotation}deg)`,
                transition: "transform 0.3s ease",
              }}
              draggable={false}
            />
          </ReactCrop>
        ) : (
          <img
            ref={imgRef}
            src={cacheBustedSrc}
            alt={`Editing ${imageName}`}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              maxHeight: "calc(100vh - 180px)",
              transform: `rotate(${rotation}deg)`,
              transition: "transform 0.3s ease",
            }}
            draggable={false}
          />
        )}
      </div>

      {/* Status bar */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`absolute bottom-8 sm:bottom-6 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-2.5 sm:py-3 text-[11px] sm:text-sm tracking-cinematic font-light z-20 whitespace-nowrap ${
              status.type === "success"
                ? "bg-green-900/80 text-green-200 border border-green-500/30"
                : "bg-red-900/80 text-red-200 border border-red-500/30"
            }`}
          >
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/80"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 p-6 sm:p-8 max-w-sm mx-4 text-center"
            >
              <div className="text-xs tracking-cinematic text-red-400 mb-2">DELETE IMAGE</div>
              <div className="text-sm sm:text-base text-white/80 mb-1 font-light">
                Permanently delete <span className="text-gold font-medium">{imageName.toUpperCase()}</span>?
              </div>
              <div className="text-[10px] sm:text-xs text-white/40 mb-6 tracking-cinematic">
                A backup will be saved to cloud storage.
                This cannot be undone from the editor.
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs tracking-cinematic text-white/60 hover:text-white cinematic-transition px-4 py-2 border border-white/20 hover:border-white/40 min-h-[36px]"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs tracking-cinematic text-white font-medium bg-red-600 hover:bg-red-500 active:bg-red-500 cinematic-transition px-4 py-2 disabled:opacity-50 min-h-[36px]"
                >
                  {deleting ? "DELETING..." : "DELETE PERMANENTLY"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch hint for iPad users */}
      {isTouchDevice && isCropping && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-[10px] tracking-cinematic text-white/20 z-10 pointer-events-none">
          DRAG TO SELECT CROP AREA · DRAG CORNERS TO RESIZE
        </div>
      )}

      {/* Custom styles for react-image-crop to match Cinematic Noir theme */}
      <style>{`
        .duke-crop-area .ReactCrop__crop-selection {
          border: 2px solid #C9A96E !important;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6) !important;
        }
        .duke-crop-area .ReactCrop__drag-handle {
          background-color: #C9A96E !important;
          border: none !important;
          width: ${isTouchDevice ? '14px' : '10px'} !important;
          height: ${isTouchDevice ? '14px' : '10px'} !important;
        }
        .duke-crop-area .ReactCrop__drag-bar {
          background-color: transparent !important;
        }
        .duke-crop-area .ReactCrop__rule-of-thirds-hz::before,
        .duke-crop-area .ReactCrop__rule-of-thirds-hz::after,
        .duke-crop-area .ReactCrop__rule-of-thirds-vt::before,
        .duke-crop-area .ReactCrop__rule-of-thirds-vt::after {
          background-color: rgba(201, 169, 110, 0.3) !important;
        }
      `}</style>
    </motion.div>
  );
}
