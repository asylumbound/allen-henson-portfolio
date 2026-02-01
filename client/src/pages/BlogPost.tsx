/*
 * Blog Post Page - Individual essay view
 * Design: Cinematic Noir - Clean typography, gold accents, readable long-form
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

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

  return (
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

          {/* Author Signature */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 pt-8 border-t border-border"
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
  );
}
