/**
 * PRODUCT PHOTOGRAPHY PAGE
 * Commercial product photography portfolio showcasing luxury brands
 * Categories: Watches & Jewelry, Automotive, Spirits, Beverages, Tech/Fashion
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// Product photography categories and images
const productCategories = [
  { id: "all", name: "All Work", count: 0 },
  { id: "watches", name: "Watches & Jewelry", count: 10 },
  { id: "automotive", name: "Automotive", count: 10 },
  { id: "spirits", name: "Spirits & Alcohol", count: 10 },
  { id: "beverages", name: "Beverages", count: 10 },
];

// Product images with metadata
export const productPhotographyImages = [
  // Watches & Jewelry (10)
  { src: "/images/product/rolex-pepsi-gmt.jpg", alt: "Rolex GMT-Master II 'Pepsi'", category: "watches", description: "Studio: bezel color separation + sapphire control" },
  { src: "/images/product/omega-speedmaster.jpg", alt: "Omega Speedmaster", category: "watches", description: "Lifestyle: black suit cuff, white shirt reveal" },
  { src: "/images/product/cartier-tank.jpg", alt: "Cartier Tank", category: "watches", description: "Studio: high-key minimal, Parisian restraint" },
  { src: "/images/product/ap-royal-oak.jpg", alt: "Audemars Piguet Royal Oak", category: "watches", description: "Studio: bracelet geometry + brushed/polished contrast" },
  { src: "/images/product/patek-calatrava.jpg", alt: "Patek Philippe Calatrava", category: "watches", description: "Lifestyle: soft window light, dress watch intimacy" },
  { src: "/images/product/tag-monaco.jpg", alt: "TAG Heuer Monaco", category: "watches", description: "Lifestyle: car interior, steering wheel texture" },
  { src: "/images/product/breitling-navitimer.jpg", alt: "Breitling Navitimer", category: "watches", description: "Studio: aviation instrument vibe, low-key" },
  { src: "/images/product/tudor-black-bay.jpg", alt: "Tudor Black Bay", category: "watches", description: "Lifestyle: wet jacket cuff, coastal grit" },
  { src: "/images/product/jlc-reverso.jpg", alt: "Jaeger-LeCoultre Reverso", category: "watches", description: "Studio: art-object shadows, negative space" },
  { src: "/images/product/tiffany-jewelry.jpg", alt: "Tiffany & Co. Ring", category: "watches", description: "Studio: gem specular control, macro" },
  
  // Automotive (10)
  { src: "/images/product/porsche-911-crest.jpg", alt: "Porsche 911 Hood Crest", category: "automotive", description: "Studio: paint reflections, emblem detail" },
  { src: "/images/product/ferrari-steering.jpg", alt: "Ferrari Steering Wheel", category: "automotive", description: "Lifestyle: cockpit drama, leather + carbon" },
  { src: "/images/product/mercedes-g-headlight.jpg", alt: "Mercedes-Benz G-Class Headlight", category: "automotive", description: "Studio: hard-edge highlight, brutal luxury" },
  { src: "/images/product/range-rover-interior.jpg", alt: "Range Rover Interior", category: "automotive", description: "Lifestyle: calm wealth, glass/wood" },
  { src: "/images/product/tesla-cybertruck.jpg", alt: "Tesla Cybertruck Surface", category: "automotive", description: "Studio: geometry + steel texture" },
  { src: "/images/product/bmw-m-steering.jpg", alt: "BMW M Steering Wheel", category: "automotive", description: "Lifestyle: purposeful, driver-first" },
  { src: "/images/product/lamborghini-start.jpg", alt: "Lamborghini Start Button", category: "automotive", description: "Studio: red cover, aggression controlled" },
  { src: "/images/product/audi-taillight.jpg", alt: "Audi Taillight Blue Hour", category: "automotive", description: "Lifestyle: cinematic city glow" },
  { src: "/images/product/michelin-tire.jpg", alt: "Michelin Performance Tire", category: "automotive", description: "Studio: rubber texture, bead highlights" },
  { src: "/images/product/brembo-caliper.jpg", alt: "Brembo Brake Caliper", category: "automotive", description: "Studio: color pop, industrial precision" },
  
  // Spirits & Alcohol (10)
  { src: "/images/product/macallan-pour.jpg", alt: "The Macallan Pour", category: "spirits", description: "Studio: amber gradients, liquid physics" },
  { src: "/images/product/hennessy-xo.jpg", alt: "Hennessy XO", category: "spirits", description: "Studio: dark luxe, moody rim light" },
  { src: "/images/product/patron-bottle.jpg", alt: "Patrón Bottle", category: "spirits", description: "Lifestyle: clean coastal table" },
  { src: "/images/product/don-julio-1942.jpg", alt: "Don Julio 1942", category: "spirits", description: "Studio: tall bottle, label texture" },
  { src: "/images/product/grey-goose.jpg", alt: "Grey Goose Ice-Frost", category: "spirits", description: "Studio: cold light, condensation realism" },
  { src: "/images/product/johnnie-walker.jpg", alt: "Johnnie Walker Black Label", category: "spirits", description: "Lifestyle: night city window reflection" },
  { src: "/images/product/heineken-bottle.jpg", alt: "Heineken Bottle", category: "spirits", description: "Studio: glass control, droplets" },
  { src: "/images/product/guinness-pint.jpg", alt: "Guinness Pint Cascade", category: "spirits", description: "Studio: creamy head, timing mastery" },
  { src: "/images/product/veuve-clicquot.jpg", alt: "Veuve Clicquot Pop", category: "spirits", description: "Lifestyle: restrained celebration" },
  { src: "/images/product/aperol-spritz.jpg", alt: "Aperol Spritz Build", category: "spirits", description: "Lifestyle: sun, glass, orange slice minimal" },
  
  // Beverages (10)
  { src: "/images/product/coca-cola-bottle.jpg", alt: "Coca-Cola Classic Bottle", category: "beverages", description: "Studio: timeless hero, condensation" },
  { src: "/images/product/pepsi-can.jpg", alt: "Pepsi Lifestyle Can", category: "beverages", description: "Lifestyle: street energy, motion blur controlled" },
  { src: "/images/product/red-bull-splash.jpg", alt: "Red Bull Can + Splash", category: "beverages", description: "Studio: frozen action, crisp logo" },
  { src: "/images/product/san-pellegrino.jpg", alt: "San Pellegrino Bottle", category: "beverages", description: "Lifestyle: premium dining vibe" },
  { src: "/images/product/perrier-bottle.jpg", alt: "Perrier Bottle Macro", category: "beverages", description: "Studio: green glass + droplets" },
  { src: "/images/product/gatorade-grip.jpg", alt: "Gatorade Grip Shot", category: "beverages", description: "Lifestyle: sweat + exertion, product clear" },
  { src: "/images/product/monster-energy.jpg", alt: "Monster Energy Can", category: "beverages", description: "Lifestyle: night neon, gritty realism" },
  { src: "/images/product/lacroix-set.jpg", alt: "LaCroix Colorful Set", category: "beverages", description: "Studio: playful but premium lighting" },
  { src: "/images/product/starbucks-iced.jpg", alt: "Starbucks Iced Cup", category: "beverages", description: "Lifestyle: handoff moment, shallow DOF" },
  { src: "/images/product/liquid-death.jpg", alt: "Liquid Death Can", category: "beverages", description: "Studio: punk minimal, hard light edges" },
];

export default function ProductPhotography() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter images by category
  const filteredImages = useMemo(() => {
    if (selectedCategory === "all") {
      return productPhotographyImages;
    }
    return productPhotographyImages.filter(img => img.category === selectedCategory);
  }, [selectedCategory]);

  // Update category counts
  const categoriesWithCounts = useMemo(() => {
    return productCategories.map(cat => ({
      ...cat,
      count: cat.id === "all" 
        ? productPhotographyImages.length 
        : productPhotographyImages.filter(img => img.category === cat.id).length
    }));
  }, []);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "auto";
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? filteredImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === filteredImages.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
  };

  return (
    <div className="min-h-screen" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-b from-secondary/50 to-background" />
        </div>

        <div className="relative z-10 container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
              COMMERCIAL PORTFOLIO
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
              Product Photography
            </h1>
            <div className="w-16 h-px bg-gold mx-auto mb-6" />
            <p className="max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed text-foreground/80">
              High-end commercial product photography for luxury brands, automotive, 
              spirits, and consumer goods. Campaign-ready imagery with cinematic precision.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b border-border/30">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {categoriesWithCounts.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`text-sm tracking-cinematic font-light transition-all duration-300 ${
                  selectedCategory === category.id
                    ? "text-gold"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {category.name}
                <span className="ml-2 text-xs text-foreground/40">({category.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.src}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className="group cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <div className="relative overflow-hidden aspect-[4/5] bg-secondary/20">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover image-hover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 cinematic-transition" />
                    <div className="absolute inset-0 vignette opacity-0 group-hover:opacity-100 cinematic-transition" />
                    
                    {/* Hover overlay with info */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 cinematic-transition">
                      <p className="text-white text-sm font-light">{image.alt}</p>
                      <p className="text-white/70 text-xs font-light mt-1">{image.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty state */}
          {filteredImages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-foreground/60 font-light">No images in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Services CTA */}
      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
              COMMERCIAL SERVICES
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">
              Elevate Your Brand
            </h2>
            <p className="max-w-xl mx-auto text-base font-light leading-relaxed text-foreground/80 mb-10">
              From luxury watches to automotive campaigns, I deliver campaign-ready imagery 
              that communicates brand authority and craftsmanship at the highest commercial level.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gold text-background font-medium tracking-cinematic text-sm hover:bg-gold/90 cinematic-transition"
            >
              DISCUSS YOUR PROJECT
            </a>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && filteredImages[currentIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-50 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white cinematic-transition"
              aria-label="Close lightbox"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation */}
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 md:left-8 z-50 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white cinematic-transition"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 md:right-8 z-50 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white cinematic-transition"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image */}
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-[90vw] max-h-[85vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filteredImages[currentIndex].src}
                alt={filteredImages[currentIndex].alt}
                className="max-w-full max-h-[85vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-lg font-light">{filteredImages[currentIndex].alt}</p>
                <p className="text-white/70 text-sm font-light mt-1">{filteredImages[currentIndex].description}</p>
              </div>
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm tracking-cinematic">
              {currentIndex + 1} / {filteredImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
