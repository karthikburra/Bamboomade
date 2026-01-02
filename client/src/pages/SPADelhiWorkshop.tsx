import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft, Check, Calendar, MapPin } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import WhatsAppContact from "@/components/WhatsAppContact";

// Import authentic workshop images with @assets alias
import umbrellaInstallation from "@assets/IMG-20230309-WA0039.jpg";
import bambooCraftingOutdoor from "@assets/image 81.png";
import bambooJoineryWork from "@assets/image 95.png";
import bambooTeamwork from "@assets/image 84.png";
import bambooCraftDisplay from "@assets/image 91.png";
import bambooTulipLamp from "@assets/IMG_1853 1.png";
import bambooPlantLamp from "@assets/IMG-20230311-WA0002.jpg";
import workshopParticipants from "@assets/IMG20230301165639 1.png";
import bambooTableLamp from "@assets/image 108.png";
import bambooFlowerLamp from "@assets/IMG-20230309-WA0028.jpg";
import bambooComplexFixture from "@assets/IMG-20230309-WA0029.jpg";

const SPADelhiWorkshop: React.FC = () => {
  // Image gallery with authentic SPA Delhi workshop images
  const galleryImages = [
    { src: umbrellaInstallation, alt: "Colorful bamboo umbrella installation at SPA Delhi campus" },
    { src: bambooCraftingOutdoor, alt: "Participants working on bamboo crafts outdoors" },
    { src: bambooJoineryWork, alt: "Students learning bamboo joinery techniques" },
    { src: bambooTeamwork, alt: "Team collaboration during the bamboo workshop" },
    { src: bambooCraftDisplay, alt: "Exhibition of bamboo craft projects" },
    { src: workshopParticipants, alt: "Workshop participants at SPA Delhi" }
  ];

  // Workshop key learning points
  const workshopHighlights = [
    "Hands-on model making and form exploration for designing bamboo buildings",
    "Bamboo joinery techniques integrated into architectural details",
    "Weaving methods for creating functional and decorative bamboo elements",
    "Product design methodologies specific to bamboo as a sustainable material",
    "Collaborative design approaches for complex bamboo structures",
    "Integration of bamboo into interior design and architectural studios"
  ];

  // Sample projects from the workshop
  const workshopProjects = [
    {
      image: bambooTulipLamp,
      title: "Bamboo Tulip Lamp",
      description: "Innovative lighting fixture with woven bamboo elements resembling tulip flowers"
    },
    {
      image: bambooTableLamp,
      title: "Pathway Light",
      description: "Bamboo table lamp with hollowed sections creating an ambient lighting effect"
    },
    {
      image: bambooFlowerLamp,
      title: "Bamboo Flower Planter",
      description: "Integrated planter and lighting system with woven bamboo tulips and solid bamboo structure"
    },
    {
      image: bambooComplexFixture,
      title: "Tulip Installation",
      description: "Complete bamboo installation combining lighting, planters and artistic elements"
    },
    {
      image: bambooPlantLamp,
      title: "Pendant Light with Planters",
      description: "Suspended bamboo light fixture integrating plant holders and creative bamboo joinery"
    }
  ];

  return (
    <>
      <Helmet>
        <title>SPA Delhi Bamboo Workshop | 5-Day Inclusive Hands-on Training | BambooMade</title>
        <meta
          name="description"
          content="An inclusive 5-day bamboo workshop at School of Planning and Architecture, Delhi that welcomed diverse participants - students, professionals, researchers and professors - focusing on bamboo integration into architectural curriculum."
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
            backgroundImage: `url(${umbrellaInstallation})`,
            filter: 'brightness(0.7)'
          }}
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/70 to-green-900/60 z-0"></div>
        
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                School of Planning and Architecture, Delhi
              </h1>
              <div className="text-green-300 font-semibold text-xl mb-6">
                5-day Inclusive Workshop • February 2023 • Delhi, India
              </div>
              <p className="text-lg text-green-100 mb-8 max-w-3xl">
                An inclusive bamboo workshop that welcomed participants from diverse backgrounds. Sharing knowledge with students, professionals, researchers, and professors to integrate bamboo into architectural curriculum and studios.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <WhatsAppContact
                  phoneNumber="918971690163"
                  message="Hello, I'm interested in learning more about your SPA Delhi workshop. Could you share additional information?"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                />
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
              About the <span className="text-yellow-500 dark:text-yellow-300">Workshop</span>
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              The inclusive bamboo workshop at SPA Delhi welcomed participants from diverse backgrounds, creating a rich and collaborative learning environment. Sharing knowledge with <span className="text-yellow-500 dark:text-yellow-300 font-medium">students, professionals, researchers, and professors</span> was an extraordinary achievement that highlighted the workshop's inclusive approach.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              The resounding success of this <span className="text-yellow-500 dark:text-yellow-300 font-medium">5-day workshop</span> fuels our inspiration to integrate bamboo into architectural curriculum and studios. By bringing together participants with diverse expertise and perspectives, we created a dynamic environment for exploring bamboo's potential in architecture and design.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-8 text-lg">
              Hands-on model making and form exploration were integral to our curriculum, providing a practical approach to designing bamboo buildings. Participants gained valuable skills in <span className="text-yellow-500 dark:text-yellow-300 font-medium">bamboo joinery and weaving techniques</span> that can be easily integrated into product design, interiors, and architectural details.
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

            {/* Workshop outcomes */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
              Creative Products & Outcomes
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Participants showcased an impressive array of creative products at the end of the workshop, demonstrating their newly acquired skills and innovative thinking. These included:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
              {workshopProjects.map((project, index) => (
                <div key={index} className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-green-900/20">
                  <div className="h-56 overflow-hidden">
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-lg text-green-800 dark:text-green-300 mb-2">
                      {project.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {project.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Additional creative outcomes included:
            </p>
            <ul className="list-disc pl-5 mb-8 text-gray-700 dark:text-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li className="ml-2">Pendant lighting fixtures</li>
              <li className="ml-2">Bamboo planters with integrated lights</li>
              <li className="ml-2">Tic Tac Toe Table with bamboo weaving</li>
              <li className="ml-2">Bamboo Trestle benches</li>
              <li className="ml-2">Pathway lighting solutions</li>
              <li className="ml-2">Outdoor umbrella installations</li>
            </ul>

            <p className="text-gray-700 dark:text-gray-300 mb-12">
              The workshop culminated in a showcase of these creative products, highlighting the versatility of bamboo and the innovative approaches developed by participants. This successful demonstration reinforced our commitment to integrating bamboo into architectural education and practice.
            </p>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-gradient-to-br from-green-950 to-black">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">
              Interested in Hosting a Bamboo Workshop?
            </h2>
            <p className="text-gray-300 mb-6">
              We collaborate with educational institutions, architectural organizations, and community groups to conduct immersive bamboo workshops. Reach out to discuss how we can bring sustainable bamboo design practices to your organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
              <WhatsAppContact phoneNumber="918971690163" className="bg-green-700 hover:bg-green-800" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SPADelhiWorkshop;