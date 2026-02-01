import { useState } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  aspectRatio?: string;
  objectFit?: "cover" | "contain" | "fill" | "none";
  onLoad?: () => void;
  onClick?: () => void;
}

/**
 * ResponsiveImage component that automatically generates srcset for WebP images
 * with multiple size variants (400w, 800w, 1200w, original)
 * 
 * For images that have size variants generated, the naming convention is:
 * - original.webp -> original.webp (full size)
 * - original-1200.webp (1200px width)
 * - original-800.webp (800px width)  
 * - original-400.webp (400px width)
 * 
 * If variants don't exist, falls back to the original image
 */
export function ResponsiveImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  loading = "lazy",
  aspectRatio,
  objectFit = "cover",
  onLoad,
  onClick,
}: ResponsiveImageProps) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Generate srcset for WebP images with size variants
  const generateSrcSet = (imageSrc: string): string | undefined => {
    if (!imageSrc || imgError) return undefined;
    
    // Only generate srcset for webp images in specific directories
    if (!imageSrc.includes(".webp")) return undefined;
    
    // Check if this is a product or sales image that might have variants
    const isProductImage = imageSrc.includes("/product/") || imageSrc.includes("/sales/");
    if (!isProductImage) return undefined;

    // Generate srcset with size variants
    const basePath = imageSrc.replace(".webp", "");
    const srcSetParts = [
      `${basePath}-400.webp 400w`,
      `${basePath}-800.webp 800w`,
      `${basePath}-1200.webp 1200w`,
      `${imageSrc} 1600w`,
    ];

    return srcSetParts.join(", ");
  };

  const handleError = () => {
    setImgError(true);
  };

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const srcSet = generateSrcSet(src);

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-secondary/20",
        aspectRatio && `aspect-[${aspectRatio}]`,
        className
      )}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Placeholder/skeleton while loading */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-secondary/30" />
      )}
      
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
        className={cn(
          "w-full h-full transition-opacity duration-300",
          objectFit === "cover" && "object-cover",
          objectFit === "contain" && "object-contain",
          objectFit === "fill" && "object-fill",
          objectFit === "none" && "object-none",
          loaded ? "opacity-100" : "opacity-0",
          onClick && "cursor-pointer"
        )}
      />
    </div>
  );
}

export default ResponsiveImage;
