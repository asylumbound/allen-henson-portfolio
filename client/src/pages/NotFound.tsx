/*
 * DESIGN: Cinematic Noir 404 Page
 * - Dark, atmospheric background
 * - Dramatic typography with gold accents
 * - Cinematic film strip motif
 * - Smooth animations
 */

import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Camera, Film } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/50 to-background" />
        
        {/* Film grain overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Decorative film strip elements */}
        <div className="absolute top-0 left-0 w-full h-8 bg-foreground/5 flex items-center">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-6 h-4 bg-background mx-2 rounded-sm" />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-8 bg-foreground/5 flex items-center">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-6 h-4 bg-background mx-2 rounded-sm" />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Camera Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="w-24 h-24 border border-gold/30 rounded-full flex items-center justify-center">
                <Camera className="w-10 h-10 text-gold" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-dashed border-gold/20 rounded-full"
              />
            </div>
          </motion.div>

          {/* 404 Number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="text-[120px] md:text-[180px] font-bold leading-none tracking-tighter text-foreground/10">
              404
            </h1>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="-mt-16 md:-mt-24"
          >
            <p className="meta-text text-gold uppercase mb-4">
              FRAME NOT FOUND
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-4">
              Lost in the Darkroom
            </h2>
            <div className="w-16 h-px bg-gold mx-auto mb-6" />
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-md mx-auto text-base font-normal leading-relaxed text-muted-foreground mb-10"
          >
            The frame you're looking for seems to have slipped out of focus. 
            Perhaps it was never developed, or it's waiting in another roll.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/"
              className="group flex items-center gap-2 px-8 py-3 bg-gold text-background font-semibold tracking-[0.02em] text-base hover:bg-gold/90 cinematic-transition"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 cinematic-transition" />
              RETURN HOME
            </Link>
            
            <Link
              href="/photos"
              className="group flex items-center gap-2 px-8 py-3 border border-foreground/30 text-foreground nav-text hover:border-gold hover:text-gold cinematic-transition"
            >
              <Film className="w-4 h-4" />
              VIEW PORTFOLIO
            </Link>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 pt-8 border-t border-border/30"
          >
            <p className="meta-text text-muted-foreground mb-4">
              QUICK NAVIGATION
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link href="/photos" className="text-foreground/60 hover:text-gold cinematic-transition">
                Photos
              </Link>
              <span className="text-foreground/20">·</span>
              <Link href="/video" className="text-foreground/60 hover:text-gold cinematic-transition">
                Video
              </Link>
              <span className="text-foreground/20">·</span>
              <Link href="/sales" className="text-foreground/60 hover:text-gold cinematic-transition">
                Shop
              </Link>
              <span className="text-foreground/20">·</span>
              <Link href="/about" className="text-foreground/60 hover:text-gold cinematic-transition">
                About
              </Link>
              <span className="text-foreground/20">·</span>
              <Link href="/contact" className="text-foreground/60 hover:text-gold cinematic-transition">
                Contact
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
