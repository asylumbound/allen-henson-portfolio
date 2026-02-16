import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLocation("/edit");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        // Successful login - redirect to admin
        setLocation("/edit");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      {/* Background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute inset-0 vignette opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-md mx-auto px-6"
      >
        {/* Back to site link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm tracking-cinematic font-light text-muted-foreground hover:text-gold cinematic-transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO SITE
        </Link>

        {/* Login card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-8 md:p-10">
          <div className="text-center mb-8">
            <p className="text-xs tracking-wide-cinematic text-gold font-light mb-3">
              ADMIN ACCESS
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Sign In
            </h1>
            <div className="w-12 h-px bg-gold mx-auto mt-4" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs tracking-cinematic font-light text-muted-foreground mb-2"
              >
                EMAIL
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-background/50 border border-border/50 text-foreground text-sm font-light tracking-wide focus:outline-none focus:border-gold cinematic-transition placeholder:text-muted-foreground/50"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs tracking-cinematic font-light text-muted-foreground mb-2"
              >
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cinematic-transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  SIGNING IN...
                </>
              ) : (
                "SIGN IN"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 font-light mt-6">
          Admin access only. Unauthorized access is prohibited.
        </p>
      </motion.div>
    </div>
  );
}
