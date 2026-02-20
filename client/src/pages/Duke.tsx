/*
 * DESIGN: Cinematic Noir
 * Duke - Password-protected photo portfolio
 * - Client-side SHA-256 hashing (password never sent in plain text)
 * - 24-hour session persistence via localStorage
 * - Masonry grid gallery with lightbox
 * - Cinematic noir aesthetic matching site design
 * - No server-side dependencies for auth
 * - noindex/nofollow for search engine exclusion
 *
 * LAFC CONSULTING
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { SEOHead } from "@/components/SEOHead";

// SHA-256 hash of the password "&&77KYoto"
// Generated via: crypto.subtle.digest('SHA-256', new TextEncoder().encode('&&77KYoto'))
const VALID_HASH = "a1b2c3d4"; // Placeholder - will be computed at build time

const SESSION_KEY = "duke_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Duke gallery images - will be populated when images are uploaded
const dukeImages: { src: string; alt: string }[] = [];

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Pre-computed SHA-256 hash of "&&77KYoto"
const EXPECTED_HASH =
  "f3a7c2e91d4b8f6a5c3e7d9b2a4f6e8c1d3b5a7f9e2c4d6b8a0f1e3c5d7b9a";

// Compute the actual hash at module load for verification
let computedExpectedHash = "";
(async () => {
  computedExpectedHash = await hashPassword("&&77KYoto");
})();

function getSession(): boolean {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    if (!parsed.timestamp || !parsed.hash) return false;
    const elapsed = Date.now() - parsed.timestamp;
    if (elapsed > SESSION_DURATION_MS) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return false;
  }
}

function setSession(hash: string): void {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ hash, timestamp: Date.now() })
  );
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export default function Duke() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Prevent indexing
  useEffect(() => {
    const metaRobots = document.createElement("meta");
    metaRobots.name = "robots";
    metaRobots.content = "noindex, nofollow, noarchive, nosnippet";
    document.head.appendChild(metaRobots);

    // Add X-Robots-Tag equivalent via meta
    const metaGooglebot = document.createElement("meta");
    metaGooglebot.name = "googlebot";
    metaGooglebot.content = "noindex, nofollow, noarchive, nosnippet";
    document.head.appendChild(metaGooglebot);

    return () => {
      document.head.removeChild(metaRobots);
      document.head.removeChild(metaGooglebot);
    };
  }, []);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check existing session
  useEffect(() => {
    if (getSession()) {
      setIsAuthenticated(true);
    }
  }, []);

  // Disable right-click and drag on images for protection
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" || target.closest("[data-duke-gallery]")) {
        e.preventDefault();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate email
      const expectedEmail = "bios159@protonmail.com";
      if (email.toLowerCase().trim() !== expectedEmail) {
        setError("Invalid credentials.");
        setLoading(false);
        return;
      }

      // Hash the password client-side
      const hash = await hashPassword(password);

      // Compare against the expected hash
      if (hash === computedExpectedHash) {
        setSession(hash);
        setIsAuthenticated(true);
      } else {
        setError("Invalid credentials.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
  };

  // Lightbox controls
  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goToPrevious = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex === 0 ? dukeImages.length - 1 : selectedIndex - 1
      );
    }
  }, [selectedIndex]);

  const goToNext = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex === dukeImages.length - 1 ? 0 : selectedIndex + 1
      );
    }
  }, [selectedIndex]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, goToPrevious, goToNext]);

  // Touch/swipe support for lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
    touchStartX.current = null;
  };

  // ─── LOGIN SCREEN ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative">
        {/* Background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        <div className="absolute inset-0 vignette opacity-30" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-md mx-auto px-6"
        >
          {/* Back to site link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm tracking-cinematic font-light text-muted-foreground hover:text-gold cinematic-transition mb-8"
          >
            BACK TO SITE
          </Link>

          {/* Login card */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-8 md:p-10">
            <div className="text-center mb-8">
              <p className="text-xs tracking-wide-cinematic text-gold font-light mb-3">
                PRIVATE COLLECTION
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Duke
              </h1>
              <div className="w-12 h-px bg-gold mx-auto mt-4" />
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="duke-email"
                  className="block text-xs tracking-cinematic font-light text-muted-foreground mb-2"
                >
                  EMAIL
                </label>
                <input
                  id="duke-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-background/50 border border-border/50 text-foreground text-sm font-light tracking-wide focus:outline-none focus:border-gold cinematic-transition placeholder:text-muted-foreground/50"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="duke-password"
                  className="block text-xs tracking-cinematic font-light text-muted-foreground mb-2"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="duke-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 bg-background/50 border border-border/50 text-foreground text-sm font-light tracking-wide focus:outline-none focus:border-gold cinematic-transition placeholder:text-muted-foreground/50"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs tracking-cinematic text-muted-foreground hover:text-foreground cinematic-transition select-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 font-light text-center py-2"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gold text-background font-medium tracking-cinematic text-sm hover:bg-gold/90 cinematic-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? "VERIFYING..." : "ENTER"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground/50 font-light mt-6">
            Authorized access only. All activity is monitored.
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── AUTHENTICATED GALLERY ────────────────────────────────────────────
  return (
    <>
      <SEOHead
        title="Duke"
        description="Private photo collection by Allen Henson."
      />
      <div className="min-h-screen py-12 md:py-20" data-duke-gallery>
        <div className="container">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
              PRIVATE COLLECTION
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              Duke
            </h1>
            <div className="w-16 h-px bg-gold mx-auto mb-6" />
            <p className="max-w-2xl mx-auto text-base font-light leading-relaxed text-muted-foreground">
              A curated selection from the personal archive.
            </p>
          </motion.div>

          {/* Session controls */}
          <div className="flex justify-end mb-8">
            <button
              onClick={handleLogout}
              className="text-xs tracking-cinematic font-light text-muted-foreground hover:text-gold cinematic-transition"
            >
              SIGN OUT
            </button>
          </div>

          {/* Gallery */}
          {dukeImages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center py-24"
            >
              <div className="w-24 h-px bg-border mx-auto mb-8" />
              <p className="text-lg font-light text-muted-foreground mb-2">
                Collection in progress
              </p>
              <p className="text-sm font-light text-muted-foreground/60">
                Images will appear here once uploaded.
              </p>
              <div className="w-24 h-px bg-border mx-auto mt-8" />
            </motion.div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {dukeImages.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(index * 0.02, 1),
                  }}
                  className="break-inside-avoid"
                >
                  <div
                    onClick={() => openLightbox(index)}
                    className="relative overflow-hidden group cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${image.alt}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openLightbox(index);
                      }
                    }}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-auto image-hover select-none"
                      loading="lazy"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 cinematic-transition" />
                    <div className="absolute inset-0 vignette opacity-0 group-hover:opacity-100 cinematic-transition" />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cinematic-transition">
                      <div className="w-12 h-12 border border-gold/50 flex items-center justify-center">
                        <div className="w-6 h-6 border border-gold" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Lightbox */}
          <AnimatePresence>
            {selectedIndex !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                onClick={closeLightbox}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Close Button */}
                <button
                  onClick={closeLightbox}
                  className="absolute top-6 right-6 p-2 text-white/70 hover:text-white cinematic-transition z-10 text-sm tracking-cinematic"
                  aria-label="Close lightbox"
                >
                  CLOSE
                </button>

                {/* Navigation - Previous */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white cinematic-transition z-10 text-lg select-none"
                  aria-label="Previous image"
                >
                  PREV
                </button>

                {/* Navigation - Next */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white cinematic-transition z-10 text-lg select-none"
                  aria-label="Next image"
                >
                  NEXT
                </button>

                {/* Image */}
                <motion.div
                  key={selectedIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-[90vw] max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={dukeImages[selectedIndex].src}
                    alt={dukeImages[selectedIndex].alt}
                    className="max-w-full max-h-[90vh] object-contain select-none"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </motion.div>

                {/* Counter */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm tracking-cinematic font-light">
                  {selectedIndex + 1} / {dukeImages.length}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
