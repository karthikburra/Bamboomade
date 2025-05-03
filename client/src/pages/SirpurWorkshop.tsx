import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft, Check, Award, Flame } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import WhatsAppContact from "@/components/WhatsAppContact";

// Import authentic workshop images from attached assets
import workshopBanner from "@assets/IMG_20240128_162436182 1.png";
import workshopParticipants from "@assets/IMG_20240126_151421409 1.png";
import workshopDemonstration from "@assets/IMG_20240124_171249621 1.png";
import workshopHandsOn from "@assets/IMG_20240125_132425317 1.png";
import workshopChair from "@assets/IMG_20240128_133251345 1.png";
import workshopStool from "@assets/IMG_20240128_162642715 2.png";
import workshopWeaving from "@assets/WhatsApp Image 2024-03-26 at 23.35 1.png";
import workshopExplanation from "@assets/IMG_20240124_162253839 1.png";
import workshopTesting from "@assets/IMG_20240128_160659664 1.png";

const SirpurWorkshop: React.FC = () => {
  // Image gallery with authentic Sirpur workshop images
  const galleryImages = [
    { src: workshopParticipants, alt: "Group photo of Sirpur community bamboo workshop participants" },
    { src: workshopWeaving, alt: "Women learning traditional bamboo weaving techniques in a group setting" },
    { src: workshopDemonstration, alt: "Workshop participants learning bamboo joinery techniques" },
    { src: workshopHandsOn, alt: "Men crafting bamboo furniture during the workshop" },
    { src: workshopExplanation, alt: "Instructor explaining bamboo crafting methods to participants" },
    { src: workshopTesting, alt: "Participant testing a bamboo chair created during the workshop" }
  ];

  // Workshop key points
  const workshopHighlights = [
    "Equipping villagers with essential bamboo crafting skills for self-sustainability",
    "Economic empowerment through traditional and marketable bamboo craft techniques",
    "Preparing local artisans to become key players in the future bamboo product industry",
    "Hands-on training in bamboo processing and product development",
    "Community-focused skill development promoting local entrepreneurship",
    "Preserving traditional craftsmanship while fostering economic opportunities"
  ];

  return (
    <>
      <Helmet>
        <title>Community Training for Economic Empowerment | Sirpur, Chhattisgarh | BambooMade</title>
        <meta
          name="description"
          content="6-day bamboo community training workshop at Sirpur, Chhattisgarh empowering villagers with essential bamboo crafting skills for self-sustainability and economic opportunities in the future bamboo industry."
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
            backgroundImage: `url(${galleryImages[0].src})`,
            filter: 'brightness(0.7)'
          }}
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/70 to-green-900/60 z-0"></div>
        
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                BambooMade Community Training
              </h1>
              <div className="text-green-300 font-semibold text-xl mb-6">
                6-day Bamboo Traditional Crafting Workshop • January 24-29, 2024 • Sirpur, Chhattisgarh
              </div>
              <p className="text-lg text-green-100 mb-8 max-w-3xl">
                An immersive training program equipping villagers with essential bamboo crafting skills, fostering self-sustainability and economic empowerment. Our aim was to prepare these artisans to become key players in the future bamboo product industry.
              </p>
              <WhatsAppContact
                phoneNumber="8971690163"
                message="Hello, I'm interested in organizing a community bamboo workshop similar to the one at Sirpur. Could you provide more information?"
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
              About the <span className="text-yellow-500 dark:text-yellow-300">Workshop</span>
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              The <span className="text-yellow-500 dark:text-yellow-300 font-medium">BambooMade Community Training</span> at Sirpur, Chhattisgarh, focused on empowering local villagers with <span className="text-yellow-500 dark:text-yellow-300 font-medium">bamboo crafting skills</span>. Held at Patel Samaj Bhavan in Barpura-02, this 6-day workshop (January 24-29, 2024) was organized with support from the Sirpur Rural Development Project and the local Gram Panchayat.
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
                    src={workshopWeaving} 
                    alt="Women learning traditional bamboo weaving techniques in a group setting" 
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
                    src={workshopChair} 
                    alt="Bamboo chair created during the workshop" 
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
                <div className="p-3 bg-green-900/80">
                  <h3 className="text-green-100 font-medium">Bamboo Furniture Creations</h3>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden shadow-lg flex flex-col">
                <div className="flex-grow flex items-center justify-center bg-black/10 p-4">
                  <img 
                    src={workshopStool} 
                    alt="Bamboo stool with traditional joinery techniques" 
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