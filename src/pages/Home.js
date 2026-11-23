import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  FiArrowRight, FiMonitor, FiCpu, FiEye, FiBox, 
  FiUsers, FiTarget, FiTrendingUp, FiAward 
} from 'react-icons/fi';
import HeroSection from '../components/HeroSection';
import ServiceCard from '../components/ServiceCard';
import ProductShowcase from '../components/ProductShowcase';
import ClientLogos from '../components/ClientLogos';
import StatsCounter from '../components/StatsCounter';
import TestimonialSlider from '../components/TestimonialSlider';

const Home = () => {
  const [ref1, inView1] = useInView({ threshold: 0.1, triggerOnce: true });
  const [ref2, inView2] = useInView({ threshold: 0.1, triggerOnce: true });
  const [ref3, inView3] = useInView({ threshold: 0.1, triggerOnce: true });
  const [ref4, inView4] = useInView({ threshold: 0.1, triggerOnce: true });

  const services = [
    {
      icon: <FiMonitor className="text-3xl" />,
      title: "Manufacturing Intelligence",
      description: "CNC/MTConnect integration with OEE analytics for shop floors",
      color: "from-purple-500 to-pink-500",
      link: "/services#manufacturing-intelligence"
    },
    {
      icon: <FiEye className="text-3xl" />,
      title: "Retail Visual AI",
      description: "Computer-vision analytics for stores",
      color: "from-blue-500 to-cyan-500",
      link: "/services#retail-visual-ai"
    },
    {
      icon: <FiBox className="text-3xl" />,
      title: "Computer Vision Services",
      description: "Including virtual try-ons, for clients such as KIKSARVR",
      color: "from-orange-500 to-red-500",
      link: "/services#computer-vision-services"
    },
    {
      icon: <FiCpu className="text-3xl" />,
      title: "AI & CV Consulting",
      description: "Problem scoping, proof-of-concept builds and deployment advice",
      color: "from-green-500 to-teal-500",
      link: "/services#ai-cv-consulting"
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section with animated background */}
      <HeroSection />

      {/* Navigate Your Next Section - Blue Theme */}
      <section className="section-padding bg-gradient-to-br from-yellow-500 to-yellow-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400 rounded-full filter blur-3xl"></div>
        </div>
        
        <motion.div 
          ref={ref1}
          initial={{ opacity: 0, y: 50 }}
          animate={inView1 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="container-custom relative z-10"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Navigate Your Next
                <span className="block text-gray-900 mt-2">Digital Transformation</span>
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                We bring powerful AI and Computer Vision solutions to accelerate your business growth. 
                From pioneering Virtual Try-On technology to industrial IoT monitoring.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/services" className="btn-primary bg-white text-blue-700 hover:bg-gray-100">
                  Explore Services <FiArrowRight className="inline ml-2" />
                </Link>
                <Link to="/case-studies" className="btn-secondary bg-transparent border-white text-white hover:bg-white hover:text-blue-700">
                  View Case Studies
                </Link>
              </div>
            </div>
            <div className="relative">
              <motion.div 
                animate={{ 
                  y: [0, -20, 0],
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">2021</div>
                    <div className="text-sm text-blue-200">Founded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">8+</div>
                    <div className="text-sm text-blue-200">Products Built</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">4</div>
                    <div className="text-sm text-blue-200">Product Domains</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">24/7</div>
                    <div className="text-sm text-blue-200">Monitoring</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Services Section - Purple Theme */}
      <section className="section-padding bg-gradient-to-br from-indigo-600 via-blue-900 to-indigo-600 text-white relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-72 h-72 bg-pink-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl"></div>
        </div>

        <motion.div 
          ref={ref2}
          initial={{ opacity: 0 }}
          animate={inView2 ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="container-custom relative z-10"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Our Core Services</h2>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Bridging the gap between cutting-edge AI research and practical enterprise applications
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={inView2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ServiceCard {...service} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Products Showcase - Orange Theme */}
      <section className="section-padding bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400 rounded-full filter blur-3xl"></div>
        </div>

        <motion.div 
          ref={ref3}
          initial={{ opacity: 0 }}
          animate={inView3 ? { opacity: 1 } : {}}
          className="container-custom relative z-10"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Our Products</h2>
            <p className="text-xl text-orange-100 max-w-3xl mx-auto">
              Innovative AI-powered solutions ready to transform your business
            </p>
          </div>

          <ProductShowcase />
        </motion.div>
      </section>

      {/* PulseAI & Pulse Academy Section - Teal Theme */}
      <section className="section-padding bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 text-white relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl center lg:text-5xl font-bold mb-4">PulseAI &amp; Pulse Academy</h2>
        </div>
        <motion.div
          ref={ref4}
          initial={{ opacity: 0 }}
          animate={inView4 ? { opacity: 1 } : {}}
          className="container-custom relative z-10"
        >
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={inView4 ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <h3 className="text-3xl font-bold mb-4">PulseAI</h3>
              <p className="text-lg text-cyan-100 mb-6">
                K-12 and engineering education products, from NCERT-aligned AI
                curricula to interactive engineering labs
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <FiTarget className="mr-3 text-cyan-300" />
                  <span>PulseAI K-12: NCERT-aligned AI curriculum (Grades 1-9)</span>
                </li>
                <li className="flex items-center">
                  <FiUsers className="mr-3 text-cyan-300" />
                  <span>FUNgineering: interactive engineering labs for colleges</span>
                </li>
                <li className="flex items-center">
                  <FiTrendingUp className="mr-3 text-cyan-300" />
                  <span>Edu-Square OS: AI-powered school operating system</span>
                </li>
              </ul>
              <a href="https://pulseai.school" className="btn-secondary bg-white text-teal-700 hover:bg-gray-100">
                Explore PulseAI <FiArrowRight className="inline ml-2" />
              </a>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={inView4 ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <h3 className="text-3xl font-bold mb-4">Pulse Academy</h3>
              <p className="text-lg text-cyan-100 mb-6">
                Skill-building programs for students, faculty, schools and companies
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <FiAward className="mr-3 text-cyan-300" />
                  <span>Technical training & FDPs for colleges</span>
                </li>
                <li className="flex items-center">
                  <FiCpu className="mr-3 text-cyan-300" />
                  <span>Corporate training (Deloitte, Sigmoid)</span>
                </li>
                <li className="flex items-center">
                  <FiUsers className="mr-3 text-cyan-300" />
                  <span>B2C courses & the Integrated Tech Mastery Program</span>
                </li>
              </ul>
              <a href="https://academy.pulseai.school" className="btn-secondary bg-white text-teal-700 hover:bg-gray-100">
                Join Academy <FiArrowRight className="inline ml-2" />
              </a>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <StatsCounter />

      {/* Clients & Testimonials */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-teal-900 mb-4">Trusted by Our Partners</h2>
            <p className="text-xl text-teal-900">What our clients and collaborators say about working with us</p>
          </div>
          <ClientLogos />
          <div className="mt-16">
            <TestimonialSlider />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-yellow-600 to-black text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Transform Your Business with AI?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Let's discuss how our AI and Computer Vision solutions can accelerate your digital transformation
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/contact" className="btn-primary bg-white text-blue-700 hover:bg-gray-100">
                Get Started <FiArrowRight className="inline ml-2" />
              </Link>
              {/* <Link to="/demo/visual-search" className="btn-secondary bg-transparent border-white text-white hover:bg-white hover:text-blue-700">
                Try Our Demo
              </Link> */}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
