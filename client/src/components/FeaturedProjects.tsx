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
      id: "sirpur",
      title: "Sirpur Special Area Development Authority",
      description: "Community training focused on bamboo crafting skills and sustainable building techniques for local villagers.",
      imageUrl: "/img/projects/bamboo-workshop-training.png",
      duration: "5 day workshop",
      date: "Jan 2024",
      viewMoreLink: "/our-works?category=community"
    },
    {
      id: "international",
      title: "International Bamboo Design Workshop",
      description: "International participants learning sustainable bamboo design techniques and collaborative project building.",
      imageUrl: "/img/workshops/bamboo-workshop-international.png",
      duration: "7 day workshop",
      date: "Nov 2023",
      viewMoreLink: "/our-works?category=education"
    },
    {
      id: "models",
      title: "Architectural Model Making Workshop",
      description: "Students creating innovative bamboo scale models to explore structural and spatial concepts.",
      imageUrl: "/img/projects/bamboo-model.png",
      duration: "3 day workshop",
      date: "Sept 2023",
      viewMoreLink: "/our-works?category=architecture"
    },
    {
      id: "lighting",
      title: "Bamboo Lighting Design Workshop",
      description: "Participants exploring the art of crafting elegant and sustainable bamboo lighting solutions.",
      imageUrl: "/img/projects/bamboo-lamp.png",
      duration: "5 day workshop",
      date: "Feb 2023",
      viewMoreLink: "/our-works?category=design"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-green-950/90 to-black">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-green-800 dark:text-green-300 sm:text-4xl">
            Our Experience
          </h2>
          <p className="mt-4 text-lg text-green-700 dark:text-green-400 max-w-2xl mx-auto">
            "Through our successfully conducted workshops, we have ignited creativity, empowered participants, and built a strong foundation for Bamboo centric design."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workshops.map((workshop) => (
            <Card key={workshop.id} className="overflow-hidden h-full flex flex-col">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={workshop.imageUrl}
                  alt={workshop.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardContent className="p-4 flex-grow">
                <div className="flex items-center text-sm text-green-600 dark:text-green-400 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{workshop.duration} | {workshop.date}</span>
                </div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 line-clamp-2">{workshop.title}</h3>
                <p className="mt-2 text-sm text-green-600 dark:text-green-400 line-clamp-3">{workshop.description}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Link href={workshop.viewMoreLink}>
                  <Button variant="outline" size="sm" className="w-full border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30">
                    View More
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/our-works">
            <Button variant="outline" size="lg" className="border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30">
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
