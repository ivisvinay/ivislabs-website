import React, { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import CategoryFilter from "../components/CategoryFilter";
import {
  FiEye,
  FiSearch,
  FiDatabase,
  FiImage,
  FiCode,
  FiCpu,
  FiMonitor,
  FiLayers,
  FiBookOpen,
  FiCheck,
  FiArrowRight,
  FiAward,
  FiUsers,
  FiBriefcase,
} from "react-icons/fi";

// Solution categories ordered by proven traction (real deployments/case studies first)
const SOLUTION_CATEGORIES = ["All", "EdTech", "Manufacturing", "Retail", "Business"];

const Services = () => {
  const [activeSolutionCategory, setActiveSolutionCategory] = useState("All");
  const [ref1, inView1] = useInView({ threshold: 0.1, triggerOnce: true });
  const [ref2, inView2] = useInView({ threshold: 0.1, triggerOnce: true });
  const [ref3, inView3] = useInView({ threshold: 0.1, triggerOnce: true });
  const [ref4, inView4] = useInView({ threshold: 0.1, triggerOnce: true });

  // 2 · Solutions - AI and software systems built around a client's specific problem
  const solutions = [
    {
      id: "manufacturing-intelligence",
      category: "Manufacturing",
      icon: <FiMonitor className="text-4xl" />,
      title: "Manufacturing Intelligence",
      description:
        "CNC/MTConnect integration with OEE analytics for shop floors.",
      features: [
        "CNC & MTConnect integration",
        "OEE (Overall Equipment Effectiveness) analytics",
        "Shop-floor visibility & reporting",
      ],
      bgColor: "from-orange-600 to-red-600",
    },
    {
      id: "retail-visual-ai",
      category: "Retail",
      icon: <FiEye className="text-4xl" />,
      title: "Retail Visual AI",
      description: "Computer-vision analytics for stores.",
      features: [
        "In-store computer-vision analytics",
        "Custom retail deployments",
      ],
      bgColor: "from-blue-600 to-cyan-600",
    },
    {
      id: "business-crm",
      category: "Business",
      icon: <FiLayers className="text-4xl" />,
      title: "Business CRM",
      description:
        "From conventional CRM systems to advanced, customized AI-powered solutions, including moving clients' existing data onto the new platform.",
      features: [
        "Conventional to AI-powered CRM upgrades",
        "Custom CRM builds",
        "Data migration from legacy systems",
      ],
      bgColor: "from-indigo-600 to-blue-600",
    },
    {
      id: "academy-management-platform",
      category: "EdTech",
      icon: <FiAward className="text-4xl" />,
      title: "Academy Management Platform",
      description: "A multi-tenant system for running multi-centre academies.",
      features: [
        "Multi-tenant architecture",
        "Built for multi-centre training academies",
      ],
      bgColor: "from-purple-600 to-pink-600",
    },
    {
      id: "university-learning-platforms",
      category: "EdTech",
      icon: <FiBookOpen className="text-4xl" />,
      title: "University Learning Platforms",
      description:
        "For example, a lab explainer in two languages built for Mangalore University's BCA programme.",
      features: [
        "Custom learning platforms for universities",
        "Bilingual lab explainer for Mangalore University's BCA programme",
      ],
      bgColor: "from-green-600 to-teal-600",
    },
  ];

  // 3 · Services - Project work delivered by the IVIS LABS team
  const services = [
    {
      id: "computer-vision-services",
      icon: <FiEye className="text-4xl" />,
      title: "Computer Vision Services",
      description:
        "Including virtual try-ons, for clients such as KIKSARVR.",
      features: [
        "Virtual try-on development",
        "Custom computer-vision pipelines",
      ],
      bgColor: "from-blue-600 to-cyan-600",
      case: "Virtual try-on work delivered for clients such as KIKSARVR.",
    },
    {
      id: "data-annotation",
      icon: <FiDatabase className="text-4xl" />,
      title: "Data Annotation",
      description: "Labelling images and video for training AI models.",
      features: [
        "Image & video labelling",
        "Dataset preparation for model training",
      ],
      bgColor: "from-purple-600 to-pink-600",
      case: "Annotation pipelines supporting AI model training for clients.",
    },
    {
      id: "brand-removal",
      icon: <FiImage className="text-4xl" />,
      title: "Brand Removal from Product Images",
      description: "For white labelling.",
      features: ["Automated brand removal", "White-labelling support"],
      bgColor: "from-orange-600 to-red-600",
      case: "Used by clients to prepare product imagery for white-label resale.",
    },
    {
      id: "custom-software-development",
      icon: <FiCode className="text-4xl" />,
      title: "Custom Software & App Development",
      description:
        "For example, a Flutter app for dealer service contracts (AMC).",
      features: [
        "Custom web & mobile app development",
        "Flutter app delivered for dealer AMC (service contract) management",
      ],
      bgColor: "from-green-600 to-teal-600",
      case: "A Flutter app built for managing dealer service contracts (AMC).",
    },
    {
      id: "hardware-prototype-design",
      icon: <FiCpu className="text-4xl" />,
      title: "Hardware Prototype Design & Design Transfer",
      description:
        "For example, the Sparshajyoti R1-A optical fingerprint scanner.",
      features: [
        "Hardware prototyping",
        "Design transfer to manufacturing",
      ],
      bgColor: "from-indigo-600 to-blue-600",
      case: "Sparshajyoti R1-A, an optical fingerprint scanner, taken from prototype to design transfer.",
    },
    {
      id: "ai-cv-consulting",
      icon: <FiSearch className="text-4xl" />,
      title: "AI & Computer Vision Consulting",
      description:
        "Problem scoping, proof-of-concept builds and deployment advice.",
      features: [
        "Problem scoping",
        "Proof-of-concept builds",
        "Deployment advice",
      ],
      bgColor: "from-pink-600 to-purple-600",
      case: "Scoping and proof-of-concept support for AI and computer vision initiatives.",
    },
  ];

  // 4 · Training - Skill-building programs for students, faculty, schools and companies
  const training = [
    {
      icon: FiCode,
      title: "Technical Training for Colleges",
      description:
        "3-day or 5-day programs: AI Tools, Data Analytics, Mobile App Development, Full Stack (MERN), AWS Cloud, Computer Vision & Generative AI, and Agentic AI.",
    },
    {
      icon: FiUsers,
      title: "Faculty Development Programs (FDPs)",
      description:
        "For example, Agentic AI (LangChain, LangGraph, Ollama).",
    },
    {
      icon: FiBookOpen,
      title: "Workshops Mapped to Syllabus",
      description: "Workshops and training mapped to a college's syllabus.",
    },
    {
      icon: FiBriefcase,
      title: "Corporate Training",
      description: "Past clients include Deloitte and Sigmoid.",
    },
    {
      icon: FiAward,
      title: "Internships",
      description:
        "For BCA, BBA, BSc and BCom students, plus domain internships in Biomedical AI, Robotics/CV and Allied Health AI.",
    },
    {
      icon: FiMonitor,
      title: "School AI Training",
      description: "Delivered through PulseAI K-12.",
    },
    {
      icon: FiLayers,
      title: "Pulse Academy Courses (B2C)",
      description:
        "Individual courses and the 3-year Integrated Tech Mastery Program.",
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
          <h1 className="text-5xl lg:text-6xl font-bold mb-6">
            Solutions, Services &amp; Training
          </h1>
          <p className="text-xl lg:text-2xl text-gray-200 max-w-4xl mx-auto">
            AI and software systems built around your specific problem, project
            work delivered by our team, and skill-building programs for
            students, faculty, schools and companies.
          </p>
        </motion.div>
      </section>

      {/* Solutions Grid */}
      <section id="solutions" className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Solutions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI and software systems built around a client's specific problem
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-12">
            <CategoryFilter
              categories={SOLUTION_CATEGORIES}
              active={activeSolutionCategory}
              onChange={setActiveSolutionCategory}
            />
            <motion.div
              ref={ref1}
              initial={{ opacity: 0 }}
              animate={inView1 ? { opacity: 1 } : {}}
              className="flex-1 grid md:grid-cols-2 gap-8"
            >
              {solutions
                .filter(
                  (item) =>
                    activeSolutionCategory === "All" ||
                    item.category === activeSolutionCategory
                )
                .map((item, index) => (
              <motion.div
                key={item.id}
                id={item.id}
                initial={{ opacity: 0, y: 50 }}
                animate={inView1 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover-lift"
              >
                <div className={`bg-gradient-to-r ${item.bgColor} p-6 text-white`}>
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-white/90">{item.description}</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {item.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <FiCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
                ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Project work delivered by the IVIS LABS team
            </p>
          </div>
          <motion.div
            ref={ref2}
            initial={{ opacity: 0 }}
            animate={inView2 ? { opacity: 1 } : {}}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                id={service.id}
                initial={{ opacity: 0, y: 50 }}
                animate={inView2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl shadow-lg overflow-hidden hover-lift"
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
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Example:</strong> {service.case}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Training */}
      <section id="training" className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            ref={ref3}
            initial={{ opacity: 0 }}
            animate={inView3 ? { opacity: 1 } : {}}
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Training</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Skill-building programs for students, faculty, schools and
                companies
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {training.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-xl border border-gray-200 flex items-start hover:shadow-xl transition-all duration-300"
                  >
                    <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1 text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-10">
              <a
                href="https://academy.pulseai.school"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Explore Pulse Academy Courses
                <FiArrowRight className="ml-2" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-padding bg-white">
        <motion.div
          ref={ref4}
          initial={{ opacity: 0 }}
          animate={inView4 ? { opacity: 1 } : {}}
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
                animate={inView4 ? { opacity: 1, y: 0 } : {}}
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
            Let's discuss how our AI and Computer Vision solutions and services
            can accelerate your growth
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
