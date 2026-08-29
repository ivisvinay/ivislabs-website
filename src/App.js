import React, { useEffect, useState, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import ScrollToTop from "./components/ScrollToTop";
import Loader from "./components/Loader";

// Pages
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Products from "./pages/Products";
import Pulse from "./pages/Pulse";
import Academy from "./pages/Academy";
import About from "./pages/About";
import Blog from "./pages/Blog";
import CaseStudies from "./pages/CaseStudies";
import Careers from "./pages/Careers";

// Admin console (and its PDF libraries) are only loaded when /admin is visited,
// keeping the public bundle small.
const Admin = lazy(() => import("./pages/Admin"));

// ✅ Auto-scroll helper component
const ScrollToTopOnNavigation = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Inner shell so we can read the current route and hide the public
// chrome (navbar, footer, chat) on the standalone /admin console.
const AppShell = () => {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="App min-h-screen bg-white">
      <ScrollToTopOnNavigation />
      {!isAdmin && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/products" element={<Products />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/edtech" element={<Pulse />} />
          <Route path="/blog" element={<Blog />} />
          {/* {/<Route path="/blog/:id" element={<BlogPost />} />/} */}
          <Route path="/case-studies" element={<CaseStudies />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/careers" element={<Careers />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}>
                <Admin />
              </Suspense>
            }
          />
        </Routes>
      </AnimatePresence>
      {!isAdmin && <Footer />}
      {!isAdmin && <ChatWidget />}
      {!isAdmin && <ScrollToTop />}
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
