/*
 * DESIGN: Cinematic Noir
 * - Masonry grid gallery layout
 * - Hover effects with vignette
 * - Lightbox for full-size viewing
 * - Cinematic transitions
 * - Images in exact order from allenhenson.nyc
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

// Images in exact order from allenhenson.nyc landing page
// Export for use in Edit page
export const photosImages = [
  { src: "/images/XUQX2322-scaled.jpg", alt: "Portrait" },
  { src: "/images/AH4_1923.png", alt: "Portrait" },
  { src: "/images/AHP_AHP_1J3A1859-2.png", alt: "Portrait" },
  { src: "/images/DSC02981.png", alt: "Portrait" },
  { src: "/images/BHL0538-Edit.jpg", alt: "Editorial" },
  { src: "/images/L1009868.jpg", alt: "Leica Series" },
  { src: "/images/1J3A8159.png", alt: "Portrait" },
  { src: "/images/Runway-Paris-5-Edit-1-scaled.jpg", alt: "Runway Paris" },
  { src: "/images/C6B5C345-2774-43F0-867B-DD454DC72278.png", alt: "Portrait" },
  { src: "/images/IMG_7891.png", alt: "Mobile Shot" },
  { src: "/images/OSCAR-056-Edit-scaled.jpeg", alt: "Oscar" },
  { src: "/images/L1009242-2-scaled.jpg", alt: "Leica Series" },
  { src: "/images/S-NAVONA_RETOUCH2_CHANEL-Tether_-427.png", alt: "Chanel Campaign" },
  { src: "/images/IMG-9096.jpg", alt: "Mobile Shot" },
  { src: "/images/Amelia13577-3-1.jpg", alt: "Amelia" },
  { src: "/images/AHP_7343-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/AHP_9599-Edit.png", alt: "Portrait" },
  { src: "/images/AHP-7473-Edit-Edit-Edit-Edit.jpg", alt: "Portrait" },
  { src: "/images/AHP_2268-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP_4510.png", alt: "Portrait" },
  { src: "/images/IMG_4798.png", alt: "Mobile Shot" },
  { src: "/images/AHP-2183-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP_5254-Edit-2-scaled.jpg", alt: "Portrait" },
  { src: "/images/L1000431-2-1-scaled-1672734053-985339932-1672734053-537745903-scaled.jpg", alt: "Leica Series" },
  { src: "/images/S-NAVONA-FINAL_RETOUCH_CHANEL-Tether_-207-scaled.jpg", alt: "Chanel Campaign" },
  { src: "/images/AHP_2616-Edit.png", alt: "Portrait" },
  { src: "/images/WZVX7476-scaled.jpg", alt: "Portrait" },
  { src: "/images/1J3A2008.png", alt: "Portrait" },
  { src: "/images/1J3A1882-Edit.png", alt: "Portrait" },
  { src: "/images/FACE-II_0365-Recovered-Edit-Edit.png", alt: "FACE Editorial" },
  { src: "/images/FACE-II_0304-Edit-Edit-Edit-scaled.jpg", alt: "FACE Editorial" },
  { src: "/images/AHP4049_SNAVONA_EDIT-Edit-2-scaled.jpg", alt: "Chanel Campaign" },
  { src: "/images/TEYA3965-scaled.jpg", alt: "Portrait" },
  { src: "/images/PEHP2975.jpg", alt: "Portrait" },
  { src: "/images/exile18.png", alt: "Exile" },
  { src: "/images/AHP_9554-Edit.png", alt: "Portrait" },
  { src: "/images/NFEK4250.jpg", alt: "Portrait" },
  { src: "/images/L1008180-1672734143-324447421-1672734143-1073894577-scaled.jpg", alt: "Leica Series" },
  { src: "/images/MMFC0021-Edit.png", alt: "Fashion" },
  { src: "/images/tinsel-tokyo-2.png", alt: "Tokyo Series" },
  { src: "/images/AHP-4478-Edit-2-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP_6446.png", alt: "Portrait" },
  { src: "/images/tumblr_nmiwqc4XOy1qfua5to2_r1_1280.png", alt: "Archive" },
  { src: "/images/AHP_8318-Edit.png", alt: "Portrait" },
  { src: "/images/1J3A2552-Edit.png", alt: "Portrait" },
  { src: "/images/AHP_7839-Edit-2.jpg", alt: "Portrait" },
  { src: "/images/SYDX1234.jpg", alt: "Portrait" },
  { src: "/images/AHP_7529-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/AHP-0019_v3-Edit-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP-4165-scaled.jpg", alt: "Portrait" },
  { src: "/images/IMG-5236.jpg", alt: "Mobile Shot" },
  { src: "/images/L1001397-Edit-scaled.jpg", alt: "Leica Series" },
  { src: "/images/916A8CBA-10D5-493A-B1AB-CA7BF7E1E108.png", alt: "Portrait" },
  { src: "/images/AHP_4585.png", alt: "Portrait" },
  { src: "/images/AHP-7835-Edit-Edit-Edit.jpg", alt: "Portrait" },
  { src: "/images/MMFC0052.jpg", alt: "Fashion" },
  { src: "/images/KDZC0674-2-scaled.jpg", alt: "Portrait" },
  { src: "/images/LQFT2427-scaled.jpg", alt: "Portrait" },
  { src: "/images/dip-AHP_2700-Edit-Edit-Edit-scaled.jpg", alt: "Portrait" },
  { src: "/images/SNAVONA_RETOUCH_CHANEL-Tether_149h.png", alt: "Chanel Campaign" },
  { src: "/images/L1009925-2.png", alt: "Leica Series" },
  { src: "/images/AHP-5207-scaled.jpg", alt: "Portrait" },
  { src: "/images/L1001573-scaled.jpg", alt: "Leica Series" },
  { src: "/images/AHP-2999-Edit-scaled.jpg", alt: "Portrait" },
  { src: "/images/1J3A7610-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP-0030_v3.png", alt: "Portrait" },
  { src: "/images/AHP_2616.png", alt: "Portrait" },
  { src: "/images/DK21794-Edit.png", alt: "Portrait" },
  { src: "/images/L1009718.png", alt: "Leica Series" },
  { src: "/images/L1001017-Edit-2.png", alt: "Leica Series" },
  { src: "/images/AHP_7036.png", alt: "Portrait" },
  { src: "/images/L1000994-3.png", alt: "Leica Series" },
  { src: "/images/allen-polaroid23gg.jpg", alt: "Polaroid" },
  { src: "/images/AHP-8930-v3-scaled.jpg", alt: "Portrait" },
  { src: "/images/1-2-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP-9837-Edit-Edit-scaled.jpg", alt: "Portrait" },
  { src: "/images/1J3A2481-Edit-Edit-Edit-Edit-1-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP_5636-Edit-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP_4141_SNAVONA_EDIT-Edit-Edit-2-Edit-2-scaled.jpg", alt: "Chanel Campaign" },
  { src: "/images/1J3A7318-scaled.jpg", alt: "Portrait" },
  { src: "/images/L1003772-scaled.jpg", alt: "Leica Series" },
  { src: "/images/ADYS6337-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP-5555-Edit-2-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP_8087-Edit.png", alt: "Portrait" },
  { src: "/images/thisAHP_5638-Edit.jpg", alt: "Portrait" },
  { src: "/images/AHP_2230-Edit-copytxt-Edit-scaled.jpg", alt: "Portrait" },
  { src: "/images/1075842E-5BB5-49D3-9345-D3996E9C31C9.png", alt: "Portrait" },
  { src: "/images/1J3A2488-scaled.jpg", alt: "Portrait" },
  { src: "/images/9FFFC227-D85A-422C-911A-3FB05DABA108.png", alt: "Portrait" },
  { src: "/images/L1006923-Edit-scaled.jpg", alt: "Leica Series" },
  { src: "/images/IMG-3808.jpg", alt: "Mobile Shot" },
  { src: "/images/1J3A0778-Edit-Edit-Edit-2-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/AHP_5964.png", alt: "Portrait" },
  { src: "/images/AHP_7389_retouch-2.png", alt: "Portrait" },
  { src: "/images/AHP_5555-Edit-2.png", alt: "Portrait" },
  { src: "/images/BHL0550-Edit.jpg", alt: "Editorial" },
  { src: "/images/1J3A0083-Edit.jpg", alt: "Portrait" },
  { src: "/images/1J3A2144-1-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP-4983-scaled.jpg", alt: "Portrait" },
  { src: "/images/L1008247-1.jpg", alt: "Leica Series" },
  { src: "/images/1J3A9744-scaled.jpg", alt: "Portrait" },
  { src: "/images/L1007570.jpg", alt: "Leica Series" },
  { src: "/images/AHP_2838v4-Edit.jpg", alt: "Portrait" },
  { src: "/images/1J3A7537-scaled.jpg", alt: "Portrait" },
  { src: "/images/1J3A9166.jpg", alt: "Portrait" },
  { src: "/images/AHP_8568-Edit-3.png", alt: "Portrait" },
  { src: "/images/1J3A8138.png", alt: "Portrait" },
  { src: "/images/1J3A7318.png", alt: "Portrait" },
  { src: "/images/43DE6F42-8BF7-44DB-A739-8F0614B762FF.png", alt: "Portrait" },
  { src: "/images/1J3A3654-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/1J3A3161-2.png", alt: "Portrait" },
  { src: "/images/1E55A0DC-6817-4165-B0EC-A3982798EA60.png", alt: "Portrait" },
  { src: "/images/AHP_8400-Edit-Editdiptec.png", alt: "Portrait" },
  { src: "/images/AHP_6110-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/AHP_5956.png", alt: "Portrait" },
  { src: "/images/AHP_5993.png", alt: "Portrait" },
  { src: "/images/AHP_6950-Edit.png", alt: "Portrait" },
  { src: "/images/AHP_6839-Edit.png", alt: "Portrait" },
  { src: "/images/L1008347-2-1672734159-1279272757-1672734159-2130326800-scaled.jpg", alt: "Leica Series" },
  { src: "/images/AHP_7988.png", alt: "Portrait" },
  { src: "/images/AHP_8023-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/AHP_9825-Edit.png", alt: "Portrait" },
  { src: "/images/AHP_9788.png", alt: "Portrait" },
  { src: "/images/AHP_8040-Edit.png", alt: "Portrait" },
  { src: "/images/AHP_8041.png", alt: "Portrait" },
  { src: "/images/AHP_9990-Edit11.png", alt: "Portrait" },
  { src: "/images/AHP-0019_v3.png", alt: "Portrait" },
  { src: "/images/DSC_5651-Edit-Edit-Edit-Edit-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/AHP_2395v3-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/1J3A8154-1.png", alt: "Portrait" },
  { src: "/images/AHP_0188-Edit.png", alt: "Portrait" },
  { src: "/images/AHP_4584-Edit.png", alt: "Portrait" },
  { src: "/images/bastiano-Edit.png", alt: "Bastiano" },
  { src: "/images/L1000840-Edit.png", alt: "Leica Series" },
  { src: "/images/L1004380.png", alt: "Leica Series" },
  { src: "/images/L1000863.png", alt: "Leica Series" },
  { src: "/images/tumblr_o8y8r5DQ841qfua5to1_1280.png", alt: "Archive" },
  { src: "/images/tinsel-tokyo-4.png", alt: "Tokyo Series" },
  { src: "/images/tinsel-tokyo-5.png", alt: "Tokyo Series" },
  { src: "/images/tinsel-tokyo-6.png", alt: "Tokyo Series" },
  { src: "/images/MMFC0015-Edit-2.png", alt: "Fashion" },
  { src: "/images/L1001345.png", alt: "Leica Series" },
  { src: "/images/1J3A9802-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/27F7CADD-512B-4D10-BC76-E33F78118027.png", alt: "Portrait" },
  { src: "/images/Adam24457-SCALED.png", alt: "Adam" },
  { src: "/images/9A9993B0-0F2D-4C16-A6B5-616CA3549FD7.png", alt: "Portrait" },
  { src: "/images/AH4_3850-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/AH4_2091.png", alt: "Portrait" },
  { src: "/images/AH4_7313.png", alt: "Portrait" },
  { src: "/images/AH4_0068.png", alt: "Portrait" },
  { src: "/images/1J3A6777.png", alt: "Portrait" },
  { src: "/images/1J3A7233.png", alt: "Portrait" },
  { src: "/images/1J3A6732-Edit.png", alt: "Portrait" },
  { src: "/images/1J3A0044-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/1J3A0475-Edit-Edit-Edit-Edit-Edit.png", alt: "Portrait" },
  { src: "/images/AHP-Nils-scaled.jpg", alt: "Nils" },
  { src: "/images/AHP-2311-scaled.jpg", alt: "Portrait" },
  { src: "/images/1J3A9177.jpg", alt: "Portrait" },
  { src: "/images/1J3A9072.jpg", alt: "Portrait" },
  { src: "/images/BHL0875-Edit-Edit.jpg", alt: "Editorial" },
  { src: "/images/AHP-7377-Edit.jpg", alt: "Portrait" },
  { src: "/images/AHP-1210-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP-1186-Edit-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP-5351.jpg", alt: "Portrait" },
  { src: "/images/33A07D00-4937-40B0-8BAA-F9EE3963E454-1.jpg", alt: "Portrait" },
  { src: "/images/AHP-0019-v3-scaled.jpg", alt: "Portrait" },
  { src: "/images/AHP-0030-v3-scaled.jpg", alt: "Portrait" },
  { src: "/images/RJJA6030-scaled.jpg", alt: "Portrait" },
  { src: "/images/IMG-E9888.jpg", alt: "Mobile Shot" },
  { src: "/images/RWTO0284-scaled.jpg", alt: "Portrait" },
];

export default function Photos() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Fetch saved order from database
  const { data: orderData } = trpc.gallery.getOrder.useQuery({ gallery: "photos" });
  
  // Compute ordered images based on saved order or default
  const orderedImages = useMemo(() => {
    if (orderData?.order) {
      // Reorder based on saved order
      const ordered = orderData.order
        .map((src: string) => photosImages.find(p => p.src === src))
        .filter((p): p is typeof photosImages[0] => p !== undefined);
      // Add any new images not in saved order
      const newImages = photosImages.filter(p => !orderData.order?.includes(p.src));
      return [...ordered, ...newImages];
    }
    return photosImages;
  }, [orderData]);

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
          {orderedImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: Math.min(index * 0.02, 1) }}
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
                src={orderedImages[selectedIndex].src}
                alt={orderedImages[selectedIndex].alt}
                className="max-w-full max-h-[90vh] object-contain"
              />
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm tracking-cinematic font-light">
              {selectedIndex + 1} / {orderedImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
