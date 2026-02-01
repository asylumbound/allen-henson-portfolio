/*
 * PRODUCT DETAIL PAGE
 * Individual product page with full details and purchase option
 */

import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ShoppingCart, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import ImageGallery from "@/components/ImageGallery";
import { getProductImages } from "@/data/productImages";

// Full static product data for fallback
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
  "sword-bordeaux-v2": {
    id: 9,
    slug: "sword-bordeaux-v2",
    name: "The Sword of Bordeaux v2of3 [2 SoB001-035]",
    description: "(Model shot in Bordeaux, France February 2019 during Exile.)\n\nIlford gelatin Silver fiber print",
    price: 375000,
    priceMax: 475000,
    image: "/images/sales/sword-bordeaux-v2.jpg",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order\n\nI love antique stores, this one in an alley in Bordeaux happened to have an array of old swords in the front.",
  },
  "raffaella-tresor": {
    id: 10,
    slug: "raffaella-tresor",
    name: "Raffaella Trésor - Un Incrocio a Milano [RTit001-015]",
    description: "Milan, Italy\n\nLimited edition print.",
    price: 150000,
    priceMax: 240000,
    image: "/images/sales/raffaella-tresor.jpg",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "sacrilege-toulouse": {
    id: 11,
    slug: "sacrilege-toulouse",
    name: "Sacrilège à Toulouse - Mannequin in Toulouse II [SATII001-055]",
    description: "Toulouse, France\n\nLimited edition print from the Mannequin series.",
    price: 555000,
    priceMax: 770000,
    image: "/images/sales/sacrilege-toulouse.jpg",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "mi-trevi": {
    id: 12,
    slug: "mi-trevi",
    name: "Mi Trevi! - Mannequin in Roma II [MTII001-015]",
    description: "Rome, Italy\n\nLimited edition print from the Mannequin in Roma series.",
    price: 190000,
    priceMax: 350000,
    image: "/images/sales/mi-trevi.jpg",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "sword-bordeaux-v1": {
    id: 13,
    slug: "sword-bordeaux-v1",
    name: "The Sword of Bordeaux v1of3 [SoB001-035]",
    description: "(Model shot in Bordeaux, France February 2019 during Exile.)\n\nIlford gelatin Silver fiber print",
    price: 450000,
    priceMax: 650000,
    image: "/images/sales/sword-bordeaux-v1.jpg",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "sarina-thai": {
    id: 14,
    slug: "sarina-thai",
    name: "Sarina Thai in Grand Central 2015 [STG001-045]",
    description: "New York City\n\nLimited edition print shot in Grand Central Station.",
    price: 595000,
    priceMax: 900000,
    image: "/images/sales/sarina-thai.jpg",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "entourage-pantheon-vii": {
    id: 15,
    slug: "entourage-pantheon-vii",
    name: "Entourage al Pantheon VII [EAPII001-150] + Verisart Cert",
    description: "Rome, Italy\n\nLimited edition print with Verisart Certificate of Authenticity.",
    price: 500000,
    priceMax: null,
    image: "/images/sales/entourage-pantheon-vii.png",
    category: "print",
    status: "available",
    details: "Includes Verisart Certificate of Authenticity\n\nLimited edition of 150",
  },
  "entourage-pantheon": {
    id: 16,
    slug: "entourage-pantheon",
    name: "Entourage al Pantheon [EAP001-150] + Verisart Cert",
    description: "Rome, Italy\n\nLimited edition print with Verisart Certificate of Authenticity.",
    price: 500000,
    priceMax: null,
    image: "/images/sales/entourage-pantheon.png",
    category: "print",
    status: "available",
    details: "Includes Verisart Certificate of Authenticity\n\nLimited edition of 150",
  },
  "tour-eiffel-paris": {
    id: 17,
    slug: "tour-eiffel-paris",
    name: "Tour Eiffel - Paris [TEII001-015]",
    description: "Paris, France\n\nLimited edition print.",
    price: 245000,
    priceMax: 275000,
    image: "/images/sales/tour-eiffel-paris.jpg",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "sunbathers-miami": {
    id: 18,
    slug: "sunbathers-miami",
    name: "Sunbathers in Miami Beach - 2014",
    description: "Miami Beach, Florida\n\nLimited edition print.",
    price: 270000,
    priceMax: null,
    image: "/images/sales/sunbathers-miami.jpg",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "editorial-silver-gelatin": {
    id: 19,
    slug: "editorial-silver-gelatin",
    name: "Editorial on the Run (Silver Gelatin FRAMED) - [OTR001-015L]",
    description: "Silver Gelatin print, professionally framed.\n\nFrom the Editorial on the Run series.",
    price: 520000,
    priceMax: null,
    image: "/images/sales/editorial-silver-gelatin.jpg",
    category: "print",
    status: "available",
    details: "Silver Gelatin fiber print\n\nProfessionally framed\n\nLimited edition of 15",
  },
  "leaving-mondrian": {
    id: 20,
    slug: "leaving-mondrian",
    name: "Leaving the Mondrian - Miami Beach",
    description: "Miami Beach, Florida\n\nLimited edition print.",
    price: 1399999,
    priceMax: null,
    image: "/images/sales/leaving-mondrian.jpg",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "girl-smoking-coral": {
    id: 21,
    slug: "girl-smoking-coral",
    name: "Girl smoking on Coral II - Miami [GSC001-020]",
    description: "Miami, Florida\n\nLimited edition print.",
    price: 970000,
    priceMax: null,
    image: "/images/sales/girl-smoking-coral.jpg",
    category: "print",
    status: "available",
    details: "Limited edition of 20\n\nSigned and numbered",
  },
  "journal-44": {
    id: 22,
    slug: "journal-44",
    name: "Journal # 44 [The EXILE Journal] - Allen Henson",
    description: "The EXILE Journal - A personal documentation of the exile period.",
    price: 1500000,
    priceMax: null,
    image: "/images/sales/journal-44.jpg",
    category: "book",
    status: "sold_out",
    details: "SOLD OUT\n\nOriginal handwritten journal from the Exile period.",
  },
  "zines": {
    id: 23,
    slug: "zines",
    name: "The Zines, LASCIVIOUS + PARAPHILIA",
    description: "Two zine collection featuring LASCIVIOUS and PARAPHILIA.",
    price: 9500,
    priceMax: null,
    image: "/images/sales/zines.jpg",
    category: "book",
    status: "sold_out",
    details: "SOLD OUT\n\nTwo-zine set",
  },
  "agency-fees": {
    id: 24,
    slug: "agency-fees",
    name: "AGENCY FEE'S 07JUNE2021",
    description: "Limited edition print.",
    price: 860000,
    priceMax: null,
    image: "/images/sales/agency-fees.jpg",
    category: "print",
    status: "sold_out",
    details: "SOLD OUT",
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
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const { data: dbProduct, isLoading } = trpc.products.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const checkoutMutation = trpc.checkout.createSession.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    },
    onError: (error) => {
      setIsCheckingOut(false);
      toast.error(error.message || "Failed to start checkout. Please try again.");
    },
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Use database product if available, otherwise fallback to static
  const product = dbProduct || (slug ? staticProducts[slug] : null);
  
  const handleCheckout = () => {
    if (!slug) return;
    setIsCheckingOut(true);
    checkoutMutation.mutate({ productSlug: slug });
  };

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

  const isSoldOut = product.status === "sold_out";

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
            {/* Product Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <ImageGallery
                images={getProductImages(product.slug, product.image || "/images/placeholder.jpg")}
                alt={product.name}
              />
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
                {isSoldOut ? (
                  <div className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-foreground/20 text-foreground/50 font-medium tracking-cinematic text-sm cursor-not-allowed">
                    SOLD OUT
                  </div>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gold text-background font-medium tracking-cinematic text-sm hover:bg-gold/90 cinematic-transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        BUY NOW
                      </>
                    )}
                  </button>
                )}
                
                <p className="text-xs text-center text-foreground/50">
                  Secure checkout powered by Stripe
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
