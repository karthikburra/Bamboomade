import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Mail, Phone } from "lucide-react";
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
      { phrase: 0, text: "Academic Project", className: "text-yellow-300 font-bold" },
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
      <span className="block text-pretty">
        {renderHighlightedText()}
      </span>
    </div>
  );
};

const Hero: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-b from-green-950/90 to-green-900/90 overflow-hidden">
      {/* Background Image with Overlay - optimized for all screen sizes */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 transform scale-105" 
        style={{ 
          backgroundImage: `url(${heroImage})`,
          filter: 'brightness(0.4)',
          backgroundPosition: 'center 25%',
          backgroundSize: 'cover',
          willChange: 'transform'
        }}
      />
      {/* Additional dark overlay for better text readability with gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40 z-0"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-16 sm:py-20 md:py-28 lg:py-36 xl:py-40 z-10">
        <div className="md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-white">
            <span className="block">Beyond Tradition:</span>{" "}
            <span className="block text-green-300 min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[3.5rem] lg:min-h-[4rem] xl:min-h-[4.5rem]">
              <AnimatedText 
                phrases={[
                  "Get Academic Project guidance from Experts.",
                  "We bring <span class='text-yellow-300'>Bamboo workshops</span> to you."
                ]} 
              />
            </span>
          </h1>
          <p className="mt-3 sm:mt-4 md:mt-5 lg:mt-6 text-base sm:text-lg md:text-xl lg:text-2xl text-white max-w-3xl">
            "Achieving artistic, functional, and sustainable design solutions."
          </p>

          <div className="mt-5 sm:mt-6 md:mt-8 lg:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full">
            <Link href="/project-guidance" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="default"
                className="w-full sm:w-auto text-sm sm:text-base md:text-lg h-10 sm:h-11 md:h-12 lg:h-14 px-4 sm:px-5 md:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium border border-green-400 shadow-lg shadow-green-900/50 transition-all duration-300 transform hover:scale-105"
              >
                Get Project Guidance
                <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
            <Link href="/our-works" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto text-sm sm:text-base md:text-lg h-10 sm:h-11 md:h-12 lg:h-14 px-4 sm:px-5 md:px-6 lg:px-8 bg-green-800/30 text-green-400 hover:bg-green-800/50 border border-green-700"
              >
                Explore Our Experience
                <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-4 sm:mt-5 md:mt-6 flex gap-3 sm:gap-4">
            <a href="mailto:Info@bamboomade.in" className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border border-green-700/50 hover:bg-green-900/30 text-green-300 hover:text-green-200 h-9 sm:h-10"
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Email Us</span>
              </Button>
            </a>
            <a href="https://wa.me/8971690163" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border border-green-700/50 hover:bg-green-900/30 text-green-300 hover:text-green-200 h-9 sm:h-10"
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">WhatsApp</span>
              </Button>
            </a>
          </div>
        </div>
      </div>
      
      {/* Wave Divider - Responsive height for different screen sizes */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1440 120" 
          className="text-background fill-current w-full h-auto"
          preserveAspectRatio="none"
          style={{ height: 'clamp(40px, 8vw, 120px)' }}
        >
          <path d="M0,64L80,80C160,96,320,128,480,122.7C640,117,800,75,960,64C1120,53,1280,75,1360,85.3L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default Hero;
