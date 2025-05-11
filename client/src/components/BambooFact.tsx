import React from 'react';
import { Lightbulb, ExternalLink, Instagram, Globe, Youtube, FileText, Calendar, MessageSquare, BookOpen, RefreshCw } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from './ui/button';
import { Badge } from "./ui/badge";
import { BambooFact as BambooFactType } from '@/lib/bamboo-ai';

interface BambooFactProps {
  factData: BambooFactType | null;
  factsData?: BambooFactType[];
  onFactClick?: (question: string) => void;
}

const BambooFact: React.FC<BambooFactProps> = ({ factData, factsData = [], onFactClick }) => {
  // Use factsData if available, otherwise use the single factData as a legacy option
  // Filter out any facts with contentType of "book"
  const facts = (factsData && factsData.length > 0 ? factsData : (factData ? [factData] : []))
    .filter(fact => fact.contentType !== 'book');
  
  const handleFactClick = (fact: BambooFactType | null) => {
    if (onFactClick && fact) {
      onFactClick(`Tell me more about "${fact.fact.split('.')[0]}"`);
    }
  };
  
  // Get content type icon based on the type
  const getContentTypeIcon = (contentType?: string) => {
    switch(contentType) {
      case 'social':
        return <Instagram className="h-3 w-3 mr-1" />;
      case 'youtube':
        return <Youtube className="h-3 w-3 mr-1" />;
      case 'webpage':
        return <Globe className="h-3 w-3 mr-1" />;
      case 'article':
        return <FileText className="h-3 w-3 mr-1" />;
      case 'book':
        return <BookOpen className="h-3 w-3 mr-1" />;
      case 'event':
        return <Calendar className="h-3 w-3 mr-1" />;
      case 'training':
      case 'fact':
        return <Lightbulb className="h-3 w-3 mr-1" />;
      default:
        return <MessageSquare className="h-3 w-3 mr-1" />;
    }
  };
  
  // Get content type label based on the type
  const getContentTypeLabel = (contentType?: string) => {
    switch(contentType) {
      case 'social':
        return 'Social Media';
      case 'youtube':
        return 'YouTube';
      case 'webpage':
        return 'Website';
      case 'article':
        return 'Article';
      case 'book':
        return 'Book';
      case 'event':
        return 'Event';
      case 'training':
        return 'Training';
      case 'fact':
        return 'Fact';
      default:
        return contentType || 'Unknown';
    }
  };
  
  // Get content type color based on the type
  const getContentTypeColor = (contentType?: string) => {
    switch(contentType) {
      case 'social':
        return 'bg-pink-900 text-pink-400 border-pink-800';
      case 'youtube':
        return 'bg-red-900 text-red-400 border-red-800';
      case 'webpage':
        return 'bg-blue-900 text-blue-400 border-blue-800';
      case 'article':
        return 'bg-purple-900 text-purple-400 border-purple-800';
      case 'book':
        return 'bg-orange-900 text-orange-400 border-orange-800';
      case 'event':
        return 'bg-amber-900 text-amber-400 border-amber-800';
      case 'training':
        return 'bg-cyan-900 text-cyan-400 border-cyan-800';
      case 'fact':
        return 'bg-green-900 text-green-400 border-green-800';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };
  
  // Function to render source information without content type badges
  const renderSourceInfo = (fact: BambooFactType) => {
    if (!fact.source) return null;
    
    return (
      <div className="mt-1 text-xs flex flex-wrap items-center justify-end">
        {/* Source Link only, no content type badge */}
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
            : fact.source}
          {fact.source && fact.source.startsWith('http') && <ExternalLink className="h-3 w-3 ml-1" />}
        </a>
      </div>
    );
  };

  if (facts.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
              Bamboo Facts
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full text-zinc-400 hover:text-secondary"
              title="Refresh bamboo facts"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-3.5 w-3.5 text-secondary" />
            </Button>
          </div>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                Did You Know?
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Click to learn more about this interesting bamboo fact
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full text-zinc-400 hover:text-secondary"
              title="Refresh bamboo facts"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-3.5 w-3.5 text-secondary" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="text-sm text-zinc-300 cursor-pointer hover:text-zinc-100 transition-colors"
            onClick={() => handleFactClick(fact)}
          >
            {fact.fact}
          </div>
          
          {renderSourceInfo(fact)}
        </CardContent>
      </Card>
    );
  }

  // For multiple facts, display in tile format (up to 3)
  return (
    <Card className="border-zinc-800 bg-zinc-900 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
              Did You Know?
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Interesting facts about bamboo architecture and design
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-400 hover:text-amber-400 -mt-1 -mr-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 text-secondary" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {facts.slice(0, 3).map((fact) => (
            <div 
              key={fact.id} 
              className="border-b border-zinc-800 pb-3 last:border-0 last:pb-0"
            >
              <div 
                className="text-sm text-zinc-300 cursor-pointer hover:text-zinc-100 transition-colors"
                onClick={() => handleFactClick(fact)}
              >
                {/* Show full fact text */}
                {fact.fact}
              </div>
              {renderSourceInfo(fact)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BambooFact;