import React from "react";
import { useLocation } from "wouter";
import GalleryGrid from "@/components/GalleryGrid";
import { Helmet } from "react-helmet";

const Gallery: React.FC = () => {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1]);
  const initialCategory = params.get("category") || "all";

  return (
    <>
      <Helmet>
        <title>Gallery | BambooMade</title>
        <meta name="description" content="Explore our innovative bamboo architecture projects, workshops, and design details." />
      </Helmet>
      
      <div className="bg-background py-12">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Project Gallery
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our collection of bamboo architecture projects, workshops, and design details that showcase the versatility and beauty of bamboo.
            </p>
          </div>
          
          <GalleryGrid />
        </div>
      </div>
    </>
  );
};

export default Gallery;
