import { ExternalLink, CheckCircle } from 'lucide-react';
import { companyData } from '../data/companyData';

const Products = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl"></div>
        </div>
          <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Our Products
            </h1>
            <p className="text-xl text-white/90">
              Innovative AI-powered solutions deployed at scale, 
              transforming industries with real-world applications
            </p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="space-y-16">
            {companyData.products.map((product, index) => (
              <div 
                key={product.id}
                id={product.name.toLowerCase().replace(/\s+/g, '-')}
                className="bg-gradient-to-br from-blue-900 to-black rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className={`flex flex-col ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } gap-0`}>
                  {/* Visual Section */}
                  <div className={`lg:w-2/5 gradient-bg p-12 flex flex-col justify-center items-center text-white`}>
                    <div className="text-8xl font-bold mb-4 opacity-20">
                      {product.name.split(' ').map(word => word[0]).join('')}
                    </div>
                    <h3 className="text-3xl font-bold mb-2">{product.name}</h3>
                    <p className="text-xl text-white/80 text-center">{product.tagline}</p>
                    {product.url && (
                      <a 
                        href={`https://${product.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-br from-blue-900 to-black text-primary-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Visit Platform
                        <ExternalLink className="ml-2 h-5 w-5" />
                      </a>
                    )}
                    {product.status && (
                      <div className="mt-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                        <p className="text-sm text-white/90">{product.status}</p>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="lg:w-3/5 p-8 lg:p-12 bg-white">
                    <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Features */}
                    <div className="mb-8">
                      <h4 className="text-xl font-bold text-gray-900 mb-4">Key Features</h4>
                      <div className="space-y-3">
                        {product.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technologies */}
                    <div className="mb-8">
                      <h4 className="text-xl font-bold text-gray-900 mb-4">Technologies</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.technologies.map((tech, idx) => (
                          <span 
                            key={idx}
                            className="px-4 py-2 bg-primary-50 text-primary-700 font-medium rounded-lg text-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Target/Client Info */}
                    {(product.target || product.client || product.useCases) && (
                      <div className="pt-6 border-t border-gray-200">
                        {product.client && (
                          <p className="text-gray-600 mb-2">
                            <span className="font-semibold text-gray-900">Client:</span> {product.client}
                          </p>
                        )}
                        {product.target && (
                          <p className="text-gray-600 mb-2">
                            <span className="font-semibold text-gray-900">Target Market:</span> {product.target}
                          </p>
                        )}
                        {product.useCases && (
                          <div className="text-gray-600">
                            <span className="font-semibold text-gray-900">Use Cases:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {product.useCases.map((useCase, idx) => (
                                <span 
                                  key={idx}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                >
                                  {useCase}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Interested in Our Products?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Schedule a demo to see how our solutions can benefit your organization
            </p>
            <a href="/contact" className="btn-secondary bg-white text-primary-600">
              Request a Demo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Products;
