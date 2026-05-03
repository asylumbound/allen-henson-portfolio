/**
 * Journal Page - The Journal
 * Design: Cinematic Noir - Film grain texture, dramatic light/shadow, gold accents
 * Personal/behind-the-scenes photos from Allen Henson's journey
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbSchema } from "@/components/StructuredData";
import { assetUrl } from "@/lib/assets";

// Journal images from allenhenson.nyc/about page
// Export for use in Edit page
export const journalImages = [
  assetUrl("/images/journal/1.png"),
  assetUrl("/images/journal/11794449_10156000040900602_7743628154975280560_o.png"),
  assetUrl("/images/journal/145-DSC09523.png"),
  assetUrl("/images/journal/16-2.png"),
  assetUrl("/images/journal/16003268_10154921618180879_6250090260645126513_n.png"),
  assetUrl("/images/journal/1649641668607069.png"),
  assetUrl("/images/journal/1942590B-4ECE-4432-97A8-1B8316E28825.png"),
  assetUrl("/images/journal/1J3A4168.png"),
  assetUrl("/images/journal/3734F18A-DA68-40DF-BAF7-E99EBE05636B.png"),
  assetUrl("/images/journal/44444.png"),
  assetUrl("/images/journal/452ADF1B-7C50-4824-A139-3C8D6A85C41D.png"),
  assetUrl("/images/journal/4CCFFB24-583D-45D2-8432-5C2C78D86CFC.png"),
  assetUrl("/images/journal/5-2.png"),
  assetUrl("/images/journal/52-DSC09026.png"),
  assetUrl("/images/journal/55-DSC09039.png"),
  assetUrl("/images/journal/5BE9F85E-C507-4EA5-A104-CF52C1BAABA7.png"),
  assetUrl("/images/journal/64049BDF-B3A2-4A20-8E54-BA7DAAAD570B.png"),
  assetUrl("/images/journal/69-DSC09086.png"),
  assetUrl("/images/journal/707E0DC4-222C-4B26-9755-7BE856E1B3B1.png"),
  assetUrl("/images/journal/7F67FC20-82D1-498E-A61D-4FD418CD99B3.png"),
  assetUrl("/images/journal/86160018.png"),
  assetUrl("/images/journal/8C3C569D-8976-49DD-862F-F53FC8819762.png"),
  assetUrl("/images/journal/8DA05C57-911D-43D7-B3EA-5C08A4C933CE.png"),
  assetUrl("/images/journal/90AF0C6A-000A-481D-870D-38B2ECFF9B4E.png"),
  assetUrl("/images/journal/9295AC1F-C044-4F01-8EE8-73FD616F3592.png"),
  assetUrl("/images/journal/A91CF595-E000-4B59-9350-8427EE429B54.png"),
  assetUrl("/images/journal/AACE76FE-85F6-4C17-8D58-606E2DDAEE81.png"),
  assetUrl("/images/journal/BA2FB653-AC95-45C3-BB9E-D47232A39ECB.png"),
  assetUrl("/images/journal/C0695EC9-AD80-4B75-A50F-F5581B708556.png"),
  assetUrl("/images/journal/CE6C1822-E619-4842-9896-E1DD5C4AFAFD.png"),
  assetUrl("/images/journal/CED20C5A-9F41-4E5A-A1DC-20C87656350C.png"),
  assetUrl("/images/journal/DSCF1821.png"),
  assetUrl("/images/journal/DSC_1458.png"),
  assetUrl("/images/journal/DSC_1459-Edit.png"),
  assetUrl("/images/journal/DSC_1490.png"),
  assetUrl("/images/journal/E618C11A-688E-408E-87CA-641230C8C0A3.png"),
  assetUrl("/images/journal/EFFE891E-1364-4CA3-BD5A-F71FB96D7AB2.png"),
  assetUrl("/images/journal/F4D7277E-A940-4594-AA2F-39F1D16ADC56.png"),
  assetUrl("/images/journal/F5E98C7A-CEFF-4B31-B04E-99E32E75C9D0.png"),
  assetUrl("/images/journal/IMG_0141.png"),
  assetUrl("/images/journal/IMG_0331.png"),
  assetUrl("/images/journal/IMG_0491.png"),
  assetUrl("/images/journal/IMG_0604.png"),
  assetUrl("/images/journal/IMG_0727.png"),
  assetUrl("/images/journal/IMG_0830.png"),
  assetUrl("/images/journal/IMG_0834.png"),
  assetUrl("/images/journal/IMG_0984.png"),
  assetUrl("/images/journal/IMG_1151.png"),
  assetUrl("/images/journal/IMG_1169.png"),
  assetUrl("/images/journal/IMG_1288-2.png"),
  assetUrl("/images/journal/IMG_1380.png"),
  assetUrl("/images/journal/IMG_1599.png"),
  assetUrl("/images/journal/IMG_1846.png"),
  assetUrl("/images/journal/IMG_1881.png"),
  assetUrl("/images/journal/IMG_1896.png"),
  assetUrl("/images/journal/IMG_2252.png"),
  assetUrl("/images/journal/IMG_2388.png"),
  assetUrl("/images/journal/IMG_2445.png"),
  assetUrl("/images/journal/IMG_2629.png"),
  assetUrl("/images/journal/IMG_2944.png"),
  assetUrl("/images/journal/IMG_3020.png"),
  assetUrl("/images/journal/IMG_3045.png"),
  assetUrl("/images/journal/IMG_3145.png"),
  assetUrl("/images/journal/IMG_3149.png"),
  assetUrl("/images/journal/IMG_3244.png"),
  assetUrl("/images/journal/IMG_3432.png"),
  assetUrl("/images/journal/IMG_3675.png"),
  assetUrl("/images/journal/IMG_4120.png"),
  assetUrl("/images/journal/IMG_4130.png"),
  assetUrl("/images/journal/IMG_4493.png"),
  assetUrl("/images/journal/IMG_5051-2.png"),
  assetUrl("/images/journal/IMG_5051.png"),
  assetUrl("/images/journal/IMG_5172-2.png"),
  assetUrl("/images/journal/IMG_5220.png"),
  assetUrl("/images/journal/IMG_5508.png"),
  assetUrl("/images/journal/IMG_5601.png"),
  assetUrl("/images/journal/IMG_5602-2.png"),
  assetUrl("/images/journal/IMG_5680.png"),
  assetUrl("/images/journal/IMG_5781.png"),
  assetUrl("/images/journal/IMG_5899.png"),
  assetUrl("/images/journal/IMG_6094.png"),
  assetUrl("/images/journal/IMG_6124.png"),
  assetUrl("/images/journal/IMG_6126.png"),
  assetUrl("/images/journal/IMG_6164.png"),
  assetUrl("/images/journal/IMG_6195.png"),
  assetUrl("/images/journal/IMG_6377.png"),
  assetUrl("/images/journal/IMG_6396.png"),
  assetUrl("/images/journal/IMG_6403.png"),
  assetUrl("/images/journal/IMG_6419.png"),
  assetUrl("/images/journal/IMG_6422.png"),
  assetUrl("/images/journal/IMG_6443.png"),
  assetUrl("/images/journal/IMG_6445.png"),
  assetUrl("/images/journal/IMG_6452.png"),
  assetUrl("/images/journal/IMG_6461.png"),
  assetUrl("/images/journal/IMG_6464.png"),
  assetUrl("/images/journal/IMG_6466.png"),
  assetUrl("/images/journal/IMG_6467.png"),
  assetUrl("/images/journal/IMG_6470.png"),
  assetUrl("/images/journal/IMG_6472.png"),
  assetUrl("/images/journal/IMG_6475.png"),
  assetUrl("/images/journal/IMG_6476.png"),
  assetUrl("/images/journal/IMG_6477.png"),
  assetUrl("/images/journal/IMG_6483.png"),
  assetUrl("/images/journal/IMG_6494.png"),
  assetUrl("/images/journal/IMG_6515.png"),
  assetUrl("/images/journal/IMG_6577.png"),
  assetUrl("/images/journal/IMG_6585.png"),
  assetUrl("/images/journal/IMG_6941.png"),
  assetUrl("/images/journal/IMG_6954.png"),
  assetUrl("/images/journal/IMG_6959-2.png"),
  assetUrl("/images/journal/IMG_6961.png"),
  assetUrl("/images/journal/IMG_6962.png"),
  assetUrl("/images/journal/IMG_6963.png"),
  assetUrl("/images/journal/IMG_6971.png"),
  assetUrl("/images/journal/IMG_6975.png"),
  assetUrl("/images/journal/IMG_6976.png"),
  assetUrl("/images/journal/IMG_6981.png"),
  assetUrl("/images/journal/IMG_6984.png"),
  assetUrl("/images/journal/IMG_6991.png"),
  assetUrl("/images/journal/IMG_6993.png"),
  assetUrl("/images/journal/IMG_6995.png"),
  assetUrl("/images/journal/IMG_7006.png"),
  assetUrl("/images/journal/IMG_7007.png"),
  assetUrl("/images/journal/IMG_7009.png"),
  assetUrl("/images/journal/IMG_7010.png"),
  assetUrl("/images/journal/IMG_7012.png"),
  assetUrl("/images/journal/IMG_7013.png"),
  assetUrl("/images/journal/IMG_7210.png"),
  assetUrl("/images/journal/IMG_7233.png"),
  assetUrl("/images/journal/IMG_7292.png"),
  assetUrl("/images/journal/IMG_7407.png"),
  assetUrl("/images/journal/IMG_7408.png"),
  assetUrl("/images/journal/IMG_7410.png"),
  assetUrl("/images/journal/IMG_7411.png"),
  assetUrl("/images/journal/IMG_7412.png"),
  assetUrl("/images/journal/IMG_7414.png"),
  assetUrl("/images/journal/IMG_7415.png"),
  assetUrl("/images/journal/IMG_7416.png"),
  assetUrl("/images/journal/IMG_7418.png"),
  assetUrl("/images/journal/IMG_7433.png"),
  assetUrl("/images/journal/IMG_7435.png"),
  assetUrl("/images/journal/IMG_7436.png"),
  assetUrl("/images/journal/IMG_7440.png"),
  assetUrl("/images/journal/IMG_7442.png"),
  assetUrl("/images/journal/IMG_7443.png"),
  assetUrl("/images/journal/IMG_7444.png"),
  assetUrl("/images/journal/IMG_7445.png"),
  assetUrl("/images/journal/IMG_7446.png"),
  assetUrl("/images/journal/IMG_7614.png"),
  assetUrl("/images/journal/IMG_7813.png"),
  assetUrl("/images/journal/IMG_7858.png"),
  assetUrl("/images/journal/IMG_8618.png"),
  assetUrl("/images/journal/IMG_8742.png"),
  assetUrl("/images/journal/IMG_9338.png"),
  assetUrl("/images/journal/IMG_9898.png"),
  assetUrl("/images/journal/L1000180.png"),
  assetUrl("/images/journal/L1001471.png"),
  assetUrl("/images/journal/L1001481.png"),
  assetUrl("/images/journal/L1001513.png"),
  assetUrl("/images/journal/L1001554.png"),
  assetUrl("/images/journal/L1001729.png"),
  assetUrl("/images/journal/L1008306.png"),
  assetUrl("/images/journal/L1008426.png"),
  assetUrl("/images/journal/L1008606.png"),
  assetUrl("/images/journal/L1009552.png"),
  assetUrl("/images/journal/R0006637-Edit.png"),
  assetUrl("/images/journal/a155b47758efa4ba5587fe1ec6c0c96b.png"),
];

export default function Journal() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  
  // Fetch saved order from database
  const { data: orderData } = trpc.gallery.getOrder.useQuery({ gallery: "journal" });
  
  // Compute ordered images based on saved order or default
  const orderedImages = useMemo(() => {
    if (orderData?.order) {
      // Reorder based on saved order
      const ordered = orderData.order
        .filter((src: string) => journalImages.includes(src));
      // Add any new images not in saved order
      const newImages = journalImages.filter(src => !orderData.order?.includes(src));
      return [...ordered, ...newImages];
    }
    return journalImages;
  }, [orderData]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      
      if (e.key === "Escape") {
        setSelectedImage(null);
      } else if (e.key === "ArrowLeft") {
        setSelectedImage((prev) => 
          prev !== null ? (prev - 1 + orderedImages.length) % orderedImages.length : null
        );
      } else if (e.key === "ArrowRight") {
        setSelectedImage((prev) => 
          prev !== null ? (prev + 1) % orderedImages.length : null
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, orderedImages.length]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (selectedImage !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedImage]);

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null) return;
    if (direction === "prev") {
      setSelectedImage((selectedImage - 1 + orderedImages.length) % orderedImages.length);
    } else {
      setSelectedImage((selectedImage + 1) % orderedImages.length);
    }
  };

  return (
    <>
      <SEOHead
        title="The Journal"
        description="Behind the scenes and personal photography from Allen Henson's journey. Fragments of a life spanning two decades of travel, conflict documentation, and artistic exploration across continents."
        image={assetUrl("/images/journal/1.png")}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.allenhenson.com/" },
          { name: "Journal", url: "https://www.allenhenson.com/journal" },
        ]}
      />
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="font-display text-5xl md:text-7xl font-light mb-6 tracking-tight">
              The Journal
            </h1>
            <div className="w-24 h-px bg-accent mx-auto mb-8" />
            <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              Fragments of a life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="pb-24">
        <div className="container">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {orderedImages.map((src, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.02, 0.5) }}
                className="break-inside-avoid cursor-pointer group relative overflow-hidden"
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={src}
                  alt={`Journal entry ${index + 1}`}
                  className="w-full h-auto transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close button */}
            <button
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </button>

            {/* Navigation buttons */}
            <button
              className="absolute left-4 md:left-8 text-white/70 hover:text-white transition-colors z-10 p-2"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage("prev");
              }}
            >
              <ChevronLeft size={48} />
            </button>

            <button
              className="absolute right-4 md:right-8 text-white/70 hover:text-white transition-colors z-10 p-2"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage("next");
              }}
            >
              <ChevronRight size={48} />
            </button>

            {/* Image */}
            <motion.img
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              src={orderedImages[selectedImage]}
              alt={`Journal entry ${selectedImage + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 font-mono text-sm">
              {selectedImage + 1} / {orderedImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}
