import React, { useState, useEffect } from 'react';
import { Calendar, ExternalLink, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Define the shape of an event
interface Event {
  id: number;
  title: string;
  content: string;
  source: string | null;
  contentType: string;
  status: string;
  createdAt: string;
}

interface BambooEventsProps {
  events: string | null;
  onEventClick?: (event: string) => void;
  upcomingEvents?: Event[];
}

const BambooEvents: React.FC<BambooEventsProps> = ({ events, onEventClick, upcomingEvents = [] }) => {
  // Get upcoming events from API if not provided
  const [fetchedEvents, setFetchedEvents] = useState<Event[]>([]);

  useEffect(() => {
    // If upcomingEvents are not provided, fetch them from API
    if (upcomingEvents.length === 0 && !fetchedEvents.length) {
      fetch('/api/dashboard-data')
        .then(res => res.json())
        .then(data => {
          if (data.upcomingEvents && Array.isArray(data.upcomingEvents)) {
            setFetchedEvents(data.upcomingEvents);
          }
        })
        .catch(err => console.error('Error fetching events:', err));
    }
  }, [upcomingEvents, fetchedEvents]);

  // Extract date from event content if available
  const extractDate = (content: string): string | null => {
    // Check for common date patterns in the content
    const datePatterns = [
      /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i,
      /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/
    ];

    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  };
  
  // Filter events to only include actual events (not Medium articles or other content types)
  const filterActualEvents = (events: Event[]) => {
    return events.filter(event => {
      // Check if it's explicitly an event content type
      if (event.contentType === 'event') {
        return true;
      }
      
      // Check if title explicitly mentions it's an event
      if (event.title.toLowerCase().includes('workshop') || 
          event.title.toLowerCase().includes('event') ||
          event.title.toLowerCase().includes('course') ||
          event.title.toLowerCase().includes('webinar') ||
          event.title.toLowerCase().includes('session')) {
        return true;
      }
      
      // If title contains "Medium" or similar publication names, it's not an event
      if (event.title.includes('Medium') || 
          event.title.includes('Blog') ||
          event.title.includes('Article')) {
        return false;
      }
      
      // Check content for event indicators
      const eventKeywords = ['register', 'rsvp', 'join us', 'workshop', 'webinar', 'session', 'training'];
      for (const keyword of eventKeywords) {
        if (event.content.toLowerCase().includes(keyword)) {
          return true;
        }
      }
      
      // Check if content has date-like patterns (indicating an event)
      const hasDate = extractDate(event.content) !== null;
      return hasDate;
    });
  };
  
  // Use provided upcomingEvents or the fetched ones, but filter to actual events only
  const eventsToDisplay = filterActualEvents(upcomingEvents.length > 0 ? upcomingEvents : fetchedEvents);

  // Extract location from event content if available
  const extractLocation = (content: string): string | null => {
    const locationPatterns = [
      /at\s+([^,.]+(?:,\s*[^,.]+)?)/i,
      /location:\s*([^,.]+(?:,\s*[^,.]+)?)/i,
      /venue:\s*([^,.]+(?:,\s*[^,.]+)?)/i
    ];

    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  };

  // If no events are available, show a message
  if (eventsToDisplay.length === 0 && !events) {
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
          Click on any event card to ask our AI for details or use the registration links
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        {/* Display events as tiles/cards */}
        <div className="grid grid-cols-1 gap-3">
          {eventsToDisplay.map(event => {
            // Get event date - extract from content or use createdAt if not found
            let eventDate = extractDate(event.content);
            if (!eventDate && event.createdAt) {
              // Format createdAt date if extractDate didn't find a date
              const date = new Date(event.createdAt);
              // Only format if it's a valid date
              if (!isNaN(date.getTime())) {
                const options: Intl.DateTimeFormatOptions = { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                };
                eventDate = date.toLocaleDateString('en-US', options);
              }
            }
            
            const eventLocation = extractLocation(event.content);
            
            // Extract registration link if available
            let registrationLink = null;
            
            // First try markdown-style links
            const markdownLinkMatch = event.content.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (markdownLinkMatch) {
              registrationLink = {
                text: markdownLinkMatch[1],
                url: markdownLinkMatch[2]
              };
            } 
            // Also look for regular URLs in the content
            else {
              const urlMatch = event.content.match(/(https?:\/\/[^\s]+)/);
              if (urlMatch) {
                registrationLink = {
                  text: "Register Now",
                  url: urlMatch[1]
                };
              }
              // Check if we have a source that could be a registration link
              else if (event.source && event.source.startsWith('http')) {
                registrationLink = {
                  text: "More Information",
                  url: event.source
                };
              }
            }
            
            // Truncate content for preview
            const contentPreview = event.content.substring(0, 120) + (event.content.length > 120 ? '...' : '');
            
            return (
              <div 
                key={event.id}
                className="p-3 bg-zinc-800 rounded-md cursor-pointer hover:bg-zinc-750 transition-colors border border-transparent hover:border-green-800/50"
                onClick={() => onEventClick && onEventClick(event.title)}
              >
                <h3 className="font-medium text-green-400 mb-1">{event.title}</h3>
                <div className="flex items-center text-xs text-zinc-400 mb-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {eventDate || "Coming Soon"}
                </div>
                {eventLocation && (
                  <div className="flex items-center text-xs text-zinc-400 mb-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {eventLocation}
                  </div>
                )}
                <p className="text-zinc-300 text-xs mb-2">{contentPreview}</p>
                {registrationLink && (
                  <a 
                    href={registrationLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:text-green-300 inline-flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {registrationLink.text}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Fallback to traditional markdown display if needed */}
        {eventsToDisplay.length === 0 && events && (
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
        )}
        
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