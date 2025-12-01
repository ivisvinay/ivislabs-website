import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';

const TestimonialSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: 'Karthik Bharadwaj',
      position: 'CEO, Prudent Partners',
      content: 'Meeting Vinay Kumar Venkataramana was a turning point for me. His remarkable expertise in AI and dedication to the field are truly inspiring. I\'ve seen his company, IVIS LABS PRIVATE LIMITED, achieve phenomenal growth, becoming a leader in AI implementation, development, and support. Thank you, Vinay, for your guidance and support in driving Prudent Partners LLP!',
      rating: 5,
      image: 'karthik.jpg'
    },
    {
      name: 'Madhu V Swamy',
      position: 'Co Founder and Director, Cumulations Technologies',
      content: 'We had a great experience working with IVIS Labs on our web application. Their technical know-how, responsiveness, and commitment ensured a smooth development process and a high-quality end product.',
      rating: 5,
      image: 'madhu.jpg'
    },
    {
      name: 'Harsha Srinivas',
      position: 'Director, AIMLWare',
      content: 'Vinay and IVIS Labs provide exceptional training services in all modern technologies, with a personalized approach that ensures real learning. Their expertise make complex topics accessible, fostering both skill development and innovation. We highly recommend them to anyone looking to advance in these cutting-edge fields.',
      rating: 5,
      image: 'Harsha.png'
    },
    {
      name: 'Sagar Moudgal',
      position: 'Founder - Poten2[SET] HR Consulting',
      content: 'IVIS, Dr Vinay, is highly skilled in his job. He is learned and that shows his ability in projects. Whats good working with Dr Vinay?, He LISTENS. Thats the most important aspect. A true team player he is and they are quick. A young talented energetic enthusiastic team they are. Organized, disciplined and humble. I can vouch that you wont go wrong by going with IVIS Dr Vinay',
      rating: 5,
      image: 'sagar.jpg'
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="relative max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="bg-yellow-100 rounded-2xl shadow-xl p-8 md:p-12"
        >
          <div className="flex items-start mb-6">
            <div className="text-5xl mr-6"><img src={testimonials[currentIndex].image} alt={testimonials[currentIndex].name} width={75}/></div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800">
                {testimonials[currentIndex].name}
              </h3>
              <p className="text-gray-600">{testimonials[currentIndex].position}</p>
              <div className="flex mt-2">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <FiStar key={i} className="text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
          </div>
          
          <blockquote className="text-lg text-gray-700 italic">
            "{testimonials[currentIndex].content}"
          </blockquote>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={prevTestimonial}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        <FiChevronLeft className="text-gray-700" />
      </button>
      <button
        onClick={nextTestimonial}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        <FiChevronRight className="text-gray-700" />
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-8 space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'w-8 bg-purple-300' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialSlider;