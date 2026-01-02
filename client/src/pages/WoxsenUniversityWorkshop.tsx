import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft, Check, Calendar, MapPin } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import WhatsAppContact from "@/components/WhatsAppContact";

// Import authentic workshop images with @assets alias
import bambooPartition from "@assets/Slide 16_9 - 43 (1).png";
import bambooBaskets from "@assets/121A9225 (1) 1.png";
import bambooProducts from "@assets/121A9247 (1) 2.png";
import workshopDisplay from "@assets/IMG_8198 1.png";
import partitionDetail from "@assets/Slide 16_9 - 43.png";
import bambooTable from "@assets/image 11.png";
import bambooStool from "@assets/image 12.png";
import weaving from "@assets/image 17.png";
import workshopDemo from "@assets/WhatsApp Image 2023-06-11 at 3.00 1.png";
import studentExhibition from "@assets/image 86.png";

const WoxsenUniversityWorkshop: React.FC = () => {
  // Image gallery with authentic Woxsen University workshop images
  const galleryImages = [
    { src: workshopDisplay, alt: "Exhibition of bamboo furniture and products by students at Woxsen University" },
    { src: bambooPartition, alt: "Bamboo partition screen and furniture display" },
    { src: weaving, alt: "Students learning traditional bamboo weaving techniques" },
    { src: workshopDemo, alt: "Demonstration of bamboo joinery techniques" },
    { src: studentExhibition, alt: "Students presenting their bamboo products at the exhibition" },
    { src: bambooProducts, alt: "Various bamboo products created during the workshop" }
  ];

  // Workshop key learning points
  const workshopHighlights = [
    "Incorporation of bamboo into plywood furniture design for mixed-material joinery techniques",
    "Branding products through logo design and laser CNC engraving on bamboo",
    "Traditional weaving methods adapted for modern bamboo design applications",
    "Fusion of bamboo with diverse materials to create exceptional interior products",
    "Product design methodologies specific to bamboo as a sustainable material",
    "Exhibition and presentation skills for showcasing finished bamboo products"
  ];

  // Sample projects from the workshop
  const workshopProjects = [
    {
      image: bambooPartition,
      title: "Bamboo Partition Screen",
      description: "Room divider combining woven bamboo panels with decorative circular elements"
    },
    {
      image: bambooTable,
      title: "Bamboo Coffee Table",
      description: "Mixed-material table using bamboo poles for the base structure and plywood for the top"
    },
    {
      image: bambooStool,
      title: "Triangular Side Table",
      description: "Multi-level accent table with woven bamboo shelves and solid bamboo legs"
    },
    {
      image: bambooBaskets,
      title: "Woven Bamboo Baskets",
      description: "Collection of storage baskets with handles, branded with laser-engraved logos"
    },
    {
      image: bambooProducts,
      title: "Multi-purpose Storage Solutions",
      description: "Various storage containers and organizational pieces combining different weaving techniques"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Woxsen University Bamboo Workshop | Interior Design Products | BambooMade</title>
        <meta
          name="description"
          content="A 3-day workshop at Woxsen University Interior Design department exploring the fusion of bamboo with diverse materials to create exceptional interior products with emphasis on branding."
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
            backgroundImage: `url(${workshopDisplay})`,
            filter: 'brightness(0.7)'
          }}
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/70 to-green-900/60 z-0"></div>
        
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Woxsen University Interior Design Department
              </h1>
              <div className="text-green-300 font-semibold text-xl mb-6">
                3-day Workshop • September 2022 • Hyderabad, Telangana
              </div>
              <p className="text-lg text-green-100 mb-8 max-w-3xl">
                An impactful bamboo workshop exploring the fusion of bamboo with diverse materials to create exceptional interior products. Students learned to craft contemporary masterpieces that stand out in the market, with emphasis on branding and product presentation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <WhatsAppContact
                  phoneNumber="918971690163"
                  message="Hello, I'm interested in learning more about your Woxsen University workshop. Could you share additional information?"
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
              The impactful bamboo workshop held at <span className="text-yellow-500 dark:text-yellow-300 font-medium">Woxsen University</span>, Telangana, propelled Interior Design department students to explore the fusion of bamboo with diverse materials, creating exceptional interior products that combine function and aesthetics.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              This exercise empowered students to craft contemporary masterpieces that stand out in the market, with particular emphasis on <span className="text-yellow-500 dark:text-yellow-300 font-medium">branding and showcasing</span> the finished products. The workshop activities culminated in an exhibition where students presented their work in a professional format.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-8 text-lg">
              The task of incorporating bamboo into plywood furniture design allowed students to grasp the <span className="text-yellow-500 dark:text-yellow-300 font-medium">joinery techniques between two different materials</span>, expanding their knowledge of sustainable design practices and mixed-material construction methods.
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

            {/* Branding section */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
              Branding & Product Identity
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              A unique aspect of this workshop was the focus on product branding. We instructed students on branding their bamboo products through logo design and laser CNC engraving directly on bamboo components. This additional skill set helped students understand the complete product development cycle from design to market presentation.
            </p>
            
            {/* Student projects */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-6">
              Student Projects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              Additional products created during the workshop included:
            </p>
            <ul className="list-disc pl-5 mb-8 text-gray-700 dark:text-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li className="ml-2">Partition design with integrated lighting</li>
              <li className="ml-2">Multi-purpose storage racks</li>
              <li className="ml-2">Bamboo chairs with ergonomic design</li>
              <li className="ml-2">Lighting fixtures combining bamboo and other materials</li>
              <li className="ml-2">Decorative wall elements using traditional weaving techniques</li>
              <li className="ml-2">Small organizational accessories with brand identity</li>
            </ul>

            {/* Traditional weaving section */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
              Traditional Weaving for Modern Design
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-12">
              Traditional weaving methods were a key component of the workshop, unlocking modern bamboo design possibilities. Students learned various weaving patterns and techniques that have been used for centuries, then applied these traditional methods to create contemporary interior products. This connection between traditional craftsmanship and modern design thinking was a defining feature of the workshop.
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
              We collaborate with educational institutions, interior design departments, and design organizations to conduct immersive bamboo workshops. Reach out to discuss how we can bring sustainable bamboo design practices to your organization.
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

export default WoxsenUniversityWorkshop;