export const companyData = {
  name: "IVIS LABS Private Limited",
  tagline: "Intelligent Vision Labs",
  description:
    "AI and Computer Vision Solutions founded by Doctorates in AI domain",

  hero: {
    title: "Transforming Industries with",
    highlight: "AI & Computer Vision",
    subtitle:
      "Pioneering intelligent vision solutions from Virtual Try-On to Industrial IoT monitoring, backed by doctorate-level AI expertise and real-world deployments.",
    cta: {
      primary: "Explore Our Solutions",
      secondary: "Schedule a Demo",
    },
  },

  stats: [
    { value: "10+", label: "Years of AI Research" },
    { value: "50+", label: "Enterprise Clients" },
    { value: "100+", label: "AI Models Deployed" },
    { value: "24/7", label: "Real-time Monitoring" },
  ],

  services: [
    {
      id: 1,
      title: "Computer Vision Solutions",
      description:
        "Custom AI model development, image recognition & object detection, real-time video analytics",
      icon: "Eye",
      features: [
        "Custom AI model development",
        "Image recognition & object detection",
        "Real-time video analytics",
        "Edge computing integration",
      ],
    },
    {
      id: 2,
      title: "Visual Search & Product Recognition",
      description:
        "AI-powered visual search engines, product recommendation systems, similar product matching",
      icon: "Search",
      features: [
        "AI-powered visual search engines",
        "Product recommendation systems",
        "Similar product matching",
        "E-commerce integration",
      ],
    },
    {
      id: 3,
      title: "Smart Monitoring Systems",
      description:
        "Industrial machine monitoring, entry-exit tracking, real-time operational analytics",
      icon: "Monitor",
      features: [
        "Industrial machine monitoring",
        "Predictive maintenance",
        "Entry-exit tracking & access control",
        "Real-time operational analytics",
      ],
    },
    {
      id: 4,
      title: "AR/VR Solutions",
      description:
        "Virtual Try-On experiences, augmented reality applications, 3D visualization",
      icon: "Glasses",
      features: [
        "Virtual Try-On experiences",
        "Augmented reality applications",
        "3D visualization",
        "Immersive product experiences",
      ],
    },
    {
      id: 5,
      title: "AI Integration & Consulting",
      description:
        "Custom AI implementation, web & mobile app development, cloud infrastructure setup",
      icon: "Cpu",
      features: [
        "Custom AI implementation",
        "Web & mobile application development",
        "Cloud infrastructure (AWS)",
        "Technical consulting",
      ],
    },
  ],

  products: [
    {
      id: 1,
      name: "Entry-Exit Tracking System",
      tagline: "Smart Access Control",
      description:
        "Automated attendance and visitor management with real-time analytics",
      url: "entry-exit.ivislabs.in",
      features: [
        "Automated registration",
        "Visitor tracking",
        "Real-time analytics",
        "Facial recognition",
        "Access control integration",
      ],
      technologies: ["Computer Vision", "Facial Recognition", "IoT"],
      target:
        "Corporate offices, Manufacturing facilities, Educational institutions",
    },

    {
      id: 2,
      name: "Visual Search Engine",
      tagline: "Find Similar Products Instantly",
      description:
        "Upload product images to find similar items across your inventory or catalog",
      url: "recommender.ivislabs.in",
      features: [
        "Image-based product discovery",
        "Similar product recommendations",
        "Replacement parts matching",
        "E-commerce product search",
      ],
      technologies: ["Deep Learning", "Image Similarity", "Neural Networks"],
      useCases: ["E-commerce", "Spare Parts", "Product Discovery"],
    },
    {
      id: 3,
      name: "Machine Shop Monitor",
      tagline: "Smart Industrial IoT Platform",
      description:
        "Real-time monitoring and predictive maintenance for manufacturing equipment",
      url: "machineshop.ivislabs.in",
      features: [
        "Machine status tracking (idle/active)",
        "Power consumption analytics",
        "Oil level monitoring",
        "Vibration & temperature sensors",
        "Predictive maintenance alerts",
      ],
      technologies: [
        "IoT",
        "Edge Computing",
        "Real-time Analytics",
        "Predictive AI",
      ],
      target: "Manufacturing units, CNC machine shops",
    },
    {
      id: 4,
      name: "Virtual Try-On Platform",
      tagline: "Pioneering AR Shopping Experience",
      description:
        "A leading virtual try-on company delivering advanced solutions to major fashion and eyewear brands.",
      url: null,
      features: [
        "Real-time AR visualization",
        "3D product modeling",
        "Multiple device support",
        "Seamless e-commerce integration",
      ],
      technologies: ["Computer Vision", "AR", "3D Modeling", "Deep Learning"],
      client: "A well-established virtual try-on company.",
    },
    {
      id: 5,
      name: "Smart Visual Cataloguing Engine",
      tagline: "Transforming E-commerce Discovery with AI",
      description:
        "AI-powered visual search and intelligent product cataloguing designed to simplify replacement discovery, maintenance parts identification, and intuitive shopping experiences.",
      url: null,
      features: [
        "Image-based product identification",
        "Smart product recommendation engine",
        "Replacement part matching",
        "Maintenance solutions suggestion",
        "Automated cataloguing pipeline",
      ],
      technologies: [
        "Computer Vision",
        "Deep Learning",
        "Image Similarity Models",
        "AI-based Classification",
      ],
      useCases: [
        "E-commerce",
        "Retail Innovation",
        "Maintenance & Replacement Parts",
        "Home Appliances",
        "Technical Product Discovery",
      ],
      caseStudy: {
        challenge:
          "Customers struggled to find technical or replacement parts using traditional text-based search, especially when they didn’t know the exact product name.",
        solution:
          "The AI-powered visual search system allowed customers to upload an image of the required product. The system analyzed the object, detected key characteristics, recommended compatible replacements, and suggested related maintenance solutions.",
        impact: [
          "Reduced customer support queries",
          "Increased product discovery efficiency",
          "Higher conversion rates",
          "Enhanced customer satisfaction",
          "Streamlined digital cataloguing",
        ],
        example:
          "A user uploads an image of a worn-out AC filter and instantly receives compatible replacements, pricing, maintenance kits, and professional service recommendations.",
      },
      target: "E-commerce platforms, Retail brands, Appliance manufacturers",
      status: "Deployed across multiple retail innovation projects",
    },

    {
      id: 6,
      name: "Sereno",
      tagline: "Enterprise Communication Platform",
      description:
        "Comprehensive internal communication and collaboration platform for modern enterprises",
      url: null,
      features: [
        "Team & individual chat with audio/video",
        "Ticket management system",
        "Announcements & polls",
        "Moments (workplace social feed)",
        "Secure & private communication",
      ],
      technologies: [
        "Real-time Communication",
        "WebRTC",
        "Cloud Infrastructure",
      ],
      target: "Small to medium enterprises, Professional service firms",
      status: "Currently in-house, expanding to enterprise clients",
    },
  ],

  pulse: {
    title: "PULSE",
    subtitle: "EdTech Horizontal",
    description:
      "Comprehensive educational technology solutions for institutions and learners",
    platforms: [
      {
        id: 1,
        name: "PulseAI",
        description: "AI and Robotics curriculum platform for K-12 schools",
        icon: "Brain",
        target: "K-12 Schools",
      },
      {
        id: 2,
        name: "EduCareAI",
        description: "Intelligent school-parent communication platform",
        icon: "Users",
        target: "Schools & Parents",
      },
      {
        id: 3,
        name: "Pulse",
        description:
          "CBSE/ICSE/State board content platform for comprehensive learning",
        icon: "BookOpen",
        target: "Students",
      },
      {
        id: 4,
        name: "CodeIdea",
        description:
          "Technical learning platform for engineering colleges with hands-on coding experiences",
        icon: "Code",
        target: "Engineering Colleges",
      },
    ],
  },

  academy: {
    title: "Pulse Academy",
    subtitle: "Training Vertical",
    description:
      "Bridging the industry skill gap through specialized training programs",
    programs: [
      {
        id: 1,
        title: "Industry Skill Gap Training",
        description:
          "Comprehensive training programs for engineering students to prepare them for industry requirements",
        audience: "Engineering Students",
        duration: "6-12 months",
      },
      {
        id: 2,
        title: "AI & Robotics for K-12",
        description:
          "Hands-on AI and robotics training programs designed for school students",
        audience: "K-12 Students",
        duration: "Semester-based",
      },
      {
        id: 3,
        title: "Corporate Training Programs",
        description:
          "Customized AI and technology training programs for corporate teams",
        audience: "Corporate Teams",
        duration: "Customizable",
      },
    ],
  },

  testimonials: [
    {
      id: 1,
      name: "Rajesh Kumar",
      position: "CTO, Fashion Retail Corp",
      company: "Major E-commerce Brand",
      text: "IVIS LABS' Virtual Try-On solution transformed our customer experience. The AR technology is seamless and has significantly reduced our return rates.",
      rating: 5,
    },
    {
      id: 2,
      name: "Priya Sharma",
      position: "Operations Manager",
      company: "Manufacturing Inc.",
      text: "The Machine Shop Monitor has revolutionized our production floor. Predictive maintenance has reduced downtime by 40% and saved us significant costs.",
      rating: 5,
    },
    {
      id: 3,
      name: "Dr. Anand Verma",
      position: "Principal",
      company: "Engineering College",
      text: "Pulse Academy's training programs have been instrumental in preparing our students for industry. The hands-on approach and industry-relevant curriculum make all the difference.",
      rating: 5,
    },
  ],

  techStack: {
    ai: ["Python", "TensorFlow", "PyTorch", "OpenCV", "Deep Learning"],
    vision: ["Object Detection", "Image Recognition", "Video Analytics"],
    iot: ["Sensor Integration", "Real-time Processing", "Edge Computing"],
    cloud: ["AWS", "Scalable Deployments", "Cloud Infrastructure"],
    frontend: ["React", "Vue.js", "Angular", "Flutter", "Android"],
    backend: ["Node.js", "Express", "Python APIs"],
    database: ["MongoDB", "PostgreSQL", "Time-series DB"],
  },

  contact: {
    email: "contact@ivislabs.com",
    phone: "+91 6364411444",
    phoneEdTech: "+91 9449963312",
    address: "Mysuru, India",
    social: {
      linkedin: "https://www.linkedin.com/company/ivislabs",
      instagram: "https://www.instagram.com/ivislabs",
      github: "#",
    },
  },
};
