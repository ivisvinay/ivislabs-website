import React, { useEffect, useState } from "react";
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

// ✅ Auto-scroll helper component
const ScrollToTopOnNavigation = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
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
      <div className="App min-h-screen bg-white">
        <ScrollToTopOnNavigation /> {/* 👈 Auto scroll on route change */}
        <Navbar />
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
          </Routes>
        </AnimatePresence>
        <Footer />
        <ChatWidget />
        <ScrollToTop /> {/* 👈 Keeps your manual floating button */}
      </div>
    </Router>
  );
}

export default App;
