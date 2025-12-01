import { Code, Brain, Users, BookOpen, Settings, ArrowRight } from 'lucide-react';
import { companyData } from '../data/companyData';

const iconMap = {
  Code, Brain, Users, BookOpen, Settings
};

const Pulse = () => {
  const { pulse } = companyData;

  return (
    <div>
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl"></div>
        </div>
          <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <span className="font-semibold">{pulse.subtitle}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'Expletus Sans, sans-serif' }}>
              {pulse.title}
            </h1>
            <p className="text-xl text-white/90">
              {pulse.description}
            </p>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pulse.platforms.map((platform) => {
              const Icon = iconMap[platform.icon];
              return (
                <div 
                  key={platform.id}
                  className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border-2 border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="bg-primary-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors">
                    <Icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-primary-600 transition-colors">
                    {platform.name}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {platform.description}
                  </p>
                  <div className="pt-4 border-t border-gray-200">
                    <span className="text-sm font-semibold text-primary-600">
                      Target: {platform.target}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Why Choose <span className="text-primary-600">PULSE</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                'Comprehensive curriculum aligned with industry needs',
                'Hands-on practical learning experiences',
                'AI-powered personalized learning paths',
                'Seamless integration with existing systems',
                'Real-time analytics and progress tracking',
                'Expert support and training'
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-start p-4 bg-white rounded-lg">
                  <div className="bg-primary-100 rounded-full p-2 mr-4">
                    <ArrowRight className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl"></div>
        </div>
                <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Transform Education with PULSE
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Partner with us to bring cutting-edge educational technology to your institution
            </p>
            <a href="/contact" className="btn-secondary bg-white text-primary-600">
              Get Started
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pulse;
