/**
 * Event Analyzer Utility
 * 
 * This utility provides functions to analyze event content and extract
 * key information such as dates, registration links, locations, and contact info.
 */

/**
 * Interface defining the structure of extracted event information
 */
export interface EventInfo {
  title?: string;
  dates: {
    startDate?: Date | null;
    endDate?: Date | null;
    formattedDate?: string; // e.g. "May 15-17, 2025" or "May 15, 2025"
    isoStartDate?: string;  // ISO format for calendar integration
    isoEndDate?: string;    // ISO format for calendar integration
  };
  registration?: {
    url?: string;
    text?: string;
    deadline?: Date | null;
  };
  location?: {
    name?: string;
    address?: string;
    isOnline?: boolean;
  };
  organizer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  details?: {
    description?: string;
    price?: string;
    category?: string; // Workshop, Training, Webinar, etc.
  };
}

/**
 * Main function to analyze event content and extract key information
 * 
 * @param content The event content to analyze
 * @param title Optional event title if available separately
 * @returns Extracted event information
 */
export function analyzeEventContent(
  content: string, 
  title?: string
): EventInfo {
  // Initialize the result object
  const eventInfo: EventInfo = {
    title: title,
    dates: {},
  };

  // If we don't have a title from the parameter, try to extract it from content
  if (!eventInfo.title) {
    eventInfo.title = extractEventTitle(content);
  }

  // Extract dates
  const { startDate, endDate, formattedDate } = extractEventDates(content);
  eventInfo.dates = {
    startDate,
    endDate,
    formattedDate,
    isoStartDate: startDate ? startDate.toISOString() : undefined,
    isoEndDate: endDate ? endDate.toISOString() : undefined,
  };

  // Extract registration information
  eventInfo.registration = extractRegistrationInfo(content);

  // Extract location information
  eventInfo.location = extractLocationInfo(content);

  // Extract organizer information
  eventInfo.organizer = extractOrganizerInfo(content);

  // Extract additional details
  eventInfo.details = extractEventDetails(content);

  return eventInfo;
}

/**
 * Extract the event title from content if it's not provided separately
 */
function extractEventTitle(content: string): string | undefined {
  // Look for the first line that might be a title
  const lines = content.split('\n');
  // Usually the first non-empty line that's not a date or time
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !isDateOrTime(trimmedLine) && trimmedLine.length > 5) {
      // Return the first significant line that's not a date, time, or very short
      return trimmedLine;
    }
  }

  // If we can't determine a title, return undefined
  return undefined;
}

/**
 * Check if a string appears to be a date or time
 */
function isDateOrTime(text: string): boolean {
  // Check for common date/time patterns
  const dateTimePatterns = [
    /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/,     // MM/DD/YYYY or DD/MM/YYYY
    /\d{1,2}(st|nd|rd|th)?\s+(of\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i, // 15th of May, 1st Jan
    /\d{1,2}:\d{2}\s*(am|pm)?/i,                 // HH:MM or HH:MM AM/PM
    /\d{4}-\d{2}-\d{2}/,                         // YYYY-MM-DD
    /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,  // 15 May
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i,  // May 15
    /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+\d{1,2}/i, // Monday 15, Mon 15
    /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i, // 15 May 2025
  ];

  return dateTimePatterns.some(pattern => pattern.test(text));
}

/**
 * Extract event dates from content
 */
function extractEventDates(content: string): {
  startDate: Date | null;
  endDate: Date | null;
  formattedDate: string | undefined;
} {
  // Initialize result
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let formattedDate: string | undefined;

  // Pattern for dates like "May 15, 2025" or "15th May 2025" or "2025-05-15"
  const datePatterns = [
    // Standard date formats
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,  // 15 May 2025
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})[a-z]*,?\s+(\d{4})/i,  // May 15, 2025
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,  // 2025-05-15 or 2025/05/15
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,  // 15/05/2025 or 15-05-2025
    
    // Date range patterns
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})\s*-\s*(\d{1,2}),\s*(\d{4})/i,  // May 15-17, 2025
    /(\d{1,2})\s*-\s*(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,  // 15-17 May 2025
  ];

  // Try to extract using each pattern
  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        // Handle different pattern types appropriately
        if (pattern.toString().includes('range')) {
          // Date range pattern
          if (match[0].includes('-')) {
            // This is a date range like "May 15-17, 2025"
            const month = match[1];
            const startDay = parseInt(match[2]);
            const endDay = parseInt(match[3]);
            const year = parseInt(match[4]);
            
            // Create the start and end dates
            startDate = new Date(Date.UTC(year, getMonthIndex(month), startDay));
            endDate = new Date(Date.UTC(year, getMonthIndex(month), endDay));
            formattedDate = `${month} ${startDay}-${endDay}, ${year}`;
            break;
          }
        } else if (pattern.toString().includes('(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})')) {
          // YYYY-MM-DD format
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // Month is 0-indexed in JS
          const day = parseInt(match[3]);
          startDate = new Date(Date.UTC(year, month, day));
          formattedDate = startDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          break;
        } else if (pattern.toString().includes('(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})')) {
          // DD-MM-YYYY format
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // Month is 0-indexed in JS
          const year = parseInt(match[3]);
          startDate = new Date(Date.UTC(year, month, day));
          formattedDate = startDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          break;
        } else if (pattern.toString().includes('(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)')) {
          // Month name format like "May 15, 2025"
          if (match[1].match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i)) {
            // Format: May 15, 2025
            const month = match[1];
            const day = parseInt(match[2]);
            const year = parseInt(match[3]);
            startDate = new Date(Date.UTC(year, getMonthIndex(month), day));
          } else {
            // Format: 15 May 2025
            const day = parseInt(match[1]);
            const month = match[2];
            const year = parseInt(match[3]);
            startDate = new Date(Date.UTC(year, getMonthIndex(month), day));
          }
          
          formattedDate = startDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          break;
        }
      } catch (e) {
        console.error("Error parsing date:", e);
        // Continue to try other patterns
      }
    }
  }

  // If we still don't have a startDate, try more aggressive pattern matching
  if (!startDate) {
    // Look for any isolated dates in the content
    const potentialDates = content.match(/\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}\b/gi);
    
    if (potentialDates && potentialDates.length > 0) {
      // Take the first potential date and try to parse it
      // This needs the current year, which we'll assume is the upcoming year
      const now = new Date();
      const currentYear = now.getFullYear();
      const nextYear = currentYear + 1;
      
      const dateStr = potentialDates[0];
      try {
        // Try to parse with the current year
        const testDate = new Date(`${dateStr}, ${currentYear}`);
        
        // If the date is valid and in the future, use it
        if (!isNaN(testDate.getTime()) && testDate > now) {
          startDate = testDate;
          formattedDate = startDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else {
          // Try with next year instead
          const nextYearDate = new Date(`${dateStr}, ${nextYear}`);
          if (!isNaN(nextYearDate.getTime())) {
            startDate = nextYearDate;
            formattedDate = startDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }
        }
      } catch (e) {
        console.error("Error parsing potential date:", e);
      }
    }
  }

  return { startDate, endDate, formattedDate };
}

/**
 * Get month index from month name
 */
function getMonthIndex(monthName: string): number {
  const months = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  return months.indexOf(monthName.toLowerCase().substring(0, 3));
}

/**
 * Extract registration information from content
 */
function extractRegistrationInfo(content: string): {
  url?: string;
  text?: string;
  deadline?: Date | null;
} {
  const registrationInfo: {
    url?: string;
    text?: string;
    deadline?: Date | null;
  } = {};

  // Extract registration link - first try markdown-style links
  const markdownLinkMatch = content.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (markdownLinkMatch) {
    registrationInfo.text = markdownLinkMatch[1];
    registrationInfo.url = markdownLinkMatch[2];
  } else {
    // Then look for URLs in the content
    const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      registrationInfo.url = urlMatch[1];
      // Try to determine if it's a registration link
      const registrationKeywords = ['register', 'sign up', 'enroll', 'book', 'reservation'];
      // Look for registration context around the URL
      const context = content.substring(
        Math.max(0, content.indexOf(urlMatch[1]) - 50),
        Math.min(content.length, content.indexOf(urlMatch[1]) + urlMatch[1].length + 50)
      );
      
      const isRegistrationLink = registrationKeywords.some(keyword => 
        context.toLowerCase().includes(keyword)
      );
      
      if (isRegistrationLink) {
        registrationInfo.text = "Register Now";
      } else {
        registrationInfo.text = "Event Link";
      }
    }
  }

  // Extract registration deadline
  const deadlinePatterns = [
    /register[^.]*by\s+([^.]*\d{1,2}[^.]*\d{4})/i,
    /deadline[^.]*:\s+([^.]*\d{1,2}[^.]*\d{4})/i,
    /register[^.]*before\s+([^.]*\d{1,2}[^.]*\d{4})/i,
  ];
  
  for (const pattern of deadlinePatterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        // Try to parse the deadline date
        const deadlineStr = match[1].trim();
        const deadlineDate = new Date(deadlineStr);
        if (!isNaN(deadlineDate.getTime())) {
          registrationInfo.deadline = deadlineDate;
          break;
        }
      } catch (e) {
        console.error("Error parsing registration deadline:", e);
      }
    }
  }

  return registrationInfo;
}

/**
 * Extract location information from content
 */
function extractLocationInfo(content: string): {
  name?: string;
  address?: string;
  isOnline?: boolean;
} {
  const locationInfo: {
    name?: string;
    address?: string;
    isOnline?: boolean;
  } = {};

  // Check if this is an online event
  const onlineIndicators = [
    /\bonline\b/i, 
    /\bvirtual\b/i, 
    /\bzoom\b/i, 
    /\bgoogle meet\b/i, 
    /\bmeet\.google\.com\b/i,
    /\bwebinar\b/i,
    /\blive stream\b/i
  ];
  
  locationInfo.isOnline = onlineIndicators.some(pattern => pattern.test(content));

  // If it's not an online event, try to extract physical location
  if (!locationInfo.isOnline) {
    // Look for location patterns
    const locationPatterns = [
      /\blocation\s*:?\s*([^.,\n]+)/i,
      /\bvenue\s*:?\s*([^.,\n]+)/i,
      /\baddress\s*:?\s*([^.,\n]+)/i,
      /\bat\s+([^.,\n]+\b(?:university|college|institute|school|center|hall|auditorium))/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match) {
        locationInfo.name = match[1].trim();
        break;
      }
    }
    
    // Try to extract a full address if present
    const addressMatch = content.match(/\baddress\s*:?\s*([^.]+\d{5,6})/i);
    if (addressMatch) {
      locationInfo.address = addressMatch[1].trim();
    }
  }

  return locationInfo;
}

/**
 * Extract organizer information from content
 */
function extractOrganizerInfo(content: string): {
  name?: string;
  email?: string;
  phone?: string;
} {
  const organizerInfo: {
    name?: string;
    email?: string;
    phone?: string;
  } = {};

  // Extract organizer name
  const organizerPatterns = [
    /organiz(?:er|ed by)\s*:?\s*([^.,\n]+)/i,
    /\bhost(?:ed)?\s*(?:by)?\s*:?\s*([^.,\n]+)/i,
    /\bpresented by\s*:?\s*([^.,\n]+)/i,
    /\bcontact\s*:?\s*([^.,\n]+)/i,
    /\bcoordinator\s*:?\s*([^.,\n]+)/i,
  ];
  
  for (const pattern of organizerPatterns) {
    const match = content.match(pattern);
    if (match) {
      organizerInfo.name = match[1].trim();
      // If the extracted name contains an email or phone, clean it
      if (organizerInfo.name.includes('@') || /\d{10}/.test(organizerInfo.name)) {
        organizerInfo.name = organizerInfo.name.split(/[@\d]/)[0].trim();
      }
      break;
    }
  }

  // Extract email
  const emailMatch = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    organizerInfo.email = emailMatch[0];
  }

  // Extract phone number
  const phonePatterns = [
    /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Standard formats like (123) 456-7890
    /\b\d{10}\b/, // Just 10 digits
    /\b(?:\+?\d{1,3}[-.\s]?)?\d{3,5}[-.\s]?\d{3}[-.\s]?\d{3,4}\b/, // International formats
  ];
  
  for (const pattern of phonePatterns) {
    const match = content.match(pattern);
    if (match) {
      organizerInfo.phone = match[0];
      break;
    }
  }

  return organizerInfo;
}

/**
 * Extract additional event details from content
 */
function extractEventDetails(content: string): {
  description?: string;
  price?: string;
  category?: string;
} {
  const details: {
    description?: string;
    price?: string;
    category?: string;
  } = {};

  // Extract a brief description (first 1-3 sentences that are not titles or dates)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let descriptionSentences: string[] = [];
  
  for (let i = 0; i < Math.min(sentences.length, 5); i++) {
    const sentence = sentences[i].trim();
    // Skip likely titles, dates or very short sentences
    if (sentence.length < 10 || isDateOrTime(sentence)) continue;
    
    descriptionSentences.push(sentence);
    // Get 1-3 meaningful sentences
    if (descriptionSentences.length >= 2) break;
  }
  
  if (descriptionSentences.length > 0) {
    details.description = descriptionSentences.join('. ') + '.';
  }

  // Extract price information
  const pricePatterns = [
    /\bprice\s*:?\s*([^.,\n]+)/i,
    /\bfee\s*:?\s*([^.,\n]+)/i,
    /\bcost\s*:?\s*([^.,\n]+)/i,
    /(?:₹|Rs\.?|INR)\s*(\d+(?:[,.]\d+)?)/i, // Indian Rupees
    /\$\s*(\d+(?:[,.]\d+)?)/i, // US Dollars
  ];
  
  for (const pattern of pricePatterns) {
    const match = content.match(pattern);
    if (match) {
      details.price = match[0].trim();
      break;
    }
  }

  // Determine event category
  const content_lower = content.toLowerCase();
  
  if (content_lower.includes('workshop') || content_lower.includes('hands-on')) {
    details.category = 'Workshop';
  } else if (content_lower.includes('webinar')) {
    details.category = 'Webinar';
  } else if (content_lower.includes('training') || content_lower.includes('course')) {
    details.category = 'Training';
  } else if (content_lower.includes('conference') || content_lower.includes('summit')) {
    details.category = 'Conference';
  } else if (content_lower.includes('exhibition') || content_lower.includes('expo')) {
    details.category = 'Exhibition';
  } else if (content_lower.includes('college') || content_lower.includes('university')) {
    details.category = 'College Workshop';
  } else {
    details.category = 'Event';
  }

  return details;
}

/**
 * Create a Google Calendar event link for an event
 */
export function createGoogleCalendarLink(eventInfo: EventInfo): string | undefined {
  if (!eventInfo.dates.startDate) return undefined;
  
  const startDate = eventInfo.dates.startDate;
  const endDate = eventInfo.dates.endDate || new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default to 2 hours
  
  // Format dates for Google Calendar URL
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventInfo.title || 'Bamboo Architecture Event',
    dates: `${start}/${end}`,
  });
  
  if (eventInfo.details?.description) {
    params.append('details', eventInfo.details.description);
  }
  
  if (eventInfo.location?.name) {
    params.append('location', eventInfo.location.address || eventInfo.location.name);
  }
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Create a WhatsApp message with event details
 */
export function createWhatsAppShareMessage(eventInfo: EventInfo): string {
  let message = `🎋 *Bamboo Architecture Event* 🎋\n\n`;
  
  if (eventInfo.title) {
    message += `*${eventInfo.title}*\n\n`;
  }
  
  if (eventInfo.dates.formattedDate) {
    message += `📅 *Date:* ${eventInfo.dates.formattedDate}\n`;
  }
  
  if (eventInfo.location?.name) {
    message += `📍 *Location:* ${eventInfo.location.name}`;
    if (eventInfo.location.address) {
      message += ` - ${eventInfo.location.address}`;
    }
    message += '\n';
  } else if (eventInfo.location?.isOnline) {
    message += `🌐 *Online Event*\n`;
  }
  
  if (eventInfo.details?.category) {
    message += `🏷️ *Type:* ${eventInfo.details.category}\n`;
  }
  
  if (eventInfo.details?.price) {
    message += `💰 *Price:* ${eventInfo.details.price}\n`;
  }
  
  if (eventInfo.organizer?.name) {
    message += `👤 *Organizer:* ${eventInfo.organizer.name}\n`;
    if (eventInfo.organizer.phone) {
      message += `📞 *Contact:* ${eventInfo.organizer.phone}\n`;
    }
    if (eventInfo.organizer.email) {
      message += `📧 *Email:* ${eventInfo.organizer.email}\n`;
    }
  }
  
  if (eventInfo.details?.description) {
    message += `\n📝 *About:*\n${eventInfo.details.description}\n`;
  }
  
  if (eventInfo.registration?.url) {
    message += `\n🔗 *Registration Link:*\n${eventInfo.registration.url}\n`;
  }
  
  message += `\n🎍 Shared via BambooMade.in`;
  
  return message;
}