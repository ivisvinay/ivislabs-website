import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

const ServiceCard = ({ icon, title, description, color, link }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <div className="bg-white/1 backdrop-blur-lg rounded-2xl p-6 h-full flex flex-col border border-white/20 hover:border-white/40 transition-all group">
        <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-sm text-gray-200 mb-4 flex-grow">{description}</p>
        <Link 
          to={link}
          className="inline-flex items-center text-white font-semibold hover:gap-2 transition-all group"
        >
          <span>Learn More</span>
          <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
