/*
 * DESIGN: Cinematic Noir
 * - Masonry grid gallery layout
 * - Hover effects with vignette
 * - Lightbox for full-size viewing
 * - Cinematic transitions
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const portfolioImages = [
  { src: "/images/portfolio-01.png", alt: "Portrait - Male model striped shirt" },
  { src: "/images/portfolio-02.png", alt: "Portrait - Person in vehicle" },
  { src: "/images/portfolio-03.png", alt: "Fashion - Urban leather jacket" },
  { src: "/images/portfolio-04.png", alt: "Portrait - Artistic composition" },
  { src: "/images/portfolio-05.png", alt: "Editorial - Dramatic lighting" },
  { src: "/images/portfolio-06.jpg", alt: "Fashion - Glamorous portrait" },
  { src: "/images/portfolio-07.png", alt: "Portrait - Moody lighting" },
  { src: "/images/portfolio-08.png", alt: "Portrait - Long hair subject" },
  { src: "/images/portfolio-09.png", alt: "Fashion - Dynamic pose" },
  { src: "/images/portfolio-10.png", alt: "Portrait - Studio lighting" },
  { src: "/images/portfolio-11.png", alt: "Editorial - Creative concept" },
  { src: "/images/portfolio-12.jpg", alt: "Portrait - Natural light" },
  { src: "/images/portfolio-13.png", alt: "Fashion - Editorial style" },
  { src: "/images/portfolio-14.png", alt: "Portrait - Artistic direction" },
  { src: "/images/portfolio-15.jpg", alt: "Commercial - Brand campaign" },
  { src: "/images/portfolio-16.png", alt: "Portrait - Character study" },
  { src: "/images/portfolio-17.png", alt: "Fashion - Bold styling" },
  { src: "/images/portfolio-18.jpg", alt: "Editorial - Cinematic mood" },
  { src: "/images/portfolio-19.png", alt: "Fashion - Tokyo series" },
  { src: "/images/portfolio-20.png", alt: "Fashion - Tokyo series continued" },
];

export default function Photos() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  
  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? portfolioImages.length - 1 : selectedIndex - 1);
    }
  };
  
  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === portfolioImages.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="container">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
            PORTFOLIO
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Photography
          </h1>
          <div className="w-16 h-px bg-gold mx-auto mb-6" />
          <p className="max-w-2xl mx-auto text-base font-light leading-relaxed text-muted-foreground">
            Portraits, chaos, and calm. Moments stolen and moments staged. 
            The proof that I was there — and maybe, that I still am.
          </p>
        </motion.div>

        {/* Masonry Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {portfolioImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="break-inside-avoid"
            >
              <div
                onClick={() => openLightbox(index)}
                className="relative overflow-hidden group cursor-pointer"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-auto image-hover"
                  loading="lazy"
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
      </div>

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
                src={portfolioImages[selectedIndex].src}
                alt={portfolioImages[selectedIndex].alt}
                className="max-w-full max-h-[90vh] object-contain"
              />
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm tracking-cinematic font-light">
              {selectedIndex + 1} / {portfolioImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
