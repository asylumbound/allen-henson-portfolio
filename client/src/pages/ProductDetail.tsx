/**
 * PRODUCT DETAIL PAGE
 * Individual product page with full details and purchase option
 * Includes variant selection dropdown for products with multiple sizes
 */

import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ShoppingCart, Loader2, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import ImageGallery from "@/components/ImageGallery";
import { getProductImages } from "@/data/productImages";
import { hasVariants, getVariants, ProductVariant } from "@shared/productVariants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    image: "/images/sales/editorial-on-the-run.webp",
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
    image: "/images/sales/editorial-on-the-rocks.webp",
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
    image: "/images/sales/abscond-boxset-realistic-1.webp",
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
    image: "/images/sales/abscond-series.webp",
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
    image: "/images/sales/abscond-vol1-france.webp",
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
    image: "/images/sales/tour-de-eiffel.webp",
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
    image: "/images/sales/il-pantheon.webp",
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
    image: "/images/sales/sarah-in-london.webp",
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
    image: "/images/sales/sword-bordeaux-v2.webp",
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
    image: "/images/sales/raffaella-tresor.webp",
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
    image: "/images/sales/sacrilege-toulouse.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "mi-trevi": {
    id: 12,
    slug: "mi-trevi",
    name: "Mi Trevi! - Mannequin in Roma II [MTII001-015]",
    description: "Rome, Italy - Trevi Fountain\n\nLimited edition print.",
    price: 190000,
    priceMax: 350000,
    image: "/images/sales/mi-trevi.webp",
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
    image: "/images/sales/sword-bordeaux-v1.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "sarina-thai": {
    id: 14,
    slug: "sarina-thai",
    name: "Sarina Thai in Grand Central 2015 [STG001-045]",
    description: "Grand Central Station, New York City\n\nLimited edition print.",
    price: 595000,
    priceMax: 900000,
    image: "/images/sales/sarina-thai.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "entourage-pantheon-vii": {
    id: 15,
    slug: "entourage-pantheon-vii",
    name: "Entourage al Pantheon VII [EAPII001-150] + Verisart Cert",
    description: "Rome, Italy\n\nLimited edition print with Verisart Certificate.",
    price: 500000,
    priceMax: null,
    image: "/images/sales/entourage-pantheon-vii.webp",
    category: "print",
    status: "available",
    details: "Limited edition of 150\n\nIncludes Verisart Certificate of Authenticity",
  },
  "entourage-pantheon": {
    id: 16,
    slug: "entourage-pantheon",
    name: "Entourage al Pantheon [EAP001-150] + Verisart Cert",
    description: "Rome, Italy\n\nLimited edition print with Verisart Certificate.",
    price: 500000,
    priceMax: null,
    image: "/images/sales/entourage-pantheon.webp",
    category: "print",
    status: "available",
    details: "Limited edition of 150\n\nIncludes Verisart Certificate of Authenticity",
  },
  "agency-fees": {
    id: 17,
    slug: "agency-fees",
    name: "AGENCY FEE'S 07JUNE2021",
    description: "Limited edition print.",
    price: 860000,
    priceMax: null,
    image: "/images/sales/agency-fees.webp",
    category: "print",
    status: "sold_out",
    details: "SOLD OUT",
  },
  "tour-eiffel-paris": {
    id: 18,
    slug: "tour-eiffel-paris",
    name: "Tour Eiffel - Paris [TEII001-015]",
    description: "Paris, France\n\nLimited edition print.",
    price: 245000,
    priceMax: 275000,
    image: "/images/sales/tour-eiffel-paris.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "sunbathers-miami": {
    id: 19,
    slug: "sunbathers-miami",
    name: "Sunbathers in Miami Beach - 2014",
    description: "Miami Beach, Florida\n\nLimited edition print.",
    price: 270000,
    priceMax: null,
    image: "/images/sales/sunbathers-miami.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "editorial-silver-gelatin": {
    id: 20,
    slug: "editorial-silver-gelatin",
    name: "Editorial on the Run (Silver Gelatin FRAMED) - [OTR001-015L]",
    description: "Silver Gelatin fiber print, framed.",
    price: 520000,
    priceMax: null,
    image: "/images/sales/editorial-silver-gelatin.webp",
    category: "print",
    status: "available",
    details: "Ilford Silver Gelatin fiber print\n\nFramed and ready to hang",
  },
  "journal-44": {
    id: 21,
    slug: "journal-44",
    name: "Journal # 44 [The EXILE Journal] - Allen Henson",
    description: "Personal journal documentation from the Exile period.",
    price: 1500000,
    priceMax: null,
    image: "/images/sales/journal-44.webp",
    category: "book",
    status: "sold_out",
    details: "SOLD OUT\n\nOriginal handwritten journal.",
  },
  "zines": {
    id: 22,
    slug: "zines",
    name: "The Zines, LASCIVIOUS + PARAPHILIA",
    description: "Two-zine set featuring LASCIVIOUS and PARAPHILIA.",
    price: 9500,
    priceMax: null,
    image: "/images/sales/zines.webp",
    category: "book",
    status: "sold_out",
    details: "SOLD OUT",
  },
  "leaving-mondrian": {
    id: 23,
    slug: "leaving-mondrian",
    name: "Leaving the Mondrian - Miami Beach",
    description: "Miami Beach, Florida\n\nLimited edition print.",
    price: 1399999,
    priceMax: null,
    image: "/images/sales/leaving-mondrian.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "girl-smoking-coral": {
    id: 24,
    slug: "girl-smoking-coral",
    name: "Girl smoking on Coral II - Miami [GSC001-020]",
    description: "Miami, Florida\n\nLimited edition print.",
    price: 970000,
    priceMax: null,
    image: "/images/sales/girl-smoking-coral.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  // Page 2 Products (25-48)
  "odlh-set": {
    id: 25,
    slug: "odlh-set",
    name: "ODLH SET",
    description: "Limited edition set.",
    price: 0,
    priceMax: null,
    image: "/images/sales/odlh_set.webp",
    category: "print",
    status: "sold_out",
    details: "SOLD OUT\n\nContact for pricing on similar works.",
  },
  "anna-oakley-silver-gelatin": {
    id: 26,
    slug: "anna-oakley-silver-gelatin",
    name: "Anna Oakley (Silver Gelatin) - [AO001-015L]",
    description: "Silver Gelatin fiber print.",
    price: 1290000,
    priceMax: null,
    image: "/images/sales/anna-oakley-silver-gelatin.webp",
    category: "print",
    status: "available",
    details: "Ilford Silver Gelatin fiber print\n\nLimited edition of 15",
  },
  "corset-en-metal": {
    id: 27,
    slug: "corset-en-metal",
    name: "Corset en Métal [CEMII001-015]",
    description: "Limited edition print from the Corset series.",
    price: 1510000,
    priceMax: null,
    image: "/images/sales/Corset_en_Metal.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "rudy-reyes-24x36": {
    id: 28,
    slug: "rudy-reyes-24x36",
    name: "Rudy Reyes 24\"X36\"",
    description: "Portrait of Rudy Reyes.\n\nLimited edition print.",
    price: 655000,
    priceMax: 710000,
    image: "/images/sales/rudy-reyes-24x36.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "rudy-reyes-ii": {
    id: 29,
    slug: "rudy-reyes-ii",
    name: "Rudy Reyes II",
    description: "Portrait of Rudy Reyes.\n\nLimited edition print.",
    price: 120000,
    priceMax: 530000,
    image: "/images/sales/Rudy_Reyes_II.webp",
    category: "print",
    status: "available",
    details: "Multiple sizes available\n\nCustom sizes by special order",
  },
  "girl-coal-ny": {
    id: 30,
    slug: "girl-coal-ny",
    name: "Girl + Coal NY 2015 [GC001-015]",
    description: "New York City, 2015\n\nLimited edition print.",
    price: 530000,
    priceMax: 770000,
    image: "/images/sales/Girl_Coal_NY_2015_GC001_015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "foro-romano": {
    id: 31,
    slug: "foro-romano",
    name: "Foro Romano - Rome Italy [LP07]",
    description: "Rome, Italy\n\nLimited edition print from the Roman Forum.",
    price: 310000,
    priceMax: 495000,
    image: "/images/sales/Foro_Romano_Rome_Italy_LP07.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "journal-22": {
    id: 32,
    slug: "journal-22",
    name: "Journal # 22 - Allen Henson",
    description: "Personal journal documentation.",
    price: 800000,
    priceMax: null,
    image: "/images/sales/journal-22-allen-henson.webp",
    category: "book",
    status: "sold_out",
    details: "SOLD OUT\n\nOriginal handwritten journal.",
  },
  "anna-lisa-sequoia": {
    id: 33,
    slug: "anna-lisa-sequoia",
    name: "Anna Lisa in Sequoiadendron Giganteum",
    description: "Shot among the giant sequoias.\n\nLimited edition print.",
    price: 410000,
    priceMax: 670000,
    image: "/images/sales/anna_lisa_in_sequoiadendron_giganteum.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "what-we-left-paris": {
    id: 34,
    slug: "what-we-left-paris",
    name: "What we left in Paris [LIP001-015]",
    description: "Paris, France\n\nLimited edition print.",
    price: 1550000,
    priceMax: 1700000,
    image: "/images/sales/what-we-left-in-paris.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "ipseity": {
    id: 35,
    slug: "ipseity",
    name: "Ipseity - [IPS001-015]",
    description: "Limited edition print.",
    price: 540000,
    priceMax: null,
    image: "/images/sales/ipseity-ips001-015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "mouvement-paris": {
    id: 36,
    slug: "mouvement-paris",
    name: "Mouvement Paris [MV001-015]",
    description: "Paris, France\n\nLimited edition print capturing movement.",
    price: 610000,
    priceMax: 940000,
    image: "/images/sales/Mouvement_Paris_MV001-015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "burlesque-ny-2015": {
    id: 37,
    slug: "burlesque-ny-2015",
    name: "Burlesque - New York 2015",
    description: "New York City, 2015\n\nLimited edition print from the Burlesque series.",
    price: 780000,
    priceMax: null,
    image: "/images/sales/burlesque-new-york-2015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "walk-to-cafe-paris": {
    id: 38,
    slug: "walk-to-cafe-paris",
    name: "a walk to the Cafe - Paris June [CAFE001-015]",
    description: "Paris, France\n\nLimited edition print.",
    price: 995000,
    priceMax: 1355000,
    image: "/images/sales/a_walk_to_the_Cafe_-_Paris_June_[CAFE001-015].webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "helene-traasavik-i": {
    id: 39,
    slug: "helene-traasavik-i",
    name: "Helene Traasavik I - Los Angeles [HTI001-015]",
    description: "Los Angeles\n\nLimited edition print.",
    price: 350000,
    priceMax: null,
    image: "/images/sales/helene-traasavik-i-los-angeles.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "gun-rights-la": {
    id: 40,
    slug: "gun-rights-la",
    name: "¿Gun Rights? - Los Angeles [GRL001-015]",
    description: "Los Angeles\n\nLimited edition print.",
    price: 1299000,
    priceMax: null,
    image: "/images/sales/Gun_Rights_Los_Angeles_2012.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "odeon-herodes-atticus": {
    id: 41,
    slug: "odeon-herodes-atticus",
    name: "The Odeon of Herodes Atticus - Mannequin [HA001-015]",
    description: "Athens, Greece\n\nLimited edition print from the Mannequin series.",
    price: 1515000,
    priceMax: 1650000,
    image: "/images/sales/The_Odeon_of_Herodes_Atticus_Mannequin.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "mi-trevi-skye-roma": {
    id: 42,
    slug: "mi-trevi-skye-roma",
    name: "Mi Trevi! - Skye in Roma [MT001-015]",
    description: "Rome, Italy - Trevi Fountain\n\nLimited edition print.",
    price: 1175000,
    priceMax: 1525000,
    image: "/images/sales/mi-trevi-skye-in-roma-mt001-015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "girl-on-coral": {
    id: 43,
    slug: "girl-on-coral",
    name: "Girl on Coral [GCM001-015]",
    description: "Miami, Florida\n\nLimited edition print.",
    price: 1770000,
    priceMax: 2245000,
    image: "/images/sales/girl-on-coral.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "ryan-hunter-miami": {
    id: 44,
    slug: "ryan-hunter-miami",
    name: "Ryan Hunter - Miami - Venetian",
    description: "Miami Beach, Florida\n\nLimited edition print.",
    price: 1170000,
    priceMax: null,
    image: "/images/sales/ryan-hunter-miami-venetian-2014.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "sarina-flatiron": {
    id: 45,
    slug: "sarina-flatiron",
    name: "Sarina Flatiron Building - NYC [SFB001-015]",
    description: "New York City - Flatiron Building\n\nLimited edition print.",
    price: 1290000,
    priceMax: null,
    image: "/images/sales/Sarian_Flatiron_Building_NYC_2015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "mannequin-mast-barcelona": {
    id: 46,
    slug: "mannequin-mast-barcelona",
    name: "Mannequin on the Mast en Barcelona [SB10]",
    description: "Barcelona, Spain\n\nLimited edition print from the Mannequin series.",
    price: 700000,
    priceMax: 820000,
    image: "/images/sales/Mannequin_on_the_Mast_en_Barcelona_SB10.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "colosseum-rome": {
    id: 47,
    slug: "colosseum-rome",
    name: "Colosseum - Rome [C99]",
    description: "Rome, Italy\n\nLimited edition print.",
    price: 235000,
    priceMax: null,
    image: "/images/sales/Colosseum_Rome_C99.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "room-102-access": {
    id: 48,
    slug: "room-102-access",
    name: "ROOM 102 ACCESS (DISCONTINUED)",
    description: "Discontinued access pass.",
    price: 25000,
    priceMax: null,
    image: "/images/sales/room_102_access.webp",
    category: "access",
    status: "available",
    details: "Digital access pass",
  },
  // Page 3 Products (49-72)
  "sacrilege-toulouse-skye": {
    id: 49,
    slug: "sacrilege-toulouse-skye",
    name: "Sacrilège à Toulouse - Skye in Toulouse [SAT001-015]",
    description: "Toulouse, France\n\nLimited edition print.",
    price: 2250000,
    priceMax: 2350000,
    image: "/images/sales/Sacrilege_a_Toulouse_Skye_in_Toulouse_SAT001_015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "emily-shephard-bisjoux": {
    id: 50,
    slug: "emily-shephard-bisjoux",
    name: "Emily Shephard in BISJOUX II [ESBi001-015]",
    description: "BISJOUX series\n\nLimited edition print.",
    price: 1140000,
    priceMax: null,
    image: "/images/sales/Emily-Shephard-in-BISJOUX-II-ESBi001-015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "good-morning-paris": {
    id: 51,
    slug: "good-morning-paris",
    name: "Tour de Eiffel + Mannequin Ingrat [2MI001-045] (Good Morning Paris!)",
    description: "Paris, France\n\nLimited edition print from the Mannequin Ingrat series.",
    price: 2250000,
    priceMax: null,
    image: "/images/sales/skye-eiffel-tower-good-morning-paris.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "editorial-bundle": {
    id: 52,
    slug: "editorial-bundle",
    name: "Editorial on the Run + Editorial on the Rocks",
    description: "Bundle of both Editorial books.",
    price: 9000,
    priceMax: null,
    image: "/images/sales/editorial_on_the_run_and_editorial_on_the_rocks.webp",
    category: "book",
    status: "available",
    details: "Two-book bundle\n\nSave $10 when purchasing together",
  },
  "journal-23": {
    id: 53,
    slug: "journal-23",
    name: "Journal # 23 - Allen Henson",
    description: "Personal journal documentation.",
    price: 900000,
    priceMax: null,
    image: "/images/sales/Journal_23_Allen_Henson.webp",
    category: "book",
    status: "sold_out",
    details: "SOLD OUT\n\nOriginal handwritten journal.",
  },
  "karyna-studio-ny": {
    id: 54,
    slug: "karyna-studio-ny",
    name: "Karyna - Studio N.Y. [KAS001-015]",
    description: "New York City\n\nLimited edition print.",
    price: 630000,
    priceMax: null,
    image: "/images/sales/Karyna-Studio-NY-KAS001-015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "bespoke-camera-handles": {
    id: 55,
    slug: "bespoke-camera-handles",
    name: "Bespoke Wooden Camera Handles by Allen Henson",
    description: "Handcrafted wooden camera handles.",
    price: 35000,
    priceMax: null,
    image: "/images/sales/bespoke-wooden-camera-handles-by-allen-henson.webp",
    category: "accessory",
    status: "sold_out",
    details: "SOLD OUT\n\nHandmade wooden camera handles.",
  },
  "karyna-on-dock": {
    id: 56,
    slug: "karyna-on-dock",
    name: "Karyna on Dock - [KKD001-015]",
    description: "Limited edition print.",
    price: 1270000,
    priceMax: null,
    image: "/images/sales/Karyna_on_Dock.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "kara-gibson-la-ii": {
    id: 57,
    slug: "kara-gibson-la-ii",
    name: "Kara Gibson - A.H. Studio L.A. II 2012",
    description: "Los Angeles, 2012\n\nLimited edition print.",
    price: 1300000,
    priceMax: null,
    image: "/images/sales/Kara_Gibson_AH_Studio_LA_II_2012.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "leia-contois-la": {
    id: 58,
    slug: "leia-contois-la",
    name: "Leia Contois - Los Angeles [LCL001-015]",
    description: "Los Angeles\n\nLimited edition print.",
    price: 1250000,
    priceMax: null,
    image: "/images/sales/leia-contois-los-angeles-2012.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "pantheon-roma-2015": {
    id: 59,
    slug: "pantheon-roma-2015",
    name: "Pantheon - Roma 2015",
    description: "Rome, Italy\n\nLimited edition print of the Pantheon.",
    price: 140000,
    priceMax: null,
    image: "/images/sales/Pantheon-Roma-2015.webp",
    category: "print",
    status: "sold_out",
    details: "SOLD OUT",
  },
  "arc-de-triomphe": {
    id: 60,
    slug: "arc-de-triomphe",
    name: "Arc de Triomphe - Paris",
    description: "Paris, France\n\nLimited edition print.",
    price: 170000,
    priceMax: null,
    image: "/images/sales/arc-de-triomphe-paris.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "portrait-girl-ny": {
    id: 61,
    slug: "portrait-girl-ny",
    name: "A Portrait of a Girl - NY [PX001-015]",
    description: "New York\n\nLimited edition portrait print.",
    price: 500000,
    priceMax: null,
    image: "/images/sales/a-portrait-of-a-girl-ny-px001-015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "london-big-ben": {
    id: 62,
    slug: "london-big-ben",
    name: "London - Big Ben [L001-015]",
    description: "London, UK\n\nLimited edition print.",
    price: 250000,
    priceMax: null,
    image: "/images/sales/london-big-ben-l001-015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "cate-underwood-manhattan": {
    id: 63,
    slug: "cate-underwood-manhattan",
    name: "Cate Underwood - Manhattan 2014",
    description: "Manhattan, New York\n\nLimited edition print.",
    price: 390000,
    priceMax: null,
    image: "/images/sales/cate-underwood-manhattan-2014.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "tika-camaj-miami": {
    id: 64,
    slug: "tika-camaj-miami",
    name: "Tika Camaj - Miami - Venetian 2014",
    description: "Miami Beach, Florida\n\nLimited edition print.",
    price: 150000,
    priceMax: null,
    image: "/images/sales/Tika_Camaj_Miami_Venetian_2014.webp",
    category: "print",
    status: "sold_out",
    details: "SOLD OUT",
  },
  "data-licensing": {
    id: 65,
    slug: "data-licensing",
    name: "Data Licensing",
    description: "License data for commercial use.",
    price: 0,
    priceMax: null,
    image: "/images/sales/Data_Licensing.webp",
    category: "license",
    status: "available",
    details: "Contact for pricing and licensing terms.",
  },
  "gianluca-di-sotto": {
    id: 66,
    slug: "gianluca-di-sotto",
    name: "Gianluca di Sotto - NYC / L.E.S",
    description: "New York City, Lower East Side\n\nLimited edition print.",
    price: 350000,
    priceMax: null,
    image: "/images/sales/gianluca_di_sotto_nyc_les_2014.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "karyna-brooklyn": {
    id: 67,
    slug: "karyna-brooklyn",
    name: "Karyna - Brooklyn 2015",
    description: "Brooklyn, New York\n\nLimited edition print.",
    price: 130000,
    priceMax: null,
    image: "/images/sales/Karyna-Brooklyn-2015.webp",
    category: "print",
    status: "sold_out",
    details: "SOLD OUT",
  },
  "sara-balint-fidi": {
    id: 68,
    slug: "sara-balint-fidi",
    name: "Sara Balint - FiDi NYC",
    description: "Financial District, New York City\n\nLimited edition print.",
    price: 520000,
    priceMax: null,
    image: "/images/sales/sara-balint-fidi-nyc-2014.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "another-4am-miami": {
    id: 69,
    slug: "another-4am-miami",
    name: "Another 4 a.m. shoot - Miami Beach 2014",
    description: "Miami Beach, Florida\n\nLimited edition print.",
    price: 70000,
    priceMax: null,
    image: "/images/sales/another-4-am-shoot-miami-beach-2014.webp",
    category: "print",
    status: "sold_out",
    details: "SOLD OUT",
  },
  "karyna-union-league-ii": {
    id: 70,
    slug: "karyna-union-league-ii",
    name: "Karyna - Union League Club II - 2015",
    description: "New York City\n\nLimited edition print.",
    price: 220000,
    priceMax: null,
    image: "/images/sales/Karyna-Union-League-Club-II-2015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "karyna-union-league": {
    id: 71,
    slug: "karyna-union-league",
    name: "Karyna - Union League Club",
    description: "New York City\n\nLimited edition print.",
    price: 270000,
    priceMax: null,
    image: "/images/sales/karyna_union_league_club.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "karyna-grand-central": {
    id: 72,
    slug: "karyna-grand-central",
    name: "Karyna - Grand Central Station",
    description: "Grand Central Station, New York City\n\nLimited edition print.",
    price: 290000,
    priceMax: null,
    image: "/images/sales/Karyna-Grand-Central-Station.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  // Page 4 Products (73-81)
  "kat-miami-beach": {
    id: 73,
    slug: "kat-miami-beach",
    name: "Kat - Miami Beach 2014",
    description: "Miami Beach, Florida\n\nLimited edition print.",
    price: 150000,
    priceMax: null,
    image: "/images/sales/kat-miami-beach-2014.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "shelby-carter-empire-state": {
    id: 74,
    slug: "shelby-carter-empire-state",
    name: "Shelby Carter / Elizabeth Marxs - Empire State Building 2013 [1of5]",
    description: "Empire State Building, New York City\n\nLimited edition print.",
    price: 270000,
    priceMax: null,
    image: "/images/sales/Shelby-Carter-Elizabeth-Marxs-Empire-State-Building-2013-1of5.webp",
    category: "print",
    status: "available",
    details: "Edition 1 of 5\n\nSigned and numbered",
  },
  "helene-traasavik-ii": {
    id: 75,
    slug: "helene-traasavik-ii",
    name: "Helene Traasavik II - Los Angeles 2013",
    description: "Los Angeles, 2013\n\nLimited edition print.",
    price: 170000,
    priceMax: null,
    image: "/images/sales/helene-traasavik-ii-los-angeles-2013.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "burlesque-ii-ny": {
    id: 76,
    slug: "burlesque-ii-ny",
    name: "Burlesque II - New York 2015",
    description: "New York City, 2015\n\nLimited edition print from the Burlesque series.",
    price: 300000,
    priceMax: null,
    image: "/images/sales/burlesque-ii-new-york-2015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "laundry-day-la": {
    id: 77,
    slug: "laundry-day-la",
    name: "Laundry Day - Los Angeles 2012",
    description: "Los Angeles, 2012\n\nLimited edition print.",
    price: 95000,
    priceMax: null,
    image: "/images/sales/laundry-day-los-angeles-2012.webp",
    category: "print",
    status: "sold_out",
    details: "SOLD OUT",
  },
  "victorious-venetian": {
    id: 78,
    slug: "victorious-venetian",
    name: "Victorious on Venetian Rooftop 2014 Miami Beach",
    description: "Miami Beach, Florida\n\nLimited edition print.",
    price: 150500,
    priceMax: null,
    image: "/images/sales/victorious-on-venetian-rooftop-2014-miami-beach.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "karyna-soho-nyc": {
    id: 79,
    slug: "karyna-soho-nyc",
    name: "Karyna in SoHo NYC 2014",
    description: "SoHo, New York City\n\nLimited edition print.",
    price: 65000,
    priceMax: null,
    image: "/images/sales/Karyna_in_SoHo_NYC_2014.webp",
    category: "print",
    status: "sold_out",
    details: "SOLD OUT",
  },
  "batch-a113": {
    id: 80,
    slug: "batch-a113",
    name: "BATCH A113 pt1of2",
    description: "Limited edition print.\n\nPart 1 of 2.",
    price: 200000,
    priceMax: null,
    image: "/images/sales/batch-a113-pt1of2.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
  },
  "paon-au-greystone": {
    id: 81,
    slug: "paon-au-greystone",
    name: "Paon au Greystone [PAG001-015]",
    description: "Limited edition print.",
    price: 500000,
    priceMax: null,
    image: "/images/sales/paon-au-greystone-pag001-015.webp",
    category: "print",
    status: "available",
    details: "24\"X36\" & 11\"X17\" options available\n\nCustom sizes by special order",
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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  
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
  
  // Get variants for this product
  const variants = slug ? getVariants(slug) : null;
  const productHasVariants = slug ? hasVariants(slug) : false;
  
  // Initialize selected variant when product loads
  useEffect(() => {
    if (productHasVariants && variants && variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(variants[0].id);
    }
  }, [productHasVariants, variants, selectedVariantId]);
  
  // Get the current price based on selected variant
  const currentPrice = useMemo(() => {
    if (productHasVariants && variants && selectedVariantId) {
      const variant = variants.find(v => v.id === selectedVariantId);
      return variant?.price || product?.price || 0;
    }
    return product?.price || 0;
  }, [productHasVariants, variants, selectedVariantId, product]);
  
  const handleCheckout = () => {
    if (!slug) return;
    setIsCheckingOut(true);
    checkoutMutation.mutate({ 
      productSlug: slug,
      variantId: selectedVariantId || undefined,
    });
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
                images={getProductImages(product.slug, product.image || "/images/placeholder.webp")}
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

              {/* Price - shows current variant price or range */}
              <div className="mb-6">
                <p className="text-2xl md:text-3xl text-gold font-light">
                  {formatPrice(currentPrice)}
                </p>
                {productHasVariants && variants && (
                  <p className="text-sm text-foreground/50 mt-1">
                    {variants.length} size options available
                  </p>
                )}
              </div>

              <div className="w-12 h-px bg-gold mb-6" />

              {/* Variant Selector */}
              {productHasVariants && variants && variants.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-light tracking-cinematic text-foreground/60 mb-2">
                    SELECT SIZE
                  </label>
                  <Select
                    value={selectedVariantId || variants[0].id}
                    onValueChange={setSelectedVariantId}
                  >
                    <SelectTrigger className="w-full bg-background border-foreground/20 text-foreground">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-foreground/20">
                      {variants.map((variant) => (
                        <SelectItem
                          key={variant.id}
                          value={variant.id}
                          className="text-foreground hover:bg-foreground/10"
                        >
                          {variant.name} - {formatPrice(variant.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
