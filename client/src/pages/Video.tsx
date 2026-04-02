/*
 * DESIGN: Cinematic Noir
 * - Full-width video player
 * - Theatrical presentation
 * - Cinematic aspect ratio (16:9)
 * - Minimal UI to focus on content
 */

import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbSchema } from "@/components/StructuredData";

export default function Video() {
  return (
    <>
      <SEOHead
        title="Video Reel"
        description="Cinematic video work by Allen Henson. Commercial campaigns, music videos, and narrative-driven content. Director's reel showcasing cinematography, direction, and post-production expertise."
        image="/images/portfolio-01.png"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.allenhenson.com/" },
          { name: "Video", url: "https://www.allenhenson.com/video" },
        ]}
      />
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
            MOTION
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Video Reel
          </h1>
          <div className="w-16 h-px bg-gold mx-auto mb-6" />
          <p className="max-w-2xl mx-auto text-base font-light leading-relaxed text-muted-foreground">
            A collection of cinematic work spanning commercial campaigns, 
            music videos, and narrative-driven content.
          </p>
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative aspect-film overflow-hidden bg-black">
            <video
              controls
              className="w-full h-full object-contain"
              poster="/images/portfolio-01.png"
            >
              <source src="https://vvfkredvyestpjmfyafh.supabase.co/storage/v1/object/public/video-assets/allen_henson_the_reel_1080p.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 pointer-events-none vignette opacity-30" />
          </div>
        </motion.div>

        {/* Video Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-5xl mx-auto mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl font-semibold tracking-tight mb-1">
              The Reel
            </h2>
            <p className="text-sm font-light text-muted-foreground">
              Director's Cut · 2025
            </p>
          </div>
          <div className="text-sm font-extralight tracking-cinematic text-muted-foreground">
            CINEMATOGRAPHY · DIRECTION · POST-PRODUCTION
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-3xl mx-auto mt-20 text-center"
        >
          <div className="w-12 h-px bg-border mx-auto mb-8" />
          <p className="text-base font-light leading-relaxed text-foreground/80 mb-6">
            This reel showcases a selection of work from commercial campaigns, 
            brand films, and personal projects. Each piece represents a collaboration 
            between vision and execution, capturing moments that resonate.
          </p>
          <p className="text-sm font-extralight tracking-cinematic text-muted-foreground">
            FOR FULL PROJECT INQUIRIES, PLEASE GET IN TOUCH
          </p>
        </motion.div>
      </div>
      </div>
    </>
  );
}
