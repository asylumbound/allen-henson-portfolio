/*
 * Blog Page - Essays on Cinematography, Photography, Production & AI
 * Design: Cinematic Noir - Clean typography, gold accents, dramatic spacing
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbSchema } from "@/components/StructuredData";
import { assetUrl } from "@/lib/assets";

// Hero image for the blog section
const BLOG_HERO = assetUrl("/images/L1009868.jpg");

export default function Blog() {
  const { data: posts, isLoading } = trpc.blog.list.useQuery();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <SEOHead
        title="Blog"
        description="Essays on cinematography, photography, production, and AI by Allen Henson. Insights from two decades of professional experience in editorial, commercial, and cinematic storytelling."
        image={assetUrl("/images/L1009868.jpg")}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.allenhenson.com/" },
          { name: "Blog", url: "https://www.allenhenson.com/blog" },
        ]}
      />
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[42svh] min-h-[20rem] sm:h-[50vh] sm:min-h-[25rem] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={BLOG_HERO}
            alt="Blog hero"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 vignette" />
        </div>

        <div className="relative z-10 container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="meta-text text-gold uppercase mb-4">
              ESSAYS & THOUGHTS
            </p>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-[-0.02em] mb-6">
              The Journal of Light
            </h1>
            <div className="w-16 h-px bg-gold mx-auto mb-6" />
            <p className="max-w-2xl mx-auto text-base md:text-lg font-normal leading-relaxed text-foreground/80">
              Reflections on cinematography, photography, and production.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-secondary/50 rounded-sm mb-4" />
                  <div className="h-6 bg-secondary/50 rounded-sm w-3/4 mb-2" />
                  <div className="h-4 bg-secondary/50 rounded-sm w-1/2" />
                </div>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:gap-12">
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <Link href={`/blog/${post.slug}`}>
                    <div className="cursor-pointer">
                      {/* Post Image */}
                      {post.heroImage && (
                        <div className="relative aspect-[16/9] overflow-hidden mb-6">
                          <img
                            src={post.heroImage}
                            alt={post.title}
                            className="w-full h-full object-cover object-top image-hover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 cinematic-transition" />
                        </div>
                      )}

                      {/* Post Content */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 meta-text text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>

                        <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] group-hover:text-gold cinematic-transition leading-tight">
                          {post.title}
                        </h2>

                        {post.excerpt && (
                          <p className="text-sm text-foreground/70 font-normal leading-relaxed line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}

                        <div className="flex items-center gap-2 nav-text text-gold pt-2">
                          <span>READ MORE</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 cinematic-transition" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-normal">No posts yet. Check back soon.</p>
            </div>
          )}
        </div>
      </section>
      </div>
    </>
  );
}
