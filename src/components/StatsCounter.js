import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiCalendar, FiBox, FiBriefcase, FiMonitor } from 'react-icons/fi';

const StatsCounter = () => {
  const [ref, inView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (inView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [inView, hasAnimated]);

  const stats = [
    {
      icon: <FiCalendar className="text-4xl" />,
      value: 2021,
      suffix: '',
      label: 'Founded in Mysuru',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <FiBox className="text-4xl" />,
      value: 8,
      suffix: '+',
      label: 'Products & Platforms Built',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <FiBriefcase className="text-4xl" />,
      value: 6,
      suffix: '',
      label: 'Core Service Lines',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: <FiMonitor className="text-4xl" />,
      value: 24,
      suffix: '/7',
      label: 'Real-time Monitoring',
      color: 'from-green-500 to-teal-500'
    }
  ];

  const Counter = ({ end, suffix, duration = 2 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!hasAnimated) return;

      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / (duration * 1000);

        if (progress < 1) {
          setCount(Math.floor(end * progress));
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(animate);
    }, [end, duration]);

    return (
      <span className="text-5xl font-bold">
        {count}{suffix}
      </span>
    );
  };

  return (
    <section ref={ref} className="section-padding bg-red-500 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-100 mb-4">IVIS LABS at a Glance</h2>
          <p className="text-xl text-gray-100 max-w-3xl mx-auto">
            An AI and computer vision company based in Mysuru, founded in 2021
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`w-24 h-24 mx-auto bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg`}>
                {stat.icon}
              </div>
              <div className="text-gray-100">
                {hasAnimated && (
                  <Counter end={stat.value} suffix={stat.suffix} />
                )}
              </div>
              <p className="text-gray-100 mt-2 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;