import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Photos from "./pages/Photos";
import Video from "./pages/Video";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Journal from "./pages/Journal";
import Edit from "./pages/Edit";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Sales from "./pages/Sales";
import ProductPhotography from "./pages/ProductPhotography";
import ProductDetail from "./pages/ProductDetail";
import ProductEdit from "./pages/ProductEdit";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Login from "./pages/Login";
import DataSecurityIncidentNotice from "./pages/DataSecurityIncidentNotice";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Duke from "./pages/Duke";
import Layout from "./components/Layout";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Auth pages have their own layout */}
      <Route path="/login" component={Login} />
      {/* Edit pages have their own layout (no header/footer) */}
      <Route path="/edit" component={Edit} />
      <Route path="/product_edit" component={ProductEdit} />
      {/* Duke - password-protected private collection (own layout) */}
      <Route path="/duke" component={Duke} />
      {/* All other pages use the standard Layout */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/photos" component={Photos} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
