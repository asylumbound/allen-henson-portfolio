/*
 * Blog Post Page - Individual essay view
 * Design: Cinematic Noir - Clean typography, gold accents, readable long-form
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Calendar, Clock, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { SEOHead } from "@/components/SEOHead";

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { data: post, isLoading, error } = trpc.blog.getBySlug.useQuery(
    { slug: params.slug || "" },
    { enabled: !!params.slug }
  );

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  // Redirect if post not found
  useEffect(() => {
    if (!isLoading && !post && !error) {
      setLocation("/blog");
    }
  }, [isLoading, post, error, setLocation]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Estimate reading time (average 200 words per minute)
  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-24">
        <div className="container max-w-3xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-secondary/50 rounded-sm w-1/4" />
            <div className="h-12 bg-secondary/50 rounded-sm w-3/4" />
            <div className="h-4 bg-secondary/50 rounded-sm w-1/3" />
            <div className="h-64 bg-secondary/50 rounded-sm" />
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-secondary/50 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen py-24">
        <div className="container max-w-3xl text-center">
          <h1 className="text-2xl font-semibold mb-4">Post not found</h1>
          <Link href="/blog" className="text-gold hover:underline">
            Return to blog
          </Link>
        </div>
      </div>
    );
  }

  // Format date for Open Graph
  const ogPublishedTime = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : undefined;

  return (
    <>
      <SEOHead
        title={post.title}
        description={post.excerpt || post.title}
        image={post.heroImage || "/images/L1009868.jpg"}
        type="article"
        publishedTime={ogPublishedTime}
        author="Allen Henson"
      />
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-12 md:py-20">
        <div className="container max-w-3xl">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold cinematic-transition mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="tracking-cinematic">BACK TO ESSAYS</span>
            </Link>
          </motion.div>

          {/* Title & Meta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-light mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{getReadingTime(post.content)}</span>
              </div>
            </div>

            <div className="w-16 h-px bg-gold mb-8" />
          </motion.div>

          {/* Hero Image */}
          {post.heroImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={post.heroImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 vignette opacity-50" />
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="pb-24">
        <div className="container max-w-3xl">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="prose prose-lg prose-invert max-w-none
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:font-light prose-p:leading-relaxed prose-p:text-foreground/85
              prose-a:text-gold prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-medium
              prose-em:text-foreground/70
              prose-blockquote:border-l-gold prose-blockquote:border-l-2 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-foreground/70
              prose-ul:list-disc prose-ul:pl-6
              prose-ol:list-decimal prose-ol:pl-6
              prose-li:text-foreground/85 prose-li:font-light
              prose-hr:border-border prose-hr:my-12"
          >
            <Streamdown>{post.content}</Streamdown>
          </motion.article>

          {/* Social Sharing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 pt-8 border-t border-border"
          >
            <div className="flex items-center gap-6">
              <span className="text-sm text-muted-foreground tracking-cinematic flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                SHARE
              </span>
              <div className="flex items-center gap-4">
                {/* Twitter/X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center w-10 h-10 border border-border rounded-full hover:border-gold hover:bg-gold/10 cinematic-transition"
                  title="Share on X (Twitter)"
                >
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-gold cinematic-transition" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center w-10 h-10 border border-border rounded-full hover:border-gold hover:bg-gold/10 cinematic-transition"
                  title="Share on LinkedIn"
                >
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-gold cinematic-transition" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center w-10 h-10 border border-border rounded-full hover:border-gold hover:bg-gold/10 cinematic-transition"
                  title="Share on Facebook"
                >
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-gold cinematic-transition" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(`Check out this essay: ${window.location.href}`)}`}
                  className="group flex items-center justify-center w-10 h-10 border border-border rounded-full hover:border-gold hover:bg-gold/10 cinematic-transition"
                  title="Share via Email"
                >
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-gold cinematic-transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </a>

                {/* Copy Link */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    // Could add a toast notification here
                  }}
                  className="group flex items-center justify-center w-10 h-10 border border-border rounded-full hover:border-gold hover:bg-gold/10 cinematic-transition"
                  title="Copy link"
                >
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-gold cinematic-transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Author Signature */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-8"
          >
            <p className="text-gold font-light text-lg">— AH</p>
          </motion.div>

          {/* Back to Blog */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold cinematic-transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="tracking-cinematic">BACK TO ALL ESSAYS</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  );
}
