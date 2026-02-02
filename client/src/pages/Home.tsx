/*
 * DESIGN: Cinematic Noir
 * - Full-bleed hero with video background
 * - Dramatic typography with Mont Blanc
 * - Cinematic pacing and transitions
 * - Gold accent for CTAs
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const featuredImages = [
  { src: "/images/XUQX2322-scaled.jpg", alt: "Portrait photography" },
  { src: "/images/S-NAVONA_RETOUCH2_CHANEL-Tether_-427.png", alt: "Chanel Campaign" },
  { src: "/images/L1009868.jpg", alt: "Leica Series" },
  { src: "/images/BHL0538-Edit.jpg", alt: "Editorial portrait" },
];

export default function Home() {
  // Auth is available if needed for protected features
  // const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-60"
            poster="/images/XUQX2322-scaled.jpg"
          >
            <source src="https://www.allenhenson.nyc/wp-content/uploads/2025/10/allen_henson_-_the_reel-1080p.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 vignette" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6">
              Cinematic Photography
            </h1>
            <p className="text-lg md:text-xl font-extralight tracking-cinematic text-muted-foreground mb-4">
              FILM DIRECTION & CREATIVE STRATEGY
            </p>
            <div className="w-16 h-px bg-gold mx-auto mb-8" />
            <p className="max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed text-foreground/80 mb-10">
              For over twenty years, chasing light across continents — from rooftops in Berlin 
              to the dim-lit bridges of Prague. Every frame is a conversation between control and chaos.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/photos"
              className="group flex items-center gap-2 px-8 py-3 bg-gold text-background font-medium tracking-cinematic text-sm hover:bg-gold/90 cinematic-transition"
            >
              VIEW PORTFOLIO
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 cinematic-transition" />
            </Link>
            <Link
              href="/video"
              className="group flex items-center gap-2 px-8 py-3 border border-foreground/30 text-foreground font-light tracking-cinematic text-sm hover:border-gold hover:text-gold cinematic-transition"
            >
              <Play className="w-4 h-4" />
              WATCH REEL
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-px h-16 bg-gradient-to-b from-gold to-transparent" />
        </motion.div>
      </section>

      {/* Featured Work Section */}
      <section className="py-24 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
              SELECTED WORKS
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Featured Photography
            </h2>
          </motion.div>

          {/* Featured Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {featuredImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href="/photos">
                  <div className="relative overflow-hidden group cursor-pointer aspect-[4/5]">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover image-hover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 cinematic-transition" />
                    <div className="absolute inset-0 vignette opacity-0 group-hover:opacity-100 cinematic-transition" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* View All Link */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link
              href="/photos"
              className="inline-flex items-center gap-2 text-sm tracking-cinematic font-light text-gold gold-underline"
            >
              VIEW ALL WORK
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Teaser */}
      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src="/images/allen-about-hero.webp"
                  alt="Allen Henson"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 vignette" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
                ABOUT THE ARTIST
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">
                A Witness to Light
              </h2>
              <div className="w-12 h-px bg-gold mb-8" />
              <p className="text-base font-light leading-relaxed text-foreground/80 mb-6">
                Before I ever picked up a camera, I had the honor of serving with the 22nd Infantry Regiment, 
                conducting multiple tours in Iraq, afterwards documenting conflicts around the world. 
                The discipline and chaos of those years shaped the way I see — and how I capture what I see.
              </p>
              <p className="text-base font-light leading-relaxed text-foreground/80 mb-8">
                Today my work spans portraiture, editorial, commercial, and narrative-driven campaigns. 
                I operate full-service teams in Los Angeles and New York.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm tracking-cinematic font-light text-gold gold-underline"
              >
                READ MORE
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 md:py-32">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
              LET'S CREATE TOGETHER
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
              Ready to Collaborate?
            </h2>
            <p className="max-w-xl mx-auto text-base font-light leading-relaxed text-foreground/80 mb-10">
              Whether you're looking for editorial photography, commercial campaigns, 
              or narrative-driven content, let's bring your vision to life.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gold text-background font-medium tracking-cinematic text-sm hover:bg-gold/90 cinematic-transition"
            >
              GET IN TOUCH
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
