import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  featured: boolean;
}

const FeaturedProjects: React.FC = () => {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects?featured=true"],
  });

  return (
    <section className="py-16 bg-background">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Featured Projects
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our innovative bamboo architecture projects that combine sustainability, 
            tradition, and modern design principles.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-video w-full">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects?.map((project) => (
              <Card key={project.id} className="overflow-hidden h-full flex flex-col">
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <CardContent className="p-6 flex-grow flex flex-col">
                  <div className="mb-2">
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                      {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{project.title}</h3>
                  <p className="mt-2 text-muted-foreground flex-grow">{project.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
