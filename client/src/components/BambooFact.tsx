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
  factsData?: BambooFactType[];
  onFactClick?: (question: string) => void;
}

const BambooFact: React.FC<BambooFactProps> = ({ factData, factsData = [], onFactClick }) => {
  // Use factsData if available, otherwise use the single factData as a legacy option
  const facts = factsData && factsData.length > 0 ? factsData : (factData ? [factData] : []);
  
  const handleFactClick = (fact: BambooFactType | null) => {
    if (onFactClick && fact) {
      onFactClick(`Tell me more about "${fact.fact.split('.')[0]}"`);
    }
  };
  
  // Function to render a source link for a fact
  const renderSourceLink = (fact: BambooFactType) => {
    if (!fact.source) return null;
    
    return (
      <div className="mt-1 text-xs text-zinc-500">
        Source:{' '}
        <a 
          href={fact.source.startsWith('http') ? fact.source : '#'} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-500 hover:text-green-400 inline-flex items-center"
          onClick={(e) => {
            if (!fact.source?.startsWith('http')) {
              e.preventDefault();
              handleFactClick(fact);
            }
            
            // Track click in Google Analytics
            if (typeof window !== 'undefined' && (window as any).gtag && fact.source && fact.source.startsWith('http')) {
              (window as any).gtag('event', 'citation_click', {
                'event_category': 'AI_Chat',
                'event_label': fact.source
              });
            }
          }}
        >
          {fact.source && fact.source.startsWith('http') 
            ? new URL(fact.source).hostname.replace('www.', '') 
            : fact.source || 'Source'}
          {fact.source && fact.source.startsWith('http') && <ExternalLink className="h-3 w-3 ml-1" />}
        </a>
      </div>
    );
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

  // For a single fact, maintain the old card style
  if (facts.length === 1) {
    const fact = facts[0];
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
            onClick={() => handleFactClick(fact)}
          >
            {fact.fact}
          </div>
          
          {renderSourceLink(fact)}
          
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
  }

  // For multiple facts, display in tile format (up to 3)
  return (
    <Card className="border-zinc-800 bg-zinc-900 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
          Did You Know?
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          Interesting bamboo facts from different sources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {facts.slice(0, 3).map((fact) => (
            <div 
              key={fact.id} 
              className="border-b border-zinc-800 pb-2 last:border-0 last:pb-0"
            >
              <div 
                className="text-sm text-zinc-300 cursor-pointer hover:text-zinc-100 transition-colors"
                onClick={() => handleFactClick(fact)}
              >
                {/* Truncate fact text if it's too long */}
                {fact.fact.length > 100 
                  ? `${fact.fact.substring(0, 100)}...` 
                  : fact.fact}
              </div>
              {renderSourceLink(fact)}
            </div>
          ))}
        </div>
        
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