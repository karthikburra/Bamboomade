import React, { useState, useEffect } from 'react';
import { Calendar, ExternalLink, Clock, MapPin, User, Users, Building } from 'lucide-react';
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
  
  // Filter events to only include actual events (not Medium articles, enthusiast profiles, or other content types)
  const filterActualEvents = (events: Event[]) => {
    return events.filter(event => {
      // Explicitly exclude enthusiast content types
      if (event.contentType === 'enthusiast') {
        return false;
      }
      
      // Check if it's explicitly an event content type
      if (event.contentType === 'event') {
        return true;
      }
      
      // Check if title explicitly mentions it's an event
      if (event.title.toLowerCase().includes('workshop') || 
          event.title.toLowerCase().includes('event') ||
          event.title.toLowerCase().includes('course') ||
          event.title.toLowerCase().includes('webinar') ||
          event.title.toLowerCase().includes('session') ||
          event.title.toLowerCase().includes('training')) {
        return true;
      }
      
      // If title contains non-event indicators, it's not an event
      if (event.title.includes('Medium') || 
          event.title.includes('Blog') ||
          event.title.includes('Article') ||
          event.title.includes('Profile') ||
          event.title.includes('Enthusiast') ||
          event.title.includes('Meet')) {
        return false;
      }
      
      // Check content for event indicators
      const eventKeywords = ['register', 'rsvp', 'join us', 'workshop', 'webinar', 'session', 'training', 'seminar'];
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
  
  // Filter events to only include upcoming (future) events
  const filterUpcomingEvents = (events: Event[]) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to beginning of day
    
    return events.filter(event => {
      // If we can extract a date from the content, use that to determine if it's upcoming
      const eventDateStr = extractDate(event.content);
      if (eventDateStr) {
        try {
          // Convert the extracted date string to a Date object
          // First try with Date constructor
          let extractedDate = new Date(eventDateStr);
          
          // If that fails, try manual parsing for common formats
          if (isNaN(extractedDate.getTime())) {
            // Try parsing formats like "May 31, 2025"
            const monthMap: Record<string, number> = {
              'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
              'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
            };
            
            const parts = eventDateStr.toLowerCase().replace(/[,st|nd|rd|th]/g, '').split(/\s+/);
            // Check if format is "May 31 2025" or "31 May 2025"
            if (parts.length >= 3) {
              let month = -1, day = -1, year = -1;
              
              // Try to identify which part is month, day, year
              for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (monthMap[part] !== undefined) {
                  month = monthMap[part];
                } else if (!isNaN(parseInt(part)) && parseInt(part) <= 31 && parseInt(part) >= 1) {
                  // Could be day or year
                  if (parseInt(part) <= 31 && day === -1) {
                    day = parseInt(part);
                  } else if (parseInt(part) >= 1000 && year === -1) {
                    year = parseInt(part);
                  }
                }
              }
              
              // If we found all parts, create date
              if (month !== -1 && day !== -1 && year !== -1) {
                extractedDate = new Date(year, month, day);
              }
            }
          }
          
          // Check if the extracted date is in the future
          if (!isNaN(extractedDate.getTime()) && extractedDate >= currentDate) {
            return true;
          }
        } catch (e) {
          // If date parsing fails, fall back to keyword checking
          console.error("Error parsing date:", e);
        }
      }
      
      // Check if content has keywords indicating a future event
      const content = event.content.toLowerCase();
      const hasUpcomingKeywords = 
        content.includes('upcoming') || 
        content.includes('scheduled') || 
        content.includes('register now') ||
        content.includes('soon') ||
        content.includes('will be held');
        
      return hasUpcomingKeywords;
    });
  };
  
  // Use provided upcomingEvents or the fetched ones, but filter to actual events and upcoming events only
  const eventsToDisplay = filterUpcomingEvents(
    filterActualEvents(upcomingEvents.length > 0 ? upcomingEvents : fetchedEvents)
  );

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
  
  // Extract organizer information from event content if available
  const extractOrganizer = (content: string): string | null => {
    const organizerPatterns = [
      /organized by\s+([^,.]+(?:,\s*[^,.]+)?)/i,
      /organizer[s]?:\s*([^,.]+(?:,\s*[^,.]+)?)/i,
      /hosted by\s+([^,.]+(?:,\s*[^,.]+)?)/i,
      /presented by\s+([^,.]+(?:,\s*[^,.]+)?)/i,
      /conducted by\s+([^,.]+(?:,\s*[^,.]+)?)/i,
      /facilitated by\s+([^,.]+(?:,\s*[^,.]+)?)/i,
    ];

    for (const pattern of organizerPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Try to identify college or institution names
    const institutionPatterns = [
      /(College of [^,.]+)/i,
      /(University of [^,.]+)/i,
      /(Institute of [^,.]+)/i,
      /([A-Z][a-z]+ College)/i,
      /([A-Z][a-z]+ University)/i,
      /([A-Z][a-z]+ Institute)/i,
      /(School of [^,.]+)/i,
      /([A-Z]{2,5})\s+(?:University|College|Institute)/i, // For abbreviated names like IIT, NIT
    ];
    
    for (const pattern of institutionPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Default to BambooMade if no other organizer found
    if (content.toLowerCase().includes('bamboomade') || 
        content.toLowerCase().includes('bamboo made')) {
      return 'BambooMade';
    }

    return null;
  };
  
  // Extract a brief summary of the workshop from the content
  const extractBrief = (content: string): string => {
    // Clean up any markdown or extra whitespace
    const cleanContent = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                               .replace(/\s+/g, ' ')
                               .trim();
    
    // Try to extract the first 2-3 sentences for the brief
    const sentences = cleanContent.split(/[.!?]\s+/);
    
    if (sentences.length >= 2) {
      // Get first 2 sentences if content is long enough
      return sentences.slice(0, 2).join('. ') + '.';
    } else if (cleanContent.length > 120) {
      // If we couldn't split into sentences but content is long, truncate
      return cleanContent.substring(0, 120) + '...';
    }
    
    // Short content, just return as is
    return cleanContent;
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
      <CardHeader className="pb-1 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-200 flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-green-500/90" />
            Upcoming Events
          </CardTitle>
          <Badge variant="outline" className="text-[9px] bg-zinc-800/70 text-green-400 border-green-800/60 px-1.5 py-0 h-4">
            Live
          </Badge>
        </div>
        <CardDescription className="text-[9px] text-zinc-400 mt-0.5">
          Click any event for details or registration
        </CardDescription>
      </CardHeader>
      <CardContent className="text-xs p-2">
        {/* Display events as tiles/cards - new grid-based tile UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            // Extract organizer information from content if available
            const organizerInfo = extractOrganizer(event.content);
            
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
            
            // Extract workshop brief (first 2-3 sentences or 100 chars)
            const brief = extractBrief(event.content);
            
            return (
              <div 
                key={event.id}
                className="bg-gradient-to-br from-zinc-800/90 to-zinc-900 rounded-lg overflow-hidden hover:from-zinc-750 hover:to-zinc-850 transition-all border border-zinc-700/80 hover:border-green-600/80 shadow-md flex flex-col transform hover:-translate-y-0.5 hover:shadow-green-900/10"
              >
                {/* Header with event title */}
                <div className="bg-gradient-to-r from-green-900/30 to-zinc-800/70 p-2 border-b border-zinc-700/60 flex items-center justify-between">
                  <h3 className="font-medium text-green-300 truncate text-[10px]">{event.title}</h3>
                  <Badge className="bg-green-900/50 text-green-300 border-0 text-[9px] px-1.5 py-0 h-4">
                    Workshop
                  </Badge>
                </div>
                
                {/* Event details section */}
                <div className="p-2.5 flex-1 flex flex-col">
                  {/* Date tile at the top */}
                  <div className="mb-1.5 flex justify-between items-start">
                    <div className="flex-shrink-0 bg-zinc-800/70 rounded border border-green-900/20 p-1 flex flex-col items-center justify-center w-[44px] shadow-inner">
                      {eventDate ? (
                        <>
                          <span className="text-green-400 text-[9px] font-bold uppercase tracking-wide">
                            {(() => {
                              try {
                                const date = new Date(eventDate);
                                return date.toLocaleDateString('en-US', { month: 'short' });
                              } catch (e) {
                                // If parsing fails, try to extract month from string
                                const monthMatch = eventDate.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
                                return monthMatch ? monthMatch[0] : 'Soon';
                              }
                            })()}
                          </span>
                          <span className="text-white text-sm font-bold leading-none mt-0.5">
                            {(() => {
                              try {
                                const date = new Date(eventDate);
                                return date.getDate();
                              } catch (e) {
                                // If parsing fails, try to extract day from string
                                const dayMatch = eventDate.match(/\b(\d{1,2})\b/);
                                return dayMatch ? dayMatch[0] : '';
                              }
                            })()}
                          </span>
                        </>
                      ) : (
                        <span className="text-green-400 text-[9px] font-bold">Soon</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-0.5 flex-1 ml-2">
                      {eventLocation && (
                        <div className="flex items-center text-[9px] text-zinc-300">
                          <MapPin className="h-2.5 w-2.5 mr-1 text-green-400/70 flex-shrink-0" />
                          <span className="truncate">{eventLocation}</span>
                        </div>
                      )}
                      
                      {organizerInfo && (
                        <div className="flex items-center text-[9px] text-zinc-300">
                          <Building className="h-2.5 w-2.5 mr-1 text-green-400/70 flex-shrink-0" />
                          <span className="truncate">{organizerInfo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-zinc-700/30 my-1.5 opacity-40"></div>
                  
                  {/* Workshop brief */}
                  <div 
                    className="text-zinc-300 text-[9px] mb-1.5 flex-1 cursor-pointer hover:text-zinc-100 transition-colors" 
                    onClick={() => onEventClick && onEventClick(event.title)}
                  >
                    <p className="line-clamp-3 leading-snug">{brief}</p>
                  </div>
                </div>
                
                {/* Footer with registration button */}
                <div className="bg-zinc-800/80 px-2 py-1.5 border-t border-zinc-700/50 flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[9px] h-6 px-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/40"
                    onClick={() => onEventClick && onEventClick(event.title)}
                  >
                    <Calendar className="h-2.5 w-2.5 mr-1" />
                    Details
                  </Button>
                  
                  {registrationLink && (
                    <a 
                      href={registrationLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] px-2 py-0.5 bg-gradient-to-r from-green-800 to-green-700 hover:from-green-700 hover:to-green-600 text-white rounded-md inline-flex items-center shadow-sm transform transition-all hover:scale-105"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {registrationLink.text}
                      <ExternalLink className="h-2 w-2 ml-1" />
                    </a>
                  )}
                </div>
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
          className="mt-3 w-full border-zinc-700/60 text-zinc-400 hover:text-green-300 hover:border-green-900/50 bg-zinc-800/30 hover:bg-zinc-800/60 text-xs h-8"
          onClick={() => onEventClick && onEventClick("What bamboo architecture events are coming up?")}
        >
          <Calendar className="h-3.5 w-3.5 mr-1.5 text-green-500/70" />
          Ask about more upcoming events
        </Button>
      </CardContent>
    </Card>
  );
};

export default BambooEvents;