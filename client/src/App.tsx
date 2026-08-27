import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";

// Load route code on demand so mobile visitors do not pay for galleries and private tools they never open.
const NotFound = lazy(() => import("./pages/NotFound"));
const Home = lazy(() => import("./pages/Home"));
const Photos = lazy(() => import("./pages/Photos"));
const Destinations = lazy(() => import("./pages/Destinations"));
const Video = lazy(() => import("./pages/Video"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Journal = lazy(() => import("./pages/Journal"));
const Edit = lazy(() => import("./pages/Edit"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Sales = lazy(() => import("./pages/Sales"));
const ProductPhotography = lazy(() => import("./pages/ProductPhotography"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const Login = lazy(() => import("./pages/Login"));
const DataSecurityIncidentNotice = lazy(() => import("./pages/DataSecurityIncidentNotice"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Duke = lazy(() => import("./pages/Duke"));
const Agency = lazy(() => import("./pages/Agency"));
const PhotoVideoSync = lazy(() => import("./pages/PhotoVideoSync"));
const SyncSharePage = lazy(() => import("./pages/SyncSharePage"));

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Auth pages have their own layout */}
      <Route path="/login" component={Login} />
      {/* Edit pages have their own layout (no header/footer) */}
      <Route path="/edit" component={Edit} />
      {/* Duke - password-protected private collection (own layout) */}
      <Route path="/duke" component={Duke} />
      {/* Agency - password-protected agency database (own layout) */}
      <Route path="/agency" component={Agency} />
      {/* Photo/Video Sync Sheet - production tool (own layout) */}
      <Route path="/sync" component={PhotoVideoSync} />
      {/* Legacy redirect: old URL still works */}
      <Route path="/photo-video-sync" component={PhotoVideoSync} />
      {/* Share links - public/protected file share pages */}
      <Route path="/share/:token" component={SyncSharePage} />
      {/* All other pages use the standard Layout */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/photos" component={Photos} />
            <Route path="/destinations" component={Destinations} />
            <Route path="/video" component={Video} />
            <Route path="/about" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/journal" component={Journal} />
            <Route path="/blog" component={Blog} />
            <Route path="/blog/:slug" component={BlogPost} />
            <Route path="/sales" component={Sales} />
            <Route path="/product-photography" component={ProductPhotography} />
            <Route path="/sales/success" component={CheckoutSuccess} />
            <Route path="/sales/:slug" component={ProductDetail} />
            <Route path="/data-security-incident-notice" component={DataSecurityIncidentNotice} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
