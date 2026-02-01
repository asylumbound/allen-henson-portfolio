/*
 * SALES PAGE
 * Product listing page matching cinematic noir UX/UI
 * Based on editorialontherun.com structure
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Mail } from "lucide-react";

// Full product catalog
const staticProducts = [
  // Books & Box Sets
  {
    id: 1,
    slug: "abscond-box-set",
    name: "[IN PRODUCTION] LIMITED RUN - ABSCOND BOX SET Vol I-VI",
    price: 60000,
    priceMax: null,
    image: "/images/sales/abscond-box-set.jpg",
    category: "boxset",
    status: "in_production",
  },
  {
    id: 2,
    slug: "abscond-series",
    name: "[PRESALE] ABSCOND - THE SERIES",
    price: 51000,
    priceMax: null,
    image: "/images/sales/abscond-series.png",
    category: "book",
    status: "presale",
  },
  {
    id: 3,
    slug: "abscond-vol1-france",
    name: "[PRESALE] ABSCOND - VOL I - FRANCE (I of VI)",
    price: 5000,
    priceMax: null,
    image: "/images/sales/abscond-vol1-france.png",
    category: "book",
    status: "presale",
  },
  {
    id: 4,
    slug: "editorial-on-the-run",
    name: "Editorial on the Run",
    price: 5000,
    priceMax: null,
    image: "/images/sales/editorial-on-the-run.png",
    category: "book",
    status: "available",
  },
  {
    id: 5,
    slug: "editorial-on-the-rocks",
    name: "Editorial on the Rocks",
    price: 5000,
    priceMax: null,
    image: "/images/sales/editorial-on-the-rocks.png",
    category: "book",
    status: "available",
  },
  // Limited Edition Prints
  {
    id: 6,
    slug: "tour-de-eiffel",
    name: "Tour de Eiffel + Mannequin Ingrat [MI001-045]",
    price: 269000,
    priceMax: 555000,
    image: "/images/sales/tour-de-eiffel.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 7,
    slug: "il-pantheon",
    name: "Il Pantheon a Mezzanotte - [PAN001-015]",
    price: 500000,
    priceMax: null,
    image: "/images/sales/il-pantheon.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 8,
    slug: "sarah-in-london",
    name: "Sarah in London [SL-001-050]",
    price: 110000,
    priceMax: null,
    image: "/images/sales/sarah-in-london.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 9,
    slug: "sword-bordeaux-v2",
    name: "The Sword of Bordeaux v2of3 [2 SoB001-035]",
    price: 375000,
    priceMax: 475000,
    image: "/images/sales/sword-bordeaux-v2.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 10,
    slug: "raffaella-tresor",
    name: "Raffaella Trésor - Un Incrocio a Milano [RTit001-015]",
    price: 150000,
    priceMax: 240000,
    image: "/images/sales/raffaella-tresor.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 11,
    slug: "sacrilege-toulouse",
    name: "Sacrilège à Toulouse - Mannequin in Toulouse II [SATII001-055]",
    price: 555000,
    priceMax: 770000,
    image: "/images/sales/sacrilege-toulouse.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 12,
    slug: "mi-trevi",
    name: "Mi Trevi! - Mannequin in Roma II [MTII001-015]",
    price: 190000,
    priceMax: 350000,
    image: "/images/sales/mi-trevi.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 13,
    slug: "sword-bordeaux-v1",
    name: "The Sword of Bordeaux v1of3 [SoB001-035]",
    price: 450000,
    priceMax: 650000,
    image: "/images/sales/sword-bordeaux-v1.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 14,
    slug: "sarina-thai",
    name: "Sarina Thai in Grand Central 2015 [STG001-045]",
    price: 595000,
    priceMax: 900000,
    image: "/images/sales/sarina-thai.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 15,
    slug: "entourage-pantheon-vii",
    name: "Entourage al Pantheon VII [EAPII001-150] + Verisart Cert",
    price: 500000,
    priceMax: null,
    image: "/images/sales/entourage-pantheon-vii.png",
    category: "print",
    status: "available",
  },
  {
    id: 16,
    slug: "entourage-pantheon",
    name: "Entourage al Pantheon [EAP001-150] + Verisart Cert",
    price: 500000,
    priceMax: null,
    image: "/images/sales/entourage-pantheon.png",
    category: "print",
    status: "available",
  },
  {
    id: 17,
    slug: "tour-eiffel-paris",
    name: "Tour Eiffel - Paris [TEII001-015]",
    price: 245000,
    priceMax: 275000,
    image: "/images/sales/tour-eiffel-paris.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 18,
    slug: "sunbathers-miami",
    name: "Sunbathers in Miami Beach - 2014",
    price: 270000,
    priceMax: null,
    image: "/images/sales/sunbathers-miami.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 19,
    slug: "editorial-silver-gelatin",
    name: "Editorial on the Run (Silver Gelatin FRAMED) - [OTR001-015L]",
    price: 520000,
    priceMax: null,
    image: "/images/sales/editorial-silver-gelatin.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 20,
    slug: "leaving-mondrian",
    name: "Leaving the Mondrian - Miami Beach",
    price: 1399999,
    priceMax: null,
    image: "/images/sales/leaving-mondrian.jpg",
    category: "print",
    status: "available",
  },
  {
    id: 21,
    slug: "girl-smoking-coral",
    name: "Girl smoking on Coral II - Miami [GSC001-020]",
    price: 970000,
    priceMax: null,
    image: "/images/sales/girl-smoking-coral.jpg",
    category: "print",
    status: "available",
  },
  // Sold Out Items
  {
    id: 22,
    slug: "journal-44",
    name: "Journal # 44 [The EXILE Journal] - Allen Henson",
    price: 1500000,
    priceMax: null,
    image: "/images/sales/journal-44.jpg",
    category: "book",
    status: "sold_out",
  },
  {
    id: 23,
    slug: "zines",
    name: "The Zines, LASCIVIOUS + PARAPHILIA",
    price: 9500,
    priceMax: null,
    image: "/images/sales/zines.jpg",
    category: "book",
    status: "sold_out",
  },
  {
    id: 24,
    slug: "agency-fees",
    name: "AGENCY FEE'S 07JUNE2021",
    price: 860000,
    priceMax: null,
    image: "/images/sales/agency-fees.jpg",
    category: "print",
    status: "sold_out",
  },
];

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
      return <span className="text-xs tracking-cinematic text-gold">[PRESALE]</span>;
    case "in_production":
      return <span className="text-xs tracking-cinematic text-gold">[IN PRODUCTION]</span>;
    case "sold_out":
      return <span className="text-xs tracking-cinematic text-red-500">[SOLD OUT]</span>;
    default:
      return null;
  }
}

export default function Sales() {
  const { data: dbProducts, isLoading } = trpc.products.list.useQuery();
  
  // Use database products if available, otherwise fallback to static
  const products = dbProducts && dbProducts.length > 0 ? dbProducts : staticProducts;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/L1009868.jpg"
            alt="Sales hero"
            className="w-full h-full object-cover object-top opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/50" />
          <div className="absolute inset-0 vignette" />
        </div>

        <div className="relative z-10 container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
              PRINTS & BOOKS
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
              The Collection
            </h1>
            <div className="w-16 h-px bg-gold mx-auto mb-6" />
            <p className="max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed text-foreground/80">
              Limited edition prints, signed books, and exclusive collections. 
              Each piece is a fragment of a larger story.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-secondary/50 mb-4" />
                  <div className="h-4 bg-secondary/50 w-3/4 mb-2" />
                  <div className="h-4 bg-secondary/50 w-1/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.03 }}
                >
                  <Link href={`/sales/${product.slug}`}>
                    <div className="group cursor-pointer">
                      {/* Product Image */}
                      <div className="relative overflow-hidden aspect-[4/5] mb-4 bg-secondary/20">
                        <img
                          src={product.image || "/images/placeholder.jpg"}
                          alt={product.name}
                          className="w-full h-full object-cover object-top image-hover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 cinematic-transition" />
                        
                        {/* Status badge overlay */}
                        {product.status && product.status !== "available" && (
                          <div className="absolute top-4 left-4">
                            {getStatusBadge(product.status)}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2">
                        <h3 className="text-sm md:text-base font-light leading-tight group-hover:text-gold cinematic-transition line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-gold font-light">
                          {formatPrice(product.price)}
                          {product.priceMax && (
                            <span> - {formatPrice(product.priceMax)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
              INQUIRIES & PURCHASES
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
              Ready to Acquire a Piece?
            </h2>
            <p className="max-w-xl mx-auto text-base font-light leading-relaxed text-foreground/80 mb-8">
              For purchases, custom orders, specific sizes, or commissioned work, 
              please contact me directly.
            </p>
            <a
              href="mailto:allen@allenhenson.com?subject=Purchase Inquiry"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-background font-medium tracking-cinematic text-sm hover:bg-gold/90 cinematic-transition"
            >
              <Mail className="w-4 h-4" />
              CONTACT: allen@allenhenson.com
            </a>
          </motion.div>
        </div>
      </section>

      {/* Custom Orders */}
      <section className="py-16 md:py-24">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
              COMMISSIONS
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
              Custom Orders & Commissions
            </h2>
            <p className="max-w-xl mx-auto text-base font-light leading-relaxed text-foreground/80 mb-8">
              Looking for a specific size, custom framing, or a commissioned piece? 
              Get in touch to discuss your vision.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 border border-foreground/30 text-foreground font-light tracking-cinematic text-sm hover:border-gold hover:text-gold cinematic-transition"
            >
              CONTACT
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
