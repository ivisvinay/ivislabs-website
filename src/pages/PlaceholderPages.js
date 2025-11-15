import React from 'react';
import { motion } from 'framer-motion';

// Placeholder component for pages that are coming soon
const ComingSoonPage = ({ title, description }) => {
  return (
    <div className="pt-20 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto px-4"
      >
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="text-4xl font-bold mb-4 text-gray-800">{title}</h1>
        <p className="text-xl text-gray-600 mb-8">{description}</p>
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold">
          Coming Soon
        </div>
      </motion.div>
    </div>
  );
};

export const Products = () => (
  <ComingSoonPage 
    title="Our Products" 
    description="Discover our innovative AI and Computer Vision products that are transforming industries."
  />
);

export const About = () => (
  <ComingSoonPage 
    title="About IVIS LABS" 
    description="Learn about our journey, mission, and the team behind intelligent vision solutions."
  />
);

export const Academy = () => (
  <ComingSoonPage 
    title="Pulse Academy" 
    description="Industry-focused training programs bridging the skill gap between academia and industry."
  />
);

export const EdTech = () => (
  <ComingSoonPage 
    title="PULSE EdTech Platform" 
    description="Comprehensive educational technology solutions for K-12 schools and engineering colleges."
  />
);

export const Blog = () => (
  <ComingSoonPage 
    title="Blog & Insights" 
    description="Latest updates, case studies, and insights from the world of AI and Computer Vision."
  />
);

export const BlogPost = () => (
  <ComingSoonPage 
    title="Blog Post" 
    description="This blog post is being prepared. Check back soon!"
  />
);

export const CaseStudies = () => (
  <ComingSoonPage 
    title="Case Studies" 
    description="Success stories of how we've helped businesses transform with AI."
  />
);

export const Careers = () => (
  <ComingSoonPage 
    title="Join Our Team" 
    description="Be part of the AI revolution. Exciting opportunities await!"
  />
);

export const ProductDemo = () => (
  <ComingSoonPage 
    title="Product Demo" 
    description="Interactive demonstrations of our products will be available soon."
  />
);