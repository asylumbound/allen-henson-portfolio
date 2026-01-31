/*
 * DESIGN: Cinematic Noir
 * - Split layout with image and text
 * - Elegant typography for biography
 * - Gold accents for emphasis
 * - Cinematic pacing in content reveal
 */

import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="container">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24"
        >
          <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
            THE ARTIST
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            About Allen Henson
          </h1>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative aspect-[3/4] overflow-hidden sticky top-24">
              <img
                src="/images/portfolio-07.png"
                alt="Allen Henson"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 vignette" />
            </div>
          </motion.div>

          {/* Biography */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:py-12"
          >
            <div className="w-16 h-px bg-gold mb-10" />
            
            <div className="space-y-6 text-base font-light leading-relaxed text-foreground/85">
              <p>
                For over twenty years I've chased light across continents — from rooftops in Berlin 
                to the casbah's of Morocco, and the dim-lit bridges of Prague. These images aren't 
                curated moments so much as fragments of a life observed through glass.
              </p>
              
              <p>
                Before I ever picked up a camera, I had the honor of serving with the 22nd Infantry 
                Regiment, conducting multiple tours in Iraq, afterwards documenting conflicts around 
                the world. The discipline and chaos of those years shaped the way I see — and how I 
                capture what I see.
              </p>
              
              <p>
                I've been a soldier, a producer, but more-so a witness — collaborating with artists 
                who've asked me to help define them, only to realize I've spent the same time trying 
                to define myself.
              </p>
              
              <p>
                This gallery isn't about perfection or polish. It's the record of process — of becoming, 
                undoing, and becoming again. Every frame is a conversation between control and chaos, 
                between the subject and the person holding the camera.
              </p>
              
              <p>
                Today my work spans portraiture, editorial, commercial, and narrative-driven campaigns. 
                I operate full-service teams in Los Angeles and New York, leveraging the tools of modern 
                production — from lighting and post workflows to the psychology of performance — to 
                translate moments into something lasting.
              </p>
              
              <p className="italic text-foreground/70">
                You'll find portraits, chaos, and calm. Moments stolen and moments staged. The proof 
                that I was there — and maybe, that I still am.
              </p>
              
              <p className="text-gold font-normal">
                — AH
              </p>
            </div>

            {/* Services */}
            <div className="mt-16 pt-10 border-t border-border">
              <p className="text-xs tracking-wide-cinematic text-gold font-light mb-6">
                SERVICES
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm font-light text-foreground/80">
                <div>Portraiture</div>
                <div>Editorial</div>
                <div>Commercial</div>
                <div>Brand Campaigns</div>
                <div>Film Direction</div>
                <div>Creative Strategy</div>
              </div>
            </div>

            {/* Locations */}
            <div className="mt-12 pt-10 border-t border-border">
              <p className="text-xs tracking-wide-cinematic text-gold font-light mb-6">
                LOCATIONS
              </p>
              <div className="flex flex-wrap gap-6 text-sm font-light text-foreground/80">
                <div>Los Angeles</div>
                <div>New York</div>
                <div>Berlin</div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-background font-medium tracking-cinematic text-sm hover:bg-gold/90 cinematic-transition"
              >
                GET IN TOUCH
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
