import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft, Check, Award, Flame } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import WhatsAppContact from "@/components/WhatsAppContact";

// Import authentic workshop images
import workshopGroup from "@assets/AIX_0303 1.png";
import forestResearchInstitute from "@assets/IMG_20231124_123117072 (1).png";
import bambooCrafting from "@assets/AIX_0082 1.png";
import bambooModel from "@assets/AIX_0242 1.png";
import festivalGroup from "@assets/AIX_0587.png";
import bambooStructure from "@assets/AIX_0277 1.png";
import presentation from "@assets/AIX_0169 1.png";

const InternationalBambooFestWorkshop: React.FC = () => {
  // Image gallery with authentic International Bamboo Festival images
  const galleryImages = [
    { src: workshopGroup, alt: "Group photo of International Bamboo Festival participants" },
    { src: forestResearchInstitute, alt: "Visit to Forest Research Institute Malaysia" },
    { src: bambooCrafting, alt: "Hands-on bamboo crafting session during the festival" },
    { src: bambooModel, alt: "Participants proudly displaying a bamboo model" },
    { src: festivalGroup, alt: "Festival participants and local performers" },
    { src: bambooStructure, alt: "Bamboo structure design competition" }
  ];

  // Workshop key points
  const workshopHighlights = [
    "We aim to grow alongside bamboo, contributing to its sustainable future worldwide",
    "Connecting with passionate bamboo people and sharing insights at the festival",
    "Learning from global Bamboo Architects to bring expertise back to India",
    "Modeling sustainable bamboo structures at Tadom Hill Resorts",
    "Participating in worldwide push for sustainable living through bamboo",
    "Building professional networks with international bamboo architects and designers"
  ];

  return (
    <>
      <Helmet>
        <title>International Bamboo Festival 2023 | Kuala Lumpur, Malaysia | BambooMade</title>
        <meta
          name="description"
          content="Our volunteer experience at the 2-day International Bamboo Festival in Kuala Lumpur, Malaysia, connecting with global bamboo architects to promote sustainable building practices."
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
            backgroundImage: `url(${workshopGroup})`,
            filter: 'brightness(0.7)'
          }}
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/70 to-green-900/60 z-0"></div>
        
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                International Bamboo Festival
              </h1>
              <div className="text-green-300 font-semibold text-xl mb-6">
                2-day Bamboo Festival • November 2023 • Kuala Lumpur, Malaysia
              </div>
              <p className="text-lg text-green-100 mb-8 max-w-3xl">
                At the International Bamboo Festival, we collaborated with Ewe Jin Low of Better Bamboo Buildings as volunteers at Tadom Hill Resorts. We modelled sustainable bamboo structures, shared insights on eco-friendly architecture, and contributed to the worldwide push for sustainable living.
              </p>
              <WhatsAppContact
                phoneNumber="8971690163"
                message="Hello, I'm interested in learning about your experience at the International Bamboo Festival. Could you share more information?"
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Workshop information */}
      <section className="py-16 bg-white dark:bg-green-950">
        <div className="container max-w-7xl mx-auto px-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-300 mb-6">
              About the <span className="text-yellow-500 dark:text-yellow-300">Festival</span>
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              The <span className="text-yellow-500 dark:text-yellow-300 font-medium">International Bamboo Festival</span> in Kuala Lumpur, Malaysia, brought together <span className="text-yellow-500 dark:text-yellow-300 font-medium">bamboo enthusiasts, architects, and craftspeople</span> from around the world. As volunteers with Ewe Jin Low of Better Bamboo Buildings, we participated in this 2-day festival at Tadom Hill Resorts in November 2023.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              During our time at the festival, we had the opportunity to <span className="text-yellow-500 dark:text-yellow-300 font-medium">model sustainable bamboo structures</span>, share our insights on eco-friendly architectural practices, and contribute to the global movement for sustainable living through bamboo construction and design.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-8 text-lg">
              We connected with passionate bamboo people from diverse backgrounds, learning from their approaches and experiences. This global knowledge exchange was an important step in our journey to promote <span className="text-yellow-500 dark:text-yellow-300 font-medium">bamboo as a primary building material</span> in India, contributing to a more sustainable future.
            </p>

            {/* Workshop gallery */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
              Festival Gallery
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {galleryImages.map((image, index) => (
                <div 
                  key={index} 
                  className="rounded-lg overflow-hidden shadow-md transition-transform hover:shadow-xl hover:-translate-y-1"
                >
                  <img 
                    src={image.src} 
                    alt={image.alt} 
                    className="w-full h-64 object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Workshop highlights */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
              Festival Highlights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {workshopHighlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-3 bg-green-50 dark:bg-green-900/40 rounded-lg p-4">
                  <div className="mt-1 rounded-full bg-green-100 dark:bg-green-800 p-1">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{highlight}</p>
                </div>
              ))}
            </div>

            {/* Featured moments */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-6">
              Key Festival Moments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-lg overflow-hidden shadow-lg flex flex-col">
                <div className="flex-grow flex items-center justify-center bg-black/10 p-4">
                  <img 
                    src={bambooModel} 
                    alt="Participants proudly displaying a bamboo model" 
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
                <div className="p-3 bg-green-900/80">
                  <h3 className="text-green-100 font-medium">International Collaboration</h3>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden shadow-lg flex flex-col">
                <div className="flex-grow flex items-center justify-center bg-black/10 p-4">
                  <img 
                    src={presentation} 
                    alt="Presenting at the International Bamboo Festival" 
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
                <div className="p-3 bg-green-900/80">
                  <h3 className="text-green-100 font-medium">Knowledge Sharing Sessions</h3>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden shadow-lg flex flex-col">
                <div className="flex-grow flex items-center justify-center bg-black/10 p-4">
                  <img 
                    src={forestResearchInstitute} 
                    alt="Visit to Forest Research Institute Malaysia" 
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
                <div className="p-3 bg-green-900/80">
                  <h3 className="text-green-100 font-medium">Research & Innovation Exchange</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-gradient-to-br from-green-950 to-black">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">
              Connect with Us About Global Bamboo Initiatives
            </h2>
            <p className="text-gray-300 mb-6">
              We're actively engaged in international bamboo events and collaborations. Reach out to learn more about our experiences or discuss potential partnerships in sustainable bamboo architecture.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
              <WhatsAppContact phoneNumber="8971690163" className="bg-green-700 hover:bg-green-800" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default InternationalBambooFestWorkshop;