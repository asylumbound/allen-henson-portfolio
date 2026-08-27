/*
 * DESIGN: Cinematic Noir
 * - Masonry grid gallery layout
 * - Hover effects with vignette
 * - Lightbox for full-size viewing
 * - Cinematic transitions
 * - Images in exact order from allenhenson.nyc
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SEOHead } from "@/components/SEOHead";
import MasonryGrid from "@/components/MasonryGrid";
import { assetUrl } from "@/lib/assets";

// Images in exact order from allenhenson.nyc landing page
// Export for use in Edit page
export const photosImages: Array<{ src: string; webSrc?: string; alt: string }> = [
  { src: assetUrl("/images/XUQX2322-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/XUQX2322.webp", alt: "Portrait" },
  { src: assetUrl("/images/AH4_1923.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AH4_1923.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_AHP_1J3A1859-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_AHP_1J3A1859-2.webp", alt: "Portrait" },
  { src: assetUrl("/images/DSC02981.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/DSC02981.webp", alt: "Portrait" },
  { src: assetUrl("/images/BHL0538-Edit.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/BHL0538-Edit.webp", alt: "Editorial" },
  { src: assetUrl("/images/L1009868.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1009868.webp", alt: "Leica Series" },
  { src: assetUrl("/images/1J3A8159.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A8159.webp", alt: "Portrait" },
  { src: assetUrl("/images/Runway-Paris-5-Edit-1-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/Runway-Paris-5-Edit-1.webp", alt: "Runway Paris" },
  { src: assetUrl("/images/C6B5C345-2774-43F0-867B-DD454DC72278.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/portrait-c6b5c345.webp", alt: "Portrait" },
  { src: assetUrl("/images/IMG_7891.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/IMG_7891.webp", alt: "Mobile Shot" },
  { src: assetUrl("/images/OSCAR-056-Edit-scaled.jpeg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/OSCAR-056-Edit.webp", alt: "Oscar" },
  { src: assetUrl("/images/L1009242-2-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1009242-2.webp", alt: "Leica Series" },
  { src: assetUrl("/images/S-NAVONA_RETOUCH2_CHANEL-Tether_-427.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/S-NAVONA_RETOUCH2_CHANEL-Tether_-427.webp", alt: "Chanel Campaign" },
  { src: assetUrl("/images/IMG-9096.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/IMG-9096.webp", alt: "Mobile Shot" },
  { src: assetUrl("/images/Amelia13577-3-1.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/Amelia13577-3-1.webp", alt: "Amelia" },
  { src: assetUrl("/images/AHP_7343-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_7343-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_9599-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_9599-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-7473-Edit-Edit-Edit-Edit.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-7473-Edit-Edit-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_2268-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_2268.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_4510.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_4510.webp", alt: "Portrait" },
  { src: assetUrl("/images/IMG_4798.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/IMG_4798.webp", alt: "Mobile Shot" },
  { src: assetUrl("/images/AHP-2183-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-2183.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_5254-Edit-2-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_5254-Edit-2.webp", alt: "Portrait" },
  { src: assetUrl("/images/L1000431-2-1-scaled-1672734053-985339932-1672734053-537745903-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1000431-2-1-scaled.webp", alt: "Leica Series" },
  { src: assetUrl("/images/S-NAVONA-FINAL_RETOUCH_CHANEL-Tether_-207-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/S-NAVONA-FINAL_RETOUCH_CHANEL-Tether_-207.webp", alt: "Chanel Campaign" },
  { src: assetUrl("/images/AHP_2616-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_2616-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/WZVX7476-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/WZVX7476.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A2008.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A2008.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A1882-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A1882-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/FACE-II_0365-Recovered-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/FACE-II_0365-Recovered-Edit-Edit.webp", alt: "FACE Editorial" },
  { src: assetUrl("/images/FACE-II_0304-Edit-Edit-Edit-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/FACE-II_0304-Edit-Edit-Edit.webp", alt: "FACE Editorial" },
  { src: assetUrl("/images/AHP4049_SNAVONA_EDIT-Edit-2-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP4049_SNAVONA_EDIT-Edit-2.webp", alt: "Chanel Campaign" },
  { src: assetUrl("/images/TEYA3965-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/TEYA3965.webp", alt: "Portrait" },
  { src: assetUrl("/images/PEHP2975.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/PEHP2975.webp", alt: "Portrait" },
  { src: assetUrl("/images/exile18.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/exile18.webp", alt: "Exile" },
  { src: assetUrl("/images/AHP_9554-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_9554-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/NFEK4250.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/NFEK4250.webp", alt: "Portrait" },
  { src: assetUrl("/images/L1008180-1672734143-324447421-1672734143-1073894577-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1008180.webp", alt: "Leica Series" },
  { src: assetUrl("/images/MMFC0021-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/MMFC0021-Edit.webp", alt: "Fashion" },
  { src: assetUrl("/images/tinsel-tokyo-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/tinsel-tokyo-2.webp", alt: "Tokyo Series" },
  { src: assetUrl("/images/AHP-4478-Edit-2-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-4478-Edit-2.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_6446.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_6446.webp", alt: "Portrait" },
  { src: assetUrl("/images/tumblr_nmiwqc4XOy1qfua5to2_r1_1280.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/tumblr_nmiwqc4XOy1qfua5to2_r1_1280.webp", alt: "Archive" },
  { src: assetUrl("/images/AHP_8318-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_8318-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A2552-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A2552-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_7839-Edit-2.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_7839-Edit-2.webp", alt: "Portrait" },
  { src: assetUrl("/images/SYDX1234.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/SYDX1234.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_7529-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_7529-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-0019_v3-Edit-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-0019_v3-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-4165-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-4165.webp", alt: "Portrait" },
  { src: assetUrl("/images/IMG-5236.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/IMG-5236.webp", alt: "Mobile Shot" },
  { src: assetUrl("/images/L1001397-Edit-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1001397-Edit.webp", alt: "Leica Series" },
  { src: assetUrl("/images/916A8CBA-10D5-493A-B1AB-CA7BF7E1E108.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/portrait-916a8cba.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_4585.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_4585.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-7835-Edit-Edit-Edit.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-7835-Edit-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/MMFC0052.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/MMFC0052.webp", alt: "Fashion" },
  { src: assetUrl("/images/KDZC0674-2-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/KDZC0674-2.webp", alt: "Portrait" },
  { src: assetUrl("/images/LQFT2427-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/LQFT2427.webp", alt: "Portrait" },
  { src: assetUrl("/images/dip-AHP_2700-Edit-Edit-Edit-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/dip-AHP_2700-Edit-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/SNAVONA_RETOUCH_CHANEL-Tether_149h.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/SNAVONA_RETOUCH_CHANEL-Tether_149h.webp", alt: "Chanel Campaign" },
  { src: assetUrl("/images/L1009925-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1009925-2.webp", alt: "Leica Series" },
  { src: assetUrl("/images/AHP-5207-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-5207.webp", alt: "Portrait" },
  { src: assetUrl("/images/L1001573-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1001573.webp", alt: "Leica Series" },
  { src: assetUrl("/images/AHP-2999-Edit-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-2999-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A7610-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A7610.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-0030_v3.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-0030_v3.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_2616.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_2616.webp", alt: "Portrait" },
  { src: assetUrl("/images/DK21794-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/DK21794-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/L1009718.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1009718.webp", alt: "Leica Series" },
  { src: assetUrl("/images/L1001017-Edit-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1001017-Edit-2.webp", alt: "Leica Series" },
  { src: assetUrl("/images/AHP_7036.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_7036.webp", alt: "Portrait" },
  { src: assetUrl("/images/L1000994-3.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1000994-3.webp", alt: "Leica Series" },
  { src: assetUrl("/images/allen-polaroid23gg.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/allen-polaroid23gg.webp", alt: "Polaroid" },
  { src: assetUrl("/images/AHP-8930-v3-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-8930-v3.webp", alt: "Portrait" },
  { src: assetUrl("/images/1-2-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1-2.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-9837-Edit-Edit-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-9837-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A2481-Edit-Edit-Edit-Edit-1-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A2481-Edit-Edit-Edit-Edit-1.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_5636-Edit-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_5636-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_4141_SNAVONA_EDIT-Edit-Edit-2-Edit-2-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_4141_SNAVONA_EDIT-Edit-Edit-2-Edit-2.webp", alt: "Chanel Campaign" },
  { src: assetUrl("/images/1J3A7318-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A7318.webp", alt: "Portrait" },
  { src: assetUrl("/images/L1003772-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1003772.webp", alt: "Leica Series" },
  { src: assetUrl("/images/ADYS6337-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/ADYS6337.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-5555-Edit-2-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-5555-Edit-2.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_8087-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_8087-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/thisAHP_5638-Edit.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/thisAHP_5638-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_2230-Edit-copytxt-Edit-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_2230-Edit-copytxt-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/1075842E-5BB5-49D3-9345-D3996E9C31C9.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/portrait-1075842e.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A2488-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A2488.webp", alt: "Portrait" },
  { src: assetUrl("/images/9FFFC227-D85A-422C-911A-3FB05DABA108.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/portrait-9fffc227.webp", alt: "Portrait" },
  { src: assetUrl("/images/L1006923-Edit-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1006923-Edit.webp", alt: "Leica Series" },
  { src: assetUrl("/images/IMG-3808.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/IMG-3808.webp", alt: "Mobile Shot" },
  { src: assetUrl("/images/1J3A0778-Edit-Edit-Edit-2-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A0778-Edit-Edit-Edit-2-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_5964.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_5964.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_7389_retouch-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_7389_retouch-2.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_5555-Edit-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_5555-Edit-2.webp", alt: "Portrait" },
  { src: assetUrl("/images/BHL0550-Edit.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/BHL0550-Edit.webp", alt: "Editorial" },
  { src: assetUrl("/images/1J3A0083-Edit.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A0083-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A2144-1-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A2144-1.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-4983-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-4983.webp", alt: "Portrait" },
  { src: assetUrl("/images/L1008247-1.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1008247-1.webp", alt: "Leica Series" },
  { src: assetUrl("/images/1J3A9744-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A9744.webp", alt: "Portrait" },
  { src: assetUrl("/images/L1007570.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1007570.webp", alt: "Leica Series" },
  { src: assetUrl("/images/AHP_2838v4-Edit.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_2838v4-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A7537-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A7537.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A9166.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A9166.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_8568-Edit-3.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_8568-Edit-3.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A8138.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A8138.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A7318.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A7318.webp", alt: "Portrait" },
  { src: assetUrl("/images/43DE6F42-8BF7-44DB-A739-8F0614B762FF.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/portrait-43de6f42.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A3654-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A3654-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A3161-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A3161-2.webp", alt: "Portrait" },
  { src: assetUrl("/images/1E55A0DC-6817-4165-B0EC-A3982798EA60.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/portrait-1e55a0dc.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_8400-Edit-Editdiptec.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_8400-Edit-Editdiptec.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_6110-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_6110-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_5956.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_5956.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_5993.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_5993.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_6950-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_6950-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_6839-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_6839-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/L1008347-2-1672734159-1279272757-1672734159-2130326800-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1008347-2.webp", alt: "Leica Series" },
  { src: assetUrl("/images/AHP_7988.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_7988.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_8023-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_8023-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_9825-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_9825-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_9788.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_9788.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_8040-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_8040-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_8041.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_8041.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_9990-Edit11.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_9990-Edit11.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-0019_v3.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-0019_v3.webp", alt: "Portrait" },
  { src: assetUrl("/images/DSC_5651-Edit-Edit-Edit-Edit-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/DSC_5651-Edit-Edit-Edit-Edit-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_2395v3-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_2395v3-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A8154-1.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A8154-1.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_0188-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_0188-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP_4584-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP_4584-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/bastiano-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/bastiano-Edit.webp", alt: "Bastiano" },
  { src: assetUrl("/images/L1000840-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1000840-Edit.webp", alt: "Leica Series" },
  { src: assetUrl("/images/L1004380.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1004380.webp", alt: "Leica Series" },
  { src: assetUrl("/images/L1000863.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1000863.webp", alt: "Leica Series" },
  { src: assetUrl("/images/tumblr_o8y8r5DQ841qfua5to1_1280.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/tumblr_o8y8r5DQ841qfua5to1_1280.webp", alt: "Archive" },
  { src: assetUrl("/images/tinsel-tokyo-4.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/tinsel-tokyo-4.webp", alt: "Tokyo Series" },
  { src: assetUrl("/images/tinsel-tokyo-5.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/tinsel-tokyo-5.webp", alt: "Tokyo Series" },
  { src: assetUrl("/images/tinsel-tokyo-6.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/tinsel-tokyo-6.webp", alt: "Tokyo Series" },
  { src: assetUrl("/images/MMFC0015-Edit-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/MMFC0015-Edit-2.webp", alt: "Fashion" },
  { src: assetUrl("/images/L1001345.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/L1001345.webp", alt: "Leica Series" },
  { src: assetUrl("/images/1J3A9802-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A9802-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/27F7CADD-512B-4D10-BC76-E33F78118027.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/portrait-27f7cadd.webp", alt: "Portrait" },
  { src: assetUrl("/images/Adam24457-SCALED.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/Adam24457-SCALED.webp", alt: "Adam" },
  { src: assetUrl("/images/9A9993B0-0F2D-4C16-A6B5-616CA3549FD7.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/portrait-9a9993b0.webp", alt: "Portrait" },
  { src: assetUrl("/images/AH4_3850-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AH4_3850-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AH4_2091.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AH4_2091.webp", alt: "Portrait" },
  { src: assetUrl("/images/AH4_7313.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AH4_7313.webp", alt: "Portrait" },
  { src: assetUrl("/images/AH4_0068.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AH4_0068.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A6777.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A6777.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A7233.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A7233.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A6732-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A6732-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A0044-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A0044-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A0475-Edit-Edit-Edit-Edit-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A0475-Edit-Edit-Edit-Edit-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-Nils-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-Nils.webp", alt: "Nils" },
  { src: assetUrl("/images/AHP-2311-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-2311.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A9177.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A9177.webp", alt: "Portrait" },
  { src: assetUrl("/images/1J3A9072.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/1J3A9072.webp", alt: "Portrait" },
  { src: assetUrl("/images/BHL0875-Edit-Edit.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images/BHL0875-Edit-Edit.jpg", alt: "Editorial" },
  { src: assetUrl("/images/AHP-7377-Edit.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-7377-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-1210-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-1210.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-1186-Edit-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-1186-Edit.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-5351.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-5351.webp", alt: "Portrait" },
  { src: assetUrl("/images/33A07D00-4937-40B0-8BAA-F9EE3963E454-1.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/portrait-33a07d00.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-0019-v3-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-0019-v3.webp", alt: "Portrait" },
  { src: assetUrl("/images/AHP-0030-v3-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/AHP-0030-v3.webp", alt: "Portrait" },
  { src: assetUrl("/images/RJJA6030-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/RJJA6030.webp", alt: "Portrait" },
  { src: assetUrl("/images/IMG-E9888.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/IMG-E9888.webp", alt: "Mobile Shot" },
  { src: assetUrl("/images/RWTO0284-scaled.jpg"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/portfolio-images-web/RWTO0284.webp", alt: "Portrait" },
];

// Single source of truth for how the saved order maps onto the gallery.
// Used by this page AND the /edit CMS so both always show the same list.
export function applyPhotosOrder(order: string[] | null | undefined) {
  if (order) {
    const ordered = order
      .map((src) => {
        const known = photosImages.find(p => p.src === src);
        if (known) return known;
        // Absolute storage URL = image uploaded via the /edit CMS
        if (src.startsWith("http")) return { src, alt: "Photograph by Allen Henson" };
        return undefined; // stale local path — drop
      })
      .filter((p): p is typeof photosImages[0] => p !== undefined);
    const newImages = photosImages.filter(p => !order.includes(p.src));
    return [...ordered, ...newImages];
  }
  return photosImages;
}

export default function Photos() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Fetch saved order from database
  const { data: orderData } = trpc.gallery.getOrder.useQuery({ gallery: "photos" });
  
  // Compute ordered images based on saved order or default
  const orderedImages = useMemo(() => applyPhotosOrder(orderData?.order), [orderData]);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  
  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? orderedImages.length - 1 : selectedIndex - 1);
    }
  };
  
  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === orderedImages.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  return (
    <>
      <SEOHead
        title="Editorial Photography"
        description="Editorial and portrait photography by Allen Henson. Two decades of cinematic storytelling through fashion editorials, celebrity portraits, and campaign work for luxury brands including Chanel. Based in Los Angeles and New York."
        image={assetUrl("/images/XUQX2322-scaled.jpg")}
      />
      <div className="min-h-screen py-8 sm:py-12 md:py-20">
        <div className="container">
          {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <p className="meta-text text-gold uppercase mb-4">
            PORTFOLIO
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-4">
            Editorial
          </h1>
          <div className="w-16 h-px bg-gold mx-auto mb-6" />
          <p className="max-w-2xl mx-auto text-base font-normal leading-relaxed text-muted-foreground">
            Portraits, chaos, and calm. Moments stolen and moments staged. 
            The proof that I was there — and maybe, that I still am.
          </p>
        </motion.div>

        {/* Masonry Grid — row-major: order reads left-to-right, matching /edit */}
        <MasonryGrid
          items={orderedImages}
          columns={{ base: 1, sm: 2, lg: 3 }}
          renderItem={(image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: Math.min(index * 0.02, 1) }}
            >
              <div
                onClick={() => openLightbox(index)}
                className="relative overflow-hidden group cursor-pointer"
              >
                <img
                  src={image.webSrc || image.src}
                  alt={image.alt}
                  className="w-full h-auto image-hover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 cinematic-transition" />
                <div className="absolute inset-0 vignette opacity-0 group-hover:opacity-100 cinematic-transition" />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cinematic-transition">
                  <div className="w-12 h-12 border border-gold/50 flex items-center justify-center">
                    <div className="w-6 h-6 border border-gold" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        />

        {/* Lightbox */}
        <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white cinematic-transition z-10"
              aria-label="Close lightbox"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 md:left-8 p-2 text-white/70 hover:text-white cinematic-transition z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 md:right-8 p-2 text-white/70 hover:text-white cinematic-transition z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            {/* Image */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={orderedImages[selectedIndex].src}
                alt={orderedImages[selectedIndex].alt}
                className="max-w-full max-h-[90vh] object-contain"
              />
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 nav-text">
              {selectedIndex + 1} / {orderedImages.length}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
        </div>
      </div>
    </>
  );
}
