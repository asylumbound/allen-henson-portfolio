/*
 * Cookie Consent Banner
 * GDPR/CCPA compliant cookie consent with cinematic noir styling
 * Stores consent preference in localStorage
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X, Cookie } from "lucide-react";

const CONSENT_KEY = "cookie_consent";
const CONSENT_VERSION = "1"; // Increment to re-prompt after policy changes

type ConsentStatus = "accepted" | "declined" | null;

function getStoredConsent(): ConsentStatus {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed.status as ConsentStatus;
  } catch {
    return null;
  }
}

function setStoredConsent(status: "accepted" | "declined") {
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({ status, version: CONSENT_VERSION, timestamp: Date.now() })
  );
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so the banner doesn't flash on page load
    const timer = setTimeout(() => {
      const consent = getStoredConsent();
      if (!consent) {
        setVisible(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    setStoredConsent("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    setStoredConsent("declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom duration-500"
      role="dialog"
      aria-label="Cookie consent"
    >
      {/* Backdrop blur strip */}
      <div className="bg-background/95 backdrop-blur-md border-t border-border shadow-2xl">
        <div className="container py-4 md:py-5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            {/* Icon + Text */}
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-5 h-5 text-gold mt-0.5 shrink-0" />
              <p className="text-sm font-light leading-relaxed text-foreground/80">
                We use cookies and similar technologies to enhance your browsing
                experience, analyze site traffic, and personalize content. By
                continuing to use this site, you consent to our use of cookies.
                Read our{" "}
                <Link
                  href="/privacy-policy"
                  className="text-gold underline underline-offset-2 hover:text-gold/80 cinematic-transition"
                >
                  Privacy Policy
                </Link>{" "}
                for more information.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDecline}
                className="px-5 py-2 text-xs tracking-cinematic font-light border border-foreground/20 text-foreground/70 hover:border-foreground/40 hover:text-foreground cinematic-transition"
              >
                DECLINE
              </button>
              <button
                onClick={handleAccept}
                className="px-5 py-2 text-xs tracking-cinematic font-medium bg-gold text-background hover:bg-gold/90 cinematic-transition"
              >
                ACCEPT
              </button>
              <button
                onClick={handleDecline}
                className="p-1.5 text-foreground/40 hover:text-foreground cinematic-transition md:hidden"
                aria-label="Close cookie banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
