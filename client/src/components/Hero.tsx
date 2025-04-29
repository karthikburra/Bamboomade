import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import WhatsAppContact from "./WhatsAppContact";

const Hero: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-b from-green-900/80 to-green-800/80 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ 
          backgroundImage: `url('https://lh4.googleusercontent.com/QhBfl3ZsnGYcNo1tUqlHzZVRVYdCmYCASoBNDUWD1ia8DaUfRDRfluy3_6EvzhH6T3vB-jb2yBSmC2J_aFymcwL5YM2-8nnTKbop8Hmj_v6XG0bfo7zv2h-IzJvwG6ShHw=w1280')`,
          filter: 'brightness(0.6)'
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40 z-10">
        <div className="md:max-w-3xl lg:max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            <span className="block">Beyond Tradition:</span>{" "}
            <span className="block text-green-300">Building a Sustainable Modern Future</span>
          </h1>
          <p className="mt-6 text-xl text-white max-w-3xl">
            "Achieving artistic, functional, and sustainable design solutions."
          </p>
          <div className="mt-6 text-lg text-white max-w-3xl">
            <p>We bring Bamboo Workshops to you!</p>
            <p className="mt-2">Email: <a href="mailto:Info@bamboomade.in" className="underline hover:text-green-300">Info@bamboomade.in</a></p>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/gallery">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Explore Our Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <WhatsAppContact 
              phoneNumber="+918971690163"
              message="Hello, I'm interested in BambooMade workshops. I'd like to inquire about your services."
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            />
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
