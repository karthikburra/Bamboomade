import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ExternalLink, MapPin, User, RefreshCw, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyzeEventContent } from '@/utils/eventAnalyzer';

export interface Event {
  id: number;
  title: string;
  content: string;
  source?: string | null;
  createdAt: string | Date;
  contentType?: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  registrationLink?: string | null;
}

interface UpcomingEventsListProps {
  events: Event[];
  onEventClick?: (event: string) => void;
  maxEvents?: number;
}

const UpcomingEventsList: React.FC<UpcomingEventsListProps> = ({ 
  events, 
  onEventClick,
  maxEvents = 5
}) => {
  if (!events || events.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-zinc-100 flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-green-500" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-zinc-400 text-sm">No upcoming events found. Check back later!</p>
        </CardContent>
      </Card>
    );
  }

  // Display only up to maxEvents
  const eventsToDisplay = events.slice(0, maxEvents);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl font-bold text-zinc-100 flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-green-500" />
            Upcoming Events
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-400 hover:text-green-400 -mt-1 -mr-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 text-secondary" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {eventsToDisplay.map((event) => {
            // Use event-specific fields if available, or fall back to content analysis
            let eventDate: Date | null = null;
            let eventLocation: string | null = null;
            let registrationLink: string | null = null;
            
            // Initialize organizer info
            let organizerName: string | null = null;
            
            // Check if the content type is 'event' and we have specific fields populated
            if (event.contentType === 'event') {
              // Handle eventDate
              if (event.eventDate) {
                eventDate = new Date(event.eventDate);
              }
              
              // Handle eventLocation - ensure it's string | null and not undefined
              if (typeof event.eventLocation === 'string') {
                eventLocation = event.eventLocation;
              }
              
              // Handle registrationLink - ensure it's string | null and not undefined
              if (typeof event.registrationLink === 'string') {
                registrationLink = event.registrationLink;
              }
            }
            
            // Always analyze content for organizer info and other missing fields
            const eventInfo = analyzeEventContent(event.content, event.title);
            
            // Extract organizer info
            if (eventInfo.organizer?.name) {
              organizerName = eventInfo.organizer.name;
            }
            
            // Fall back to content analysis for missing fields
            if (!eventDate && eventInfo.dates.startDate) {
              eventDate = eventInfo.dates.startDate;
            }
            
            if (!eventLocation && eventInfo.location?.name) {
              eventLocation = eventInfo.location.name;
            }
            
            if (!registrationLink && eventInfo.registration?.url) {
              registrationLink = eventInfo.registration.url;
            }
            
            // Extract month and day from the event date
            let month = "TBD";
            let day = "";
            
            if (eventDate) {
              month = eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
              day = eventDate.getDate().toString();
            }
            
            // Time display has been removed as requested
            
            // Determine event category/type - default to "Event" if not specified
            const eventType = event.contentType === 'event' ? "Event" : "Workshop";
            
            return (
              <div 
                key={event.id} 
                className="flex items-start group cursor-pointer hover:bg-zinc-800/50 p-2 rounded-lg transition-colors"
                onClick={() => onEventClick && onEventClick(event.title)}
              >
                {/* Left side: Date display */}
                <div className="flex-shrink-0 w-14 h-14 bg-green-900/20 rounded-md flex flex-col items-center justify-center border border-green-900/30 mr-3">
                  <div className="text-xs text-green-400 font-medium">{month}</div>
                  <div className="text-xl font-bold text-white">{day}</div>
                </div>
                
                {/* Right side: Event details */}
                <div className="flex-1 min-w-0">
                  {/* Event category badge (with no time) */}
                  <div className="flex items-center mb-1">
                    <Badge variant="outline" className="mr-2 text-xs px-1.5 py-0 bg-zinc-900/90 text-amber-400 border-amber-900/60">
                      {eventType}
                    </Badge>
                  </div>
                  
                  {/* Event title */}
                  <h3 className="font-medium text-sm text-zinc-100 group-hover:text-green-400 transition-colors mb-0.5 truncate">
                    {event.title}
                  </h3>
                  
                  {/* Time display removed as requested */}
                  
                  {/* Location if available */}
                  {eventLocation && (
                    <div className="text-xs text-zinc-400 mb-1 flex items-center truncate">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{eventLocation}</span>
                    </div>
                  )}
                  
                  {/* Organizer if available */}
                  {organizerName && (
                    <div className="text-xs text-zinc-400 mb-1 flex items-center truncate">
                      <User className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{organizerName}</span>
                    </div>
                  )}
                  
                  {/* Source information and Registration link in one line */}
                  <div className="flex items-center justify-between mt-1">
                    {event.source && (
                      <div className="text-xs text-zinc-400 flex items-center truncate flex-1 mr-2">
                        <Link className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {event.source.startsWith('http') ? (
                            <a 
                              href={event.source} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-zinc-400 hover:text-green-400 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {event.source.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                            </a>
                          ) : (
                            event.source
                          )}
                        </span>
                      </div>
                    )}
                    
                    {registrationLink && (
                      <a 
                        href={registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-green-500 hover:text-green-400 transition-colors flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Register Now
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* View more button */}
        {events.length > maxEvents && (
          <Button
            variant="link"
            className="text-green-500 hover:text-green-400 p-0 h-auto mt-3"
            onClick={() => onEventClick && onEventClick("Show me all upcoming bamboo architecture events")}
          >
            View More
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEventsList;