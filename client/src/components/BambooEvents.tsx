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
      <CardContent className="text-sm p-4">
        {/* Display events as tiles/cards */}
        <div className="grid grid-cols-1 gap-4">
          {eventsToDisplay.map(event => {
            // STEP 1: Extract & format event date 
            let eventDate = extractDate(event.content);
            
            // Use createdAt as fallback if no date found in content
            if (!eventDate && event.createdAt) {
              const date = new Date(event.createdAt);
              if (!isNaN(date.getTime())) {
                eventDate = date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              }
            }
            
            // STEP 2: Format date components for display
            let day = "TBD";
            let month = "";
            let year = "";
            
            if (eventDate) {
              try {
                // Try standard date parsing first
                const dateObj = new Date(eventDate);
                
                if (!isNaN(dateObj.getTime())) {
                  day = dateObj.getDate().toString();
                  month = dateObj.toLocaleString('en-US', { month: 'short' });
                  year = dateObj.getFullYear().toString();
                } else {
                  // Fallback to regex pattern matching for non-standard date formats
                  const dateMatch = eventDate.match(/(\d{1,2})[^\d]*([A-Za-z]+)[^\d]*(\d{4})/);
                  if (dateMatch) {
                    day = dateMatch[1];
                    month = dateMatch[2].substring(0, 3);
                    year = dateMatch[3];
                  }
                }
              } catch (e) {
                console.error("Error parsing date:", e);
              }
            }
            
            // STEP 3: Extract event location
            const eventLocation = extractLocation(event.content);
            
            // STEP 4: Determine workshop type/category
            let workshopType = "Workshop";
            const content = event.content.toLowerCase();
            const title = event.title.toLowerCase();
            
            if (title.includes("college") || content.includes("college")) {
              workshopType = "College Workshop";
            } else if (title.includes("training") || content.includes("training")) {
              workshopType = "Training Session";
            } else if (title.includes("webinar") || content.includes("webinar")) {
              workshopType = "Webinar";
            }
            
            // STEP 5: Extract registration link
            let registrationLink = null;
            
            // Check for markdown-style links first
            const markdownLinkMatch = event.content.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (markdownLinkMatch) {
              registrationLink = {
                text: markdownLinkMatch[1],
                url: markdownLinkMatch[2]
              };
            } 
            // Then check for regular URLs
            else {
              const urlMatch = event.content.match(/(https?:\/\/[^\s]+)/);
              if (urlMatch) {
                registrationLink = {
                  text: "Register Now",
                  url: urlMatch[1]
                };
              }
              // Use source URL as fallback
              else if (event.source && event.source.startsWith('http')) {
                registrationLink = {
                  text: "More Information",
                  url: event.source
                };
              }
            }
            
            // STEP 6: Extract short description (6-8 words)
            const contentWords = event.content.split(/\s+/);
            const shortSummary = contentWords.slice(0, 7).join(' ') + (contentWords.length > 7 ? '...' : '');
            
            // STEP 7: Extract organizer information
            const extractOrganizerInfo = () => {
              // Find contact person/organizer
              const contactPatterns = [
                /contact:?\s*([^,\.\n]+)/i,
                /organiz(?:er|ed by):?\s*([^,\.\n]+)/i,
                /coordinator:?\s*([^,\.\n]+)/i,
                /point of contact:?\s*([^,\.\n]+)/i
              ];
              
              let contactPerson = null;
              for (const pattern of contactPatterns) {
                const match = event.content.match(pattern);
                if (match) {
                  contactPerson = match[1].trim();
                  break;
                }
              }
              
              // Find phone number
              const phonePatterns = [
                /(\+?\d[\d\s-]{8,}\d)/,                       // Standard phone format
                /(?:phone|call|contact|tel):?\s*(\+?\d[\d\s-]{8,}\d)/i  // Labeled phone
              ];
              
              let phoneNumber = null;
              for (const pattern of phonePatterns) {
                const match = event.content.match(pattern);
                if (match) {
                  phoneNumber = match[1].trim();
                  break;
                }
              }
              
              return { contactPerson, phoneNumber };
            };
            
            const { contactPerson, phoneNumber } = extractOrganizerInfo();
            
            // STEP 8: Render event tile
            return (
              <div 
                key={event.id}
                className="bg-zinc-800/70 rounded-lg overflow-hidden shadow-md transition-all hover:shadow-lg border border-zinc-700 hover:border-green-800/60 group cursor-pointer flex"
                onClick={() => onEventClick && onEventClick(event.title)}
              >
                {/* Left side: Date display */}
                <div className="w-24 min-w-[6rem] bg-green-900/40 flex flex-col items-center justify-center p-3 border-r border-zinc-700">
                  <Badge variant="outline" className="mb-1 text-xs bg-zinc-900/90 text-amber-400 border-amber-900/60 px-1.5 py-0">
                    {workshopType}
                  </Badge>
                  <div className="text-center">
                    {month && <div className="text-xs text-green-400 font-medium uppercase">{month}</div>}
                    <div className="text-3xl font-bold text-white">{day}</div>
                    {year && <div className="text-xs text-zinc-400">{year}</div>}
                  </div>
                </div>
                
                {/* Right side: Event details */}
                <div className="flex-1 flex flex-col p-3">
                  {/* Event title and location */}
                  <div className="mb-2">
                    <h3 className="font-semibold text-green-400 text-base group-hover:text-green-300 transition-colors">
                      {event.title}
                    </h3>
                    
                    {eventLocation && (
                      <div className="flex items-center text-xs text-zinc-400 mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{eventLocation}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Organizer info section */}
                  {(contactPerson || phoneNumber) && (
                    <div className="mb-2 text-xs">
                      {contactPerson && (
                        <div className="text-amber-300 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <span>Organizer: {contactPerson}</span>
                        </div>
                      )}
                      {phoneNumber && (
                        <div className="text-zinc-300 flex items-center mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span>{phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Brief content preview */}
                  <p className="text-zinc-300 text-xs mb-3 flex-grow">{shortSummary}</p>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-auto">
                    {/* Registration button */}
                    {registrationLink ? (
                      <a 
                        href={registrationLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-1.5 bg-amber-700/50 hover:bg-amber-600/50 text-amber-200 hover:text-amber-100 rounded-md text-xs font-medium inline-flex items-center justify-center border border-amber-800/70 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {registrationLink.text}
                        <ExternalLink className="h-3 w-3 ml-1.5" />
                      </a>
                    ) : (
                      <button 
                        className="flex-1 px-3 py-1.5 bg-green-900/40 hover:bg-green-800/60 text-green-400 hover:text-green-300 rounded-md text-xs font-medium inline-flex items-center justify-center border border-green-900/70 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick && onEventClick(`Tell me more details about "${event.title}"`);
                        }}
                      >
                        More details
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 16v-4"/>
                          <path d="M12 8h.01"/>
                        </svg>
                      </button>
                    )}
                    
                    {/* Workshop info button */}
                    <button 
                      className="flex-1 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-300 rounded-md text-xs font-medium inline-flex items-center justify-center border border-zinc-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick && onEventClick(`What are the workshop details for "${event.title}"?`);
                      }}
                    >
                      Workshop Info
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M9 15V9h6" />
                        <path d="M9 9h6v6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Fallback to traditional markdown display if needed (but with h1 header removed) */}
        {eventsToDisplay.length === 0 && events && (
          <div className="prose prose-sm prose-invert max-w-none prose-headings:text-zinc-200 prose-a:text-green-400">
            <ReactMarkdown components={{
              h1: () => null, // Skip the h1 heading completely
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
        
        {/* "Ask about events" button */}
        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          onClick={() => onEventClick && onEventClick("What bamboo architecture events are coming up?")}
        >
          Ask about upcoming events
        </Button>
      </CardContent>
    </Card>
  );
};

export default BambooEvents;