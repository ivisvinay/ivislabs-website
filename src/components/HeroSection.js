import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiPlay, FiCode, FiEye, FiCpu } from 'react-icons/fi';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Champions Evolve.",
      subtitle: "DIGITAL-FIRST | ON-PREM | AI-FIRST",
      description: "Pioneering Computer Vision and AI solutions that transform businesses",
      bgClass: "from-black via-blue-900 to-black",
      cta: "Explore Solutions",
      link: "/services"
    },
    {
      title: "The Future is Visual",
      subtitle: "Computer Vision | Deep Learning | Real-time Analytics",
      description: "From Virtual Try-On to Industrial IoT - We make AI work for you",
      bgClass: "from-purple-900 via-pink-800 to-purple-900",
      cta: "View Products",
      link: "/products"
    },
    {
      title: "Empowering Talent Transformations",
      subtitle: "EdTech | Academy | Training",
      description: "Bridging the skill gap with industry-focused AI education",
      bgClass: "from-teal-900 via-cyan-800 to-teal-900",
      cta: "Join Academy",
      link: "/academy"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].bgClass} transition-all duration-1000`}></div>
        
        {/* Animated particles/dots */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              animate={{
                x: [0, Math.random() * 400 - 200],
                y: [0, Math.random() * 400 - 200],
                scale: [1, Math.random() * 2 + 0.5, 1],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/50"></div>

        {/* Animated Wave Pattern */}
        <svg 
          className="absolute bottom-0 w-full h-32 opacity-30"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="url(#gradient)"
            animate={{
              d: [
                "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                "M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Content */}
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            <motion.h1 
              className="text-5xl lg:text-7xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {slides[currentSlide].title}
            </motion.h1>
            
            <motion.p 
              className="text-lg lg:text-xl mb-6 text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {slides[currentSlide].subtitle}
            </motion.p>
            
            <motion.p 
              className="text-xl lg:text-2xl mb-8 text-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {slides[currentSlide].description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <Link 
                to={slides[currentSlide].link}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all inline-flex items-center"
              >
                {slides[currentSlide].cta}
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              {/* <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-lg font-semibold hover:bg-white/20 transition-all inline-flex items-center border border-white/30">
                <FiPlay className="mr-2" />
                Watch Demo
              </button> */}
            </motion.div>

            {/* Slide indicators */}
            <div className="flex gap-2 mt-12">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide ? 'w-12 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Right side - Animated graphics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full h-[500px]">
              {/* Floating icons representing services */}
              <motion.div
                animate={{ 
                  y: [0, -30, 0],
                  rotate: [0, 10, 0]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-1/4  left-1/4 bg-gradient-to-br from-teal-700 to-teal-700 p-6 rounded-2xl shadow-2xl"
              >
                <FiEye className="text-4xl text-white" />
                <p className="text-white mt-2 text-sm font-semibold">Computer Vision</p>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, 30, 0],
                  rotate: [0, -10, 0]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute top-1/3 right-1/4 bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-2xl shadow-2xl"
              >
                <FiCpu className="text-4xl text-white" />
                <p className="text-white mt-2 text-sm font-semibold">AI Solutions</p>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, -25, 0],
                  rotate: [0, 15, 0]
                }}
                transition={{ 
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
                className="absolute bottom-1/4 left-1/3 bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl shadow-2xl"
              >
                <FiCode className="text-4xl text-white" />
                <p className="text-white mt-2 text-sm font-semibold">EdTech</p>
              </motion.div>

              {/* Central glow effect */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
