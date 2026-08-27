/**
 * PRODUCT PHOTOGRAPHY PAGE
 * Commercial product photography portfolio showcasing luxury brands
 * Categories: Watches & Jewelry, Automotive, Spirits, Beverages, Tech/Fashion
 * Features: Uncropped images, database-driven order, zoom-on-hover
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { ImageGallerySchema, BreadcrumbSchema } from "@/components/StructuredData";
import MasonryGrid from "@/components/MasonryGrid";
import { assetUrl } from "@/lib/assets";

// Product photography categories
const productCategories = [
  { id: "all", name: "All Work", count: 0 },
  { id: "watches", name: "Watches & Jewelry", count: 0 },
  { id: "automotive", name: "Automotive", count: 0 },
  { id: "spirits", name: "Spirits & Alcohol", count: 0 },
  { id: "beverages", name: "Beverages", count: 0 },
  { id: "tech-fashion", name: "Tech / Fashion / Consumer", count: 0 },
];

// Product images with metadata - ORDER MATCHES DATABASE (42 images)
// This is the master list that provides metadata for each image
export const productPhotographyImages = [
  // 1. Rolex Yacht-Master
  { src: assetUrl("/images/product/rolex-yacht-master.webp"), alt: "Rolex Yacht-Master II", category: "watches", description: "Studio: water splash, rose gold + steel, ceramic bezel" },
  // 2. Don Julio Tequila
  { src: assetUrl("/images/product/don-julio-tequila.webp"), alt: "Don Julio 1942", category: "spirits", description: "Studio: tall amber bottle, gold accents" },
  // 3. Aesop Bottles
  { src: assetUrl("/images/product/consumer-aesop-bottles.webp"), alt: "Aesop Bottle Set", category: "tech-fashion", description: "Studio: editorial minimal, warm neutrals" },
  // 4. McLaren Wheel
  { src: assetUrl("/images/product/mclaren-wheel.webp"), alt: "McLaren Carbon Wheel", category: "automotive", description: "Studio: carbon weave, orange caliper" },
  // 5. Louis Vuitton Leather
  { src: assetUrl("/images/product/fashion-lv-leather.webp"), alt: "Louis Vuitton Leather Good", category: "tech-fashion", description: "Studio: grain + stitching macro" },
  // 6. Bang & Olufsen Speaker
  { src: assetUrl("/images/product/tech-bo-speaker.webp"), alt: "Bang & Olufsen Speaker", category: "tech-fashion", description: "Studio: industrial sculpture" },
  // 7. Audemars Piguet Royal Oak
  { src: assetUrl("/images/product/ap-royal-oak.webp"), alt: "Audemars Piguet Royal Oak", category: "watches", description: "Studio: bracelet geometry + brushed/polished contrast" },
  // 8. Jaeger-LeCoultre Reverso
  { src: assetUrl("/images/product/jlc-reverso.webp"), alt: "Jaeger-LeCoultre Reverso", category: "watches", description: "Studio: art-deco geometry, reversible case" },
  // 9. Omega Speedmaster
  { src: assetUrl("/images/product/omega-speedmaster.webp"), alt: "Omega Speedmaster Moonwatch", category: "watches", description: "Studio: black dial contrast, tachymeter detail" },
  // 10. Porsche 911 Crest
  { src: assetUrl("/images/product/porsche-911-crest.webp"), alt: "Porsche 911 Hood Crest", category: "automotive", description: "Studio: paint reflections, emblem detail" },
  // 11. Tiffany Jewelry
  { src: assetUrl("/images/product/tiffany-jewelry.webp"), alt: "Tiffany & Co. Diamond Ring", category: "watches", description: "Studio: gem specular control, platinum setting" },
  // 12. Patek Philippe Calatrava
  { src: assetUrl("/images/product/patek-calatrava.webp"), alt: "Patek Philippe Calatrava", category: "watches", description: "Studio: dress watch elegance, guilloché dial" },
  // 13. TAG Heuer Monaco
  { src: assetUrl("/images/product/tag-monaco.webp"), alt: "TAG Heuer Monaco", category: "watches", description: "Studio: square case, racing heritage" },
  // 14. Cartier Tank
  { src: assetUrl("/images/product/cartier-tank.webp"), alt: "Cartier Tank", category: "watches", description: "Studio: high-key minimal, Parisian restraint" },
  // 15. Mercedes G-Class Headlight
  { src: assetUrl("/images/product/mercedes-g-headlight.webp"), alt: "Mercedes-Benz G-Class Headlight", category: "automotive", description: "Studio: hard-edge highlight, brutal luxury" },
  // 16. Breitling Navitimer
  { src: assetUrl("/images/product/breitling-navitimer.webp"), alt: "Breitling Navitimer", category: "watches", description: "Studio: aviation instrument, slide rule bezel" },
  // 17. Tudor Black Bay
  { src: assetUrl("/images/product/tudor-black-bay.webp"), alt: "Tudor Black Bay", category: "watches", description: "Studio: dive watch heritage, snowflake hands" },
  // 18. Macallan Whisky
  { src: assetUrl("/images/product/macallan-whisky.webp"), alt: "The Macallan 18 Year", category: "spirits", description: "Studio: amber gradients, heritage bottle" },
  // 19. Ferrari Steering
  { src: assetUrl("/images/product/ferrari-steering.webp"), alt: "Ferrari Steering Wheel", category: "automotive", description: "Lifestyle: cockpit drama, leather + carbon" },
  // 20. Range Rover Interior
  { src: assetUrl("/images/product/range-rover-interior.webp"), alt: "Range Rover Interior", category: "automotive", description: "Lifestyle: calm wealth, glass/wood" },
  // 21. Tesla Cybertruck
  { src: assetUrl("/images/product/tesla-cybertruck.webp"), alt: "Tesla Cybertruck Surface", category: "automotive", description: "Studio: geometry + steel texture" },
  // 22. Rolls-Royce Spirit
  { src: assetUrl("/images/product/rolls-royce-spirit.webp"), alt: "Rolls-Royce Spirit of Ecstasy", category: "automotive", description: "Studio: iconic chrome figure, dramatic light" },
  // 23. Hennessy Cognac
  { src: assetUrl("/images/product/hennessy-cognac.webp"), alt: "Hennessy XO Cognac", category: "spirits", description: "Studio: dark luxe, snifter glass" },
  // 24. Rémy Martin XO
  { src: assetUrl("/images/product/remy-martin-xo.webp"), alt: "Rémy Martin XO", category: "spirits", description: "Studio: frosted decanter, centaur logo" },
  // 25. Lamborghini Exhaust
  { src: assetUrl("/images/product/lamborghini-exhaust.webp"), alt: "Lamborghini Exhaust", category: "automotive", description: "Studio: titanium heat patina, hexagonal tips" },
  // 26. Bentley Flying B
  { src: assetUrl("/images/product/bentley-flying-b.webp"), alt: "Bentley Flying B", category: "automotive", description: "Studio: chrome wings, ultra-luxury emblem" },
  // 27. Johnnie Walker Blue
  { src: assetUrl("/images/product/johnnie-walker-blue.webp"), alt: "Johnnie Walker Blue Label", category: "spirits", description: "Studio: iconic blue bottle, gold label" },
  // 28. Aston Martin Grille
  { src: assetUrl("/images/product/aston-martin-grille.webp"), alt: "Aston Martin Grille", category: "automotive", description: "Studio: mesh detail, British craftsmanship" },
  // 29. Adidas Samba
  { src: assetUrl("/images/product/fashion-adidas-samba.webp"), alt: "Adidas Samba", category: "tech-fashion", description: "Lifestyle: street + shadow geometry" },
  // 30. Grey Goose Vodka
  { src: assetUrl("/images/product/grey-goose-vodka.webp"), alt: "Grey Goose Vodka", category: "spirits", description: "Studio: frosted glass, French elegance" },
  // 31. Dom Perignon
  { src: assetUrl("/images/product/champagne-dom-perignon.webp"), alt: "Dom Perignon", category: "spirits", description: "Studio: condensation droplets, celebration" },
  // 32. Sprite Lemon
  { src: assetUrl("/images/product/sprite-lemon.webp"), alt: "Sprite Lemon-Lime", category: "beverages", description: "Studio: citrus freshness, clear bubbles" },
  // 33. Veuve Clicquot
  { src: assetUrl("/images/product/veuve-clicquot.webp"), alt: "Veuve Clicquot", category: "spirits", description: "Studio: iconic yellow label, celebration" },
  // 34. Bombay Sapphire Gin
  { src: assetUrl("/images/product/bombay-sapphire-gin.webp"), alt: "Bombay Sapphire Gin", category: "spirits", description: "Studio: blue glass facets, Queen Victoria" },
  // 35. Coca-Cola Classic
  { src: assetUrl("/images/product/coca-cola-classic.webp"), alt: "Coca-Cola Classic Bottle", category: "beverages", description: "Studio: iconic contour bottle, condensation" },
  // 36. Pepsi Can
  { src: assetUrl("/images/product/pepsi-can.webp"), alt: "Pepsi Can Splash", category: "beverages", description: "Studio: dynamic water splash, frozen motion" },
  // 37. Monster Energy
  { src: assetUrl("/images/product/monster-energy.webp"), alt: "Monster Energy", category: "beverages", description: "Studio: green claw logo, ice crystals" },
  // 38. San Pellegrino
  { src: assetUrl("/images/product/san-pellegrino.webp"), alt: "San Pellegrino", category: "beverages", description: "Studio: Italian elegance, red star" },
  // 39. Dyson Hair Tool
  { src: assetUrl("/images/product/consumer-dyson-hairtool.webp"), alt: "Dyson Hair Tool", category: "tech-fashion", description: "Studio: chrome + matte, modern premium" },
  // 40. Leica Camera
  { src: assetUrl("/images/product/tech-leica-camera.webp"), alt: "Leica Camera Body", category: "tech-fashion", description: "Studio: heritage engineering, low-key" },
  // 41. Sony Headphones
  { src: assetUrl("/images/product/tech-sony-headphones.webp"), alt: "Sony Headphones", category: "tech-fashion", description: "Studio: matte textures, soft gradients" },
  // 42. Nike Air Force 1
  { src: assetUrl("/images/product/fashion-nike-af1.webp"), alt: "Nike Air Force 1", category: "tech-fashion", description: "Studio: white-on-white texture mastery" },
];

// Single source of truth for how the saved order maps onto the gallery.
// Used by this page AND the /edit CMS so both always show the same list.
// NOTE: when a saved order exists, ONLY images in it are shown — this is how
// deletions made in the CMS stay deleted on the live page.
//
// The CMS persists local paths (for example, `/images/product/cartier-tank.webp`),
// while `assetUrl()` converts the catalogue entries to Supabase public URLs at
// runtime. Normalize public product URLs back to the CMS path before matching.
export function normalizeProductOrderSource(src: string): string {
  if (src.startsWith("/images/product/")) return src;

  try {
    const url = new URL(src);
    const marker = "/product-images/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex !== -1) {
      const objectKey = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
      return `/images/product/${objectKey}`;
    }
  } catch {
    // Non-URL values are handled by the caller as stale paths.
  }

  return src;
}

export function applyProductOrder(order: string[] | null | undefined) {
  if (order && order.length > 0) {
    const imageMap = new Map(
      productPhotographyImages.flatMap(img => [
        [img.src, img] as const,
        [normalizeProductOrderSource(img.src), img] as const,
      ])
    );

    return order
      .map(src => {
        const known = imageMap.get(src) ?? imageMap.get(normalizeProductOrderSource(src));
        if (known) return known;
        // Absolute storage URL = image uploaded through the CMS.
        if (src.startsWith("http")) return { src, alt: "Product photograph", category: "uploaded", description: "" };
        return undefined; // stale local path — drop
      })
      .filter((img): img is typeof productPhotographyImages[0] => img !== undefined);
  }
  return productPhotographyImages;
}

// Simple image component (zoom feature disabled)
function ProductImage({ 
  src, 
  alt, 
  className,
  onLoad 
}: { 
  src: string; 
  alt: string; 
  className?: string;
  onLoad?: () => void;
}) {
  return (
    <div className="relative overflow-hidden w-full">
      <img
        src={src}
        srcSet={`${src.replace('.webp', '-400.webp')} 400w, ${src.replace('.webp', '-800.webp')} 800w, ${src.replace('.webp', '-1200.webp')} 1200w, ${src} 1600w`}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={alt}
        className={`w-full h-auto block ${className}`}
        loading="lazy"
        onLoad={onLoad}
        onError={(e) => {
          // Fallback to original image if responsive variants don't exist
          const img = e.currentTarget;
          if (img.srcset) {
            img.srcset = '';
            img.src = src;
          }
        }}
      />
    </div>
  );
}

export default function ProductPhotography() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Start with the hardcoded order (which now matches database)
  const [orderedImages, setOrderedImages] = useState(productPhotographyImages);

  // Load saved order from database
  const { data: savedOrder } = trpc.gallery.getOrder.useQuery(
    { gallery: "product-photography" },
    { staleTime: 1000 * 60 * 5 } // Cache for 5 minutes
  );

  // Apply saved order when loaded - ONLY show images from saved order
  // This respects deletions made in the /edit CMS
  useEffect(() => {
    if (savedOrder?.order && savedOrder.order.length > 0) {
      setOrderedImages(applyProductOrder(savedOrder.order));
    }
  }, [savedOrder]);

  const filteredImages = orderedImages;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "auto";
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentIndex((prev) => (prev === 0 ? filteredImages.length - 1 : prev - 1));
    } else {
      setCurrentIndex((prev) => (prev === filteredImages.length - 1 ? 0 : prev + 1));
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigateLightbox("prev");
      if (e.key === "ArrowRight") navigateLightbox("next");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, filteredImages.length]);

  // SEO data
  const seoImages = filteredImages.slice(0, 10).map(img => ({
    src: img.src.startsWith("http") ? img.src : `https://allenhenson.com${img.src}`,
    alt: img.alt
  }));

  return (
    <>
      <SEOHead
        title="Product Photography | Allen Henson"
        description="High-end commercial product photography for luxury brands, automotive, spirits, and consumer goods. Campaign-ready imagery with cinematic precision by Allen Henson."
        image={assetUrl("/images/product/rolex-yacht-master.webp")}
        url="https://allenhenson.com/product-photography"
      />
      <ImageGallerySchema
        name="Allen Henson Product Photography Portfolio"
        description="Commercial product photography showcasing luxury watches, automotive details, premium spirits, and consumer goods"
        images={seoImages}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://allenhenson.com" },
          { name: "Product Photography", url: "https://allenhenson.com/product-photography" }
        ]}
      />

      <div className="min-h-screen pt-10 pb-10 sm:pt-16 sm:pb-16 md:pt-24">
        {/* Header */}
        <div className="container mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="meta-text text-gold uppercase mb-4">
              COMMERCIAL PORTFOLIO
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">
              Product Photography
            </h1>
            <div className="w-16 h-px bg-gold mx-auto mb-6" />
            <p className="max-w-2xl mx-auto text-base font-normal leading-relaxed text-foreground/80">
              High-end commercial product photography for luxury brands, automotive, spirits, and consumer goods. Campaign-ready imagery with cinematic precision.
            </p>
          </motion.div>
        </div>

        {/* Image Grid — CSS columns masonry: images take natural height, no black gaps */}
        <div className="container">
          {/* Row-major masonry: order reads left-to-right, matching /edit */}
          <MasonryGrid
            items={filteredImages}
            columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}
            renderItem={(image, index) => (
              <motion.div
                key={image.src}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.4) }}
                className="group cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <div className="relative overflow-hidden bg-secondary/30">
                  <ProductImage
                    src={image.src}
                    alt={image.alt}
                    className="image-hover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />
                  <div className="absolute inset-0 vignette opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Hover Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-sm font-medium text-white mb-1">{image.alt}</h3>
                    <p className="text-xs text-white/70">{image.description}</p>
                  </div>
                </div>
              </motion.div>
            )}
          />
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
              onClick={closeLightbox}
            >
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>

              {/* Navigation */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("prev");
                }}
                className="absolute left-4 z-50 p-2 text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("next");
                }}
                className="absolute right-4 z-50 p-2 text-white/70 hover:text-white transition-colors"
              >
                <ChevronRight className="w-10 h-10" />
              </button>

              {/* Image */}
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="max-w-[90vw] max-h-[90vh] relative"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={filteredImages[currentIndex]?.src}
                  alt={filteredImages[currentIndex]?.alt}
                  className="max-w-full max-h-[85vh] object-contain"
                />
              </motion.div>

              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
                {currentIndex + 1} / {filteredImages.length}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Section */}
        <div className="container mt-10 sm:mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-background font-semibold tracking-[0.02em] text-base hover:bg-gold/90 transition-all duration-300"
            >
              DISCUSS YOUR PROJECT
            </a>
          </motion.div>
        </div>
      </div>
    </>
  );
}
