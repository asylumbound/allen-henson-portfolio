/*
 * PRODUCT DETAIL PAGE
 * Individual product page with full details and purchase option
 */

import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ExternalLink, ShoppingCart } from "lucide-react";
import { useEffect } from "react";
import SEOHead from "@/components/SEOHead";

// Static product data for fallback
const staticProducts: Record<string, {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  priceMax: number | null;
  image: string;
  category: string;
  status: string;
  details: string;
}> = {
  "editorial-on-the-run": {
    id: 4,
    slug: "editorial-on-the-run",
    name: "Editorial on the Run",
    description: "Editorial on the Run is a hell-on-wheels, unrepentant tour around the wildernesses and hallowed grounds of the U.S. Compelled to stick everything in storage and hit the road, Anna and I have driven over 20,000 miles in the course of 5 months. From rabbit stew in the Mojave to drinking our way through the Napa Valley abyss, Standing Rock, hiking through Zion, Vegas acid trips and a D.I.Y. Doomsday trailer.",
    price: 5000,
    priceMax: null,
    image: "/images/sales/editorial-on-the-run.png",
    category: "book",
    status: "available",
    details: "Hardback, 152 pages on matte archival paper.\n\nISBN: 978-1-5323-4559-3",
  },
  "editorial-on-the-rocks": {
    id: 5,
    slug: "editorial-on-the-rocks",
    name: "Editorial on the Rocks",
    description: "The Photography of Allen Henson",
    price: 5000,
    priceMax: null,
    image: "/images/sales/editorial-on-the-rocks.png",
    category: "book",
    status: "available",
    details: "Hardback, 216 pages on matte archival paper.\n\nISBN: 978-1-941165-91-1",
  },
  "abscond-box-set": {
    id: 1,
    slug: "abscond-box-set",
    name: "[IN PRODUCTION] LIMITED RUN - ABSCOND BOX SET Vol I-VI",
    description: "THE ABSCOND SERIALS BY ROI ALLEN HENSON\n\nA six-volume journey through France, Morocco, Italy, Greece, Prague & The Escape, and Los Angeles & The Virus.",
    price: 60000,
    priceMax: null,
    image: "/images/sales/abscond-box-set.jpg",
    category: "boxset",
    status: "in_production",
    details: "BOOK I - FRANCE [isbn: 979-8-88796-508-6]\nBOOK II - MOROCCO [isbn: 979-8-88796-509-3]\nBOOK III - ITALY [isbn: 979-8-88796-510-9]\nBOOK IV - GREECE [isbn: 979-8-88796-516-1]\nBOOK V - PRAGUE & THE ESCAPE [isbn: 979-8-88796-517-8]\nBOOK VI - LOS ANGELES & THE VIRUS [isbn: 979-8-88796-518-5]",
  },
  "abscond-series": {
    id: 2,
    slug: "abscond-series",
    name: "[PRESALE] ABSCOND - THE SERIES",
    description: "THE ABSCOND SERIALS BY ROI ALLEN HENSON\n\nThe complete six-volume series available for presale.",
    price: 51000,
    priceMax: null,
    image: "/images/sales/abscond-series.png",
    category: "book",
    status: "presale",
    details: "Six volumes covering:\n• France\n• Morocco\n• Italy\n• Greece\n• Prague & The Escape\n• Los Angeles & The Virus",
  },
  "abscond-vol1-france": {
    id: 3,
    slug: "abscond-vol1-france",
    name: "[PRESALE] ABSCOND - VOL I - FRANCE (I of VI)",
    description: "ABSCOND - Vol. I - FRANCE (I of VI)\n\nNot your typical travelogue... Book One of Six in the Abscond Serial.",
    price: 5000,
    priceMax: null,
    image: "/images/sales/abscond-vol1-france.png",
    category: "book",
    status: "presale",
    details: "ISBN: 979-8-88796-508-6\n\nCH I - PARIS\nCH II - LA PROVINCE, LE VIN ET L'ÉPÉE",
  },
  "tour-de-eiffel": {
    id: 6,
    slug: "tour-de-eiffel",
    name: "Tour de Eiffel + Mannequin Ingrat [MI001-045]",
    description: "Limited edition print from the Mannequin Ingrat series.",
    price: 269000,
    priceMax: 555000,
    image: "/images/sales/tour-de-eiffel.jpg",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order\n\nLimited run 25 in each size, signed and numbered",
  },
  "il-pantheon": {
    id: 7,
    slug: "il-pantheon",
    name: "Il Pantheon a Mezzanotte - [PAN001-015]",
    description: "Rome, Italy\n\nIlford gelatin Silver fiber print, unframed.",
    price: 500000,
    priceMax: null,
    image: "/images/sales/il-pantheon.jpg",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "sarah-in-london": {
    id: 8,
    slug: "sarah-in-london",
    name: "Sarah in London [SL-001-050]",
    description: "Limited edition print from the London series.",
    price: 110000,
    priceMax: null,
    image: "/images/sales/sarah-in-london.jpg",
    category: "print",
    status: "available",
    details: "Limited edition of 50\n\nSigned and numbered",
  },
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getStatusBadge(status: string | null) {
  switch (status) {
    case "presale":
      return <span className="inline-block px-3 py-1 text-xs tracking-cinematic text-gold border border-gold">[PRESALE]</span>;
    case "in_production":
      return <span className="inline-block px-3 py-1 text-xs tracking-cinematic text-gold border border-gold">[IN PRODUCTION]</span>;
    case "sold_out":
      return <span className="inline-block px-3 py-1 text-xs tracking-cinematic text-red-500 border border-red-500">[SOLD OUT]</span>;
    default:
      return null;
  }
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  
  const { data: dbProduct, isLoading } = trpc.products.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Use database product if available, otherwise fallback to static
  const product = dbProduct || (slug ? staticProducts[slug] : null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gold">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">Product Not Found</h1>
        <Link href="/sales" className="text-gold hover:underline">
          ← Back to Shop
        </Link>
      </div>
    );
  }

  const bigCartelUrl = `https://www.editorialontherun.com/product/${slug}`;

  return (
    <>
      <SEOHead
        title={`${product.name} | Allen Henson`}
        description={product.description || `${product.name} - Available from Allen Henson`}
        image={product.image || undefined}
        url={`https://www.allenhenson.com/sales/${slug}`}
        type="website"
      />
      
      <div className="min-h-screen py-12 md:py-20">
        <div className="container">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Link
              href="/sales"
              className="inline-flex items-center gap-2 text-sm tracking-cinematic font-light text-foreground/60 hover:text-gold cinematic-transition"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO SHOP
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-secondary/20">
                <img
                  src={product.image || "/images/placeholder.jpg"}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 vignette pointer-events-none" />
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col"
            >
              {/* Status Badge */}
              {product.status && product.status !== "available" && (
                <div className="mb-4">
                  {getStatusBadge(product.status)}
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-4">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mb-6">
                <p className="text-2xl md:text-3xl text-gold font-light">
                  {formatPrice(product.price)}
                  {product.priceMax && (
                    <span> - {formatPrice(product.priceMax)}</span>
                  )}
                </p>
              </div>

              <div className="w-12 h-px bg-gold mb-6" />

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <p className="text-base font-light leading-relaxed text-foreground/80 whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Details */}
              {product.details && (
                <div className="mb-8">
                  <p className="text-sm font-light leading-relaxed text-foreground/60 whitespace-pre-line">
                    {product.details}
                  </p>
                </div>
              )}

              {/* Purchase Button */}
              <div className="mt-auto space-y-4">
                <a
                  href={bigCartelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gold text-background font-medium tracking-cinematic text-sm hover:bg-gold/90 cinematic-transition"
                >
                  <ShoppingCart className="w-4 h-4" />
                  PURCHASE
                  <ExternalLink className="w-4 h-4" />
                </a>
                
                <p className="text-xs text-center text-foreground/50">
                  Secure checkout via Big Cartel
                </p>
              </div>

              {/* Contact for Custom Orders */}
              <div className="mt-8 pt-8 border-t border-foreground/10">
                <p className="text-sm font-light text-foreground/60 mb-4">
                  Looking for a custom size or framing option?
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-sm tracking-cinematic font-light text-gold gold-underline"
                >
                  CONTACT FOR CUSTOM ORDERS
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
