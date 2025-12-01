import { GraduationCap, Users, Building2, Clock, CheckCircle } from 'lucide-react';
import { companyData } from '../data/companyData';

const Academy = () => {
  const { academy } = companyData;

  return (
    <div>
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl"></div>
        </div>  <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <GraduationCap className="h-16 w-16 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {academy.title}
            </h1>
            <p className="text-xl text-white/90 mb-4">
              {academy.subtitle}
            </p>
            <p className="text-lg text-white/80">
              {academy.description}
            </p>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Our Training Programs
          </h2>
          <div className="space-y-8">
            {academy.programs.map((program) => (
              <div 
                key={program.id}
                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">
                      {program.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {program.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center text-gray-700">
                        <Users className="h-4 w-4 mr-2 text-primary-600" />
                        <span className="font-medium">Audience:</span>
                        <span className="ml-1">{program.audience}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Clock className="h-4 w-4 mr-2 text-primary-600" />
                        <span className="font-medium">Duration:</span>
                        <span className="ml-1">{program.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-auto">
                    <a 
                      href="/contact"
                      className="inline-block btn-primary whitespace-nowrap"
                    >
                      Enroll Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              What Makes Us Different
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: GraduationCap,
                  title: 'Expert Instructors',
                  description: 'Learn from PhD-level AI experts with real-world industry experience'
                },
                {
                  icon: Building2,
                  title: 'Industry-Relevant Curriculum',
                  description: 'Curriculum designed to meet current industry demands and future trends'
                },
                {
                  icon: Users,
                  title: 'Hands-on Learning',
                  description: 'Practical projects and case studies from actual deployments'
                },
                {
                  icon: CheckCircle,
                  title: 'Placement Support',
                  description: 'Career guidance and placement assistance for program graduates'
                }
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="bg-white p-6 rounded-xl">
                    <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
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
              Ready to Advance Your Skills?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join Pulse Academy and bridge the gap between education and industry
            </p>
            <a href="/contact" className="btn-secondary bg-white text-primary-600">
              Apply Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Academy;
