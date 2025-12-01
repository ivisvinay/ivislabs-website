import React from 'react';
import { motion } from 'framer-motion';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-blue-900 to-black flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 mx-auto mb-4"
        >
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Expletus Sans, sans-serif' }}>IVIS LABS</span>
          </div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white text-2xl font-bold mb-2"
          style={{ fontFamily: 'Expletus Sans, sans-serif' }}
        >
          IVIS LABS
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-gray-300"
        >
          Loading AI Excellence...
        </motion.p>
        <div className="flex justify-center mt-6 space-x-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
            className="w-3 h-3 bg-blue-400 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
            className="w-3 h-3 bg-purple-400 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
            className="w-3 h-3 bg-pink-400 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Loader;
