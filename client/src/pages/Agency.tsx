/**
 * DESIGN: Cinematic Noir
 * Agency Database - Password-protected modeling agency reference
 * - Client-side SHA-256 hashing (password never sent in plain text)
 * - 24-hour session persistence via localStorage
 * - 4 tabbed sections: Communications, Contacts, Agency Directory, Magazines
 * - Search and filter across all sections
 * - Cinematic noir aesthetic matching site design
 * - noindex/nofollow for search engine exclusion
 *
 * LAFC CONSULTING
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { SEOHead } from "@/components/SEOHead";
import {
  communications,
  agencyContacts,
  agencyDirectory,
  magazines,
  type Communication,
  type AgencyContact,
  type AgencyDirectory as AgencyDirectoryType,
  type Magazine,
} from "@/data/agencyData";

// ─── AUTH ──────────────────────────────────────────────────────────────

const SESSION_KEY = "agency_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Credentials
const VALID_USERNAME = "editor";
const VALID_PASSWORD = "&&77LEica";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

let computedExpectedHash = "";
(async () => {
  computedExpectedHash = await hashPassword(VALID_PASSWORD);
})();

function getSession(): boolean {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    if (!parsed.timestamp || !parsed.hash) return false;
    const elapsed = Date.now() - parsed.timestamp;
    if (elapsed > SESSION_DURATION_MS) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return false;
  }
}

function setSession(hash: string): void {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ hash, timestamp: Date.now() })
  );
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ─── TYPES ─────────────────────────────────────────────────────────────

type Section = "communications" | "contacts" | "agencies" | "magazines";

// ─── COMPONENT ─────────────────────────────────────────────────────────

export default function Agency() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [activeSection, setActiveSection] = useState<Section>("communications");
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [commDirectionFilter, setCommDirectionFilter] = useState("all");
  const [agencyCityFilter, setAgencyCityFilter] = useState("all");
  const [agencyCountryFilter, setAgencyCountryFilter] = useState("all");
  const [agencyTierFilter, setAgencyTierFilter] = useState("all");
  const [magTierFilter, setMagTierFilter] = useState("all");
  const [magSubmissionFilter, setMagSubmissionFilter] = useState("all");

  // Check session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      setIsAuthenticated(true);
    }
  }, []);

  // noindex meta tag
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const q = searchQuery.toLowerCase();

  // ─── FILTERED DATA ───────────────────────────────────────────────────

  const filteredCommunications = useMemo(() => {
    return communications.filter((c) => {
      const matchesSearch =
        !q ||
        c.agency.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.keyPhrases.toLowerCase().includes(q);
      const matchesDirection =
        commDirectionFilter === "all" || c.direction === commDirectionFilter;
      return matchesSearch && matchesDirection;
    });
  }, [q, commDirectionFilter]);

  const filteredContacts = useMemo(() => {
    return agencyContacts.filter((c) => {
      return (
        !q ||
        c.agency.toLowerCase().includes(q) ||
        c.person.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
  }, [q]);

  const filteredAgencies = useMemo(() => {
    return agencyDirectory.filter((a) => {
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.phone && a.phone.includes(q));
      const matchesCountry =
        agencyCountryFilter === "all" ||
        a.country.toLowerCase() === agencyCountryFilter.toLowerCase();
      const matchesCity =
        agencyCityFilter === "all" ||
        a.city.toLowerCase() === agencyCityFilter.toLowerCase();
      const matchesTier =
        agencyTierFilter === "all" || a.tier === agencyTierFilter;
      return matchesSearch && matchesCountry && matchesCity && matchesTier;
    });
  }, [q, agencyCountryFilter, agencyCityFilter, agencyTierFilter]);

  const filteredMagazines = useMemo(() => {
    return magazines.filter((m) => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.notes.toLowerCase().includes(q) ||
        m.submissionMethod.toLowerCase().includes(q);
      const matchesTier =
        magTierFilter === "all" || m.tier === Number(magTierFilter);
      const matchesSubmission =
        magSubmissionFilter === "all" ||
        (magSubmissionFilter === "open" &&
          (m.acceptsUnsolicited === "Yes" ||
            m.acceptsUnsolicited.startsWith("Yes"))) ||
        (magSubmissionFilter === "limited" &&
          m.acceptsUnsolicited.includes("Limited")) ||
        (magSubmissionFilter === "closed" &&
          (m.acceptsUnsolicited === "No" ||
            m.acceptsUnsolicited === "N/A"));
      return matchesSearch && matchesTier && matchesSubmission;
    });
  }, [q, magTierFilter, magSubmissionFilter]);

  const agencyCountries = useMemo(
    () => Array.from(new Set(agencyDirectory.map((a) => a.country))).sort(),
    []
  );

  const agencyCities = useMemo(() => {
    const filtered =
      agencyCountryFilter === "all"
        ? agencyDirectory
        : agencyDirectory.filter(
            (a) =>
              a.country.toLowerCase() === agencyCountryFilter.toLowerCase()
          );
    return Array.from(new Set(filtered.map((a) => a.city))).sort();
  }, [agencyCountryFilter]);

  const sections: { key: Section; label: string; count: number }[] = [
    {
      key: "communications",
      label: "Communications",
      count: filteredCommunications.length,
    },
    { key: "contacts", label: "Contacts", count: filteredContacts.length },
    {
      key: "agencies",
      label: "Agency Directory",
      count: filteredAgencies.length,
    },
    { key: "magazines", label: "Magazines", count: filteredMagazines.length },
  ];

  // ─── AUTH HANDLERS ───────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const trimmedIdentity = identity.toLowerCase().trim();

      if (trimmedIdentity === VALID_USERNAME && password === VALID_PASSWORD) {
        const hash = await hashPassword(password);
        setSession(hash);
        setIsAuthenticated(true);
        return;
      }

      // Also accept the viewer email from Duke
      const viewerEmail = "bios159@protonmail.com";
      if (trimmedIdentity === viewerEmail) {
        const hash = await hashPassword(password);
        if (hash === computedExpectedHash) {
          setSession(hash);
          setIsAuthenticated(true);
        } else {
          setError("Invalid credentials.");
        }
      } else {
        setError("Invalid credentials.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    setIdentity("");
    setPassword("");
  };

  // ─── LOGIN SCREEN ────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        <div className="absolute inset-0 vignette opacity-30" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-md mx-auto px-6"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm tracking-cinematic font-light text-muted-foreground hover:text-gold cinematic-transition mb-8"
          >
            BACK TO SITE
          </Link>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-8 md:p-10">
            <div className="text-center mb-8">
              <p className="text-xs tracking-wide-cinematic text-gold font-light mb-3">
                RESTRICTED ACCESS
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Agency Database
              </h1>
              <div className="w-12 h-px bg-gold mx-auto mt-4" />
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="agency-identity"
                  className="block text-xs tracking-cinematic font-light text-muted-foreground mb-2"
                >
                  USERNAME / EMAIL
                </label>
                <input
                  id="agency-identity"
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full px-4 py-3 bg-background/50 border border-border/50 text-foreground text-sm font-light tracking-wide focus:outline-none focus:border-gold cinematic-transition placeholder:text-muted-foreground/50"
                  placeholder="username or email"
                />
              </div>

              <div>
                <label
                  htmlFor="agency-password"
                  className="block text-xs tracking-cinematic font-light text-muted-foreground mb-2"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="agency-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 bg-background/50 border border-border/50 text-foreground text-sm font-light tracking-wide focus:outline-none focus:border-gold cinematic-transition placeholder:text-muted-foreground/50"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs tracking-cinematic text-muted-foreground hover:text-foreground cinematic-transition select-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 font-light text-center py-2"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gold text-background font-medium tracking-cinematic text-sm hover:bg-gold/90 cinematic-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? "VERIFYING..." : "ENTER"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground/50 font-light mt-6">
            Authorized access only. All activity is monitored.
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── AUTHENTICATED DATABASE VIEW ─────────────────────────────────────

  return (
    <>
      <SEOHead
        title="Agency Database"
        description="Private agency communications and directory."
      />
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border/30">
          <div className="container py-8 flex items-start justify-between">
            <div>
              <p className="text-xs tracking-wide-cinematic text-gold font-light mb-2">
                RESTRICTED ACCESS
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Agency Database
              </h1>
              <p className="mt-2 text-sm font-light tracking-wide text-muted-foreground">
                Communications / Contacts / Agencies / Magazines
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs tracking-cinematic font-light text-muted-foreground hover:text-gold cinematic-transition mt-2"
            >
              SIGN OUT
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="border-b border-border/20">
          <div className="container py-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all sections..."
              className="w-full bg-transparent text-base font-light tracking-wide border-b border-border/30 pb-2 focus:border-gold focus:outline-none cinematic-transition placeholder:text-muted-foreground/40 text-foreground"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="border-b border-border/20 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="container flex gap-0 overflow-x-auto">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`py-3 px-4 text-xs font-medium tracking-widest uppercase transition-colors border-b-2 whitespace-nowrap ${
                  activeSection === s.key
                    ? "border-gold text-gold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
                <span className="ml-1.5 text-[10px] font-light opacity-60">
                  {s.count}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="container py-8">
          <AnimatePresence mode="wait">
            {/* COMMUNICATIONS */}
            {activeSection === "communications" && (
              <motion.section
                key="communications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <SectionHeader index="01" title="Communications Log" />
                  <FilterSelect
                    value={commDirectionFilter}
                    onChange={setCommDirectionFilter}
                    options={[
                      { value: "all", label: "All Directions" },
                      { value: "sent", label: "Sent" },
                      { value: "received", label: "Received" },
                    ]}
                  />
                </div>
                {filteredCommunications.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-0">
                    {filteredCommunications.map((c, i) => (
                      <div
                        key={i}
                        className="border-b border-border/10 py-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-xs font-light tracking-wider text-muted-foreground/60 uppercase w-20 shrink-0">
                                {c.date}
                              </span>
                              <span
                                className={`text-xs font-medium tracking-widest uppercase px-2 py-0.5 border ${
                                  c.direction === "sent"
                                    ? "border-gold/40 text-gold"
                                    : c.direction === "received"
                                    ? "border-blue-400/40 text-blue-400"
                                    : "border-border/40 text-muted-foreground"
                                }`}
                              >
                                {c.direction}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold mt-1 text-foreground">
                              {c.agency}
                              <span className="font-light text-muted-foreground ml-2">
                                / {c.contact}
                              </span>
                            </h3>
                            <p className="text-xs font-light text-muted-foreground/70 mt-0.5">
                              Subject: {c.subject}
                            </p>
                            <p className="text-xs font-light text-muted-foreground/50 mt-1 italic">
                              {c.keyPhrases}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {/* CONTACTS */}
            {activeSection === "contacts" && (
              <motion.section
                key="contacts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <SectionHeader index="02" title="Agency Contacts" />
                <div className="mt-6">
                  {filteredContacts.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b-2 border-gold/30">
                            <Th>Agency</Th>
                            <Th>Contact</Th>
                            <Th>Role</Th>
                            <Th>Email</Th>
                            <Th>Location</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredContacts.map((c, i) => (
                            <tr
                              key={i}
                              className="border-b border-border/10 hover:bg-white/[0.02] transition-colors"
                            >
                              <Td bold>{c.agency}</Td>
                              <Td>{c.person}</Td>
                              <Td light>{c.role}</Td>
                              <Td>
                                <a
                                  href={`mailto:${c.email}`}
                                  className="underline underline-offset-2 hover:text-gold transition-colors text-foreground/80"
                                >
                                  {c.email}
                                </a>
                              </Td>
                              <Td light>{c.city || "--"}</Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* AGENCY DIRECTORY */}
            {activeSection === "agencies" && (
              <motion.section
                key="agencies"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <SectionHeader index="03" title="Agency Directory" />
                  <div className="flex gap-2 flex-wrap">
                    <FilterSelect
                      value={agencyCountryFilter}
                      onChange={(value) => {
                        setAgencyCountryFilter(value);
                        setAgencyCityFilter("all");
                      }}
                      options={[
                        { value: "all", label: "All Countries" },
                        ...agencyCountries.map((c) => ({
                          value: c,
                          label: c,
                        })),
                      ]}
                    />
                    <FilterSelect
                      value={agencyCityFilter}
                      onChange={setAgencyCityFilter}
                      options={[
                        { value: "all", label: "All Cities" },
                        ...agencyCities.map((c) => ({ value: c, label: c })),
                      ]}
                    />
                    <FilterSelect
                      value={agencyTierFilter}
                      onChange={setAgencyTierFilter}
                      options={[
                        { value: "all", label: "All Tiers" },
                        { value: "Top", label: "Top" },
                        { value: "Mid", label: "Mid" },
                        { value: "Boutique", label: "Boutique" },
                      ]}
                    />
                  </div>
                </div>
                {filteredAgencies.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-0">
                    {filteredAgencies.map((a, i) => (
                      <div
                        key={i}
                        className="border-b border-border/10 py-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-light tracking-widest text-muted-foreground/50 uppercase">
                                {a.city}, {a.country}
                              </span>
                              <span
                                className={`text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 border ${
                                  a.tier === "Top"
                                    ? "border-gold/50 text-gold"
                                    : a.tier === "Mid"
                                    ? "border-border/40 text-muted-foreground"
                                    : "border-border/20 text-muted-foreground/60"
                                }`}
                              >
                                {a.tier}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold mt-1 text-foreground">
                              {a.name}
                            </h3>
                            {(a.email || a.phone) && (
                              <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1">
                                {a.email && (
                                  <a
                                    href={`mailto:${a.email}`}
                                    className="text-xs font-light underline underline-offset-2 hover:text-gold transition-colors text-foreground/70"
                                  >
                                    {a.email}
                                  </a>
                                )}
                                {a.phone && (
                                  <a
                                    href={`tel:${a.phone}`}
                                    className="text-xs font-light text-muted-foreground/60 hover:text-foreground transition-colors"
                                  >
                                    {a.phone}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {/* MAGAZINES */}
            {activeSection === "magazines" && (
              <motion.section
                key="magazines"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <SectionHeader index="04" title="Magazine Submission Guidelines" />
                  <div className="flex gap-2 flex-wrap">
                    <FilterSelect
                      value={magTierFilter}
                      onChange={setMagTierFilter}
                      options={[
                        { value: "all", label: "All Tiers" },
                        { value: "1", label: "Tier 1: High Fashion" },
                        { value: "2", label: "Tier 2: Independent" },
                        { value: "3", label: "Tier 3: Contemporary" },
                      ]}
                    />
                    <FilterSelect
                      value={magSubmissionFilter}
                      onChange={setMagSubmissionFilter}
                      options={[
                        { value: "all", label: "All Submissions" },
                        { value: "open", label: "Accepts Submissions" },
                        { value: "limited", label: "Limited" },
                        { value: "closed", label: "Closed / Invitation Only" },
                      ]}
                    />
                  </div>
                </div>
                {filteredMagazines.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-0">
                    {filteredMagazines.map((m, i) => (
                      <div
                        key={i}
                        className="border-b border-border/10 py-5 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-light tracking-widest text-muted-foreground/50 uppercase">
                                Tier {m.tier} / {m.tierLabel}
                              </span>
                              <SubmissionBadge status={m.acceptsUnsolicited} />
                            </div>
                            <h3 className="text-sm font-semibold mt-1 text-foreground">
                              {m.name}
                            </h3>
                            <p className="text-xs font-light text-muted-foreground/60 mt-0.5">
                              {m.website}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground/40">
                              {m.format}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                          <div>
                            <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground/40">
                              Submission Method
                            </span>
                            <p className="text-xs font-light mt-0.5 text-foreground/80">
                              {m.submissionMethod}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground/40">
                              Notes
                            </span>
                            <p className="text-xs font-light mt-0.5 text-muted-foreground/70">
                              {m.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/20 mt-12">
          <div className="container py-6 flex items-center justify-between">
            <p className="text-[10px] font-light tracking-widest uppercase text-muted-foreground/40">
              Agency Database / LAFC Consulting / {new Date().getFullYear()}
            </p>
            <Link
              href="/"
              className="text-[10px] font-light tracking-widest uppercase text-muted-foreground/30 hover:text-gold cinematic-transition"
            >
              ALLENHENSON.COM
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="relative">
      <span className="absolute -left-2 -top-6 text-[80px] font-extralight text-foreground/[0.04] leading-none select-none pointer-events-none">
        {index}
      </span>
      <h2 className="relative text-lg font-semibold tracking-tight uppercase text-foreground">
        {title}
      </h2>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-[10px] font-medium tracking-widest uppercase bg-background border border-border/30 text-foreground px-3 py-1.5 focus:border-gold focus:outline-none appearance-none cursor-pointer cinematic-transition"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-background text-foreground">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SubmissionBadge({ status }: { status: string }) {
  const isOpen = status === "Yes" || status.startsWith("Yes");
  const isLimited = status.includes("Limited");
  const borderColor = isOpen
    ? "border-green-500/50"
    : isLimited
    ? "border-yellow-500/40"
    : "border-border/20";
  const textColor = isOpen
    ? "text-green-400"
    : isLimited
    ? "text-yellow-400"
    : "text-muted-foreground/40";

  return (
    <span
      className={`text-[9px] font-medium tracking-widest uppercase px-2 py-0.5 border ${borderColor} ${textColor}`}
    >
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <p className="text-sm font-light text-muted-foreground/40 tracking-wide">
        No results found.
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-[10px] font-medium tracking-widest uppercase text-gold/60 py-2 pr-4">
      {children}
    </th>
  );
}

function Td({
  children,
  bold,
  light,
}: {
  children: React.ReactNode;
  bold?: boolean;
  light?: boolean;
}) {
  return (
    <td
      className={`text-xs py-3 pr-4 ${
        bold
          ? "font-semibold text-foreground"
          : light
          ? "font-light text-muted-foreground/60"
          : "font-normal text-foreground/80"
      }`}
    >
      {children}
    </td>
  );
}
