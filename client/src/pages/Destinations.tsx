/*
 * DESIGN: Cinematic Noir — matches /photos
 * - Masonry grid gallery layout
 * - Hover effects with vignette
 * - Lightbox for full-size viewing
 * - Cinematic transitions
 * - Content is managed entirely from the /edit CMS (Destinations tab)
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SEOHead } from "@/components/SEOHead";
import MasonryGrid from "@/components/MasonryGrid";

// No built-in images — the Destinations collection is populated via /edit uploads.
// Export for use in Edit page (mirrors photosImages / journalImages).
export const destinationsImages: Array<{ src: string; webSrc?: string; alt: string }> = [];

// Single source of truth for how the saved order maps onto the gallery.
// Used by this page AND the /edit CMS so both always show the same list.
export function applyDestinationsOrder(order: string[] | null | undefined) {
  if (order) {
    const ordered = order
      .map((src) => {
        const known = destinationsImages.find(img => img.src === src);
        if (known) return known;
        // Absolute storage URL = image uploaded via the /edit CMS
        if (src.startsWith("http")) return { src, alt: "Destination by Allen Henson" };
        return undefined; // stale local path — drop
      })
      .filter((img): img is typeof destinationsImages[0] => img !== undefined);
    const newImages = destinationsImages.filter(img => !order.includes(img.src));
    return [...ordered, ...newImages];
  }
  return destinationsImages;
}

export default function Destinations() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Fetch saved order from database
  const { data: orderData } = trpc.gallery.getOrder.useQuery({ gallery: "destinations" });

  // Compute ordered images based on saved order or default
  const orderedImages = useMemo(() => applyDestinationsOrder(orderData?.order), [orderData]);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? orderedImages.length - 1 : selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === orderedImages.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  return (
    <>
      <SEOHead
        title="Destinations"
        description="Luxury interior and exterior photography by Allen Henson. Residences, resorts, and architectural spaces captured as experiences — a way of living, framed."
      />
      <div className="min-h-screen py-12 md:py-20">
        <div className="container">
          {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="meta-text text-gold uppercase mb-4">
            PORTFOLIO
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">
            Destinations
          </h1>
          <div className="w-16 h-px bg-gold mx-auto mb-6" />
          <p className="max-w-2xl mx-auto text-base font-normal leading-relaxed text-muted-foreground">
            Interiors, exteriors, and the light that finds them.
            Spaces that are experiences — not places to stay, but ways to live.
          </p>
        </motion.div>

        {/* Masonry Grid — row-major: order reads left-to-right, matching /edit */}
        <MasonryGrid
          items={orderedImages}
          columns={{ base: 1, sm: 2, lg: 3 }}
          renderItem={(image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: Math.min(index * 0.02, 1) }}
            >
              <div
                onClick={() => openLightbox(index)}
                className="relative overflow-hidden group cursor-pointer"
              >
                <img
                  src={image.webSrc || image.src}
                  alt={image.alt}
                  className="w-full h-auto image-hover"
                  loading="lazy"
                  decoding="async"
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
          )}
        />

        {/* Empty state — shown until the collection is populated via /edit */}
        {orderedImages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center py-24"
          >
            <p className="meta-text text-muted-foreground uppercase tracking-wide-cinematic">
              Collection arriving soon
            </p>
          </motion.div>
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
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white cinematic-transition z-10"
              aria-label="Close lightbox"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 md:left-8 p-2 text-white/70 hover:text-white cinematic-transition z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 md:right-8 p-2 text-white/70 hover:text-white cinematic-transition z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-10 h-10" />
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
                src={orderedImages[selectedIndex].src}
                alt={orderedImages[selectedIndex].alt}
                className="max-w-full max-h-[90vh] object-contain"
              />
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 nav-text">
              {selectedIndex + 1} / {orderedImages.length}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
        </div>
      </div>
    </>
  );
}
