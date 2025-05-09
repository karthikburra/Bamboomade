import React, { useState, MouseEvent } from 'react';
import { Lightbulb, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from './ui/button';
import { BambooFact as BambooFactType } from '@/lib/bamboo-ai';

interface BambooFactProps {
  factData: BambooFactType | null;
  factsData?: BambooFactType[];
  onFactClick?: (question: string) => void;
}

const BambooFact: React.FC<BambooFactProps> = ({ factData, factsData = [], onFactClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Use factsData if available, otherwise use the single factData as a legacy option
  const facts = factsData && factsData.length > 0 ? factsData : (factData ? [factData] : []);
  const currentFact = facts.length > 0 ? facts[currentIndex] : null;
  
  const handleFactClick = (fact: BambooFactType | null) => {
    if (onFactClick && fact) {
      onFactClick(`Tell me more about "${fact.fact.split('.')[0]}"`);
    }
  };
  
  const handleNext = () => {
    if (facts.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % facts.length);
    }
  };
  
  const handlePrevious = () => {
    if (facts.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + facts.length) % facts.length);
    }
  };

  if (facts.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
            Bamboo Facts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-zinc-400">
            Interesting facts about bamboo will appear here. Ask our AI about bamboo properties!
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
          Did You Know?
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          {facts.length > 1 ? "Browse interesting bamboo facts from different sources" : "Click to learn more about this interesting bamboo fact"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentFact && (
          <div 
            className="text-sm text-zinc-300 cursor-pointer hover:text-zinc-100 transition-colors"
            onClick={() => handleFactClick(currentFact)}
          >
            {currentFact.fact}
          </div>
        )}
        
        {currentFact && currentFact.source && (
          <div className="mt-2 text-xs text-zinc-500">
            Source:{' '}
            <a 
              href={currentFact.source.startsWith('http') ? currentFact.source : '#'} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-400 inline-flex items-center"
              onClick={(e) => {
                if (!currentFact.source?.startsWith('http')) {
                  e.preventDefault();
                  handleFactClick(currentFact);
                }
                
                // Track click in Google Analytics
                if (typeof window !== 'undefined' && (window as any).gtag && currentFact.source.startsWith('http')) {
                  (window as any).gtag('event', 'citation_click', {
                    'event_category': 'AI_Chat',
                    'event_label': currentFact.source
                  });
                }
              }}
            >
              {currentFact.source.startsWith('http') 
                ? new URL(currentFact.source).hostname.replace('www.', '') 
                : currentFact.source}
              {currentFact.source.startsWith('http') && <ExternalLink className="h-3 w-3 ml-1" />}
            </a>
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          onClick={() => onFactClick && onFactClick("What are some interesting facts about bamboo?")}
        >
          More bamboo facts
        </Button>
      </CardContent>
      
      {facts.length > 1 && (
        <CardFooter className="p-2 flex justify-between items-center border-t border-zinc-800">
          <span className="text-xs text-zinc-500">
            {currentIndex + 1} / {facts.length}
          </span>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-zinc-400" 
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-zinc-400" 
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default BambooFact;