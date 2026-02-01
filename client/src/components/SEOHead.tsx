/*
 * SEO Head Component - Dynamic Open Graph and Twitter Card meta tags
 * Uses react-helmet-async for managing document head
 */

import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  author?: string;
}

export function SEOHead({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
  author = "Allen Henson",
}: SEOHeadProps) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const fullImage = image?.startsWith("http") ? image : `${siteUrl}${image}`;
  const fullTitle = title.includes("Allen Henson") ? title : `${title} | Allen Henson`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to update or create meta tag
    const setMetaTag = (property: string, content: string, isName = false) => {
      const attr = isName ? "name" : "property";
      let meta = document.querySelector(`meta[${attr}="${property}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Basic meta tags
    setMetaTag("description", description, true);

    // Open Graph tags
    setMetaTag("og:title", fullTitle);
    setMetaTag("og:description", description);
    setMetaTag("og:type", type);
    setMetaTag("og:url", fullUrl);
    setMetaTag("og:site_name", "Allen Henson Photography");
    
    if (image) {
      setMetaTag("og:image", fullImage);
      setMetaTag("og:image:width", "1200");
      setMetaTag("og:image:height", "630");
      setMetaTag("og:image:alt", title);
    }

    // Article-specific tags
    if (type === "article") {
      if (publishedTime) {
        setMetaTag("article:published_time", publishedTime);
      }
      if (author) {
        setMetaTag("article:author", author);
      }
    }

    // Twitter Card tags
    setMetaTag("twitter:card", image ? "summary_large_image" : "summary", true);
    setMetaTag("twitter:title", fullTitle, true);
    setMetaTag("twitter:description", description, true);
    if (image) {
      setMetaTag("twitter:image", fullImage, true);
      setMetaTag("twitter:image:alt", title, true);
    }

    // Cleanup function to reset title on unmount
    return () => {
      document.title = "Allen Henson | Cinematic Photography";
    };
  }, [fullTitle, description, fullImage, fullUrl, type, publishedTime, author, image, title]);

  return null;
}

export default SEOHead;
