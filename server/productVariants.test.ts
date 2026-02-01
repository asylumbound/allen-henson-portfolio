/**
 * Product Variants Tests
 * Tests for the product variants system
 */

import { describe, it, expect } from "vitest";
import { 
  hasVariants, 
  getVariants, 
  getVariantById, 
  getDefaultVariant,
  productVariants 
} from "../shared/productVariants";

describe("Product Variants", () => {
  describe("hasVariants", () => {
    it("returns true for products with variants", () => {
      expect(hasVariants("tour-de-eiffel")).toBe(true);
      expect(hasVariants("sword-bordeaux-v2")).toBe(true);
      expect(hasVariants("sacrilege-toulouse")).toBe(true);
    });

    it("returns false for products without variants", () => {
      expect(hasVariants("editorial-on-the-run")).toBe(false);
      expect(hasVariants("abscond-box-set")).toBe(false);
      expect(hasVariants("non-existent-product")).toBe(false);
    });
  });

  describe("getVariants", () => {
    it("returns variants array for products with variants", () => {
      const variants = getVariants("tour-de-eiffel");
      expect(variants).not.toBeNull();
      expect(Array.isArray(variants)).toBe(true);
      expect(variants!.length).toBe(2);
    });

    it("returns null for products without variants", () => {
      expect(getVariants("editorial-on-the-run")).toBeNull();
      expect(getVariants("non-existent-product")).toBeNull();
    });

    it("each variant has required properties", () => {
      const variants = getVariants("tour-de-eiffel");
      expect(variants).not.toBeNull();
      
      for (const variant of variants!) {
        expect(variant).toHaveProperty("id");
        expect(variant).toHaveProperty("name");
        expect(variant).toHaveProperty("price");
        expect(variant).toHaveProperty("sku");
        expect(typeof variant.id).toBe("string");
        expect(typeof variant.name).toBe("string");
        expect(typeof variant.price).toBe("number");
        expect(typeof variant.sku).toBe("string");
      }
    });
  });

  describe("getVariantById", () => {
    it("returns the correct variant by ID", () => {
      const variant = getVariantById("tour-de-eiffel", "11x17");
      expect(variant).not.toBeNull();
      expect(variant!.id).toBe("11x17");
      expect(variant!.name).toBe('11"X17"');
      expect(variant!.price).toBe(269000);
    });

    it("returns the 24x36 variant correctly", () => {
      const variant = getVariantById("tour-de-eiffel", "24x36");
      expect(variant).not.toBeNull();
      expect(variant!.id).toBe("24x36");
      expect(variant!.name).toBe('24"X36"');
      expect(variant!.price).toBe(555000);
    });

    it("returns null for non-existent variant ID", () => {
      expect(getVariantById("tour-de-eiffel", "8x10")).toBeNull();
    });

    it("returns null for non-existent product", () => {
      expect(getVariantById("non-existent-product", "11x17")).toBeNull();
    });
  });

  describe("getDefaultVariant", () => {
    it("returns the first variant as default", () => {
      const defaultVariant = getDefaultVariant("tour-de-eiffel");
      expect(defaultVariant).not.toBeNull();
      expect(defaultVariant!.id).toBe("11x17");
    });

    it("returns null for products without variants", () => {
      expect(getDefaultVariant("editorial-on-the-run")).toBeNull();
      expect(getDefaultVariant("non-existent-product")).toBeNull();
    });
  });

  describe("productVariants data integrity", () => {
    it("all variants have positive prices", () => {
      for (const [slug, variants] of Object.entries(productVariants)) {
        for (const variant of variants) {
          expect(variant.price).toBeGreaterThan(0);
        }
      }
    });

    it("all variants have unique IDs within a product", () => {
      for (const [slug, variants] of Object.entries(productVariants)) {
        const ids = variants.map(v => v.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it("24x36 variants are priced higher than 11x17 variants", () => {
      for (const [slug, variants] of Object.entries(productVariants)) {
        const small = variants.find(v => v.id === "11x17");
        const large = variants.find(v => v.id === "24x36");
        
        if (small && large) {
          expect(large.price).toBeGreaterThan(small.price);
        }
      }
    });
  });
});
