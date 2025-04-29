import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-b from-primary-950/30 to-primary-900/30 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ 
          backgroundImage: `url('https://source.unsplash.com/featured/?bamboo,architecture')`,
          filter: 'brightness(0.4)'
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40 z-10">
        <div className="md:max-w-3xl lg:max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            <span className="block">Sustainable</span>{" "}
            <span className="block text-secondary-400">Bamboo Architecture</span>
          </h1>
          <p className="mt-6 text-xl text-white max-w-3xl">
            BambooMade pioneers innovative and sustainable architectural solutions using bamboo. 
            Our designs blend traditional craftsmanship with modern engineering to create 
            sustainable, beautiful structures.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/gallery">
              <Button
                size="lg"
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Explore Our Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="text-background fill-current w-full h-auto">
          <path d="M0,64L80,80C160,96,320,128,480,122.7C640,117,800,75,960,64C1120,53,1280,75,1360,85.3L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default Hero;
