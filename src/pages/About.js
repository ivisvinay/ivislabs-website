import { Award, Users, Target, Heart } from "lucide-react";
import { companyData } from "../data/companyData";

const About = () => {
  return (
    <div className="min-h-screen">
      {/* Hero - Purple gradient like Infosys */}
      <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl"></div>
        </div>
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold font-expletus mb-6">
              About IVIS LABS
            </h1>
            <p className="text-xl text-white/90">{companyData.description}</p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold font-expletus mb-8 text-gray-900 dark:text-white">
              Our Story
            </h2>
            <div className="space-y-6 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                IVIS LABS Private Limited is an AI and computer vision company
                based in Mysuru, founded in 2021 by Dr. Vinay Kumar
                Venkataramana, Founder &amp; Managing Director.
              </p>
              <p>
                We build and own products across education (PulseAI K-12,
                Edu-Square OS, FUNgineering, iVis), HR &amp; hiring (Netted,
                Campus Hiring Platform), security &amp; operations (Entry-Exit),
                and home robotics (OOTA). Alongside our own products, we deliver
                custom AI solutions - from manufacturing intelligence and retail
                visual AI to academy management and university learning
                platforms - and project-based services spanning computer
                vision, data annotation, custom software, and hardware
                prototyping.
              </p>
              <p>
                We also run training programs for students, faculty, schools and
                companies, and Pulse Academy, our B2C training vertical,
                including the 3-year Integrated Tech Mastery Program.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values with colorful cards */}
      <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl"></div>
        </div>
        <div className="container-custom">
          <h2 className="text-4xl font-bold font-expletus text-center mb-12 text-gray-900 dark:text-white">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Award,
                title: "Excellence",
                description:
                  "We pursue excellence in everything we do, from research to deployment",
                color: "blue",
              },
              {
                icon: Users,
                title: "Collaboration",
                description:
                  "We believe in the power of collaboration with clients and partners",
                color: "purple",
              },
              {
                icon: Target,
                title: "Innovation",
                description:
                  "We constantly push boundaries to deliver innovative AI solutions",
                color: "orange",
              },
              {
                icon: Heart,
                title: "Impact",
                description:
                  "We measure success by the positive impact we create for our clients",
                color: "blue",
              },
            ].map((value, idx) => {
              const Icon = value.icon;
              const colorClasses = {
                blue: {
                  bg: "bg-gradient-to-br from-blue-500 to-blue-700",
                  icon: "text-blue-600 dark:text-blue-400",
                  iconBg: "bg-blue-100 dark:bg-blue-900/30",
                },
                purple: {
                  bg: "bg-gradient-to-br from-purple-500 to-purple-700",
                  icon: "text-purple-600 dark:text-purple-400",
                  iconBg: "bg-purple-100 dark:bg-purple-900/30",
                },
                orange: {
                  bg: "bg-gradient-to-br from-orange-500 to-orange-700",
                  icon: "text-orange-600 dark:text-orange-400",
                  iconBg: "bg-orange-100 dark:bg-orange-900/30",
                },
              };
              const colors = colorClasses[value.color];
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-700 p-6 rounded-xl text-center hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 border-l-4 relative overflow-hidden"
                  style={{ borderLeftColor: `var(--tw-gradient-from)` }}
                >
                  {/* Gradient overlay on hover */}
                  <div
                    className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300`}
                  ></div>

                  <div
                    className={`${colors.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10`}
                  >
                    <Icon className={`h-8 w-8 ${colors.icon}`} />
                  </div>
                  <h3 className="text-xl font-bold font-expletus mb-3 text-gray-900 dark:text-white relative z-10">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 relative z-10">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold font-expletus text-center mb-12 text-gray-900 dark:text-white">
              Our Expertise
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold font-expletus mb-4 text-gray-900 dark:text-white">
                  Core Competencies
                </h3>
                <ul className="space-y-3">
                  {[
                    "Computer Vision & Deep Learning",
                    "AI Curriculum Design",
                    "Facial Recognition & Access Control",
                    "Manufacturing Intelligence (CNC/MTConnect, OEE)",
                    "Hiring & HR Technology",
                    "Safety-Critical Robotics",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2 text-xl">
                        →
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-expletus mb-4 text-gray-900 dark:text-white">
                  Industries We Serve
                </h3>
                <ul className="space-y-3">
                  {[
                    "Education (K-12 & Higher Ed)",
                    "HR & Hiring",
                    "Manufacturing & Retail",
                    "Security & Operations",
                    "Home Robotics",
                    "Corporate Training",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2 text-xl">
                        →
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academics */}
      <section className="section-padding bg-gray-50 dark:bg-gray-800">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold font-expletus text-center mb-4 text-gray-900 dark:text-white">
              Academics
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
              Academic and research contributions led by Dr. Vinay Kumar
              Venkataramana, Founder &amp; Managing Director
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Board of Studies Advisory",
                  description:
                    "Member of BoS at various universities, and Industrial Consultant to the BoS of NIE, Mysuru.",
                },
                {
                  title: "Curriculum & Syllabus Design",
                  description: "For universities and colleges.",
                },
                {
                  title: "Resource Person",
                  description:
                    "For FDPs (including at IIT Guwahati), ideathons and hackathons, including judging.",
                },
                {
                  title: "Conference Leadership",
                  description:
                    "Program Chair and Regional Chair (India) for ICPRS; Scientific Committee member for ICPRS-27.",
                },
                {
                  title: "Peer Review",
                  description:
                    "For Pattern Recognition Letters, SN Computer Science and international conferences.",
                },
                {
                  title: "Research",
                  description:
                    "Computer vision and facial expression recognition, such as the IAH-LBP descriptor.",
                },
                {
                  title: "Industry-College Project Collaboration",
                  description: "For example, SwagatAI.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600"
                >
                  <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Blue gradient */}
      <section className="section-padding bg-gradient-to-br from-blue-600 to-blue-900 text-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {companyData.stats.map((stat, index) => {
              const colors = [
                "text-blue-300",
                "text-orange-300",
                "text-purple-300",
                "text-blue-200",
              ];
              return (
                <div key={index}>
                  <div className={`text-5xl font-bold mb-2 ${colors[index]}`}>
                    {stat.value}
                  </div>
                  <div className="text-white/80">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold font-expletus mb-6 text-gray-900 dark:text-white">
              Join Us on Our Journey
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Whether you're looking for cutting-edge AI solutions or want to be
              part of our team
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact" className="btn-primary">
                Partner With Us
              </a>
              <a href="/careers" className="btn-secondary">
                View Careers
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
