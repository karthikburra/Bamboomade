import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const AIChatPrompt: React.FC = () => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  // Collection of bamboo facts
  const bambooFacts = [
    "Bamboo is one of the fastest-growing plants on Earth, with some species growing up to 91 cm (3 ft) in a single day.",
    "Bamboo is technically a grass, not a tree, making it part of the Poaceae family.",
    "There are over 1,500 species of bamboo growing across the world in various climates.",
    "Bamboo can sequester up to 70% more carbon per hectare than hardwood forests.",
    "Bamboo requires no pesticides or fertilizers to grow, making it naturally sustainable.",
    "Bamboo has a higher tensile strength than steel, making it excellent for construction.",
    "One hectare of bamboo can yield 60 tonnes of material annually, compared to 20 tonnes for most trees.",
    "Bamboo releases 35% more oxygen into the atmosphere than equivalent tree species.",
    "The oldest bamboo crafts discovered date back to 7,000 years ago in China.",
    "India is the second-largest bamboo producer globally, after China.",
    "The National Bamboo Mission aims to promote the bamboo sector in India through area-based farming.",
    "Bamboo can be used to create over 1,500 different products, from furniture to textiles.",
  ];

  // Change the fact every 4 seconds with fade effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Fade out
      setIsVisible(false);
      
      // Change fact after fade out animation completes
      setTimeout(() => {
        setCurrentFactIndex((prevIndex) => (prevIndex + 1) % bambooFacts.length);
        // Fade in
        setIsVisible(true);
      }, 300);
    }, 4000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [bambooFacts.length]);

  return (
    <div className="fixed bottom-4 left-0 right-0 mx-auto w-full z-50 px-4">
      <div className="relative bg-zinc-900/95 border-2 border-primary/30 rounded-xl shadow-xl py-3 px-4 max-w-7xl mx-auto backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/90 via-zinc-800/90 to-primary/30 animate-gradient-x"></div>
        <div className="relative z-10">
          <div className="flex items-center">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center mr-2.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <h3 className="text-sm font-medium text-white">Did you know?</h3>
          </div>
          
          <div className="mt-2 text-sm text-zinc-200 p-1 min-h-[48px] transition-all duration-500 ease-in-out">
            <p className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              {bambooFacts[currentFactIndex]}
            </p>
          </div>
          
          <div className="mt-1 flex justify-center">
            <div className="flex gap-1.5">
              {bambooFacts.map((_, index) => (
                <div 
                  key={index} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === currentFactIndex 
                      ? "bg-primary" 
                      : "bg-zinc-600"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPrompt;