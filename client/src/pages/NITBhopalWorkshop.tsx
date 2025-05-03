import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft, Check, Calendar, MapPin } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import WhatsAppContact from "@/components/WhatsAppContact";

// Import authentic workshop images with @assets alias
import bambooPavilion from "@assets/IMG-20240514-WA0003.jpg";
import bambooPavilionConstruction from "@assets/IMG-20240514-WA0001.jpg";
import bambooModel from "@assets/IMG-20230920-WA0054 1 (1).png";
import bambooJoinery from "@assets/IMG-20230920-WA0048.png";
import bambooConstruction from "@assets/0Z4A8974 1 (2).jpg";
import bambooTeamwork from "@assets/IMG-20230920-WA0085 1 (1).jpg";
import bambooWeaving from "@assets/IMG-20230920-WA0056 1 (1).jpg";
import bambooBasket from "@assets/IMG-20230920-WA0053 1.png";
import bambooTable from "@assets/IMG-20230920-WA0047 1.png";
import bambooDisplay from "@assets/IMG-20230920-WA0063 1.png";
import bambooShelf from "@assets/IMG-20230920-WA0035 (1).jpg";
import bambooLamp from "@assets/IMG-20230920-WA0061 1 (1).jpg";

const NITBhopalWorkshop: React.FC = () => {
  // Image gallery with authentic NIT Bhopal workshop images
  const galleryImages = [
    { src: bambooPavilion, alt: "Bamboo pavilion structure at NIT Bhopal campus" },
    { src: bambooPavilionConstruction, alt: "Students constructing bamboo roof structure" },
    { src: bambooModel, alt: "Architectural bamboo model created during the workshop" },
    { src: bambooJoinery, alt: "Bamboo joinery techniques demonstrated at the workshop" },
    { src: bambooConstruction, alt: "Participants working on bamboo joinery techniques" },
    { src: bambooTeamwork, alt: "Students collaborating on bamboo structure creation" }
  ];

  // Workshop key learning points
  const workshopHighlights = [
    "Bamboo joinery techniques that can be seamlessly integrated into product design",
    "Weaving methods for creating functional and decorative bamboo elements",
    "Hands-on experience with bamboo material properties for design applications",
    "Creating detailed technical drawings and presentations for bamboo projects",
    "Product design methodologies specific to bamboo as a primary material",
    "Collaborative design approaches for complex bamboo structures"
  ];

  // Sample projects from the workshop
  const workshopProjects = [
    {
      image: bambooWeaving,
      title: "Bamboo Weaving Techniques",
      description: "Learning traditional and modern weaving patterns to create functional pieces"
    },
    {
      image: bambooBasket,
      title: "Functional Bamboo Basket",
      description: "Combining joinery and weaving to create sturdy and attractive storage solutions"
    },
    {
      image: bambooTable,
      title: "Bamboo Side Table",
      description: "Designing furniture that highlights bamboo's strength and aesthetic qualities"
    },
    {
      image: bambooDisplay,
      title: "Illuminated Display Shelf",
      description: "Integrating lighting elements with bamboo structures for interior decor"
    },
    {
      image: bambooShelf,
      title: "Multi-tier Bamboo Shelving",
      description: "Creating modular storage solutions with sustainable bamboo materials"
    },
    {
      image: bambooLamp,
      title: "Bamboo Lighting Fixture",
      description: "Exploring bamboo's translucent properties for creating ambient lighting"
    }
  ];

  return (
    <>
      <Helmet>
        <title>NIT Bhopal Bamboo Workshop | National-level Bamboo Joinery & Craft | BambooMade</title>
        <meta
          name="description"
          content="A transformative 3-day national-level bamboo joinery and craft workshop at MA National Institute of Technology Bhopal in partnership with COA TRC and IIA Bhopal Centre, focusing on product design."
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
            backgroundImage: `url(${bambooPavilion})`,
            filter: 'brightness(0.7)'
          }}
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/70 to-green-900/60 z-0"></div>
        
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                MA National Institute of Technology, Bhopal
              </h1>
              <div className="text-green-300 font-semibold text-xl mb-6">
                3-day National Workshop • September 2023 • Bhopal, India
              </div>
              <p className="text-lg text-green-100 mb-8 max-w-3xl">
                A transformative national-level bamboo joinery and craft workshop conducted in partnership with COA TRC and IIA Bhopal Centre, empowering participants to embrace bamboo as their primary material for designing products and creating detailed presentations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <WhatsAppContact
                  phoneNumber="8971690163"
                  message="Hello, I'm interested in learning more about your NIT Bhopal workshop. Could you share additional information?"
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
              Conducted in partnership with <span className="text-yellow-500 dark:text-yellow-300 font-medium">COA TRC, Bhopal, and the IIA Bhopal Centre</span>, this workshop was a transformative 3-day national-level event focused on bamboo joinery and craft. The workshop aimed to empower participants with the knowledge and confidence to embrace bamboo as their primary material for designing products.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              Participants learned how to create <span className="text-yellow-500 dark:text-yellow-300 font-medium">detailed presentations and technical drawings</span> to bring their bamboo-based ideas to life. The workshop incorporated both theoretical knowledge and practical, hands-on experience in bamboo joinery and weaving techniques.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-8 text-lg">
              We welcomed participants with diverse experiences and expertise, making it easier for them to seamlessly integrate these skills into <span className="text-yellow-500 dark:text-yellow-300 font-medium">product design and interior decor</span>. The workshop emphasized the versatility of bamboo as a sustainable material for contemporary design applications.
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

            {/* Workshop partners */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
              Workshop Partners
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-5 text-center">
                <h4 className="font-bold text-lg text-green-800 dark:text-green-300 mb-2">
                  MA National Institute of Technology
                </h4>
                <p className="text-gray-600 dark:text-gray-400">Host Institution</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-5 text-center">
                <h4 className="font-bold text-lg text-green-800 dark:text-green-300 mb-2">
                  Council of Architecture Training & Research Centre
                </h4>
                <p className="text-gray-600 dark:text-gray-400">Knowledge Partner</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-5 text-center">
                <h4 className="font-bold text-lg text-green-800 dark:text-green-300 mb-2">
                  Indian Institute of Architects, Bhopal Centre
                </h4>
                <p className="text-gray-600 dark:text-gray-400">Industry Partner</p>
              </div>
            </div>

            {/* Student projects */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-6">
              Student Projects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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

            {/* Workshop outcomes */}
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
              Workshop Outcomes
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              The workshop successfully equipped participants with practical knowledge of bamboo joinery and weaving techniques, enabling them to integrate these skills into their own product design and interior decor projects. Participants left with a deeper understanding of bamboo as a material and the confidence to use it as a primary element in their designs.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-12">
              The collaborative environment fostered connections between diverse participants, from students to professionals, creating a community of bamboo enthusiasts committed to sustainable design practices.
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
              <WhatsAppContact phoneNumber="8971690163" className="bg-green-700 hover:bg-green-800" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default NITBhopalWorkshop;