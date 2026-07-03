/**
 * Journal Page - The Journal
 * Design: Cinematic Noir - Film grain texture, dramatic light/shadow, gold accents
 * Personal/behind-the-scenes photos from Allen Henson's journey
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbSchema } from "@/components/StructuredData";
import { assetUrl } from "@/lib/assets";

// Journal images from allenhenson.nyc/about page
// Export for use in Edit page
export const journalImages: Array<{ src: string; webSrc: string }> = [
{ src: assetUrl("/images/journal/1.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/1.webp" },
{ src: assetUrl("/images/journal/145-DSC09523.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/145-DSC09523.webp" },
{ src: assetUrl("/images/journal/16-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/16-2.webp" },
{ src: assetUrl("/images/journal/16003268_10154921618180879_6250090260645126513_n.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/16003268_10154921618180879_6250090260645126513_n.webp" },
{ src: assetUrl("/images/journal/1649641668607069.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/1649641668607069.webp" },
{ src: assetUrl("/images/journal/1942590B-4ECE-4432-97A8-1B8316E28825.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-1942590b.webp" },
{ src: assetUrl("/images/journal/1J3A4168.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/1J3A4168.webp" },
{ src: assetUrl("/images/journal/3734F18A-DA68-40DF-BAF7-E99EBE05636B.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-3734f18a.webp" },
{ src: assetUrl("/images/journal/44444.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/44444.webp" },
{ src: assetUrl("/images/journal/452ADF1B-7C50-4824-A139-3C8D6A85C41D.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-452adf1b.webp" },
{ src: assetUrl("/images/journal/4CCFFB24-583D-45D2-8432-5C2C78D86CFC.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-4ccffb24.webp" },
{ src: assetUrl("/images/journal/5-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/5-2.webp" },
{ src: assetUrl("/images/journal/52-DSC09026.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/52-DSC09026.webp" },
{ src: assetUrl("/images/journal/55-DSC09039.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/55-DSC09039.webp" },
{ src: assetUrl("/images/journal/5BE9F85E-C507-4EA5-A104-CF52C1BAABA7.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-5be9f85e.webp" },
{ src: assetUrl("/images/journal/64049BDF-B3A2-4A20-8E54-BA7DAAAD570B.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-64049bdf.webp" },
{ src: assetUrl("/images/journal/69-DSC09086.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/69-DSC09086.webp" },
{ src: assetUrl("/images/journal/707E0DC4-222C-4B26-9755-7BE856E1B3B1.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-707e0dc4.webp" },
{ src: assetUrl("/images/journal/7F67FC20-82D1-498E-A61D-4FD418CD99B3.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-7f67fc20.webp" },
{ src: assetUrl("/images/journal/86160018.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/86160018.webp" },
{ src: assetUrl("/images/journal/8C3C569D-8976-49DD-862F-F53FC8819762.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-8c3c569d.webp" },
{ src: assetUrl("/images/journal/8DA05C57-911D-43D7-B3EA-5C08A4C933CE.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-8da05c57.webp" },
{ src: assetUrl("/images/journal/90AF0C6A-000A-481D-870D-38B2ECFF9B4E.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-90af0c6a.webp" },
{ src: assetUrl("/images/journal/9295AC1F-C044-4F01-8EE8-73FD616F3592.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-9295ac1f.webp" },
{ src: assetUrl("/images/journal/A91CF595-E000-4B59-9350-8427EE429B54.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-a91cf595.webp" },
{ src: assetUrl("/images/journal/AACE76FE-85F6-4C17-8D58-606E2DDAEE81.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-aace76fe.webp" },
{ src: assetUrl("/images/journal/BA2FB653-AC95-45C3-BB9E-D47232A39ECB.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-ba2fb653.webp" },
{ src: assetUrl("/images/journal/C0695EC9-AD80-4B75-A50F-F5581B708556.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-c0695ec9.webp" },
{ src: assetUrl("/images/journal/CE6C1822-E619-4842-9896-E1DD5C4AFAFD.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-ce6c1822.webp" },
{ src: assetUrl("/images/journal/CED20C5A-9F41-4E5A-A1DC-20C87656350C.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-ced20c5a.webp" },
{ src: assetUrl("/images/journal/DSCF1821.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/DSCF1821.webp" },
{ src: assetUrl("/images/journal/DSC_1458.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/DSC_1458.webp" },
{ src: assetUrl("/images/journal/DSC_1459-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/DSC_1459-Edit.webp" },
{ src: assetUrl("/images/journal/DSC_1490.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/DSC_1490.webp" },
{ src: assetUrl("/images/journal/E618C11A-688E-408E-87CA-641230C8C0A3.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-e618c11a.webp" },
{ src: assetUrl("/images/journal/EFFE891E-1364-4CA3-BD5A-F71FB96D7AB2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-effe891e.webp" },
{ src: assetUrl("/images/journal/F4D7277E-A940-4594-AA2F-39F1D16ADC56.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-f4d7277e.webp" },
{ src: assetUrl("/images/journal/F5E98C7A-CEFF-4B31-B04E-99E32E75C9D0.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/journal-f5e98c7a.webp" },
{ src: assetUrl("/images/journal/IMG_0141.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_0141.webp" },
{ src: assetUrl("/images/journal/IMG_0331.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_0331.webp" },
{ src: assetUrl("/images/journal/IMG_0491.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_0491.webp" },
{ src: assetUrl("/images/journal/IMG_0604.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_0604.webp" },
{ src: assetUrl("/images/journal/IMG_0727.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_0727.webp" },
{ src: assetUrl("/images/journal/IMG_0830.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_0830.webp" },
{ src: assetUrl("/images/journal/IMG_0834.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_0834.webp" },
{ src: assetUrl("/images/journal/IMG_0984.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_0984.webp" },
{ src: assetUrl("/images/journal/IMG_1151.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_1151.webp" },
{ src: assetUrl("/images/journal/IMG_1169.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_1169.webp" },
{ src: assetUrl("/images/journal/IMG_1288-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_1288-2.webp" },
{ src: assetUrl("/images/journal/IMG_1380.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_1380.webp" },
{ src: assetUrl("/images/journal/IMG_1599.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_1599.webp" },
{ src: assetUrl("/images/journal/IMG_1846.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_1846.webp" },
{ src: assetUrl("/images/journal/IMG_1881.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_1881.webp" },
{ src: assetUrl("/images/journal/IMG_1896.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_1896.webp" },
{ src: assetUrl("/images/journal/IMG_2252.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_2252.webp" },
{ src: assetUrl("/images/journal/IMG_2388.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_2388.webp" },
{ src: assetUrl("/images/journal/IMG_2445.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_2445.webp" },
{ src: assetUrl("/images/journal/IMG_2629.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_2629.webp" },
{ src: assetUrl("/images/journal/IMG_2944.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_2944.webp" },
{ src: assetUrl("/images/journal/IMG_3020.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_3020.webp" },
{ src: assetUrl("/images/journal/IMG_3045.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_3045.webp" },
{ src: assetUrl("/images/journal/IMG_3145.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_3145.webp" },
{ src: assetUrl("/images/journal/IMG_3149.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_3149.webp" },
{ src: assetUrl("/images/journal/IMG_3244.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_3244.webp" },
{ src: assetUrl("/images/journal/IMG_3432.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_3432.webp" },
{ src: assetUrl("/images/journal/IMG_3675.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_3675.webp" },
{ src: assetUrl("/images/journal/IMG_4120.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_4120.webp" },
{ src: assetUrl("/images/journal/IMG_4130.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_4130.webp" },
{ src: assetUrl("/images/journal/IMG_4493.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_4493.webp" },
{ src: assetUrl("/images/journal/IMG_5051-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_5051-2.webp" },
{ src: assetUrl("/images/journal/IMG_5051.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_5051.webp" },
{ src: assetUrl("/images/journal/IMG_5172-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_5172-2.webp" },
{ src: assetUrl("/images/journal/IMG_5220.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_5220.webp" },
{ src: assetUrl("/images/journal/IMG_5508.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_5508.webp" },
{ src: assetUrl("/images/journal/IMG_5601.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_5601.webp" },
{ src: assetUrl("/images/journal/IMG_5602-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_5602-2.webp" },
{ src: assetUrl("/images/journal/IMG_5680.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_5680.webp" },
{ src: assetUrl("/images/journal/IMG_5781.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_5781.webp" },
{ src: assetUrl("/images/journal/IMG_5899.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_5899.webp" },
{ src: assetUrl("/images/journal/IMG_6094.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6094.webp" },
{ src: assetUrl("/images/journal/IMG_6124.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6124.webp" },
{ src: assetUrl("/images/journal/IMG_6126.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6126.webp" },
{ src: assetUrl("/images/journal/IMG_6164.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6164.webp" },
{ src: assetUrl("/images/journal/IMG_6195.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6195.webp" },
{ src: assetUrl("/images/journal/IMG_6377.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6377.webp" },
{ src: assetUrl("/images/journal/IMG_6396.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6396.webp" },
{ src: assetUrl("/images/journal/IMG_6403.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6403.webp" },
{ src: assetUrl("/images/journal/IMG_6419.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6419.webp" },
{ src: assetUrl("/images/journal/IMG_6422.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6422.webp" },
{ src: assetUrl("/images/journal/IMG_6443.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6443.webp" },
{ src: assetUrl("/images/journal/IMG_6445.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6445.webp" },
{ src: assetUrl("/images/journal/IMG_6452.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6452.webp" },
{ src: assetUrl("/images/journal/IMG_6461.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6461.webp" },
{ src: assetUrl("/images/journal/IMG_6464.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6464.webp" },
{ src: assetUrl("/images/journal/IMG_6466.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6466.webp" },
{ src: assetUrl("/images/journal/IMG_6467.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6467.webp" },
{ src: assetUrl("/images/journal/IMG_6470.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6470.webp" },
{ src: assetUrl("/images/journal/IMG_6472.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6472.webp" },
{ src: assetUrl("/images/journal/IMG_6475.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6475.webp" },
{ src: assetUrl("/images/journal/IMG_6476.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6476.webp" },
{ src: assetUrl("/images/journal/IMG_6477.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6477.webp" },
{ src: assetUrl("/images/journal/IMG_6483.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6483.webp" },
{ src: assetUrl("/images/journal/IMG_6494.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6494.webp" },
{ src: assetUrl("/images/journal/IMG_6515.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6515.webp" },
{ src: assetUrl("/images/journal/IMG_6577.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6577.webp" },
{ src: assetUrl("/images/journal/IMG_6585.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6585.webp" },
{ src: assetUrl("/images/journal/IMG_6941.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6941.webp" },
{ src: assetUrl("/images/journal/IMG_6954.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6954.webp" },
{ src: assetUrl("/images/journal/IMG_6959-2.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6959-2.webp" },
{ src: assetUrl("/images/journal/IMG_6961.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6961.webp" },
{ src: assetUrl("/images/journal/IMG_6962.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6962.webp" },
{ src: assetUrl("/images/journal/IMG_6963.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6963.webp" },
{ src: assetUrl("/images/journal/IMG_6971.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6971.webp" },
{ src: assetUrl("/images/journal/IMG_6975.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6975.webp" },
{ src: assetUrl("/images/journal/IMG_6976.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6976.webp" },
{ src: assetUrl("/images/journal/IMG_6981.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6981.webp" },
{ src: assetUrl("/images/journal/IMG_6984.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6984.webp" },
{ src: assetUrl("/images/journal/IMG_6991.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6991.webp" },
{ src: assetUrl("/images/journal/IMG_6993.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6993.webp" },
{ src: assetUrl("/images/journal/IMG_6995.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_6995.webp" },
{ src: assetUrl("/images/journal/IMG_7006.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7006.webp" },
{ src: assetUrl("/images/journal/IMG_7007.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7007.webp" },
{ src: assetUrl("/images/journal/IMG_7009.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7009.webp" },
{ src: assetUrl("/images/journal/IMG_7010.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7010.webp" },
{ src: assetUrl("/images/journal/IMG_7012.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7012.webp" },
{ src: assetUrl("/images/journal/IMG_7013.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7013.webp" },
{ src: assetUrl("/images/journal/IMG_7210.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7210.webp" },
{ src: assetUrl("/images/journal/IMG_7233.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7233.webp" },
{ src: assetUrl("/images/journal/IMG_7292.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7292.webp" },
{ src: assetUrl("/images/journal/IMG_7407.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7407.webp" },
{ src: assetUrl("/images/journal/IMG_7408.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7408.webp" },
{ src: assetUrl("/images/journal/IMG_7410.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7410.webp" },
{ src: assetUrl("/images/journal/IMG_7411.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7411.webp" },
{ src: assetUrl("/images/journal/IMG_7412.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7412.webp" },
{ src: assetUrl("/images/journal/IMG_7414.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7414.webp" },
{ src: assetUrl("/images/journal/IMG_7415.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7415.webp" },
{ src: assetUrl("/images/journal/IMG_7416.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7416.webp" },
{ src: assetUrl("/images/journal/IMG_7418.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7418.webp" },
{ src: assetUrl("/images/journal/IMG_7433.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7433.webp" },
{ src: assetUrl("/images/journal/IMG_7435.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7435.webp" },
{ src: assetUrl("/images/journal/IMG_7436.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7436.webp" },
{ src: assetUrl("/images/journal/IMG_7440.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7440.webp" },
{ src: assetUrl("/images/journal/IMG_7442.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7442.webp" },
{ src: assetUrl("/images/journal/IMG_7443.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7443.webp" },
{ src: assetUrl("/images/journal/IMG_7444.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7444.webp" },
{ src: assetUrl("/images/journal/IMG_7445.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7445.webp" },
{ src: assetUrl("/images/journal/IMG_7446.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7446.webp" },
{ src: assetUrl("/images/journal/IMG_7614.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7614.webp" },
{ src: assetUrl("/images/journal/IMG_7813.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7813.webp" },
{ src: assetUrl("/images/journal/IMG_7858.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_7858.webp" },
{ src: assetUrl("/images/journal/IMG_8618.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_8618.webp" },
{ src: assetUrl("/images/journal/IMG_8742.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_8742.webp" },
{ src: assetUrl("/images/journal/IMG_9338.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_9338.webp" },
{ src: assetUrl("/images/journal/IMG_9898.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/IMG_9898.webp" },
{ src: assetUrl("/images/journal/L1000180.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/L1000180.webp" },
{ src: assetUrl("/images/journal/L1001471.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/L1001471.webp" },
{ src: assetUrl("/images/journal/L1001481.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/L1001481.webp" },
{ src: assetUrl("/images/journal/L1001513.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/L1001513.webp" },
{ src: assetUrl("/images/journal/L1001554.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/L1001554.webp" },
{ src: assetUrl("/images/journal/L1001729.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/L1001729.webp" },
{ src: assetUrl("/images/journal/L1008306.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/L1008306.webp" },
{ src: assetUrl("/images/journal/L1008426.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/L1008426.webp" },
{ src: assetUrl("/images/journal/L1008606.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/L1008606.webp" },
{ src: assetUrl("/images/journal/L1009552.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/L1009552.webp" },
{ src: assetUrl("/images/journal/R0006637-Edit.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/R0006637-Edit.webp" },
{ src: assetUrl("/images/journal/a155b47758efa4ba5587fe1ec6c0c96b.png"), webSrc: "https://frgdgcpmrshimyxsamdr.supabase.co/storage/v1/object/public/journal-images-web/a155b47758efa4ba5587fe1ec6c0c96b.webp" },
];

export default function Journal() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  
  // Fetch saved order from database
  const { data: orderData } = trpc.gallery.getOrder.useQuery({ gallery: "journal" });
  
  // Compute ordered images based on saved order or default
  const orderedImages = useMemo(() => {
    if (orderData?.order) {
      // Reorder based on saved order (order stores src URLs)
      const ordered = orderData.order
        .map((src: string) => journalImages.find(img => img.src === src))
        .filter((img): img is typeof journalImages[0] => img !== undefined);
      // Add any new images not in saved order
      const newImages = journalImages.filter(img => !orderData.order?.includes(img.src));
      return [...ordered, ...newImages];
    }
    return journalImages;
  }, [orderData]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      
      if (e.key === "Escape") {
        setSelectedImage(null);
      } else if (e.key === "ArrowLeft") {
        setSelectedImage((prev) => 
          prev !== null ? (prev - 1 + orderedImages.length) % orderedImages.length : null
        );
      } else if (e.key === "ArrowRight") {
        setSelectedImage((prev) => 
          prev !== null ? (prev + 1) % orderedImages.length : null
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, orderedImages.length]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (selectedImage !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedImage]);

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null) return;
    if (direction === "prev") {
      setSelectedImage((selectedImage - 1 + orderedImages.length) % orderedImages.length);
    } else {
      setSelectedImage((selectedImage + 1) % orderedImages.length);
    }
  };

  return (
    <>
      <SEOHead
        title="The Journal"
        description="Behind the scenes and personal photography from Allen Henson's journey. Fragments of a life spanning two decades of travel, conflict documentation, and artistic exploration across continents."
        image={assetUrl("/images/journal/1.png")}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.allenhenson.com/" },
          { name: "Journal", url: "https://www.allenhenson.com/journal" },
        ]}
      />
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-28 md:py-36">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="font-display text-5xl md:text-7xl font-normal mb-6 tracking-tight">
              The Journal
            </h1>
            <div className="w-24 h-px bg-accent mx-auto mb-8" />
            <p className="text-lg md:text-xl text-muted-foreground font-normal leading-relaxed max-w-2xl mx-auto">
              Fragments of a life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="pb-24">
        <div className="container">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {orderedImages.map((img, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.02, 0.5) }}
                className="break-inside-avoid mb-4 cursor-pointer group relative overflow-hidden"
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={img.webSrc}
                  alt={`Journal entry ${index + 1}`}
                  className="w-full h-auto transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close button */}
            <button
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </button>

            {/* Navigation buttons */}
            <button
              className="absolute left-4 md:left-8 text-white/70 hover:text-white transition-colors z-10 p-2"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage("prev");
              }}
            >
              <ChevronLeft size={48} />
            </button>

            <button
              className="absolute right-4 md:right-8 text-white/70 hover:text-white transition-colors z-10 p-2"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage("next");
              }}
            >
              <ChevronRight size={48} />
            </button>

            {/* Image */}
            <motion.img
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              src={orderedImages[selectedImage].src}
              alt={`Journal entry ${selectedImage + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 font-mono text-sm">
              {selectedImage + 1} / {orderedImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}
