/*
 * DESIGN: Cinematic Noir
 * - Film noir aesthetic with dramatic light/shadow
 * - Gold accent (#C9A962 / oklch(0.75 0.12 85)) for navigation underlines
 * - Mont Blanc typography throughout
 * - Cinematic timing animations (0.6s cubic-bezier)
 * - Film grain overlay on dark mode
 */

import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, Menu, X } from "lucide-react";
import CookieConsent from "@/components/CookieConsent";
import { assetUrl } from "@/lib/assets";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/photos", label: "EDITORIAL" },
  { href: "/product-photography", label: "PRODUCT" },
  { href: "/video", label: "VIDEO" },
  { href: "/journal", label: "JOURNAL" },
  { href: "/blog", label: "BLOG" },
  { href: "/sales", label: "SHOP" },
  { href: "/about", label: "ABOUT" },
  { href: "/contact", label: "CONTACT" },
];

const cities = "STUTTGART · HAMBURG · BERLIN · LEIPZIG · ZURICH · BARCELONA · PARIS · BORDEAUX · TANGIER · MARRAKECH · THESSALONIKI · ATHENS · ROME · SÃO PAULO · MEDELLÍN · NEW YORK CITY · MIAMI · LOS ANGELES · BUENOS AIRES · BOLIVIA · PERU · LONDON · PRAGUE · BUDAPEST";

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col film-grain">
      {/* City Ticker Marquee */}
      <div className="overflow-hidden bg-secondary/50 py-2 border-b border-border">
        <div className="flex whitespace-nowrap">
          <span className="marquee text-xs tracking-wide-cinematic text-muted-foreground font-light">
            {cities} · {cities} ·&nbsp;
          </span>
        </div>
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/95 backdrop-blur-sm border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="container py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <img
                src={assetUrl("/images/AHP-Logo.png")}
                alt="Allen Henson Productions"
                className="h-10 md:h-12 w-auto cinematic-transition hover:opacity-80"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm tracking-cinematic font-light gold-underline cinematic-transition ${
                    location === item.href
                      ? "text-gold"
                      : "text-foreground hover:text-gold"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-foreground hover:text-gold cinematic-transition"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={toggleTheme}
                className="p-2 text-foreground hover:text-gold cinematic-transition"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-foreground hover:text-gold cinematic-transition"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden cinematic-transition ${
            mobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="container py-4 flex flex-col gap-4 border-t border-border">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm tracking-cinematic font-light py-2 ${
                  location === item.href
                    ? "text-gold"
                    : "text-foreground hover:text-gold"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-auto">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Footer Navigation */}
            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-xs tracking-cinematic font-light text-muted-foreground hover:text-gold cinematic-transition"
                >
                  {item.label.charAt(0) + item.label.slice(1).toLowerCase()}
                </Link>
              ))}
            </nav>

            {/* Legal Links */}
            <div className="flex items-center gap-4">
              <Link
                href="/privacy-policy"
                className="text-xs tracking-cinematic font-light text-muted-foreground hover:text-gold cinematic-transition"
              >
                Privacy Policy
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link
                href="/terms-of-service"
                className="text-xs tracking-cinematic font-light text-muted-foreground hover:text-gold cinematic-transition"
              >
                Terms of Service
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link
                href="/data-security-incident-notice"
                className="text-xs tracking-cinematic font-light text-muted-foreground hover:text-gold cinematic-transition"
              >
                Data Security Notice
              </Link>
            </div>

            {/* Duke - visible only on About page */}
            {location === "/about" && (
              <div className="flex items-center">
                <Link
                  href="/duke"
                  className="text-xs tracking-cinematic font-light text-muted-foreground/30 hover:text-gold cinematic-transition"
                >
                  Duke
                </Link>
              </div>
            )}

            {/* Copyright */}
            <p className="text-xs tracking-wide font-extralight text-muted-foreground">
              © 2026 ALLEN HENSON
            </p>
          </div>
        </div>
      </footer>
      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
}
