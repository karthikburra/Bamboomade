import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft, Check, Award, Flame } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import WhatsAppContact from "@/components/WhatsAppContact";

// Import workshop images from assets folder
// Using images from existing assets as placeholders 
// (you can replace these with actual Sirpur workshop images)
import workshopImg1 from "@assets/IMG_20241105_143222581_HDR.jpg";
import workshopImg2 from "@assets/IMG_20241105_143140009_HDR.jpg";
import workshopImg3 from "@assets/IMG_20241106_110210399_HDR.jpg";
import workshopImg4 from "@assets/IMG_20241106_124903428_HDR.jpg";
import workshopImg5 from "@assets/IMG_20241105_142900515.jpg"; 
import workshopImg6 from "@assets/IMG_20241107_171107759.jpg";

const SirpurWorkshop: React.FC = () => {
  // Image gallery with aspect ratios preserved
  const galleryImages = [
    { src: workshopImg1, alt: "Community members learning bamboo techniques" },
    { src: workshopImg2, alt: "Traditional bamboo weaving demonstration" },
    { src: workshopImg3, alt: "Workshop participants crafting with bamboo" },
    { src: workshopImg4, alt: "Bamboo joinery techniques being taught" },
    { src: workshopImg5, alt: "Hands-on bamboo crafting experience" },
    { src: workshopImg6, alt: "Traditional weaving patterns in bamboo" }
  ];

  // Workshop key points
  const workshopHighlights = [
    "Introduction to bamboo as a sustainable local resource",
    "Traditional weaving techniques preserved from generations",
    "Essential joinery methods for structural applications",
    "Hands-on experience with bamboo processing",
    "Community-focused skill development approach",
    "Bridging traditional craftsmanship with modern applications"
  ];

  return (
    <>
      <Helmet>
        <title>Community Training Workshop at Sirpur | BambooMade</title>
        <meta
          name="description"
          content="5-day bamboo community training workshop at Sirpur, Chhattisgarh focused on traditional weaving techniques and joinery methods."
        />
      </Helmet>

      {/* Hero Banner */}
      <section className="relative bg-green-900 dark:bg-black">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-black to-transparent opacity-90"
            style={{ mixBlendMode: 'multiply' }}
          ></div>
          <img
            src={galleryImages[0].src}
            alt="Bamboo Community Training Workshop"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container relative z-10 mx-auto px-4 py-24 sm:py-32">
          <Link href="/our-works" className="inline-flex items-center text-green-300 hover:text-green-100 mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Our Works
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            BambooMade Community Training
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 mb-4">
            <div className="flex items-center bg-black/30 text-green-300 px-3 py-1 rounded-full backdrop-blur-sm">
              <span className="text-sm sm:text-base">January 2024</span>
            </div>
            <div className="flex items-center bg-black/30 text-green-300 px-3 py-1 rounded-full backdrop-blur-sm">
              <span className="text-sm sm:text-base">Sirpur, Chhattisgarh</span>
            </div>
            <div className="flex items-center bg-black/30 text-green-300 px-3 py-1 rounded-full backdrop-blur-sm">
              <span className="text-sm sm:text-base">5-Day Workshop</span>
            </div>
          </div>
          <p className="text-white/90 text-lg sm:text-xl max-w-3xl">
            An immersive training program to create awareness of bamboo through hands-on experience, focusing on traditional weaving techniques and joinery methods.
          </p>
        </div>
      </section>

      {/* Workshop information */}
      <section className="py-16 bg-white dark:bg-green-950">
        <div className="container max-w-7xl mx-auto px-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-300 mb-6">
              About the <span className="text-yellow-500 dark:text-yellow-300">Workshop</span>
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              The <span className="text-yellow-500 dark:text-yellow-300 font-medium">BambooMade Community Training</span> at Sirpur, Chhattisgarh, focused on creating awareness of bamboo through <span className="text-yellow-500 dark:text-yellow-300 font-medium">hands-on experience</span>. The 5-day workshop primarily emphasized traditional weaving techniques and joineries that have been passed down through generations in the community.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              This community-centered approach aimed to have a <span className="text-yellow-500 dark:text-yellow-300 font-medium">direct influence</span> on how bamboo is used in future applications. By bringing together traditional craftspeople and modern design concepts, the workshop created a bridge between <span className="text-yellow-500 dark:text-yellow-300 font-medium">heritage techniques</span> and contemporary applications.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-8 text-lg">
              Participants learned through practical, hands-on sessions that covered the fundamentals of bamboo as a material, traditional processing methods, and various joinery techniques that can be applied to both traditional crafts and <span className="text-yellow-500 dark:text-yellow-300 font-medium">modern structural applications</span>.
            </p>

            {/* Workshop gallery */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
              Workshop Gallery
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
              Workshop Highlights
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

            {/* Featured creations */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-6">
              Traditional Techniques & Community Creations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-lg overflow-hidden shadow-lg flex flex-col">
                <div className="flex-grow flex items-center justify-center bg-black/10 p-4">
                  <img 
                    src={workshopImg2} 
                    alt="Traditional bamboo weaving patterns" 
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
                <div className="p-3 bg-green-900/80">
                  <h3 className="text-green-100 font-medium">Traditional Weaving Patterns</h3>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden shadow-lg flex flex-col">
                <div className="flex-grow flex items-center justify-center bg-black/10 p-4">
                  <img 
                    src={workshopImg4} 
                    alt="Bamboo joinery techniques demonstration" 
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
                <div className="p-3 bg-green-900/80">
                  <h3 className="text-green-100 font-medium">Bamboo Joinery Techniques</h3>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden shadow-lg flex flex-col">
                <div className="flex-grow flex items-center justify-center bg-black/10 p-4">
                  <img 
                    src={workshopImg6} 
                    alt="Woven bamboo traditional patterns" 
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
                <div className="p-3 bg-green-900/80">
                  <h3 className="text-green-100 font-medium">Traditional Craft Techniques</h3>
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
              Interested in Community Workshops?
            </h2>
            <p className="text-gray-300 mb-6">
              We organize community training workshops throughout the year. Contact us to organize a similar workshop in your community or stay updated about upcoming workshops.
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

export default SirpurWorkshop;