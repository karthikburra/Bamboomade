import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import WhatsAppContact from "./WhatsAppContact";
import heroImage from "@assets/Hero.png";

interface AnimatedTextProps {
  phrases: string[];
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ phrases }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const currentPhrase = phrases[currentIndex];
    
    // Handle typing and deleting animation
    const timer = setTimeout(() => {
      // If in deleting mode, clear text instantly
      if (isDeleting) {
        setDisplayText(''); // Instantly clear the text
        setIsDeleting(false);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        setLoopCount(loopCount + 1);
        setTypingSpeed(100); // Reset typing speed
      } 
      // If in typing mode, add characters one by one
      else {
        setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        setTypingSpeed(80); // Normal typing speed
        
        // When full text is displayed, pause before deleting
        if (displayText === currentPhrase) {
          setTypingSpeed(1500); // Pause at the end of phrase
          setIsDeleting(true);
        }
      }
      
    }, typingSpeed);
    
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentIndex, phrases, loopCount, typingSpeed]);

  // Helper function to highlight specific parts of the text
  const renderHighlightedText = () => {
    // Define the parts to be highlighted for each phrase
    const highlightMap = [
      { phrase: 0, text: "Thesis Project", className: "text-yellow-300 font-bold" },
      { phrase: 1, text: "BambooMade AI", className: "text-yellow-300 font-bold" },
      { phrase: 2, text: "Bamboo workshops", className: "text-yellow-300 font-bold" },
    ];
    
    // Find which highlight applies to current phrase
    const highlight = highlightMap.find(h => h.phrase === currentIndex);
    
    if (!highlight || displayText.length === 0) {
      return displayText;
    }
    
    // Check if the highlighted part is in the currently displayed text
    const { text, className } = highlight;
    const startIndex = phrases[currentIndex].indexOf(text);
    
    // If the highlight text isn't in the phrase or we haven't typed that far yet
    if (startIndex === -1 || displayText.length <= startIndex) {
      return displayText;
    }
    
    // Check if we've typed past the end of the highlighted part
    const endIndex = startIndex + text.length;
    if (displayText.length < endIndex) {
      // We're in the middle of typing the highlighted part
      const beforeHighlight = displayText.substring(0, startIndex);
      const highlightPart = displayText.substring(startIndex);
      
      return (
        <>
          {beforeHighlight}
          <span className={className}>{highlightPart}</span>
        </>
      );
    } else {
      // We've typed the full highlighted part
      const beforeHighlight = displayText.substring(0, startIndex);
      const highlightPart = displayText.substring(startIndex, endIndex);
      const afterHighlight = displayText.substring(endIndex);
      
      return (
        <>
          {beforeHighlight}
          <span className={className}>{highlightPart}</span>
          {afterHighlight}
        </>
      );
    }
  };

  return (
    <div className="relative overflow-hidden">
      <span className="block">
        {renderHighlightedText()}
        <span className="animate-pulse">|</span>
      </span>
    </div>
  );
};

const Hero: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-b from-green-950/90 to-green-900/90 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ 
          backgroundImage: `url(${heroImage})`,
          filter: 'brightness(0.4)'
        }}
      />
      {/* Additional dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40 z-10">
        <div className="md:max-w-3xl lg:max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            <span className="block">Beyond Tradition:</span>{" "}
            <span className="block text-green-300 min-h-[4rem] md:min-h-[4.5rem]">
              <AnimatedText 
                phrases={[
                  "Get Thesis Project guidance from Experts.",
                  "Explore BambooMade AI for more Knowledge.",
                  "We bring Bamboo workshops to you."
                ]} 
              />
            </span>
          </h1>
          <p className="mt-6 text-xl text-white max-w-3xl">
            "Achieving artistic, functional, and sustainable design solutions."
          </p>
          <div className="mt-6 text-lg text-white max-w-3xl">
            <p className="mt-2">Email: <a href="mailto:Info@bamboomade.in" className="underline hover:text-green-300">Info@bamboomade.in</a></p>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/gallery">
              <Button
                size="lg"
                variant="secondary"
                className="bg-green-800/30 text-green-400 hover:bg-green-800/50 border border-green-700"
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
