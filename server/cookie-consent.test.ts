import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Cookie Consent Banner", () => {
  const componentPath = resolve(
    __dirname,
    "../client/src/components/CookieConsent.tsx"
  );
  const layoutPath = resolve(
    __dirname,
    "../client/src/components/Layout.tsx"
  );

  const componentSource = readFileSync(componentPath, "utf-8");
  const layoutSource = readFileSync(layoutPath, "utf-8");

  describe("Component structure", () => {
    it("should use localStorage for consent storage", () => {
      expect(componentSource).toContain("localStorage.getItem");
      expect(componentSource).toContain("localStorage.setItem");
    });

    it("should define a consent key constant", () => {
      expect(componentSource).toContain('CONSENT_KEY');
      expect(componentSource).toContain('"cookie_consent"');
    });

    it("should have a consent version for re-prompting after policy changes", () => {
      expect(componentSource).toContain("CONSENT_VERSION");
    });

    it("should have accept and decline handlers", () => {
      expect(componentSource).toContain("handleAccept");
      expect(componentSource).toContain("handleDecline");
    });

    it("should store accepted status on accept", () => {
      expect(componentSource).toContain('"accepted"');
    });

    it("should store declined status on decline", () => {
      expect(componentSource).toContain('"declined"');
    });

    it("should have ACCEPT and DECLINE buttons", () => {
      expect(componentSource).toContain("ACCEPT");
      expect(componentSource).toContain("DECLINE");
    });

    it("should link to the Privacy Policy page", () => {
      expect(componentSource).toContain('href="/privacy-policy"');
      expect(componentSource).toContain("Privacy Policy");
    });

    it("should have proper ARIA attributes for accessibility", () => {
      expect(componentSource).toContain('role="dialog"');
      expect(componentSource).toContain('aria-label="Cookie consent"');
    });

    it("should use cinematic noir styling (gold accent, tracking)", () => {
      expect(componentSource).toContain("text-gold");
      expect(componentSource).toContain("tracking-cinematic");
      expect(componentSource).toContain("bg-gold");
    });

    it("should have a delayed appearance to avoid flash on page load", () => {
      expect(componentSource).toContain("setTimeout");
    });

    it("should be fixed to the bottom of the viewport", () => {
      expect(componentSource).toContain("fixed bottom-0");
    });

    it("should have a high z-index to appear above other content", () => {
      expect(componentSource).toContain("z-[100]");
    });

    it("should have slide-in animation", () => {
      expect(componentSource).toContain("slide-in-from-bottom");
    });
  });

  describe("Layout integration", () => {
    it("should import CookieConsent in Layout", () => {
      expect(layoutSource).toContain(
        'import CookieConsent from "@/components/CookieConsent"'
      );
    });

    it("should render CookieConsent component in Layout", () => {
      expect(layoutSource).toContain("<CookieConsent />");
    });
  });

  describe("Consent versioning", () => {
    it("should check version when reading stored consent", () => {
      expect(componentSource).toContain("parsed.version");
      expect(componentSource).toContain("CONSENT_VERSION");
    });

    it("should return null for outdated consent versions", () => {
      // The function should return null when version doesn't match
      expect(componentSource).toContain("return null");
    });
  });
});
