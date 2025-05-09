import React from 'react';
import { Lightbulb, ExternalLink } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from './ui/button';
import { BambooFact as BambooFactType } from '@/lib/bamboo-ai';

interface BambooFactProps {
  factData: BambooFactType | null;
  onFactClick?: (question: string) => void;
}

const BambooFact: React.FC<BambooFactProps> = ({ factData, onFactClick }) => {
  const handleFactClick = () => {
    if (onFactClick && factData) {
      onFactClick(`Tell me more about "${factData.fact.split('.')[0]}"`);
    }
  };

  if (!factData) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
            Bamboo Fact
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
          Click to learn more about this interesting bamboo fact
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="text-sm text-zinc-300 cursor-pointer hover:text-zinc-100 transition-colors"
          onClick={handleFactClick}
        >
          {factData.fact}
        </div>
        
        {factData.source && (
          <div className="mt-2 text-xs text-zinc-500">
            Source:{' '}
            <a 
              href={factData.source.startsWith('http') ? factData.source : '#'} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-400 inline-flex items-center"
              onClick={(e) => {
                if (!factData.source?.startsWith('http')) {
                  e.preventDefault();
                  handleFactClick();
                }
                
                // Track click in Google Analytics
                if (typeof window !== 'undefined' && (window as any).gtag && factData.source?.startsWith('http')) {
                  (window as any).gtag('event', 'citation_click', {
                    'event_category': 'AI_Chat',
                    'event_label': factData.source
                  });
                }
              }}
            >
              {factData.source.startsWith('http') 
                ? new URL(factData.source).hostname.replace('www.', '') 
                : factData.source}
              {factData.source.startsWith('http') && <ExternalLink className="h-3 w-3 ml-1" />}
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
    </Card>
  );
};

export default BambooFact;