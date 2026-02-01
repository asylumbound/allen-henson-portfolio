/**
 * Stripe Checkout Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { productPrices } from "./stripe";

describe("Stripe Integration", () => {
  describe("Product Prices", () => {
    it("should have valid product price entries", () => {
      expect(Object.keys(productPrices).length).toBeGreaterThan(0);
    });

    it("should have prices in cents (positive integers)", () => {
      for (const [slug, product] of Object.entries(productPrices)) {
        expect(product.price).toBeGreaterThan(0);
        expect(Number.isInteger(product.price)).toBe(true);
      }
    });

    it("should have non-empty product names", () => {
      for (const [slug, product] of Object.entries(productPrices)) {
        expect(product.name).toBeTruthy();
        expect(product.name.length).toBeGreaterThan(0);
      }
    });

    it("should include key products", () => {
      expect(productPrices["editorial-on-the-run"]).toBeDefined();
      expect(productPrices["editorial-on-the-rocks"]).toBeDefined();
    });

    it("should have correct price for Editorial on the Run ($50)", () => {
      expect(productPrices["editorial-on-the-run"].price).toBe(5000); // $50.00 in cents
    });

    it("should have correct price for limited edition prints ($2,690)", () => {
      expect(productPrices["tour-de-eiffel"].price).toBe(269000); // $2,690.00 in cents
    });
  });

  describe("Checkout Session Creation", () => {
    it("should export createCheckoutSession function", async () => {
      const { createCheckoutSession } = await import("./stripe");
      expect(typeof createCheckoutSession).toBe("function");
    });

    it("should export getOrderBySessionId function", async () => {
      const { getOrderBySessionId } = await import("./stripe");
      expect(typeof getOrderBySessionId).toBe("function");
    });

    it("should export stripeRouter", async () => {
      const { stripeRouter } = await import("./stripe");
      expect(stripeRouter).toBeDefined();
    });
  });
});
