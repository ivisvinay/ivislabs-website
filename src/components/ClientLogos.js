import React from 'react';
import { motion } from 'framer-motion';

const ClientLogos = () => {
  // Placeholder for client logos - you can replace these with actual logos
  const clients = [
    { name: 'Kiksar Solutions', description: 'Virtual Try-On Technology' },
    { name: 'Avinya Technologies', description: 'Technology Partner' },
    { name: 'LGC', description: 'IoT Solutions' },
    { name: 'Infopine', description: 'Visual Search' },
    { name: 'Vidwath', description: 'EdTech Platform' },
    { name: 'AIMLware', description: 'AI Integration' },
    { name: 'poten2set', description: 'HR Solutions' },
    { name: 'Raaksapphire', description: 'Robotics' }
  ];

  return (
    <div className="overflow-hidden py-8">
      <motion.div 
        animate={{ x: [0, -1920] }}
        transition={{ 
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 20,
            ease: "linear",
          },
        }}
        className="flex space-x-12"
      >
        {[...clients, ...clients].map((client, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-48 h-24 bg-gray-100 rounded-xl flex flex-col items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <div className="text-lg font-bold text-gray-700">{client.name}</div>
            <div className="text-xs text-gray-500 mt-1">{client.description}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default ClientLogos;