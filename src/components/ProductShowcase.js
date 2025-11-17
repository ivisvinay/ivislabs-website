import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMonitor, FiSearch, FiUsers, FiMessageSquare, FiShoppingBag, FiArrowRight } from 'react-icons/fi';

const ProductShowcase = () => {
  const [activeProduct, setActiveProduct] = useState(0);

  const products = [
    {
      id: 'visual-search',
      name: 'Visual Search Engine',
      icon: <FiSearch className="text-3xl" />,
      description: 'AI-powered image search for e-commerce product discovery and replacement parts matching',
      features: ['Deep learning algorithms', 'Real-time matching', 'Multi-category support'],
      demoLink: 'https://recommender.ivislabs.in/',
      image: 'recommender.ivislabs.in'
    },
    {
      id: 'machine-monitor',
      name: 'Machine Shop Monitor',
      icon: <FiMonitor className="text-3xl" />,
      description: 'Real-time industrial machine monitoring with predictive maintenance alerts',
      features: ['IoT sensor integration', 'Power consumption analytics', 'Predictive maintenance'],
      demoLink: 'https://machineshop.ivislabs.in/',
      image: 'machineshop.ivislabs.in'
    },
    {
      id: 'entry-exit',
      name: 'Entry-Exit System',
      icon: <FiUsers className="text-3xl" />,
      description: 'Smart access control and attendance monitoring with facial recognition',
      features: ['Automated registration', 'Real-time analytics', 'Visitor tracking'],
      demoLink: 'https://entry-exit.ivislabs.in/',
      image: 'entry-exit.ivislabs.in'
    },
    {
      id: 'sereno',
      name: 'Sereno Platform',
      icon: <FiMessageSquare className="text-3xl" />,
      description: 'Enterprise communication and collaboration platform for teams',
      features: ['Team chat', 'Ticket management', 'Polls & announcements'],
      demoLink: 'https://sereno.ivislabs.in/',
      image: 'Enterprise platform'
    },
    {
      id: 'pharmacy',
      name: 'AR Pharmacy Search',
      icon: <FiShoppingBag className="text-3xl" />,
      description: 'Augmented reality based retail search solution for pharmacies',
      features: ['AR visualization', 'Product location', 'Inventory tracking'],
      demoLink: 'https://pharmacy.ivislabs.in/',
      image: 'pharmacy.ivislabs.in'
    }
  ];

  return (
    <div className="relative">
      {/* Product Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {products.map((product, index) => (
          <motion.button
            key={product.id}
            onClick={() => setActiveProduct(index)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeProduct === index
                ? 'bg-white text-orange-600 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {product.name}
          </motion.button>
        ))}
      </div>

      {/* Product Display */}
      <motion.div
        key={activeProduct}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/20"
      >
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl mb-6">
              {products[activeProduct].icon}
            </div>
            <h3 className="text-3xl font-bold mb-4">{products[activeProduct].name}</h3>
            <p className="text-lg text-orange-100 mb-6">
              {products[activeProduct].description}
            </p>
            <div className="space-y-3 mb-8">
              {products[activeProduct].features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center"
                >
                  <div className="w-2 h-2 bg-orange-300 rounded-full mr-3"></div>
                  <span className="text-white">{feature}</span>
                </motion.div>
              ))}
            </div>
            <Link
              to={products[activeProduct].demoLink}
              className="inline-flex items-center px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <span>Know More</span>
              <FiArrowRight className="ml-2" />
            </Link>
          </div>
          <div className="relative">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-8 backdrop-blur-sm border border-white/10"
            >
              <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚀</div>
                  <p className="text-xl font-semibold text-white">
                    {products[activeProduct].image}
                  </p>
                  <p className="text-sm text-orange-200 mt-2">Live Demo Available</p>
                </div>
              </div>
            </motion.div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full filter blur-2xl opacity-30"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-red-400 to-pink-500 rounded-full filter blur-2xl opacity-30"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductShowcase;
