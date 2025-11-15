import { TrendingUp, Users, CheckCircle, Quote } from "lucide-react";
import { caseStudies } from "../data/caseStudiesData";

const CaseStudies = () => {
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
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Case Studies
            </h1>
            <p className="text-xl text-white/90">
              Real-world success stories showcasing the impact of our AI and
              Computer Vision solutions
            </p>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="space-y-16">
            {caseStudies.map((study, index) => (
              <div
                key={study.id}
                className="bg-white rounded-3xl overflow-hidden shadow-xl"
              >
                {/* Header with Image */}
                <div className="relative h-64 md:h-96 overflow-hidden">
                  <img
                    src={study.image}
                    alt={study.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <div className="max-w-4xl">
                      <span className="inline-block px-3 py-1 bg-primary-600 rounded-full text-sm font-semibold mb-4">
                        {study.industry}
                      </span>
                      <h2 className="text-3xl md:text-4xl font-bold mb-2">
                        {study.title}
                      </h2>
                      <p className="text-xl text-white/90">{study.client}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12">
                  <div className="max-w-4xl mx-auto">
                    {/* Challenge */}
                    <div className="mb-8">
                      <div className="flex items-center mb-4">
                        <div className="bg-red-100 p-2 rounded-lg mr-3">
                          <TrendingUp className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          The Challenge
                        </h3>
                      </div>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        {study.challenge}
                      </p>
                    </div>

                    {/* Solution */}
                    <div className="mb-8">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          Our Solution
                        </h3>
                      </div>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        {study.solution}
                      </p>
                    </div>

                    {/* Results */}
                    <div className="mb-8">
                      <div className="flex items-center mb-4">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          Results & Impact
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {study.results.map((result, idx) => (
                          <div
                            key={idx}
                            className="flex items-start p-4 bg-green-50 rounded-lg"
                          >
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{result}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technologies */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Technologies Used
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {study.technologies.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-primary-50 text-primary-700 font-medium rounded-lg"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Testimonial */}
                    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-8 rounded-2xl">
                      <Quote className="h-10 w-10 text-primary-600 mb-4" />
                      <p className="text-lg text-gray-700 italic mb-4">
                        "{study.testimonial}"
                      </p>
                      <p className="text-primary-600 font-semibold">
                        - {study.client}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-blue-700 to-blue-500 text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Create Your Success Story?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Let's discuss how we can help transform your business with AI
            </p>
            <a
              href="/contact"
              className="btn-secondary bg-white text-primary-600"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CaseStudies;
