import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookOpen, FiUsers, FiShield, FiCpu, FiArrowRight } from 'react-icons/fi';

const ProductShowcase = () => {
  const [activeProduct, setActiveProduct] = useState(0);

  const products = [
    {
      id: 'pulseai-k12',
      name: 'PulseAI K-12',
      icon: <FiBookOpen className="text-3xl" />,
      description: 'AI curriculum for schools, aligned to NCERT (Grades 1-9). Paying customers today.',
      features: ['NCERT-aligned curriculum', 'Grades 1-9', 'Delivered to partner schools'],
      demoLink: 'https://pulseai.school',
      image: 'pulseai.school'
    },
    {
      id: 'entry-exit',
      name: 'Entry-Exit',
      icon: <FiShield className="text-3xl" />,
      description: 'Face-recognition access control and surveillance. Paying customers today.',
      features: ['Facial recognition check-in/out', 'Real-time visitor tracking', 'Security alerts'],
      demoLink: 'https://entry-exit.ivislabs.in/',
      image: 'entry-exit.ivislabs.in'
    },
    {
      id: 'netted',
      name: 'Netted',
      icon: <FiUsers className="text-3xl" />,
      description: 'Hiring credibility platform - "CIBIL for hiring." Currently an MVP.',
      features: ['Credibility scoring for hiring decisions'],
      demoLink: '/products#netted',
      image: 'Hiring credibility platform'
    },
    {
      id: 'oota',
      name: 'OOTA',
      icon: <FiCpu className="text-3xl" />,
      description: 'Safety-critical home cooking robotics platform, supervised remotely from a phone. Patent filed.',
      features: ['Remote supervision from a phone', 'Safety-critical robotics design'],
      demoLink: '/products#oota',
      image: 'Home cooking robotics'
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
            {products[activeProduct].demoLink.startsWith('http') ? (
              <a
                href={products[activeProduct].demoLink}
                className="inline-flex items-center px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <span>Know More</span>
                <FiArrowRight className="ml-2" />
              </a>
            ) : (
              <Link
                to={products[activeProduct].demoLink}
                className="inline-flex items-center px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <span>Know More</span>
                <FiArrowRight className="ml-2" />
              </Link>
            )}
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
