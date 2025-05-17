import axios from 'axios';
import * as cheerio from 'cheerio';
import { getOpenAI } from "./openai-service";
import { storage } from "./storage";
import { URL } from 'url';
import path from 'path';
import { scrapeWebsite, convertScrapedResultsToKnowledgeContent } from './scraper_integration';

/**
 * Import and process content from a URL
 * @param url The URL to import content from
 * @param userId The ID of the user importing the content
 * @returns The imported content information
 */
export async function importFromUrl(url: string, userId: number) {
  try {
    // Validate the URL
    if (!url.match(/^(http|https):\/\/[^ "]+$/)) {
      throw new Error('Invalid URL format');
    }

    // Fetch the webpage content with a timeout
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 15000, // 15-second timeout
      maxRedirects: 5
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const baseUrl = new URL(url).origin;

    // Extract basic metadata
    const title = $('meta[property="og:title"]').attr('content') || 
                  $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  'Untitled Content';

    // Get meta description
    const metaDescription = $('meta[name="description"]').attr('content') || 
                            $('meta[property="og:description"]').attr('content') || 
                            '';
    
    // Remove scripts, styles, comments, navigation, footers, and common non-content elements
    $('script, style, noscript, iframe, nav, footer, header, .header, .footer, .nav, .navigation, .sidebar, .comments, .share, .related, .recommended, #comments, #sidebar, #header, #footer, #nav').remove();
    $('*').contents().each(function() {
      if (this.type === 'comment') {
        $(this).remove();
      }
    });

    // Extract all images with proper URLs
    const images = extractImages($, baseUrl);

    // Extract main text content with better structure preservation
    const bodyText = extractStructuredContent($);
    
    // Truncate for AI processing while preserving more content
    const truncatedContent = bodyText.slice(0, 20000);

    // Extract social media information if present
    const socialMediaInfo = extractSocialMediaInfo($, url);

    // Extract location information for events
    const locationInfo = extractLocationInfo($);

    // Extract pricing and cost information
    const priceInfo = extractPriceInfo($);

    // Use Gemini to categorize and summarize the content
    const analysis = await categorizeAndSummarizeContent(title, truncatedContent, url, metaDescription, images);

    // Use date pattern to attempt to extract a date from the HTML
    const extractedDate = extractDateFromHTML($);

    // Try to parse event dates and times with Gemini AI if it's an event
    const eventDates = analysis.contentType === 'event' ?
      await extractEventDatesAndTimes(truncatedContent, extractedDate) :
      { startDate: extractedDate, endDate: null, timings: null };

    // Extract contact information
    const contactInfo = extractContactInfo($);

    // Determine social profiles if this is a person/enthusiast profile
    const socialProfiles = analysis.contentType === 'enthusiast' ? 
      await extractSocialProfiles(truncatedContent, title) : 
      {};

    // First use our advanced scraper to get structured information
    let enhancedData = null;
    
    try {
      console.log('Starting enhanced web scraping for additional structured data');
      const scrapedData = await scrapeWebsite(url, 3); // Scrape up to 3 pages
      
      // If we got any structured data, log it
      if (scrapedData.pages && scrapedData.pages.length > 0) {
        console.log(`Enhanced scraping found ${scrapedData.pages.length} pages, ${scrapedData.events.length} events, ${scrapedData.contacts.length} contacts`);
        enhancedData = scrapedData;
      }
    } catch (scrapeError) {
      console.error('Error during enhanced scraping:', scrapeError);
      // Continue with standard processing
    }
    
    // Create a new knowledge base entry with enhanced data
    const newContent = await storage.createAiKnowledgeContent({
      title: analysis.title || title,
      content: analysis.summary,
      rawContent: truncatedContent,
      source: url,
      contentType: analysis.contentType,
      status: 'active',
      mediaUrl: analysis.imageUrl || (images.length > 0 ? images[0] : null),
      mediaType: 'webpage',
      socialMediaInfo: socialMediaInfo,
      // Enhanced fields based on content type
      contactEmail: contactInfo.email || socialProfiles.email,
      contactPhone: contactInfo.phone || socialProfiles.phone,
      linkedinUrl: socialProfiles.linkedin,
      instagramUrl: socialProfiles.instagram,
      twitterUrl: socialProfiles.twitter,
      facebookUrl: socialProfiles.facebook,
      personalWebsite: socialProfiles.website,
      
      // Event specific fields - use more detailed event dates if available
      eventDate: eventDates.startDate || extractedDate || undefined,
      eventEndDate: eventDates.endDate,
      eventTimings: eventDates.timings,
      eventLocation: locationInfo.location,
      registrationLink: analysis.registrationLink || extractRegistrationLink($, url),
      
      // Price information
      price: priceInfo.price,
      currency: priceInfo.currency,
      priceRange: priceInfo.priceRange,
      discountPrice: priceInfo.discountPrice,
      
      createdBy: userId
    });

    // Add extracted images to a separate gallery if there are multiple good quality images
    if (images.length > 1 && analysis.contentType !== 'social_media') {
      await saveAdditionalImages(images, newContent.id, userId);
    }

    // Extract facts if this content provides useful factual information
    if (['article', 'webpage', 'document', 'event', 'project'].includes(analysis.contentType)) {
      const facts = await extractFactsFromContent(truncatedContent, newContent.id, userId);
    }

    return {
      id: newContent.id,
      title: newContent.title,
      contentType: newContent.contentType,
      source: newContent.source,
      extractedDate: newContent.eventDate || null,
      location: newContent.eventLocation || null,
      imageCount: images.length,
      success: true
    };
  } catch (error) {
    console.error('Error importing from URL:', error);
    throw error;
  }
}

/**
 * Extract images from HTML with proper URL resolution
 */
function extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const images: string[] = [];
  
  // Try open graph image first
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    images.push(resolveUrl(ogImage, baseUrl));
  }

  // Get larger featured images
  $('img[width][height]').each(function() {
    const src = $(this).attr('src') || $(this).attr('data-src');
    const width = parseInt($(this).attr('width') || '0', 10);
    const height = parseInt($(this).attr('height') || '0', 10);
    
    if (src && width > 300 && height > 200) {
      images.push(resolveUrl(src, baseUrl));
    }
  });

  // Find large images without width/height attributes
  $('img').each(function() {
    const src = $(this).attr('src') || 
                $(this).attr('data-src') || 
                $(this).attr('data-lazy-src') || 
                $(this).attr('data-original');
    
    if (!src) return;
    
    // Skip small icons and buttons
    if (src.includes('icon') || src.includes('logo') || 
        src.includes('button') || src.includes('badge')) {
      return;
    }
    
    const fullUrl = resolveUrl(src, baseUrl);
    
    // Don't add duplicates
    if (!images.includes(fullUrl)) {
      images.push(fullUrl);
    }
  });

  // Filter out broken image URLs and common non-content images
  return images.filter(img => {
    const url = img.toLowerCase();
    return !url.includes('pixel.gif') && 
           !url.includes('spacer.gif') && 
           !url.includes('1x1.gif') &&
           !url.includes('tracking') &&
           !url.includes('analytics');
  }).slice(0, 10); // Limit to 10 images
}

/**
 * Resolve relative URLs to absolute URLs
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    // If already absolute
    if (url.match(/^(http|https):\/\//)) {
      return url;
    }
    
    // If protocol-relative URL
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    // If root-relative URL
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    
    // If relative URL
    return `${baseUrl}/${url}`;
  } catch (error) {
    return url; // Return original on error
  }
}

/**
 * Extract structured content preserving headings and paragraphs
 */
function extractStructuredContent($: cheerio.CheerioAPI): string {
  let content = '';

  // Get headings and their contents
  $('h1, h2, h3, h4, h5, h6, p, article, section, .content, .article, .post, .entry, .main').each(function() {
    const text = $(this).text().trim();
    if (text) {
      content += text + '\n\n';
    }
  });

  // If still no good content, get main content
  if (content.length < 200) {
    content = $('body').text().replace(/\s+/g, ' ').trim();
  }

  return content;
}

/**
 * Extract social media information from a webpage
 */
function extractSocialMediaInfo($: cheerio.CheerioAPI, url: string): any {
  const info: any = {};
  
  // Detect if the page is from a social media platform
  const hostname = new URL(url).hostname;
  
  if (hostname.includes('instagram.com')) {
    info.platform = 'instagram';
    info.handle = $('meta[property="og:title"]').attr('content')?.split(' ')[0] || '';
    info.profileUrl = url;
    
    // Collect all image URLs
    const mediaUrls: string[] = [];
    $('meta[property="og:image"]').each(function() {
      const imgUrl = $(this).attr('content');
      if (imgUrl) mediaUrls.push(imgUrl);
    });
    
    info.mediaUrls = mediaUrls;
  }
  else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    info.platform = 'twitter';
    info.handle = $('meta[property="og:title"]').attr('content')?.split(' ')[0] || '';
    info.profileUrl = url;
  }
  else if (hostname.includes('facebook.com')) {
    info.platform = 'facebook';
    info.profileUrl = url;
  }
  else if (hostname.includes('linkedin.com')) {
    info.platform = 'linkedin';
    info.profileUrl = url;
  }
  
  return info;
}

/**
 * Extract location information for events
 */
function extractLocationInfo($: cheerio.CheerioAPI): { location: string | null, coordinates?: string } {
  // Try schema.org event markup
  const eventLocation = $('[itemtype="http://schema.org/Event"] [itemtype="http://schema.org/Place"] [itemprop="name"]').text() ||
                        $('[itemtype="http://schema.org/Event"] [itemprop="location"]').text();
  
  if (eventLocation) {
    return { location: eventLocation };
  }
  
  // Try event microdata
  const venueElement = $('.venue, .location, .event-location, .event-venue, [data-event-venue]').first();
  if (venueElement.length) {
    return { location: venueElement.text().trim() };
  }
  
  // Look for address formats
  const addressElement = $('address').first();
  if (addressElement.length) {
    return { location: addressElement.text().trim() };
  }
  
  return { location: null };
}

/**
 * Extract registration link for events
 */
function extractRegistrationLink($: cheerio.CheerioAPI, baseUrl: string): string | null {
  // Look for registration buttons
  const regButton = $('a:contains("Register"), a:contains("Sign up"), a:contains("RSVP"), a:contains("Book"), a:contains("Join"), a:contains("Tickets"), a:contains("Enroll")').first();
  
  if (regButton.length) {
    const href = regButton.attr('href');
    if (href) {
      return resolveUrl(href, baseUrl);
    }
  }
  
  return null;
}

/**
 * Extract pricing information from a webpage
 */
function extractPriceInfo($: cheerio.CheerioAPI): { 
  price: string | null, 
  currency: string | null,
  discountPrice: string | null,
  priceRange: string | null
} {
  // Look for price elements
  const priceElements = $('.price, .cost, .fee, .amount, [itemprop="price"], .event-cost, .ticket-price')
    .filter(function() {
      return $(this).text().trim().length > 0;
    });
  
  // Look for schema.org price markup
  const schemaPrice = $('[itemtype="http://schema.org/Product"] [itemprop="price"]').text().trim() ||
                      $('[itemtype="http://schema.org/Offer"] [itemprop="price"]').text().trim() ||
                      $('[itemtype="http://schema.org/Event"] [itemprop="price"]').text().trim();
  
  // Look for currency
  const schemaCurrency = $('[itemtype="http://schema.org/Product"] [itemprop="priceCurrency"]').text().trim() ||
                         $('[itemtype="http://schema.org/Offer"] [itemprop="priceCurrency"]').text().trim() ||
                         $('[itemtype="http://schema.org/Event"] [itemprop="priceCurrency"]').text().trim();
  
  // Look for common price patterns in text
  const bodyText = $('body').text();
  const priceRegex = /(?:INR|Rs\.?|₹|Rs)\s*\d+(?:[,.]\d+)?|\$\s*\d+(?:[,.]\d+)?|€\s*\d+(?:[,.]\d+)?|£\s*\d+(?:[,.]\d+)?/g;
  const priceMatches = bodyText.match(priceRegex) || [];
  
  // Look for price ranges
  const priceRangeRegex = /(?:INR|Rs\.?|₹|Rs|€|\$|£|EUR)\s*\d+(?:[,.]\d+)?\s*(?:-|–|to)\s*(?:INR|Rs\.?|₹|Rs|€|\$|£|EUR)?\s*\d+(?:[,.]\d+)?/gi;
  const priceRangeMatches = bodyText.match(priceRangeRegex) || [];
  
  // Look for discount prices or special offers
  const discountRegex = /(?:discount|offer|sale|special).*?(?:INR|Rs\.?|₹|Rs)\s*\d+(?:[,.]\d+)?|\$\s*\d+(?:[,.]\d+)?|€\s*\d+(?:[,.]\d+)?|£\s*\d+(?:[,.]\d+)?/gi;
  const discountMatches = bodyText.match(discountRegex) || [];
  
  // Extract currency symbol/code from price
  const getCurrency = (price: string): string | null => {
    if (!price) return null;
    if (price.includes('₹') || price.includes('Rs') || price.includes('INR')) return 'INR';
    if (price.includes('$')) return 'USD';
    if (price.includes('€')) return 'EUR';
    if (price.includes('£')) return 'GBP';
    return null;
  };
  
  // Prioritize and compile results
  const mainPrice = schemaPrice || 
                   (priceElements.length > 0 ? priceElements.first().text().trim() : null) ||
                   (priceMatches.length > 0 ? priceMatches[0] : null);
  
  const currency = schemaCurrency || getCurrency(mainPrice || '');
  
  const discountPrice = discountMatches.length > 0 ? discountMatches[0] : null;
  const priceRange = priceRangeMatches.length > 0 ? priceRangeMatches[0] : null;
  
  return {
    price: mainPrice,
    currency,
    discountPrice,
    priceRange
  };
}

/**
 * Extract detailed event dates and times for better scheduling
 */
async function extractEventDatesAndTimes(content: string, extractedDate: string | null): Promise<{
  startDate: string | null,
  endDate: string | null,
  timings: string | null
}> {
  try {
    const gemini = getGeminiAI();
    
    const prompt = `
    Based on this content that appears to be about an event, please extract the most accurate event dates and times information.
    
    Already extracted date (may be inaccurate): ${extractedDate || 'None found'}
    
    Please analyze the text and extract:
    1. Event start date in YYYY-MM-DD format (or date range if applicable)
    2. Event end date in YYYY-MM-DD format (if it's a multi-day event)
    3. Event start and end times (e.g., "9:00 AM - 5:00 PM" or multiple timing slots)
    
    Respond in this JSON format ONLY:
    {
      "startDate": "YYYY-MM-DD or null if not found",
      "endDate": "YYYY-MM-DD or null if not applicable",
      "timings": "Start time - End time or detailed timing information or null if not found"
    }
    
    Content:
    ${content.substring(0, 5000)}
    `;

    const result = await gemini.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse event dates JSON from Gemini response:', e);
      }
    }
    
    // Fallback response
    return {
      startDate: extractedDate,
      endDate: null,
      timings: null
    };
  } catch (error) {
    console.error('Error extracting event dates with Gemini:', error);
    return {
      startDate: extractedDate,
      endDate: null,
      timings: null
    };
  }
}

/**
 * Extract contact information from a webpage
 */
function extractContactInfo($: cheerio.CheerioAPI): { email: string | null, phone: string | null } {
  // Extract email addresses using a basic pattern
  const bodyText = $('body').text();
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = bodyText.match(emailRegex) || [];
  
  // Extract phone numbers
  const phoneRegex = /(\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g;
  const phones = bodyText.match(phoneRegex) || [];
  
  // Prioritize "contact@", "info@", etc. emails
  let primaryEmail = null;
  for (const email of emails) {
    if (email.includes('contact@') || email.includes('info@') || email.includes('hello@')) {
      primaryEmail = email;
      break;
    }
  }
  
  return { 
    email: primaryEmail || (emails.length > 0 ? emails[0] : null),
    phone: phones.length > 0 ? phones[0] : null
  };
}

/**
 * Extract a date from HTML using common patterns
 */
function extractDateFromHTML($: cheerio.CheerioAPI): string | null {
  // Look for common date patterns in meta tags
  const metaPublished = $('meta[property="article:published_time"]').attr('content') ||
                        $('meta[name="publishdate"]').attr('content') ||
                        $('meta[name="date"]').attr('content');
                        
  if (metaPublished) {
    return metaPublished;
  }

  // Look for schema.org event date markup
  const eventDate = $('[itemtype="http://schema.org/Event"] [itemprop="startDate"]').attr('content') ||
                    $('[itemtype="http://schema.org/Event"] [itemprop="startDate"]').text();
                    
  if (eventDate) {
    return eventDate;
  }

  // Look for time elements
  const timeElement = $('time').attr('datetime');
  if (timeElement) {
    return timeElement;
  }

  // Look for common date class names or structures
  const dateElement = $('.date, .published, .publish-date, .post-date, .event-date, .startDate, .start-date').first().text().trim();
  if (dateElement) {
    return dateElement;
  }

  // Look for text containing dates
  const bodyText = $('body').text();
  
  // Try to find dates in format: January 15, 2025 or 15 January 2025
  const dateRegex = /(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})|(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/gi;
  
  const dateMatches = bodyText.match(dateRegex);
  if (dateMatches && dateMatches.length > 0) {
    return dateMatches[0];
  }

  return null;
}

/**
 * Use Gemini AI to categorize and summarize content
 */
async function categorizeAndSummarizeContent(
  title: string, 
  content: string, 
  url: string, 
  metaDescription: string,
  images: string[]
) {
  try {
    const openai = getOpenAI();
    
    const prompt = `
    I need a detailed analysis of this web content about bamboo architecture and design. The goal is to intelligently categorize, extract, and summarize it for our knowledge database.
    
    URL: ${url}
    Title: ${title}
    Meta Description: ${metaDescription}
    Available Images: ${images.length > 0 ? images.slice(0, 3).join(', ') : 'None found'}
    
    Please:
    
    1. Identify the most accurate content type from these options:
       - article (informational/news content)
       - event (workshop/conference/webinar with date and time)
       - social_media (post from social platforms with engagement)
       - webpage (general website content/landing page)
       - document (technical document/guide/research)
       - project (bamboo project showcase with examples)
       - enthusiast (profile of bamboo expert/artist/architect)
       - fact (specific factual information about bamboo)
       - book (publication or book about bamboo)
    
    2. Provide a concise, specific and meaningful title (if the current one can be improved)
    
    3. Select the most informative/high-quality image URL from the list (if no good ones are available, recommend what kind of image should be added)
    
    4. Create a comprehensive summary (~300 words) that captures:
       - Key bamboo design/architecture concepts
       - Techniques or methodologies mentioned
       - Notable projects or examples
       - Any sustainability aspects discussed
       - Technical specifications if relevant
    
    5. If this appears to be an event, extract any registration link information
    
    The response must be valid JSON in this format:
    {
      "contentType": "type from above",
      "title": "improved title",
      "imageUrl": "best image URL or null",
      "summary": "comprehensive summary",
      "registrationLink": "event registration URL or null"
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: "You are a specialized content analyzer for bamboo architecture." },
        { role: "user", content: prompt + "\n\nContent:\n" + content.substring(0, 10000) }
      ],
      response_format: { type: "json_object" }
    });
    
    const responseText = response.choices[0].message.content;
    if (responseText) {
      try {
        return JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON from OpenAI response:', e);
      }
    }
    
    // If we couldn't parse JSON, return default values
    return {
      contentType: 'webpage',
      title: title,
      imageUrl: images.length > 0 ? images[0] : null,
      summary: metaDescription || content.substring(0, 1000) + '...',
      registrationLink: null
    };
  } catch (error) {
    console.error('Error categorizing content with OpenAI:', error);
    // Fallback to basic categorization
    return {
      contentType: 'webpage',
      title: title,
      imageUrl: images.length > 0 ? images[0] : null,
      summary: metaDescription || content.substring(0, 1000) + '...',
      registrationLink: null
    };
  }
}

/**
 * Extract social profiles for bamboo enthusiasts
 */
async function extractSocialProfiles(content: string, name: string) {
  try {
    const gemini = getGeminiAI();
    
    const prompt = `
    Based on this content that appears to be about a bamboo enthusiast, architect, or expert named "${name}", please extract any social media profiles or contact information.
    
    Look for:
    - LinkedIn URL
    - Instagram handle or URL
    - Twitter/X handle or URL
    - Facebook profile or page
    - Personal website
    - Email address
    - Phone number
    - YouTube channel
    - GitHub profile
    
    Respond in this JSON format only:
    {
      "linkedin": "URL or null",
      "instagram": "URL or null",
      "twitter": "URL or null",
      "facebook": "URL or null",
      "website": "URL or null",
      "email": "address or null",
      "phone": "number or null",
      "youtube": "URL or null",
      "github": "URL or null"
    }
    
    Content:
    ${content.substring(0, 8000)}
    `;

    const result = await gemini.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse social profiles JSON from Gemini response:', e);
        return {};
      }
    }
    
    return {};
  } catch (error) {
    console.error('Error extracting social profiles with Gemini:', error);
    return {};
  }
}

/**
 * Extract bamboo facts from content with better context
 */
async function extractFactsFromContent(content: string, contentId: number, userId: number) {
  try {
    const gemini = getGeminiAI();
    
    const prompt = `
    Extract 3-5 interesting, educational, and accurate facts about bamboo from this content.
    I want high-quality facts that would be valuable for architectural students and professionals.
    
    Each fact should be:
    - Self-contained and meaningful on its own
    - 1-2 sentences long
    - Focused specifically on bamboo properties, architectural applications, cultivation, or sustainability
    - Technical and precise, with specific measurements, techniques or specifications when appropriate
    - Directly supported by information in the content (don't invent facts)
    
    Format your response as a JSON array of facts:
    ["Fact 1", "Fact 2", "Fact 3"]
    
    Content:
    ${content.substring(0, 10000)}
    `;

    const result = await gemini.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const facts = JSON.parse(jsonMatch[0]);
        
        // Save the facts to the database
        const savedFacts = [];
        for (const factText of facts) {
          if (factText && typeof factText === 'string') {
            const newFact = await storage.createBambooFact({
              fact: factText,
              sourceContentId: contentId,
              createdBy: userId,
              status: 'active'
            });
            savedFacts.push(newFact);
          }
        }
        
        return savedFacts;
      } catch (e) {
        console.error('Failed to parse facts JSON from Gemini response:', e);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting facts with Gemini:', error);
    return [];
  }
}

/**
 * Save additional images to a gallery for the content
 */
async function saveAdditionalImages(images: string[], contentId: number, userId: number) {
  // Skip the first image as it's already saved as the main image
  if (images.length <= 1) return;
  
  try {
    const imagesToSave = images.slice(1, 10); // Save up to 9 additional images
    
    for (const imageUrl of imagesToSave) {
      // TODO: Implement storing additional images in a related table
      // For now, we'll just log them
      console.log(`Would save additional image ${imageUrl} for content ${contentId}`);
    }
    
    return imagesToSave.length;
  } catch (error) {
    console.error('Error saving additional images:', error);
    return 0;
  }
}