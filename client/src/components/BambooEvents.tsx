import React from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface BambooEventsProps {
  events: string | null;
  onEventClick?: (event: string) => void;
}

const BambooEvents: React.FC<BambooEventsProps> = ({ events, onEventClick }) => {
  // If no events are available, show a message
  if (!events) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-500" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-zinc-400">
            No upcoming events found in our database. Ask our AI for information about workshops and events!
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
            <Calendar className="h-5 w-5 mr-2 text-green-500" />
            Upcoming Events
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-zinc-800 text-green-400 border-green-800 px-2">
            Live
          </Badge>
        </div>
        <CardDescription className="text-xs text-zinc-400">
          Click on any event to ask our AI for details or use the registration links
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="prose prose-sm prose-invert max-w-none prose-headings:text-zinc-200 prose-a:text-green-400">
          <ReactMarkdown components={{
            a: ({ node, ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 inline-flex items-center"
                onClick={(e) => e.stopPropagation()} // Prevent the link click from triggering the list item click
              >
                {props.children}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            ),
            li: ({ node, ...props }) => {
              // Check if the content contains a link
              const hasLink = String(props.children).includes('[') && String(props.children).includes('](');
              
              return (
                <li 
                  {...props} 
                  className={`mb-3 last:mb-0 ${hasLink ? '' : 'cursor-pointer hover:text-green-300'} transition-colors`}
                  onClick={hasLink ? undefined : () => onEventClick && onEventClick(String(props.children))}
                />
              );
            }
          }}>
            {events}
          </ReactMarkdown>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          onClick={() => onEventClick && onEventClick("What bamboo architecture events are coming up?")}
        >
          Ask about upcoming events
        </Button>
      </CardContent>
    </Card>
  );
};

export default BambooEvents;