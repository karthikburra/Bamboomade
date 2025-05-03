import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft, Check, Award, Flame } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import WhatsAppContact from "@/components/WhatsAppContact";
import Footer from "@/components/Footer";

// Import workshop images
import workshopImg1 from "@assets/IMG_20241107_171145625.jpg";
import workshopImg2 from "@assets/IMG_20241107_171107759.jpg";
import workshopImg3 from "@assets/IMG_20241105_143222581_HDR.jpg";
import workshopImg4 from "@assets/IMG_20241107_171134786.jpg";
import workshopImg5 from "@assets/IMG_20241105_162432711.jpg";
import workshopImg6 from "@assets/IMG_20241106_124903428_HDR.jpg";
import workshopImg7 from "@assets/IMG_20241105_142900515.jpg";
import workshopImg8 from "@assets/IMG_20241105_143140009_HDR.jpg";
import workshopImg9 from "@assets/IMG_20241107_171049859.jpg";
import workshopImg10 from "@assets/IMG_20241106_110210399_HDR.jpg";
import workshopImg11 from "@assets/IMG_20241106_150152616 (1).jpg";
import workshopImg12 from "@assets/IMG_20241107_172108003 (1).jpg";

const IcfaiWorkshop: React.FC = () => {
  // Image gallery with aspect ratios preserved
  const galleryImages = [
    { src: workshopImg1, alt: "Students learning bamboo joinery techniques" },
    { src: workshopImg2, alt: "Bamboo basket weaving display" },
    { src: workshopImg3, alt: "Workshop instruction session" },
    { src: workshopImg4, alt: "Coffee table made with bamboo and glass" },
    { src: workshopImg5, alt: "Students working with bamboo tools" },
    { src: workshopImg6, alt: "Collaborative bamboo construction" },
    { src: workshopImg7, alt: "Demonstration of bamboo techniques" },
    { src: workshopImg8, alt: "Instructor explaining bamboo properties" },
    { src: workshopImg9, alt: "Bamboo lighting fixture display" },
    { src: workshopImg10, alt: "Students processing bamboo outdoors" },
    { src: workshopImg11, alt: "Bamboo joinery demonstration" },
    { src: workshopImg12, alt: "Bamboo lighting fixture with LED lights" }
  ];

  // Workshop key points
  const workshopHighlights = [
    "Basic understanding of bamboo as a sustainable material",
    "Composite joinery techniques and structural applications",
    "Traditional weaving methods applied to modern designs",
    "Hand tool techniques for bamboo processing",
    "Creation of functional products like furniture and lighting",
    "Collaborative design and problem-solving"
  ];

  // Workshop deliverables
  const workshopDeliverables = [
    "Partition design screens",
    "Coffee tables with glass tops",
    "Ergonomic chairs",
    "Creative lighting fixtures",
    "Multi-purpose storage racks",
    "Decorative basketry elements"
  ];

  return (
    <>
      <Helmet>
        <title>ICFAI School of Architecture Workshop | BambooMade</title>
        <meta
          name="description"
          content="3-day Bamboo joinery and craft workshop at ICFAI School of Architecture, Telangana, helping students explore bamboo's potential for creating exceptional sustainable products."
        />
      </Helmet>

      {/* Back button navigation */}
      <div className="bg-green-900/80 text-white">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <Link href="/our-works">
            <Button variant="link" className="text-green-200 hover:text-green-100 -ml-4 font-medium">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Our Experience
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero section */}
      <div className="relative text-white py-12 sm:py-16 md:py-20">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ 
            backgroundImage: `url(/img/workshops/icfai-hero-bg.jpg)`,
            filter: 'brightness(0.7)'
          }}
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/50 to-green-800/40 z-0"></div>
        
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                ICFAI School of Architecture
              </h1>
              <div className="text-green-300 font-semibold text-xl mb-6">
                3-day Bamboo Joinery and Craft Workshop • November 2024
              </div>
              <p className="text-lg text-green-100 mb-8">
                An immersive workshop that propelled architecture students to explore
                bamboo's potential, empowering them to craft contemporary masterpieces
                and sustainable design solutions.
              </p>
              <WhatsAppContact
                phoneNumber="+918971690163"
                message="Hello, I'm interested in organizing a bamboo workshop similar to the one at ICFAI School of Architecture. Could you provide more information?"
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              />
            </div>
            
            {/* Hero Images */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="rounded-lg overflow-hidden shadow-xl h-44">
                    <img 
                      src="/img/workshops/icfai-lamp.jpg" 
                      alt="Bamboo lamp fixture with LED lights" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-lg overflow-hidden shadow-xl h-48">
                    <img 
                      src="/img/workshops/icfai-bamboo-cutting.jpg" 
                      alt="Students working with bamboo materials" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg overflow-hidden shadow-xl h-48">
                    <img 
                      src="/img/workshops/icfai-hanging-lamp.jpg" 
                      alt="Bamboo shelving unit and hanging lamp" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-lg overflow-hidden shadow-xl h-44">
                    <img 
                      src="/img/workshops/icfai-bamboo-shelf.jpg" 
                      alt="Bamboo furniture display" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workshop information */}
      <section className="py-16 bg-white dark:bg-green-950">
        <div className="container max-w-7xl mx-auto px-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-300 mb-6">
              About the Workshop
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              The impactful bamboo workshop held at ICFAI School of Architecture, Telangana, 
              propelled students to explore the bamboo to create exceptional products. This 
              exercise empowered them to craft contemporary masterpieces showcasing the 
              finished products.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              Throughout the three days, students progressed from basic material understanding
              to creating functional designs. The workshop emphasized hands-on learning, with
              students working directly with bamboo to understand its properties, limitations,
              and vast potential as a sustainable building material.
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Instructors guided participants through various joinery techniques, tools usage,
              and design considerations unique to bamboo construction, fostering both technical
              skills and creative exploration.
            </p>
          </div>
        </div>
      </section>

      {/* Featured images - highlighting best projects */}
      <section className="py-12 bg-green-50 dark:bg-green-900/20">
        <div className="container max-w-7xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-300 mb-8 text-center">
            Featured Workshop Creations
          </h2>
          <div className="grid grid-cols-12 gap-3 sm:gap-4">
            {/* First row */}
            <div className="col-span-12 md:col-span-5 lg:col-span-6">
              <div className="rounded-lg overflow-hidden shadow-lg h-full">
                <img 
                  src={workshopImg4} 
                  alt="Coffee table made with bamboo and glass" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="col-span-12 md:col-span-7 lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={workshopImg9} 
                  alt="Bamboo display stand" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={workshopImg12} 
                  alt="Bamboo lighting fixture with LED lights" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="sm:col-span-2 rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={workshopImg6} 
                  alt="Students working on bamboo frame assembly" 
                  className="w-full h-60 object-cover"
                />
              </div>
            </div>
            
            {/* Second row */}
            <div className="col-span-12 md:col-span-7 lg:col-span-6 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={workshopImg3} 
                  alt="Workshop demonstration session" 
                  className="w-full h-40 object-cover"
                />
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={workshopImg5} 
                  alt="Students processing bamboo" 
                  className="w-full h-40 object-cover"
                />
              </div>
              <div className="col-span-2 rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={workshopImg10} 
                  alt="Students harvesting bamboo outdoors" 
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
            <div className="col-span-12 md:col-span-5 lg:col-span-6">
              <div className="rounded-lg overflow-hidden shadow-lg h-full">
                <img 
                  src={workshopImg2} 
                  alt="Bamboo basket weaving display" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-gray-700 dark:text-gray-300 italic">
            The students created remarkable pieces showcasing both traditional craftsmanship and innovative design approaches.
          </div>
        </div>
      </section>
      
      {/* Key Highlights & Student Creations */}
      <section className="py-16 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-950/30">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Key Highlights Section */}
            <div className="bg-white dark:bg-green-900/60 rounded-xl shadow-lg p-6 border-l-4 border-green-500 dark:border-green-400">
              <div className="flex items-center mb-6">
                <div className="bg-yellow-100 dark:bg-yellow-800/50 p-3 rounded-full mr-4">
                  <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-300">
                  Key <span className="text-yellow-500 dark:text-yellow-300">Highlights</span>
                </h2>
              </div>
              
              <div className="space-y-4">
                {workshopHighlights.map((highlight, index) => {
                  // Highlight key terms in yellow
                  const highlightedText = highlight
                    .replace(/sustainable/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">sustainable</span>')
                    .replace(/techniques/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">techniques</span>')
                    .replace(/joinery/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">joinery</span>')
                    .replace(/bamboo/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">bamboo</span>')
                    .replace(/modern designs/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">modern designs</span>')
                    .replace(/functional products/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">functional products</span>')
                    .replace(/Collaborative/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">Collaborative</span>');
                    
                  return (
                    <div 
                      key={index} 
                      className="flex p-3 rounded-lg transition-colors hover:bg-green-50 dark:hover:bg-green-800/30 border border-transparent hover:border-green-200 dark:hover:border-green-700"
                    >
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span 
                        className="text-gray-700 dark:text-gray-200 font-medium"
                        dangerouslySetInnerHTML={{ __html: highlightedText }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Student Creations Section */}
            <div className="bg-white dark:bg-green-900/60 rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 dark:border-yellow-400">
              <div className="flex items-center mb-6">
                <div className="bg-yellow-100 dark:bg-yellow-800/50 p-3 rounded-full mr-4">
                  <Flame className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-300">
                  Student <span className="text-yellow-500 dark:text-yellow-300">Creations</span>
                </h2>
              </div>
              
              <div className="space-y-4">
                {workshopDeliverables.map((deliverable, index) => {
                  // Highlight key terms in yellow
                  const highlightedText = deliverable
                    .replace(/Partition/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">Partition</span>')
                    .replace(/Coffee tables/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">Coffee tables</span>')
                    .replace(/Ergonomic/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">Ergonomic</span>')
                    .replace(/Creative/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">Creative</span>')
                    .replace(/Multi-purpose/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">Multi-purpose</span>')
                    .replace(/Decorative/g, '<span class="text-yellow-500 dark:text-yellow-300 font-semibold">Decorative</span>');
                    
                  return (
                    <div 
                      key={index} 
                      className="flex p-3 rounded-lg transition-colors hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border border-transparent hover:border-yellow-200 dark:hover:border-yellow-800"
                    >
                      <Check className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span 
                        className="text-gray-700 dark:text-gray-200 font-medium"
                        dangerouslySetInnerHTML={{ __html: highlightedText }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 relative text-white">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ 
            backgroundImage: `url(/img/workshops/icfai-cta-bg.jpg)`,
            filter: 'brightness(0.6)'
          }}
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-800/60 to-green-900/70 z-0"></div>
        
        <div className="container max-w-7xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Organize a Similar Workshop at Your Institution
          </h2>
          <p className="text-green-100 max-w-3xl mx-auto mb-8">
            Bring the transformative experience of bamboo design and craftsmanship to your 
            students. Our customizable workshops can be tailored to fit your curriculum needs
            and facility constraints.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <WhatsAppContact
              phoneNumber="+918971690163"
              message="Hello, I'm interested in organizing a bamboo workshop at our institution. Please provide more details."
              className="bg-white text-green-800 hover:bg-green-100"
              size="lg"
            />
            <Link href="/project-guidance">
              <Button 
                size="lg" 
                className="bg-green-700 hover:bg-green-600 text-white border border-green-600"
              >
                Explore Project Guidance
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default IcfaiWorkshop;