/**
 * DukeImageEditor - Full-screen image editor for the Duke gallery
 * Features: Free-form crop (react-easy-crop), Rotate (90° increments), Save to server
 * Optimized for desktop and iPad
 * Only accessible when logged in as "editor" role
 */

import { useState, useCallback, useEffect } from "react";
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

  // Responsive: detect touch device / viewport
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

  const handleReset = () => {
    setRotation(0);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsCropping(false);
    setCroppedAreaPixels(null);
    setStatus(null);
  };

  const hasChanges = rotation !== 0 || (isCropping && croppedAreaPixels);

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

      {/* Tool bar — wraps gracefully on smaller screens */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 px-3 sm:px-4 py-2 sm:py-3 bg-black/80 border-b border-white/5 flex-wrap">
        {/* Crop toggle */}
        <button
          onClick={() => {
            setIsCropping(!isCropping);
            if (!isCropping) {
              setZoom(1);
              setCrop({ x: 0, y: 0 });
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

        {/* Zoom slider (visible when cropping) — wider on desktop, touch-friendly on iPad */}
        {isCropping && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs tracking-cinematic text-white/40">
              ZOOM
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-20 sm:w-28 md:w-36 h-2 sm:h-1 accent-gold appearance-none bg-white/20 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:sm:w-3 [&::-webkit-slider-thumb]:sm:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
            />
            <span className="text-[10px] sm:text-xs tracking-cinematic text-white/40 w-8">
              {zoom.toFixed(1)}x
            </span>
          </div>
        )}
      </div>

      {/* Image name on mobile (shown below toolbar when hidden from top bar) */}
      <div className="xs:hidden sm:hidden text-center py-1 bg-black/60">
        <span className="text-[9px] tracking-cinematic text-gold/60 font-light">
          {imageName.toUpperCase()}
        </span>
      </div>

      {/* Image area — fills remaining space */}
      <div className="flex-1 relative overflow-hidden">
        {isCropping ? (
          <Cropper
            image={cacheBustedSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={true}
            zoomWithScroll={!isTouchDevice}
            style={{
              containerStyle: {
                background: "#000",
                touchAction: "none",
              },
              cropAreaStyle: {
                border: "2px solid #C9A96E",
                color: "rgba(0, 0, 0, 0.6)",
              },
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black p-4 sm:p-6 md:p-8">
            <img
              src={cacheBustedSrc}
              alt={`Editing ${imageName}`}
              className="max-w-full max-h-full object-contain select-none"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: "transform 0.3s ease",
              }}
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Status bar — positioned above bottom on iPad to avoid home indicator */}
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

      {/* Touch hint for iPad users */}
      {isTouchDevice && isCropping && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-[10px] tracking-cinematic text-white/20 z-10 pointer-events-none">
          PINCH TO ZOOM · DRAG TO PAN · DRAG CORNERS TO CROP
        </div>
      )}
    </motion.div>
  );
}
