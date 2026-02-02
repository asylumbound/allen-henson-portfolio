/*
 * Structured Data Component - JSON-LD Schema.org markup
 * Implements structured data for better search engine understanding
 */

import { useEffect } from "react";

// Person/Creative Professional Schema
export function PersonSchema() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "person-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://www.allenhenson.com/#person",
      name: "Allen Henson",
      givenName: "Allen",
      familyName: "Henson",
      url: "https://www.allenhenson.com",
      image: "https://www.allenhenson.com/images/allen-polaroid23gg.jpg",
      description:
        "Award-winning photographer and film director with over 20 years of experience in editorial, commercial, and cinematic photography. Based in Los Angeles and New York.",
      jobTitle: ["Photographer", "Film Director", "Creative Director"],
      worksFor: {
        "@type": "Organization",
        name: "Allen Henson Productions",
        url: "https://www.allenhenson.com",
      },
      sameAs: [
        "https://www.instagram.com/allenhenson",
        "https://www.linkedin.com/in/allenhenson",
        "https://vimeo.com/allenhenson",
      ],
      knowsAbout: [
        "Photography",
        "Film Direction",
        "Editorial Photography",
        "Commercial Photography",
        "Portrait Photography",
        "Product Photography",
        "Fashion Photography",
        "Cinematic Storytelling",
      ],
      alumniOf: {
        "@type": "Organization",
        name: "22nd Infantry Regiment, U.S. Army",
      },
      award: [
        "Multiple international photography awards",
        "Campaign work for luxury brands including Chanel",
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Los Angeles",
        addressRegion: "CA",
        addressCountry: "US",
      },
    });

    // Remove existing script if present
    const existing = document.getElementById("person-schema");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("person-schema");
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, []);

  return null;
}

// Organization Schema
export function OrganizationSchema() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "organization-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.allenhenson.com/#organization",
      name: "Allen Henson Productions",
      url: "https://www.allenhenson.com",
      logo: "https://www.allenhenson.com/images/AHP_logo_white.png",
      description:
        "Full-service photography and film production company specializing in editorial, commercial, and cinematic content creation.",
      founder: {
        "@type": "Person",
        "@id": "https://www.allenhenson.com/#person",
      },
      address: [
        {
          "@type": "PostalAddress",
          addressLocality: "Los Angeles",
          addressRegion: "CA",
          addressCountry: "US",
        },
        {
          "@type": "PostalAddress",
          addressLocality: "New York",
          addressRegion: "NY",
          addressCountry: "US",
        },
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "allen@allenhenson.com",
        availableLanguage: ["English"],
      },
      sameAs: [
        "https://www.instagram.com/allenhenson",
        "https://www.linkedin.com/in/allenhenson",
        "https://vimeo.com/allenhenson",
      ],
    });

    const existing = document.getElementById("organization-schema");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("organization-schema");
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, []);

  return null;
}

// Website Schema
export function WebsiteSchema() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "website-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://www.allenhenson.com/#website",
      name: "Allen Henson Photography",
      url: "https://www.allenhenson.com",
      description:
        "Official website of Allen Henson - Cinematic Photography, Film Direction & Creative Strategy",
      publisher: {
        "@type": "Organization",
        "@id": "https://www.allenhenson.com/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://www.allenhenson.com/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    });

    const existing = document.getElementById("website-schema");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("website-schema");
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, []);

  return null;
}

// Image Gallery Schema for portfolio pages
interface ImageGallerySchemaProps {
  name: string;
  description: string;
  images: Array<{ src: string; alt: string }>;
}

export function ImageGallerySchema({ name, description, images }: ImageGallerySchemaProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "gallery-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      name: name,
      description: description,
      url: typeof window !== "undefined" ? window.location.href : "",
      author: {
        "@type": "Person",
        "@id": "https://www.allenhenson.com/#person",
      },
      image: images.slice(0, 10).map((img) => ({
        "@type": "ImageObject",
        url: `https://www.allenhenson.com${img.src}`,
        name: img.alt,
        author: {
          "@type": "Person",
          "@id": "https://www.allenhenson.com/#person",
        },
      })),
    });

    const existing = document.getElementById("gallery-schema");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("gallery-schema");
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [name, description, images]);

  return null;
}

// Product Schema for shop items
interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  sku?: string;
}

export function ProductSchema({
  name,
  description,
  image,
  price,
  currency = "USD",
  availability = "InStock",
  sku,
}: ProductSchemaProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "product-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: name,
      description: description,
      image: image.startsWith("http") ? image : `https://www.allenhenson.com${image}`,
      sku: sku,
      brand: {
        "@type": "Brand",
        name: "Allen Henson Photography",
      },
      offers: {
        "@type": "Offer",
        price: price,
        priceCurrency: currency,
        availability: `https://schema.org/${availability}`,
        seller: {
          "@type": "Organization",
          "@id": "https://www.allenhenson.com/#organization",
        },
      },
      creator: {
        "@type": "Person",
        "@id": "https://www.allenhenson.com/#person",
      },
    });

    const existing = document.getElementById("product-schema");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("product-schema");
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [name, description, image, price, currency, availability, sku]);

  return null;
}

// Breadcrumb Schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "breadcrumb-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    });

    const existing = document.getElementById("breadcrumb-schema");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("breadcrumb-schema");
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [items]);

  return null;
}

// Professional Service Schema
export function ProfessionalServiceSchema() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "service-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "@id": "https://www.allenhenson.com/#service",
      name: "Allen Henson Photography Services",
      description:
        "Professional photography and film direction services including editorial, commercial, portrait, and product photography.",
      url: "https://www.allenhenson.com",
      image: "https://www.allenhenson.com/images/allen-polaroid23gg.jpg",
      priceRange: "$$$",
      areaServed: [
        { "@type": "City", name: "Los Angeles" },
        { "@type": "City", name: "New York" },
        { "@type": "Country", name: "United States" },
        { "@type": "Place", name: "Worldwide" },
      ],
      serviceType: [
        "Editorial Photography",
        "Commercial Photography",
        "Portrait Photography",
        "Product Photography",
        "Fashion Photography",
        "Film Direction",
        "Creative Direction",
        "Campaign Photography",
      ],
      provider: {
        "@type": "Person",
        "@id": "https://www.allenhenson.com/#person",
      },
    });

    const existing = document.getElementById("service-schema");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("service-schema");
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, []);

  return null;
}

export default {
  PersonSchema,
  OrganizationSchema,
  WebsiteSchema,
  ImageGallerySchema,
  ProductSchema,
  BreadcrumbSchema,
  ProfessionalServiceSchema,
};
