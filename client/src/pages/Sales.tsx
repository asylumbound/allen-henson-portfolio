/*
 * SALES PAGE
 * Product listing page matching cinematic noir UX/UI
 * Full 81-product catalog from editorialontherun.com
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbSchema } from "@/components/StructuredData";
import { assetUrl } from "@/lib/assets";

// Full 81-product catalog
const staticProducts = [
  // Page 1 Products (1-24)
  { id: 1, slug: "abscond-box-set", name: "[IN PRODUCTION] LIMITED RUN - ABSCOND BOX SET Vol I-VI", price: 60000, priceMax: null, image: assetUrl("/images/sales/abscond-boxset-realistic-1.webp"), status: "in_production" },
  { id: 2, slug: "abscond-series", name: "[PRESALE] ABSCOND - THE SERIES", price: 51000, priceMax: null, image: assetUrl("/images/sales/abscond-series.webp"), status: "presale" },
  { id: 3, slug: "abscond-vol1-france", name: "[PRESALE] ABSCOND - VOL I - FRANCE (I of VI)", price: 5000, priceMax: null, image: assetUrl("/images/sales/abscond-vol1-france.webp"), status: "presale" },
  { id: 4, slug: "editorial-on-the-run", name: "Editorial on the Run", price: 5000, priceMax: null, image: assetUrl("/images/sales/editorial-on-the-run.webp"), status: "available" },
  { id: 5, slug: "editorial-on-the-rocks", name: "Editorial on the Rocks", price: 5000, priceMax: null, image: assetUrl("/images/sales/editorial-on-the-rocks.webp"), status: "available" },
  { id: 6, slug: "tour-de-eiffel", name: "Tour de Eiffel + Mannequin Ingrat [MI001-045]", price: 269000, priceMax: 555000, image: assetUrl("/images/sales/tour-de-eiffel.webp"), status: "available" },
  { id: 7, slug: "il-pantheon", name: "Il Pantheon a Mezzanotte - [PAN001-015]", price: 500000, priceMax: null, image: assetUrl("/images/sales/il-pantheon.webp"), status: "available" },
  { id: 8, slug: "sarah-in-london", name: "Sarah in London [SL-001-050]", price: 110000, priceMax: null, image: assetUrl("/images/sales/sarah-in-london.webp"), status: "available" },
  { id: 9, slug: "sword-bordeaux-v2", name: "The Sword of Bordeaux v2of3 [2 SoB001-035]", price: 375000, priceMax: 475000, image: assetUrl("/images/sales/sword-bordeaux-v2.webp"), status: "available" },
  { id: 10, slug: "raffaella-tresor", name: "Raffaella Trésor - Un Incrocio a Milano [RTit001-015]", price: 150000, priceMax: 240000, image: assetUrl("/images/sales/raffaella-tresor.webp"), status: "available" },
  { id: 11, slug: "sacrilege-toulouse", name: "Sacrilège à Toulouse - Mannequin in Toulouse II [SATII001-055]", price: 555000, priceMax: 770000, image: assetUrl("/images/sales/sacrilege-toulouse.webp"), status: "available" },
  { id: 12, slug: "mi-trevi", name: "Mi Trevi! - Mannequin in Roma II [MTII001-015]", price: 190000, priceMax: 350000, image: assetUrl("/images/sales/mi-trevi.webp"), status: "available" },
  { id: 13, slug: "sword-bordeaux-v1", name: "The Sword of Bordeaux v1of3 [SoB001-035]", price: 450000, priceMax: 650000, image: assetUrl("/images/sales/sword-bordeaux-v1.webp"), status: "available" },
  { id: 14, slug: "sarina-thai", name: "Sarina Thai in Grand Central 2015 [STG001-045]", price: 595000, priceMax: 900000, image: assetUrl("/images/sales/sarina-thai.webp"), status: "available" },
  { id: 15, slug: "entourage-pantheon-vii", name: "Entourage al Pantheon VII [EAPII001-150] + Verisart Cert", price: 500000, priceMax: null, image: assetUrl("/images/sales/entourage-pantheon-vii.webp"), status: "available" },
  { id: 16, slug: "entourage-pantheon", name: "Entourage al Pantheon [EAP001-150] + Verisart Cert", price: 500000, priceMax: null, image: assetUrl("/images/sales/entourage-pantheon.webp"), status: "available" },
  { id: 17, slug: "agency-fees", name: "AGENCY FEE'S 07JUNE2021", price: 860000, priceMax: null, image: assetUrl("/images/sales/agency-fees.webp"), status: "sold_out" },
  { id: 18, slug: "tour-eiffel-paris", name: "Tour Eiffel - Paris [TEII001-015]", price: 245000, priceMax: 275000, image: assetUrl("/images/sales/tour-eiffel-paris.webp"), status: "available" },
  { id: 19, slug: "sunbathers-miami", name: "Sunbathers in Miami Beach - 2014", price: 270000, priceMax: null, image: assetUrl("/images/sales/sunbathers-miami.webp"), status: "available" },
  { id: 20, slug: "editorial-silver-gelatin", name: "Editorial on the Run (Silver Gelatin FRAMED) - [OTR001-015L]", price: 520000, priceMax: null, image: assetUrl("/images/sales/editorial-silver-gelatin.webp"), status: "available" },
  { id: 21, slug: "journal-44", name: "Journal # 44 [The EXILE Journal] - Allen Henson", price: 1500000, priceMax: null, image: assetUrl("/images/sales/journal-44.webp"), status: "sold_out" },
  { id: 22, slug: "zines", name: "The Zines, LASCIVIOUS + PARAPHILIA", price: 9500, priceMax: null, image: assetUrl("/images/sales/zines.webp"), status: "sold_out" },
  { id: 23, slug: "leaving-mondrian", name: "Leaving the Mondrian - Miami Beach", price: 1399999, priceMax: null, image: assetUrl("/images/sales/leaving-mondrian.webp"), status: "available" },
  { id: 24, slug: "girl-smoking-coral", name: "Girl smoking on Coral II - Miami [GSC001-020]", price: 970000, priceMax: null, image: assetUrl("/images/sales/girl-smoking-coral.webp"), status: "available" },
  
  // Page 2 Products (25-48)
  { id: 25, slug: "odlh-set", name: "ODLH SET", price: 0, priceMax: null, image: assetUrl("/images/sales/odlh_set.webp"), status: "sold_out" },
  { id: 26, slug: "anna-oakley-silver-gelatin", name: "Anna Oakley (Silver Gelatin) - [AO001-015L]", price: 1290000, priceMax: null, image: assetUrl("/images/sales/anna-oakley-silver-gelatin.webp"), status: "available" },
  { id: 27, slug: "corset-en-metal", name: "Corset en Métal [CEMII001-015]", price: 1510000, priceMax: null, image: assetUrl("/images/sales/Corset_en_Metal.webp"), status: "available" },
  { id: 28, slug: "rudy-reyes-24x36", name: "Rudy Reyes 24\"X36\"", price: 655000, priceMax: 710000, image: assetUrl("/images/sales/rudy-reyes-24x36.webp"), status: "available" },
  { id: 29, slug: "rudy-reyes-ii", name: "Rudy Reyes II", price: 120000, priceMax: 530000, image: assetUrl("/images/sales/Rudy_Reyes_II.webp"), status: "available" },
  { id: 30, slug: "girl-coal-ny", name: "Girl + Coal NY 2015 [GC001-015]", price: 530000, priceMax: 770000, image: assetUrl("/images/sales/Girl_Coal_NY_2015_GC001_015.webp"), status: "available" },
  { id: 31, slug: "foro-romano", name: "Foro Romano - Rome Italy [LP07]", price: 310000, priceMax: 495000, image: assetUrl("/images/sales/Foro_Romano_Rome_Italy_LP07.webp"), status: "available" },
  { id: 32, slug: "journal-22", name: "Journal # 22 - Allen Henson", price: 800000, priceMax: null, image: assetUrl("/images/sales/journal-22-allen-henson.webp"), status: "sold_out" },
  { id: 33, slug: "anna-lisa-sequoia", name: "Anna Lisa in Sequoiadendron Giganteum", price: 410000, priceMax: 670000, image: assetUrl("/images/sales/anna_lisa_in_sequoiadendron_giganteum.webp"), status: "available" },
  { id: 34, slug: "what-we-left-paris", name: "What we left in Paris [LIP001-015]", price: 1550000, priceMax: 1700000, image: assetUrl("/images/sales/what-we-left-in-paris.webp"), status: "available" },
  { id: 35, slug: "ipseity", name: "Ipseity - [IPS001-015]", price: 540000, priceMax: null, image: assetUrl("/images/sales/ipseity-ips001-015.webp"), status: "available" },
  { id: 36, slug: "mouvement-paris", name: "Mouvement Paris [MV001-015]", price: 610000, priceMax: 940000, image: assetUrl("/images/sales/Mouvement_Paris_MV001-015.webp"), status: "available" },
  { id: 37, slug: "burlesque-ny-2015", name: "Burlesque - New York 2015", price: 780000, priceMax: null, image: assetUrl("/images/sales/burlesque-new-york-2015.webp"), status: "available" },
  { id: 38, slug: "walk-to-cafe-paris", name: "a walk to the Cafe - Paris June [CAFE001-015]", price: 995000, priceMax: 1355000, image: assetUrl("/images/sales/a_walk_to_the_Cafe_-_Paris_June_[CAFE001-015].webp"), status: "available" },
  { id: 39, slug: "helene-traasavik-i", name: "Helene Traasavik I - Los Angeles [HTI001-015]", price: 350000, priceMax: null, image: assetUrl("/images/sales/helene-traasavik-i-los-angeles.webp"), status: "available" },
  { id: 40, slug: "gun-rights-la", name: "¿Gun Rights? - Los Angeles [GRL001-015]", price: 1299000, priceMax: null, image: assetUrl("/images/sales/Gun_Rights_Los_Angeles_2012.webp"), status: "available" },
  { id: 41, slug: "odeon-herodes-atticus", name: "The Odeon of Herodes Atticus - Mannequin [HA001-015]", price: 1515000, priceMax: 1650000, image: assetUrl("/images/sales/The_Odeon_of_Herodes_Atticus_Mannequin.webp"), status: "available" },
  { id: 42, slug: "mi-trevi-skye-roma", name: "Mi Trevi! - Skye in Roma [MT001-015]", price: 1175000, priceMax: 1525000, image: assetUrl("/images/sales/mi-trevi-skye-in-roma-mt001-015.webp"), status: "available" },
  { id: 43, slug: "girl-on-coral", name: "Girl on Coral [GCM001-015]", price: 1770000, priceMax: 2245000, image: assetUrl("/images/sales/girl-on-coral.webp"), status: "available" },
  { id: 44, slug: "ryan-hunter-miami", name: "Ryan Hunter - Miami - Venetian", price: 1170000, priceMax: null, image: assetUrl("/images/sales/ryan-hunter-miami-venetian-2014.webp"), status: "available" },
  { id: 45, slug: "sarina-flatiron", name: "Sarina Flatiron Building - NYC [SFB001-015]", price: 1290000, priceMax: null, image: assetUrl("/images/sales/Sarian_Flatiron_Building_NYC_2015.webp"), status: "available" },
  { id: 46, slug: "mannequin-mast-barcelona", name: "Mannequin on the Mast en Barcelona [SB10]", price: 700000, priceMax: 820000, image: assetUrl("/images/sales/Mannequin_on_the_Mast_en_Barcelona_SB10.webp"), status: "available" },
  { id: 47, slug: "colosseum-rome", name: "Colosseum - Rome [C99]", price: 235000, priceMax: null, image: assetUrl("/images/sales/Colosseum_Rome_C99.webp"), status: "available" },
  { id: 48, slug: "room-102-access", name: "ROOM 102 ACCESS (DISCONTINUED)", price: 25000, priceMax: null, image: assetUrl("/images/sales/room_102_access.webp"), status: "available" },
  
  // Page 3 Products (49-72)
  { id: 49, slug: "sacrilege-toulouse-skye", name: "Sacrilège à Toulouse - Skye in Toulouse [SAT001-015]", price: 2250000, priceMax: 2350000, image: assetUrl("/images/sales/Sacrilege_a_Toulouse_Skye_in_Toulouse_SAT001_015.webp"), status: "available" },
  { id: 50, slug: "emily-shephard-bisjoux", name: "Emily Shephard in BISJOUX II [ESBi001-015]", price: 1140000, priceMax: null, image: assetUrl("/images/sales/Emily-Shephard-in-BISJOUX-II-ESBi001-015.webp"), status: "available" },
  { id: 51, slug: "good-morning-paris", name: "Tour de Eiffel + Mannequin Ingrat [2MI001-045] (Good Morning Paris!)", price: 2250000, priceMax: null, image: assetUrl("/images/sales/skye-eiffel-tower-good-morning-paris.webp"), status: "available" },
  { id: 52, slug: "editorial-bundle", name: "Editorial on the Run + Editorial on the Rocks", price: 9000, priceMax: null, image: assetUrl("/images/sales/editorial_on_the_run_and_editorial_on_the_rocks.webp"), status: "available" },
  { id: 53, slug: "journal-23", name: "Journal # 23 - Allen Henson", price: 900000, priceMax: null, image: assetUrl("/images/sales/Journal_23_Allen_Henson.webp"), status: "sold_out" },
  { id: 54, slug: "karyna-studio-ny", name: "Karyna - Studio N.Y. [KAS001-015]", price: 630000, priceMax: null, image: assetUrl("/images/sales/Karyna-Studio-NY-KAS001-015.webp"), status: "available" },
  { id: 55, slug: "bespoke-camera-handles", name: "Bespoke Wooden Camera Handles by Allen Henson", price: 35000, priceMax: null, image: assetUrl("/images/sales/bespoke-wooden-camera-handles-by-allen-henson.webp"), status: "sold_out" },
  { id: 56, slug: "karyna-on-dock", name: "Karyna on Dock - [KKD001-015]", price: 1270000, priceMax: null, image: assetUrl("/images/sales/Karyna_on_Dock.webp"), status: "available" },
  { id: 57, slug: "kara-gibson-la-ii", name: "Kara Gibson - A.H. Studio L.A. II 2012", price: 1300000, priceMax: null, image: assetUrl("/images/sales/Kara_Gibson_AH_Studio_LA_II_2012.webp"), status: "available" },
  { id: 58, slug: "leia-contois-la", name: "Leia Contois - Los Angeles [LCL001-015]", price: 1250000, priceMax: null, image: assetUrl("/images/sales/leia-contois-los-angeles-2012.webp"), status: "available" },
  { id: 59, slug: "pantheon-roma-2015", name: "Pantheon - Roma 2015", price: 140000, priceMax: null, image: assetUrl("/images/sales/Pantheon-Roma-2015.webp"), status: "sold_out" },
  { id: 60, slug: "arc-de-triomphe", name: "Arc de Triomphe - Paris", price: 170000, priceMax: null, image: assetUrl("/images/sales/arc-de-triomphe-paris.webp"), status: "available" },
  { id: 61, slug: "portrait-girl-ny", name: "A Portrait of a Girl - NY [PX001-015]", price: 500000, priceMax: null, image: assetUrl("/images/sales/a-portrait-of-a-girl-ny-px001-015.webp"), status: "available" },
  { id: 62, slug: "london-big-ben", name: "London - Big Ben [L001-015]", price: 250000, priceMax: null, image: assetUrl("/images/sales/london-big-ben-l001-015.webp"), status: "available" },
  { id: 63, slug: "cate-underwood-manhattan", name: "Cate Underwood - Manhattan 2014", price: 390000, priceMax: null, image: assetUrl("/images/sales/cate-underwood-manhattan-2014.webp"), status: "available" },
  { id: 64, slug: "tika-camaj-miami", name: "Tika Camaj - Miami - Venetian 2014", price: 150000, priceMax: null, image: assetUrl("/images/sales/Tika_Camaj_Miami_Venetian_2014.webp"), status: "sold_out" },
  { id: 65, slug: "data-licensing", name: "Data Licensing", price: 0, priceMax: null, image: assetUrl("/images/sales/Data_Licensing.webp"), status: "available" },
  { id: 66, slug: "gianluca-di-sotto", name: "Gianluca di Sotto - NYC / L.E.S", price: 350000, priceMax: null, image: assetUrl("/images/sales/gianluca_di_sotto_nyc_les_2014.webp"), status: "available" },
  { id: 67, slug: "karyna-brooklyn", name: "Karyna - Brooklyn 2015", price: 130000, priceMax: null, image: assetUrl("/images/sales/Karyna-Brooklyn-2015.webp"), status: "sold_out" },
  { id: 68, slug: "sara-balint-fidi", name: "Sara Balint - FiDi NYC", price: 520000, priceMax: null, image: assetUrl("/images/sales/sara-balint-fidi-nyc-2014.webp"), status: "available" },
  { id: 69, slug: "another-4am-miami", name: "Another 4 a.m. shoot - Miami Beach 2014", price: 70000, priceMax: null, image: assetUrl("/images/sales/another-4-am-shoot-miami-beach-2014.webp"), status: "sold_out" },
  { id: 70, slug: "karyna-union-league-ii", name: "Karyna - Union League Club II - 2015", price: 220000, priceMax: null, image: assetUrl("/images/sales/Karyna-Union-League-Club-II-2015.webp"), status: "available" },
  { id: 71, slug: "karyna-union-league", name: "Karyna - Union League Club", price: 270000, priceMax: null, image: assetUrl("/images/sales/karyna_union_league_club.webp"), status: "available" },
  { id: 72, slug: "karyna-grand-central", name: "Karyna - Grand Central Station", price: 290000, priceMax: null, image: assetUrl("/images/sales/Karyna-Grand-Central-Station.webp"), status: "available" },
  
  // Page 4 Products (73-81)
  { id: 73, slug: "kat-miami-beach", name: "Kat - Miami Beach 2014", price: 150000, priceMax: null, image: assetUrl("/images/sales/kat-miami-beach-2014.webp"), status: "available" },
  { id: 74, slug: "shelby-carter-empire-state", name: "Shelby Carter / Elizabeth Marxs - Empire State Building 2013 [1of5]", price: 270000, priceMax: null, image: assetUrl("/images/sales/Shelby-Carter-Elizabeth-Marxs-Empire-State-Building-2013-1of5.webp"), status: "available" },
  { id: 75, slug: "helene-traasavik-ii", name: "Helene Traasavik II - Los Angeles 2013", price: 170000, priceMax: null, image: assetUrl("/images/sales/helene-traasavik-ii-los-angeles-2013.webp"), status: "available" },
  { id: 76, slug: "burlesque-ii-ny", name: "Burlesque II - New York 2015", price: 300000, priceMax: null, image: assetUrl("/images/sales/burlesque-ii-new-york-2015.webp"), status: "available" },
  { id: 77, slug: "laundry-day-la", name: "Laundry Day - Los Angeles 2012", price: 95000, priceMax: null, image: assetUrl("/images/sales/laundry-day-los-angeles-2012.webp"), status: "sold_out" },
  { id: 78, slug: "victorious-venetian", name: "Victorious on Venetian Rooftop 2014 Miami Beach", price: 150500, priceMax: null, image: assetUrl("/images/sales/victorious-on-venetian-rooftop-2014-miami-beach.webp"), status: "available" },
  { id: 79, slug: "karyna-soho-nyc", name: "Karyna in SoHo NYC 2014", price: 65000, priceMax: null, image: assetUrl("/images/sales/Karyna_in_SoHo_NYC_2014.webp"), status: "sold_out" },
  { id: 80, slug: "batch-a113", name: "BATCH A113 pt1of2", price: 200000, priceMax: null, image: assetUrl("/images/sales/batch-a113-pt1of2.webp"), status: "available" },
  { id: 81, slug: "paon-au-greystone", name: "Paon au Greystone [PAG001-015]", price: 500000, priceMax: null, image: assetUrl("/images/sales/paon-au-greystone-pag001-015.webp"), status: "available" },
];

const PRODUCTS_PER_PAGE = 24;

function formatPrice(cents: number): string {
  if (cents === 0) return "Contact for pricing";
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
      return (
        <span className="inline-block px-2 py-1 text-xs tracking-cinematic bg-gold/20 text-gold border border-gold/30">
          PRESALE
        </span>
      );
    case "in_production":
      return (
        <span className="inline-block px-2 py-1 text-xs tracking-cinematic bg-gold/20 text-gold border border-gold/30">
          IN PRODUCTION
        </span>
      );
    case "sold_out":
      return (
        <span className="inline-block px-2 py-1 text-xs tracking-cinematic bg-gold/20 text-gold border border-gold/30">
          SOLD OUT
        </span>
      );
    default:
      return null;
  }
}

export default function Sales() {
  const [location, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Parse page from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get("page") || "1", 10);
    if (page >= 1 && page <= Math.ceil(staticProducts.length / PRODUCTS_PER_PAGE)) {
      setCurrentPage(page);
    }
  }, [location]);
  
  const totalPages = Math.ceil(staticProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = staticProducts.slice(startIndex, endIndex);
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setLocation(page === 1 ? "/sales" : `/sales?page=${page}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <SEOHead
        title="Shop | Fine Art Prints & Books"
        description="Limited edition fine art prints, signed photography books, and exclusive collections by Allen Henson. Each piece is a fragment of a larger story. 81 pieces available including the ABSCOND series and Editorial on the Run."
        image={assetUrl("/images/sales/abscond-boxset-realistic-1.webp")}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.allenhenson.com/" },
          { name: "Shop", url: "https://www.allenhenson.com/shop" },
        ]}
      />
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-28 md:py-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={assetUrl("/images/L1009868.jpg")}
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
            <p className="meta-text text-gold uppercase mb-4">
              PRINTS & BOOKS
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] mb-6">
              The Collection
            </h1>
            <div className="w-16 h-px bg-gold mx-auto mb-6" />
            <p className="max-w-2xl mx-auto text-base md:text-lg font-normal leading-relaxed text-foreground/80">
              Limited edition prints, signed books, and exclusive collections. 
              Each piece is a fragment of a larger story.
            </p>
            <p className="mt-4 text-sm text-gold/70">
              {staticProducts.length} pieces available
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {currentProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.03 }}
              >
                <Link href={`/sales/${product.slug}`}>
                  <div className="group cursor-pointer">
                    {/* Product Image - uses object-contain to show full image without cropping */}
                    <div className="relative overflow-hidden aspect-[3/4] mb-4 bg-secondary/20">
                      <img
                        src={product.image || assetUrl("/images/placeholder.webp")}
                        srcSet={product.image?.includes('.webp') ? `${product.image.replace('.webp', '-400.webp')} 400w, ${product.image.replace('.webp', '-800.webp')} 800w, ${product.image} 1200w` : undefined}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        alt={product.name}
                        className="w-full h-full object-contain image-hover"
                        loading="lazy"
                      />
                      
                      {/* Status badge overlay */}
                      {product.status && product.status !== "available" && (
                        <div className="absolute top-4 left-4">
                          {getStatusBadge(product.status)}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <h3 className="text-sm md:text-base font-normal leading-tight group-hover:text-gold cinematic-transition line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-gold font-normal">
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-16">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 nav-text border border-foreground/30 hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed cinematic-transition"
              >
                <ChevronLeft className="w-4 h-4" />
                PREV
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 nav-text border cinematic-transition ${
                      currentPage === page
                        ? "bg-gold text-background border-gold"
                        : "border-foreground/30 hover:border-gold hover:text-gold"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 nav-text border border-foreground/30 hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed cinematic-transition"
              >
                NEXT
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Page indicator */}
          <p className="text-center text-sm text-foreground/50 mt-6">
            Showing {startIndex + 1}-{Math.min(endIndex, staticProducts.length)} of {staticProducts.length} pieces
          </p>
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
            <p className="meta-text text-gold uppercase mb-4">
              INQUIRIES & PURCHASES
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] mb-6">
              Ready to Acquire a Piece?
            </h2>
            <p className="max-w-xl mx-auto text-base font-normal leading-relaxed text-foreground/80 mb-8">
              For purchases, custom orders, specific sizes, or commissioned work, 
              please contact me directly.
            </p>
            <a
              href="mailto:allen@allenhenson.com?subject=Purchase Inquiry"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-background font-semibold tracking-[0.02em] text-base hover:bg-gold/90 cinematic-transition"
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
            <p className="meta-text text-gold uppercase mb-4">
              COMMISSIONS
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] mb-6">
              Custom Orders & Commissions
            </h2>
            <p className="max-w-xl mx-auto text-base font-normal leading-relaxed text-foreground/80 mb-8">
              Looking for a specific size, custom framing, or a commissioned piece? 
              Get in touch to discuss your vision.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 border border-foreground/30 text-foreground font-normal tracking-cinematic text-sm hover:border-gold hover:text-gold cinematic-transition"
            >
              CONTACT
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
      </div>
    </>
  );
}
