import React from "react";
import { Link } from "wouter";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface WorkshopHighlight {
  id: string;
  content: string;
}

export interface WorkshopImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface WorkshopDetailProps {
  id: string;
  title: string;
  location: string;
  date: string;
  duration: string;
  description: string;
  highlights: WorkshopHighlight[];
  images: WorkshopImage[];
  nextWorkshopId?: string;
  prevWorkshopId?: string;
}

const WorkshopDetail: React.FC<WorkshopDetailProps> = ({
  id,
  title,
  location,
  date,
  duration,
  description,
  highlights,
  images,
  nextWorkshopId,
  prevWorkshopId,
}) => {
  return (
    <div className="py-12 bg-gradient-to-b from-background to-green-50/30 dark:to-green-950/30">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/our-works">
            <Button variant="link" className="pl-0 text-green-700 dark:text-green-400">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Workshops
            </Button>
          </Link>
        </div>

        {/* Workshop Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-green-800 dark:text-green-300 mb-4">
            {title}
          </h1>
          
          <div className="flex flex-wrap gap-4 mb-6 text-green-700 dark:text-green-400">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{location}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{date} | {duration}</span>
            </div>
          </div>
          
          <p className="text-lg text-green-700 dark:text-green-400 max-w-3xl">
            {description}
          </p>
        </div>
        
        {/* Key Highlights */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-6">
            Key Highlights
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map((highlight) => (
              <Card key={highlight.id} className="bg-white/80 dark:bg-black/20 border-green-300 dark:border-green-800">
                <CardContent className="p-6">
                  <p className="text-green-700 dark:text-green-400">{highlight.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Workshop Gallery */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-6">
            Workshop Gallery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <div key={index} className="flex flex-col">
                <div className="aspect-video overflow-hidden rounded-lg bg-black/5 flex items-center justify-center">
                  <img 
                    src={image.url} 
                    alt={image.alt} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {image.caption && (
                  <p className="mt-2 text-sm text-center text-green-600 dark:text-green-500">{image.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation between workshops */}
        <div className="mt-16">
          <Separator className="mb-8 bg-green-200 dark:bg-green-800" />
          <div className="flex justify-between">
            {prevWorkshopId ? (
              <Link href={`/workshops/${prevWorkshopId}`}>
                <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Workshop
                </Button>
              </Link>
            ) : (
              <div />
            )}
            
            {nextWorkshopId && (
              <Link href={`/workshops/${nextWorkshopId}`}>
                <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30">
                  Next Workshop
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopDetail;