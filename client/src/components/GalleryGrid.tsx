import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  featured: boolean;
}

const GalleryGrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: allProjects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const filteredProjects = selectedCategory === "all"
    ? allProjects
    : allProjects?.filter(project => project.category === selectedCategory);

  return (
    <div className="py-8">
      <Tabs
        defaultValue="all"
        onValueChange={setSelectedCategory}
        className="w-full"
      >
        <div className="flex justify-center mb-8">
          <TabsList>
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="workshop">Workshops</TabsTrigger>
            <TabsTrigger value="design">Design Details</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedCategory} className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="aspect-square w-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects?.map((project) => (
                <Card
                  key={project.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-0"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="aspect-square w-full overflow-hidden">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Project Details Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        {selectedProject && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedProject.title}</DialogTitle>
              <DialogDescription>
                {selectedProject.category.charAt(0).toUpperCase() + selectedProject.category.slice(1)}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <img
                src={selectedProject.imageUrl}
                alt={selectedProject.title}
                className="w-full rounded-md object-cover max-h-[60vh]"
              />
              <p className="mt-4 text-muted-foreground">
                {selectedProject.description}
              </p>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default GalleryGrid;
