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
  // Use real workshop data from BambooMade's website
  const workshops: Workshop[] = [
    {
      id: "sirpur",
      title: "Sirpur Special Area Development Authority",
      description: "Community training focused on bamboo crafting skills and sustainable building techniques.",
      imageUrl: "https://lh4.googleusercontent.com/316KNhT4XoaTZUTOJVSmdOu_5vw2WWbHxefzDjerEgZEqEt6ZxhFNeT0b_LQEyDzP9BIVsgO9nhc1_1rro_c4tiZlKEcxvzgI-8gTM0AedmKfGHTqpzljEIL_ejJAfPVgw=w1280",
      duration: "5 day workshop",
      date: "Jan 2024",
      viewMoreLink: "/projects/sirpur"
    },
    {
      id: "inboo-23",
      title: "International Bamboo Festival, Malaysia",
      description: "Volunteers at International Bamboo Festival showcasing sustainable bamboo techniques.",
      imageUrl: "https://lh5.googleusercontent.com/4vCGBxeaZwe1NpZULC6j5jtonzfFTggbXqw_Zrn64tHYnrCHAG3192TmhQaVkz2TRkmqa8Y1UTvDfy9pmiL0dDaPgWx9dlG2hX9dEDNK28AK37xfI2lILrPBbDSHjlpF3w=w1280",
      duration: "DBBB",
      date: "Nov 2023",
      viewMoreLink: "/projects/inboo-23"
    },
    {
      id: "manit",
      title: "MA National Institute of Technology, Bhopal",
      description: "Workshop for architecture students focusing on bamboo design and construction techniques.",
      imageUrl: "https://lh4.googleusercontent.com/3afPFY8aRRrgCgEadDuyGXYM0pLqyFqO7U1NYUAsjlgwfQbPECKlfXDtyvW02-rRIfBhinysZC8YAv-hDDaGpTLtD2P13VUq7lBi5Jba7e_jVEi1SykNTDhADRWHqlQ3Pw=w1280",
      duration: "3 day workshop",
      date: "Sept 2023",
      viewMoreLink: "/projects/manit"
    },
    {
      id: "spa",
      title: "School of Planning and Architecture, Delhi",
      description: "Workshop on innovative bamboo architecture and sustainable design principles.",
      imageUrl: "https://lh6.googleusercontent.com/HhoF4g6nzOyuPdLXvHNwuPIGqcqfkvyRZqkfqhnJIpD0jyixmDOSeGbT4ElqLGPawdwJhWqlsa8F3rcOhPSkw64=w1280",
      duration: "5 day workshop",
      date: "Feb 2023",
      viewMoreLink: "/projects/spa"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Our Experience
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
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
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{workshop.duration} | {workshop.date}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground line-clamp-2">{workshop.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{workshop.description}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Link href={workshop.viewMoreLink}>
                  <Button variant="outline" size="sm" className="w-full">
                    View More
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/gallery">
            <Button variant="outline" size="lg">
              View All Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
