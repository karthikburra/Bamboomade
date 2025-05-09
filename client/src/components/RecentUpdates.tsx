import React from 'react';
import { Clock, ExternalLink, Calendar } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RecentUpdate } from '@/lib/bamboo-ai';
import { formatDistance } from 'date-fns';

interface RecentUpdatesProps {
  updates: RecentUpdate[];
  onUpdateClick?: (title: string) => void;
}

const RecentUpdates: React.FC<RecentUpdatesProps> = ({ updates, onUpdateClick }) => {
  const formatTimeAgo = (date: Date) => {
    try {
      const parsedDate = typeof date === 'string' ? new Date(date) : date;
      return formatDistance(parsedDate, new Date(), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'recently';
    }
  };

  if (!updates || updates.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Recent Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-zinc-400">
            We'll show recent bamboo architecture updates here as they're added to our knowledge base.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Recent Updates
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-zinc-800 text-blue-400 border-blue-800 px-2">
            {updates.length} new
          </Badge>
        </div>
        <CardDescription className="text-xs text-zinc-400">
          Click on any update to ask our AI for more information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {updates.map((update) => (
            <div 
              key={update.id}
              className="border-b border-zinc-800 pb-3 last:border-b-0 cursor-pointer"
              onClick={() => onUpdateClick && onUpdateClick(update.title)}
            >
              <h3 className="text-sm font-medium text-zinc-200 hover:text-blue-400 transition-colors">
                {update.title}
              </h3>
              
              <div className="mt-1 text-xs flex items-center text-zinc-500">
                <Calendar className="h-3 w-3 mr-1" />
                {formatTimeAgo(update.createdAt)}
              </div>
              
              <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                {update.content.length > 150 
                  ? `${update.content.substring(0, 150)}...` 
                  : update.content}
              </p>
              
              {update.source && (
                <div className="mt-1 text-xs text-zinc-500">
                  Source:{' '}
                  <a 
                    href={update.source.startsWith('http') ? update.source : '#'} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-400 inline-flex items-center"
                    onClick={(e) => {
                      if (!update.source?.startsWith('http')) {
                        e.preventDefault();
                        onUpdateClick && onUpdateClick(update.title);
                      }
                      
                      // Track click in Google Analytics
                      if (typeof window !== 'undefined' && (window as any).gtag && update.source?.startsWith('http')) {
                        (window as any).gtag('event', 'citation_click', {
                          'event_category': 'AI_Chat',
                          'event_label': update.source
                        });
                      }
                    }}
                  >
                    {update.source.startsWith('http') 
                      ? new URL(update.source).hostname.replace('www.', '') 
                      : update.source}
                    {update.source.startsWith('http') && <ExternalLink className="h-3 w-3 ml-1" />}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          onClick={() => onUpdateClick && onUpdateClick("What's new in bamboo architecture?")}
        >
          More recent updates
        </Button>
      </CardContent>
    </Card>
  );
};

export default RecentUpdates;