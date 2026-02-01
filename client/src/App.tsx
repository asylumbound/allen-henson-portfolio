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
import Layout from "./components/Layout";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Edit page has its own layout (no header/footer) */}
      <Route path="/edit" component={Edit} />
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
