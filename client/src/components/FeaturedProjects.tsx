import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";

interface Workshop {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: string;
  date: string;
  viewMoreLink: string;
}

const FeaturedProjects: React.FC = () => {
  // Use authentic workshop data with locally stored images
  const workshops: Workshop[] = [
    {
      id: "icfai-architecture",
      title: "ICFAI School of Architecture",
      description: "An impactful bamboo workshop where students explored bamboo to create exceptional products, empowering them to craft contemporary masterpieces showcasing the finished products.",
      imageUrl: "/img/workshops/icfai-bamboo-stool.jpg",
      duration: "3 day workshop",
      date: "Nov 2024",
      viewMoreLink: "/workshops/icfai-architecture"
    },
    {
      id: "sirpur-community",
      title: "BambooMade Community Training",
      description: "Creating awareness of bamboo through hands-on experience focusing on traditional weaving techniques and joineries, which will directly influence the way the material is used in the future.",
      imageUrl: "/img/projects/community-training.png",
      duration: "5 day workshop",
      date: "Jan 2024",
      viewMoreLink: "/workshops/sirpur-community"
    },
    {
      id: "international-bamboo-fest",
      title: "International Bamboo Festival",
      description: "Volunteering with Ewe Jin Low at Tadom Hill Resorts in Malaysia, modeling sustainable bamboo structures and contributing to the worldwide push for sustainable living.",
      imageUrl: "/img/projects/bamboo-model-festival.png",
      duration: "2 day festival",
      date: "Nov 2023",
      viewMoreLink: "/workshops/international-bamboo-fest"
    },
    {
      id: "nit-bhopal",
      title: "NIT Bhopal",
      description: "A transformative national-level bamboo joinery workshop in partnership with COA TRC and IIA Bhopal Centre, focusing on product design and detailed drawing presentations.",
      imageUrl: "/img/projects/nit-bhopal-structure.png",
      duration: "3 day workshop",
      date: "Sept 2023",
      viewMoreLink: "/workshops/nit-bhopal"
    },
    {
      id: "spa-delhi",
      title: "SPA Delhi",
      description: "An inclusive workshop welcoming diverse participants and sharing knowledge with students, professionals, researchers, and professors to integrate bamboo into architectural curriculum.",
      imageUrl: "/img/projects/spa-delhi-umbrella.jpg",
      duration: "5 day workshop",
      date: "Feb 2023",
      viewMoreLink: "/workshops/spa-delhi"
    },
    {
      id: "woxsen-university",
      title: "Woxsen University",
      description: "Workshop for Interior Design department students exploring the fusion of bamboo with diverse materials to create exceptional interior products with emphasis on branding.",
      imageUrl: "/img/projects/woxsen-university-table.png",
      duration: "3 day workshop",
      date: "Sept 2022",
      viewMoreLink: "/workshops/woxsen-university"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-green-50/30 dark:to-green-950/30">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12 text-center px-4 sm:px-0">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-green-800 dark:text-green-300 sm:text-4xl">
            Our Experience
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-green-700 dark:text-green-400 max-w-2xl mx-auto">
            "Through our successfully conducted workshops, we have ignited creativity, empowered participants, and built a strong foundation for Bamboo centric design."
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-0">
          {workshops.slice(0, 4).map((workshop) => (
            <Card key={workshop.id} className="overflow-hidden h-full flex flex-col">
              <div className="aspect-video w-full overflow-hidden bg-black/5 flex items-center justify-center">
                <img
                  src={workshop.imageUrl}
                  alt={workshop.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <CardContent className="p-3 sm:p-4 flex-grow">
                <div className="flex items-center text-xs sm:text-sm text-green-600 dark:text-green-400 mb-1 sm:mb-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span>{workshop.duration} | {workshop.date}</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-300 line-clamp-2">{workshop.title}</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-green-600 dark:text-green-400 line-clamp-3">{workshop.description}</p>
              </CardContent>
              <CardFooter className="p-3 sm:p-4 pt-0">
                <Link href={workshop.viewMoreLink} className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30">
                    View More
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 text-center px-4 sm:px-0">
          <Link href="/our-works" className="w-full sm:w-auto inline-block">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30">
              View All Works
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
