import React from "react";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiLinkedin,
  FiInstagram,
  FiArrowRight,
} from "react-icons/fi";

const Footer = () => {
  // const currentYear = new Date().getFullYear();

  const footerLinks = {
    services: [
      { name: "Manufacturing Intelligence", path: "/services#manufacturing-intelligence" },
      { name: "Retail Visual AI", path: "/services#retail-visual-ai" },
      { name: "Computer Vision Services", path: "/services#computer-vision-services" },
      { name: "AI & CV Consulting", path: "/services#ai-cv-consulting" },
    ],
    products: [
      { name: "Entry-Exit", path: "/products#entry-exit" },
      { name: "Netted", path: "/products#netted" },
      { name: "Campus Hiring Platform", path: "/products#campus-hiring-platform" },
      { name: "OOTA", path: "/products#oota" },
    ],
    edtech: [
      { name: "PulseAI K-12", path: "https://pulseai.school", external: true },
      { name: "Pulse Academy", path: "https://academy.pulseai.school", external: true },
      { name: "Training & Internships", path: "/services#training" },
    ],
    company: [
      { name: "About Us", path: "/about" },
      { name: "Careers", path: "/careers" },
      { name: "Blog", path: "/blog" },
      { name: "Contact", path: "/contact" },
    ],
  };

  return (
    <footer className="bg-gradient-to-b from-blue-900 to-black text-white">
      {/* Main Footer Content */}
      <div className="container-custom py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span
                className="text-xl font-bold"
                style={{ fontFamily: "Expletus Sans, sans-serif" }}
              >
                IVIS LABS
              </span>
            </div>
            <p className="text-gray-400 mb-6 text-sm sm:text-base">
              Intelligent Vision Labs - Pioneering AI and Computer Vision
              solutions for enterprise transformation.
            </p>
            <div className="space-y-3">
              <a
                href="mailto:contact@ivislabs.com"
                className="flex items-center text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
              >
                <FiMail className="mr-3 flex-shrink-0" />
                <span className="break-all">contact@ivislabs.com</span>
              </a>
              <a
                href="tel:+916364411444"
                className="flex items-center text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
              >
                <FiPhone className="mr-3 flex-shrink-0" />
                +91 6364411444
              </a>
              <a
                href="tel:+919449963312"
                className="flex items-center text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
              >
                <FiPhone className="mr-3 flex-shrink-0" />
                <span>+91 9449963312 (EdTech and Learning)</span>
              </a>
              <div className="flex items-start text-gray-400 text-sm sm:text-base">
                <FiMapPin className="mr-3 mt-1 flex-shrink-0" />
                <span>
                  113/A First Floor, Temple Road, Jayalakshmipuram, Mysuru
                  570012
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-4">
              Services
            </h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center group text-sm sm:text-base"
                  >
                    <span>{link.name}</span>
                    <FiArrowRight className="ml-1 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-4">
              Products
            </h3>
            <ul className="space-y-2">
              {footerLinks.products.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center group text-sm sm:text-base"
                  >
                    <span>{link.name}</span>
                    <FiArrowRight className="ml-1 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* PulseAI / Pulse Academy */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-4">
              PulseAI &amp; Academy
            </h3>
            <ul className="space-y-2">
              {footerLinks.edtech.map((link) =>
                link.external ? (
                  <li key={link.path}>
                    <a
                      href={link.path}
                      className="text-gray-400 hover:text-white transition-colors inline-flex items-center group text-sm sm:text-base"
                    >
                      <span>{link.name}</span>
                      <FiArrowRight className="ml-1 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                    </a>
                  </li>
                ) : (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-gray-400 hover:text-white transition-colors inline-flex items-center group text-sm sm:text-base"
                    >
                      <span>{link.name}</span>
                      <FiArrowRight className="ml-1 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center group text-sm sm:text-base"
                  >
                    <span>{link.name}</span>
                    <FiArrowRight className="ml-1 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Subscribe to our Newsletter
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Stay updated with the latest in AI and Computer Vision
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:outline-none focus:bg-gray-700 transition-colors text-sm sm:text-base"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-900 to-black text-white rounded-lg sm:rounded-l-none sm:rounded-r-lg hover:shadow-lg transform hover:scale-105 transition-all whitespace-nowrap text-sm sm:text-base">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-black/50 py-6 px-4 sm:px-6 lg:px-20">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
              © IVIS LABS Private Limited. All rights reserved.
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <Link
                  to="/privacy"
                  className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors whitespace-nowrap"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors whitespace-nowrap"
                >
                  Terms of Service
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="https://www.linkedin.com/company/ivislabs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiLinkedin className="text-lg sm:text-xl" />
                </a>
                <a
                  href="https://www.instagram.com/ivislabs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiInstagram className="text-lg sm:text-xl" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
