/**
 * Product Variants Data
 * Defines size options and pricing for products with multiple variants
 */

export interface ProductVariant {
  id: string;
  name: string;
  price: number; // in cents
  sku: string;
}

export interface ProductWithVariants {
  slug: string;
  variants: ProductVariant[];
}

// Products with size variants (11"X17" and 24"X36" options)
export const productVariants: Record<string, ProductVariant[]> = {
  // Products with two size options
  "tour-de-eiffel": [
    { id: "11x17", name: '11"X17"', price: 269000, sku: "TDE-11X17" },
    { id: "24x36", name: '24"X36"', price: 555000, sku: "TDE-24X36" },
  ],
  "sword-bordeaux-v2": [
    { id: "11x17", name: '11"X17"', price: 375000, sku: "SOB2-11X17" },
    { id: "24x36", name: '24"X36"', price: 475000, sku: "SOB2-24X36" },
  ],
  "raffaella-tresor": [
    { id: "11x17", name: '11"X17"', price: 150000, sku: "RT-11X17" },
    { id: "24x36", name: '24"X36"', price: 240000, sku: "RT-24X36" },
  ],
  "sacrilege-toulouse": [
    { id: "11x17", name: '11"X17"', price: 555000, sku: "SAT2-11X17" },
    { id: "24x36", name: '24"X36"', price: 770000, sku: "SAT2-24X36" },
  ],
  "mi-trevi": [
    { id: "11x17", name: '11"X17"', price: 190000, sku: "MT2-11X17" },
    { id: "24x36", name: '24"X36"', price: 350000, sku: "MT2-24X36" },
  ],
  "sword-bordeaux-v1": [
    { id: "11x17", name: '11"X17"', price: 450000, sku: "SOB1-11X17" },
    { id: "24x36", name: '24"X36"', price: 650000, sku: "SOB1-24X36" },
  ],
  "sarina-thai": [
    { id: "11x17", name: '11"X17"', price: 595000, sku: "STG-11X17" },
    { id: "24x36", name: '24"X36"', price: 900000, sku: "STG-24X36" },
  ],
  "tour-eiffel-paris": [
    { id: "11x17", name: '11"X17"', price: 245000, sku: "TE2-11X17" },
    { id: "24x36", name: '24"X36"', price: 275000, sku: "TE2-24X36" },
  ],
  "rudy-reyes-24x36": [
    { id: "11x17", name: '11"X17"', price: 655000, sku: "RR-11X17" },
    { id: "24x36", name: '24"X36"', price: 710000, sku: "RR-24X36" },
  ],
  "rudy-reyes-ii": [
    { id: "11x17", name: '11"X17"', price: 120000, sku: "RR2-11X17" },
    { id: "24x36", name: '24"X36"', price: 530000, sku: "RR2-24X36" },
  ],
  "girl-coal-ny": [
    { id: "11x17", name: '11"X17"', price: 530000, sku: "GC-11X17" },
    { id: "24x36", name: '24"X36"', price: 770000, sku: "GC-24X36" },
  ],
  "foro-romano": [
    { id: "11x17", name: '11"X17"', price: 310000, sku: "FR-11X17" },
    { id: "24x36", name: '24"X36"', price: 495000, sku: "FR-24X36" },
  ],
  "anna-lisa-sequoia": [
    { id: "11x17", name: '11"X17"', price: 410000, sku: "ALS-11X17" },
    { id: "24x36", name: '24"X36"', price: 670000, sku: "ALS-24X36" },
  ],
  "what-we-left-paris": [
    { id: "11x17", name: '11"X17"', price: 1550000, sku: "LIP-11X17" },
    { id: "24x36", name: '24"X36"', price: 1700000, sku: "LIP-24X36" },
  ],
  "mouvement-paris": [
    { id: "11x17", name: '11"X17"', price: 610000, sku: "MV-11X17" },
    { id: "24x36", name: '24"X36"', price: 940000, sku: "MV-24X36" },
  ],
  "walk-to-cafe-paris": [
    { id: "11x17", name: '11"X17"', price: 995000, sku: "CAFE-11X17" },
    { id: "24x36", name: '24"X36"', price: 1355000, sku: "CAFE-24X36" },
  ],
  "odeon-herodes-atticus": [
    { id: "11x17", name: '11"X17"', price: 1515000, sku: "OHA-11X17" },
    { id: "24x36", name: '24"X36"', price: 1650000, sku: "OHA-24X36" },
  ],
  "mi-trevi-skye-roma": [
    { id: "11x17", name: '11"X17"', price: 1175000, sku: "MTS-11X17" },
    { id: "24x36", name: '24"X36"', price: 1525000, sku: "MTS-24X36" },
  ],
  "girl-on-coral": [
    { id: "11x17", name: '11"X17"', price: 1770000, sku: "GOC-11X17" },
    { id: "24x36", name: '24"X36"', price: 2245000, sku: "GOC-24X36" },
  ],
  "mannequin-mast-barcelona": [
    { id: "11x17", name: '11"X17"', price: 700000, sku: "MMB-11X17" },
    { id: "24x36", name: '24"X36"', price: 820000, sku: "MMB-24X36" },
  ],
  "sacrilege-toulouse-skye": [
    { id: "11x17", name: '11"X17"', price: 2250000, sku: "SATS-11X17" },
    { id: "24x36", name: '24"X36"', price: 2350000, sku: "SATS-24X36" },
  ],
};

// Helper function to check if a product has variants
export function hasVariants(slug: string): boolean {
  return slug in productVariants;
}

// Helper function to get variants for a product
export function getVariants(slug: string): ProductVariant[] | null {
  return productVariants[slug] || null;
}

// Helper function to get a specific variant by ID
export function getVariantById(slug: string, variantId: string): ProductVariant | null {
  const variants = productVariants[slug];
  if (!variants) return null;
  return variants.find(v => v.id === variantId) || null;
}

// Helper function to get the default (first) variant for a product
export function getDefaultVariant(slug: string): ProductVariant | null {
  const variants = productVariants[slug];
  if (!variants || variants.length === 0) return null;
  return variants[0];
}
