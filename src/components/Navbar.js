import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiChevronDown, FiSearch } from "react-icons/fi";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    {
      name: "Services",
      path: "/services",
    },
    {
      name: "Products",
      path: "/products",
      // dropdown: [
      //   { name: 'Visual Search Engine', path: '/demo/visual-search' },
      //   { name: 'Machine Shop Monitor', path: '/demo/machine-monitor' },
      //   { name: 'Entry-Exit System', path: '/demo/entry-exit' },
      //   { name: 'Sereno Platform', path: '/demo/sereno' },
      //   { name: 'AR Pharmacy Search', path: '/demo/pharmacy' },
      // ]
    },
    {
      name: "EdTech",
      path: "/edtech",
      // dropdown: [
      //   { name: "CodeIdea", path: "/edtech#codeidea" },
      //   { name: "PulseAI", path: "/edtech#pulseai" },
      //   { name: "EduCareAI", path: "/edtech#educare" },
      //   { name: "School ERP", path: "/edtech#school-erp" },
      // ],
    },
    {
      name: "Academy",
      // path: "/academy",
      path: "https://pulse.ivislabs.com/",
      external: true,
      // dropdown: [
      //   { name: "Industry Training", path: "/academy#industry" },
      //   { name: "AI/Robotics for K-12", path: "/academy#k12" },
      //   { name: "Corporate Programs", path: "/academy#corporate" },
      //   { name: "Certifications", path: "/academy#certifications" },
      // ],
    },
    {
      name: "About",
      path: "/about",
    },
    {
      name: "Resources",
      path: "#",
      dropdown: [
        { name: "Blog", path: "/blog" },
        { name: "Case Studies", path: "/case-studies" },
      ],
    },
  ];

  return (
    <>
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-gray-100 shadow-lg py-2" : "bg-transparent py-4"
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center"
              >
                <span
                  className={`ml-2 text-xl font-bold ${
                    scrolled ? "text-blue-900" : "text-white"
                  }`}
                  style={{ fontFamily: "Expletus Sans, sans-serif" }}
                >
                  IVIS LABS
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <div
                  key={index}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(index)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-1 font-medium transition-colors ${
                      scrolled
                        ? "text-gray-700 hover:text-blue-600"
                        : "text-white hover:text-blue-200"
                    } ${
                      location.pathname === item.path ? "text-blue-600" : ""
                    }`}
                  >
                    <span>{item.name}</span>
                    {item.dropdown && <FiChevronDown className="text-sm" />}
                  </Link>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {activeDropdown === index && item.dropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 border border-gray-100"
                      >
                        {item.dropdown.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                className={`p-2 rounded-lg transition-colors ${
                  scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"
                }`}
              >
                <FiSearch
                  className={`text-xl ${
                    scrolled ? "text-gray-700" : "text-white"
                  }`}
                />
              </button>
              <Link
                to="/contact"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-900 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Contact Us
              </Link>
              <Link
                to="/careers"
                className={`px-4 py-2 border-2 rounded-lg transition-all ${
                  scrolled
                    ? "border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600"
                    : "border-white text-white hover:bg-white hover:text-gray-800"
                }`}
              >
                Careers
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2"
            >
              {isOpen ? (
                <FiX
                  className={`text-2xl ${
                    scrolled ? "text-gray-700" : "text-white"
                  }`}
                />
              ) : (
                <FiMenu
                  className={`text-2xl ${
                    scrolled ? "text-gray-700" : "text-white"
                  }`}
                />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween" }}
            className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-40 overflow-y-auto"
          >
            <div className="p-6 pt-20">
              {navItems.map((item, index) => (
                <div key={index} className="mb-4">
                  <Link
                    to={item.path}
                    className="block text-lg font-semibold text-gray-800 mb-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.dropdown && (
                    <div className="ml-4 space-y-2">
                      {item.dropdown.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className="block text-sm text-gray-600 hover:text-blue-600"
                          onClick={() => setIsOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-8 space-y-4">
                <Link
                  to="/contact"
                  className="block w-full text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Contact Us
                </Link>
                <Link
                  to="/careers"
                  className="block w-full text-center px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Careers
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
