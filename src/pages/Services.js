import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import {
  FiEye,
  FiSearch,
  FiMonitor,
  FiBox,
  FiCode,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";

const Services = () => {
  const [ref1, inView1] = useInView({ threshold: 0.1, triggerOnce: true });
  const [ref2, inView2] = useInView({ threshold: 0.1, triggerOnce: true });

  const services = [
    {
      id: "ai-vision",
      icon: <FiEye className="text-4xl" />,
      title: "Computer Vision Solutions",
      description:
        "Custom AI model development for enterprise-grade computer vision applications",
      features: [
        "Image recognition & object detection",
        "Real-time video analytics",
        "Custom AI model training",
        "Edge computing solutions",
        "OCR and document processing",
      ],
      bgColor: "from-blue-600 to-cyan-600",
      case: "A well-established virtual try-on company.",
    },
    {
      id: "visual-search",
      icon: <FiSearch className="text-4xl" />,
      title: "Visual Search & Product Recognition",
      description:
        "AI-powered visual search engines for e-commerce and industrial applications",
      features: [
        "Similar product matching",
        "Replacement parts identification",
        "Multi-category support",
        "Real-time recommendations",
        "API integration",
      ],
      bgColor: "from-purple-600 to-pink-600",
      case: "Helps customers find AC filters and spare parts",
    },
    {
      id: "monitoring",
      icon: <FiMonitor className="text-4xl" />,
      title: "Smart Monitoring Systems",
      description:
        "IoT-enabled monitoring solutions for industrial and enterprise applications",
      features: [
        "Machine status tracking",
        "Predictive maintenance",
        "Power consumption analytics",
        "Real-time alerts",
        "Custom dashboard development",
      ],
      bgColor: "from-orange-600 to-red-600",
      case: "Reduced manufacturing downtime by 60%",
    },
    {
      id: "ar-vr",
      icon: <FiBox className="text-4xl" />,
      title: "AR/VR Solutions",
      description:
        "Immersive augmented and virtual reality experiences for retail and training",
      features: [
        "Virtual Try-On technology",
        "AR product visualization",
        "3D modeling and rendering",
        "Training simulations",
        "Interactive experiences",
      ],
      bgColor: "from-green-600 to-teal-600",
      case: "AR-based pharmacy search solution",
    },
    {
      id: "consulting",
      icon: <FiCode className="text-4xl" />,
      title: "AI Integration & Consulting",
      description:
        "End-to-end AI implementation and digital transformation consulting",
      features: [
        "AI strategy development",
        "Technology stack selection",
        "Cloud infrastructure setup",
        "Team training & support",
        "Performance optimization",
      ],
      bgColor: "from-indigo-600 to-blue-600",
      case: "100+ successful AI implementations",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container-custom relative z-10 text-center"
        >
          <h1 className="text-5xl lg:text-6xl font-bold mb-6">Our Solutions</h1>
          <p className="text-xl lg:text-2xl text-gray-200 max-w-4xl mx-auto">
            Comprehensive AI and Computer Vision solutions tailored to transform
            your business operations
          </p>
        </motion.div>
      </section>

      {/* Services Grid */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            ref={ref1}
            initial={{ opacity: 0 }}
            animate={inView1 ? { opacity: 1 } : {}}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 50 }}
                animate={inView1 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover-lift"
              >
                <div
                  className={`bg-gradient-to-r ${service.bgColor} p-6 text-white`}
                >
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                  <p className="text-white/90">{service.description}</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <FiCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Success Story:</strong> {service.case}
                    </p>
                  </div>
                  <Link
                    to={`/demo/${service.id}`}
                    className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
                  ></Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-padding bg-white">
        <motion.div
          ref={ref2}
          initial={{ opacity: 0 }}
          animate={inView2 ? { opacity: 1 } : {}}
          className="container-custom"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A systematic approach to delivering AI excellence
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Discovery",
                desc: "Understanding your business needs and challenges",
              },
              {
                step: "02",
                title: "Design",
                desc: "Creating custom AI solutions tailored to your requirements",
              },
              {
                step: "03",
                title: "Development",
                desc: "Building and testing robust AI models and systems",
              },
              {
                step: "04",
                title: "Deployment",
                desc: "Seamless integration and ongoing support",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={inView2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl font-bold text-blue-900 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Let's discuss how our AI and Computer Vision services can accelerate
            your growth
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Get Started Today <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Services;
