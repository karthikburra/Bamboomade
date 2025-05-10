import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ExternalLink, Clock, MapPin } from "lucide-react";
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
        <CardTitle className="text-xl font-bold text-zinc-100 flex items-center">
          <CalendarDays className="h-5 w-5 mr-2 text-green-500" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {eventsToDisplay.map((event) => {
            // Analyze event to extract dates and other info
            const eventInfo = analyzeEventContent(event.content, event.title);
            
            // Extract month and day from the start date
            let month = "TBD";
            let day = "";
            
            if (eventInfo.dates.startDate) {
              const date = eventInfo.dates.startDate;
              month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
              day = date.getDate().toString();
            }
            
            // Format time
            let timeDisplay = "";
            if (eventInfo.dates.startDate) {
              const startTime = eventInfo.dates.startDate.toLocaleString('en-US', {
                hour: 'numeric', 
                minute: 'numeric',
                hour12: true
              });
              
              let endTime = "";
              if (eventInfo.dates.endDate) {
                endTime = eventInfo.dates.endDate.toLocaleString('en-US', {
                  hour: 'numeric', 
                  minute: 'numeric',
                  hour12: true
                });
                timeDisplay = `${startTime} - ${endTime}`;
              } else {
                timeDisplay = startTime;
              }
            }
            
            // Determine event category/type
            const eventType = eventInfo.details?.category || "Workshop";
            
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
                  {/* Event category badge and time */}
                  <div className="flex items-center mb-1">
                    {eventType && (
                      <Badge variant="outline" className="mr-2 text-xs px-1.5 py-0 bg-zinc-900/90 text-amber-400 border-amber-900/60">
                        {eventType}
                      </Badge>
                    )}
                    
                    {timeDisplay && (
                      <div className="text-xs text-zinc-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{timeDisplay}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Event title */}
                  <h3 className="font-medium text-sm text-zinc-100 group-hover:text-green-400 transition-colors mb-0.5 truncate">
                    {event.title}
                  </h3>
                  
                  {/* Location if available */}
                  {eventInfo.location?.name && (
                    <div className="text-xs text-zinc-400 mb-1 truncate">
                      {eventInfo.location.name}
                    </div>
                  )}
                  
                  {/* Registration link if available */}
                  {eventInfo.registration?.url && (
                    <a 
                      href={eventInfo.registration.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-green-500 hover:text-green-400 transition-colors mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {eventInfo.registration.text || "Register Now"}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
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