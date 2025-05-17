/**
 * Scraper Integration
 * Enhanced web scraping integration for BambooMade Knowledge Assistant
 */
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { InsertAiKnowledgeContent } from '@shared/schema';

const execPromise = promisify(exec);

interface ScraperResultPage {
  url: string;
  title: string;
  content: string;
  timestamp: string;
}

interface ScraperResultImage {
  url: string;
  page_url: string;
  alt_text: string;
}

interface ScraperResultEvent {
  title: string;
  url: string;
  date?: string;
  location?: string;
  registration_link?: string;
  price?: string;
}

interface ScraperResultContact {
  source_url: string;
  email?: string[];
  phone?: string[];
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

interface ScraperResult {
  url: string;
  pages: ScraperResultPage[];
  images: ScraperResultImage[];
  events: ScraperResultEvent[];
  contacts: ScraperResultContact[];
}

/**
 * Scrape a website and extract structured data
 * @param url The URL to scrape
 * @param maxPages Maximum number of pages to scrape (default: 3)
 */
export async function scrapeWebsite(url: string, maxPages: number = 3): Promise<ScraperResult> {
  try {
    console.log(`Starting web scraping for URL: ${url} with max pages: ${maxPages}`);
    
    // Create a temporary output file
    const outputFile = path.join(
      process.cwd(),
      `temp_scrape_${Date.now()}.json`
    );
    
    // Run the Python script with the URL and max pages
    const command = `python3 server/bamboo_scraper.py "${url}" ${maxPages} "${outputFile}"`;
    
    // Execute the command
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.warn('Scraper stderr:', stderr);
    }
    
    console.log('Scraper output:', stdout);
    
    // Read and parse the output file
    let scrapedResult: ScraperResult;
    
    if (fs.existsSync(outputFile)) {
      const fileContent = fs.readFileSync(outputFile, 'utf8');
      scrapedResult = JSON.parse(fileContent);
      
      // Clean up the temporary file
      fs.unlinkSync(outputFile);
      
      return scrapedResult;
    } else {
      throw new Error('Scraper did not produce output file');
    }
  } catch (error) {
    console.error('Error running scraper:', error);
    
    // Return empty result structure on error
    return {
      url,
      pages: [],
      images: [],
      events: [],
      contacts: []
    };
  }
}

/**
 * Convert scraper results to knowledge content items
 * @param scrapedResult The results from the scraper
 * @param createdBy User ID of the person creating the content
 */
export function convertScrapedResultsToKnowledgeContent(
  scrapedResult: ScraperResult,
  createdBy: number
): InsertAiKnowledgeContent[] {
  const knowledgeItems: InsertAiKnowledgeContent[] = [];
  
  try {
    // Process web pages
    if (scrapedResult.pages && scrapedResult.pages.length > 0) {
      scrapedResult.pages.forEach((page) => {
        // Basic web page content
        knowledgeItems.push({
          title: page.title || `Content from ${page.url}`,
          content: page.content,
          source: page.url,
          contentType: 'webpage',
          status: 'active',
          createdBy,
          rawContent: JSON.stringify(page)
        });
      });
    }
    
    // Process events
    if (scrapedResult.events && scrapedResult.events.length > 0) {
      scrapedResult.events.forEach((event) => {
        const eventContent = [
          `Event: ${event.title || 'Unnamed Event'}`,
          event.date ? `Date: ${event.date}` : '',
          event.location ? `Location: ${event.location}` : '',
          event.price ? `Price: ${event.price}` : '',
          event.registration_link ? `Registration: ${event.registration_link}` : '',
          `Source: ${event.url}`
        ].filter(Boolean).join('\n');
        
        knowledgeItems.push({
          title: event.title || `Event from ${event.url}`,
          content: eventContent,
          source: event.url,
          contentType: 'event',
          status: 'active',
          createdBy,
          // Event-specific fields
          eventDate: event.date || '',
          eventLocation: event.location || '',
          registrationLink: event.registration_link || '',
          price: event.price || '',
          rawContent: JSON.stringify(event)
        });
      });
    }
    
    // Process contact information
    if (scrapedResult.contacts && scrapedResult.contacts.length > 0) {
      scrapedResult.contacts.forEach((contact) => {
        if (contact.email || contact.phone || contact.social_media) {
          const contactContent = [
            'Contact Information:',
            contact.email ? `Email: ${contact.email.join(', ')}` : '',
            contact.phone ? `Phone: ${contact.phone.join(', ')}` : '',
            contact.social_media ? 'Social Media: ' + 
              Object.entries(contact.social_media)
                .map(([platform, url]) => `${platform}: ${url}`)
                .join(', ') : ''
          ].filter(Boolean).join('\n');
          
          knowledgeItems.push({
            title: `Contact Information from ${new URL(contact.source_url).hostname}`,
            content: contactContent,
            source: contact.source_url,
            contentType: 'enthusiast',
            status: 'active',
            createdBy,
            // Contact specific fields
            contactEmail: contact.email ? contact.email[0] : '',
            contactPhone: contact.phone ? contact.phone[0] : '',
            // Social media links
            linkedinUrl: contact.social_media?.linkedin || '',
            instagramUrl: contact.social_media?.instagram || '',
            twitterUrl: contact.social_media?.twitter || '',
            facebookUrl: contact.social_media?.facebook || '',
            rawContent: JSON.stringify(contact)
          });
        }
      });
    }
    
    return knowledgeItems;
  } catch (error) {
    console.error('Error converting scraped results to knowledge content:', error);
    
    // Fallback with basic information
    return [{
      title: `Content from ${scrapedResult.url}`,
      content: `This content was extracted from ${scrapedResult.url}, but there was an error processing the structured data.`,
      source: scrapedResult.url,
      contentType: 'webpage',
      status: 'active',
      createdBy,
      rawContent: JSON.stringify(scrapedResult)
    }];
  }
}