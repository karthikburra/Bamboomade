/**
 * Scrapy Manager
 * Integration for using Scrapy to extract structured data from websites
 */
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { URL } from 'url';
import { storage } from './storage';
import { InsertAiKnowledgeContent } from '@shared/schema';

const execPromise = promisify(exec);

interface ScrapyPage {
  url: string;
  title: string;
  content: string;
  timestamp: string;
}

interface ScrapyImage {
  url: string;
  alt_text?: string;
  title?: string;
  page_url: string;
}

interface ScrapyEvent {
  title: string;
  url: string;
  date?: string;
  location?: string;
  registration_link?: string;
  price?: string;
}

interface ScrapyContact {
  url: string;
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

interface ScrapyBook {
  title: string;
  url: string;
  author?: string;
  publication_year?: string;
  publisher?: string;
  purchase_link?: string;
}

interface ScrapySocialMedia {
  url: string;
  platform?: string;
  embed_code?: string;
  post_date?: string;
}

interface ScrapyResults {
  pages: ScrapyPage[];
  events: ScrapyEvent[];
  contacts: ScrapyContact[];
  images: ScrapyImage[];
  books: ScrapyBook[];
  social_media: ScrapySocialMedia[];
}

interface ScrapyResponse {
  url: string;
  results: ScrapyResults;
}

/**
 * Run the web extractor to extract data from a website
 * @param url URL to crawl
 * @param maxDepth Maximum crawl depth (default: 2)
 * @returns Structured data extracted from the website
 */
export async function scrapeWebsite(url: string, maxDepth: number = 2): Promise<ScrapyResponse> {
  try {
    console.log(`Starting web extraction for URL: ${url} with max depth: ${maxDepth}`);
    
    // Create a temporary output file
    const outputFile = path.join(
      process.cwd(),
      `temp_extraction_${Date.now()}.json`
    );
    
    // Run the Python script with URL and depth parameters
    const command = `python3 server/simple_extractor.py "${url}" ${maxDepth} "${outputFile}"`;
    console.log(`Executing command: ${command}`);
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.warn('Extraction stderr:', stderr);
    }
    
    console.log('Extraction stdout:', stdout);
    
    // Check if output file was created
    if (!fs.existsSync(outputFile)) {
      throw new Error('Web extractor did not produce output file');
    }
    
    // Read and parse the output file
    const fileContent = fs.readFileSync(outputFile, 'utf8');
    const scrapyResult: ScrapyResponse = JSON.parse(fileContent);
    
    // Clean up the temporary file
    fs.unlinkSync(outputFile);
    
    return scrapyResult;
  } catch (error) {
    console.error('Error running web extractor:', error);
    
    // Return empty result on error
    return {
      url,
      results: {
        pages: [],
        events: [],
        contacts: [],
        images: [],
        books: [],
        social_media: []
      }
    };
  }
}

/**
 * Convert Scrapy extraction results to knowledge content items
 * @param scrapyResult Structured data from Scrapy
 * @param userId User ID of the person adding the content
 * @returns Array of knowledge content items ready to add to the database
 */
export async function processScrapyResults(
  scrapyResult: ScrapyResponse, 
  userId: number
): Promise<number> {
  const knowledgeItems: InsertAiKnowledgeContent[] = [];
  
  try {
    const { url, results } = scrapyResult;
    const hostname = new URL(url).hostname;
    
    // No folder organization for now as it's not part of our schema
    console.log(`Processing content extracted from ${url}`);
    
    // Process web pages
    if (results.pages && results.pages.length > 0) {
      for (const page of results.pages) {
        knowledgeItems.push({
          title: page.title || `Content from ${page.url}`,
          content: page.content || `Extracted content from ${page.url}`,
          source: page.url,
          contentType: 'webpage',
          status: 'active',
          createdBy: userId,
          rawContent: JSON.stringify(page)
        });
      }
    }
    
    // Process events
    if (results.events && results.events.length > 0) {
      for (const event of results.events) {
        const eventContent = [
          event.title ? `Event: ${event.title}` : 'Unnamed Event',
          event.date ? `Date: ${event.date}` : '',
          event.location ? `Location: ${event.location}` : '',
          event.price ? `Price: ${event.price}` : '',
          event.registration_link ? `Registration: ${event.registration_link}` : '',
          `Source: ${event.url}`
        ].filter(Boolean).join('\n\n');
        
        knowledgeItems.push({
          title: event.title || `Event from ${hostname}`,
          content: eventContent,
          source: event.url,
          contentType: 'event',
          status: 'active',
          createdBy: userId,
          eventDate: event.date || '',
          eventLocation: event.location || '',
          registrationLink: event.registration_link || '',
          price: event.price || '',
          rawContent: JSON.stringify(event)
        });
      }
    }
    
    // Process books
    if (results.books && results.books.length > 0) {
      for (const book of results.books) {
        // Create comprehensive content that includes all book details
        const bookContent = [
          book.title ? `Book: ${book.title}` : 'Unnamed Book',
          book.author ? `Author: ${book.author}` : '',
          book.publication_year ? `Year: ${book.publication_year}` : '',
          book.publisher ? `Publisher: ${book.publisher}` : '',
          book.purchase_link ? `Purchase: ${book.purchase_link}` : '',
          book.price ? `Price: ${book.price}` : '',
          `Source: ${book.url}`
        ].filter(Boolean).join('\n\n');
        
        // Create item with fields that exist in the actual database schema
        knowledgeItems.push({
          title: book.title || `Book from ${hostname}`,
          content: bookContent,
          source: book.url,
          contentType: 'book',
          status: 'active',
          createdBy: userId,
          // Store the full book details in the rawContent field
          rawContent: JSON.stringify(book),
          // Include book price if available
          price: typeof book.price === 'string' ? book.price : null
        });
      }
    }
    
    // Process contacts
    if (results.contacts && results.contacts.length > 0) {
      for (const contact of results.contacts) {
        if (contact.email || contact.phone || contact.social_media) {
          const contactContent = [
            'Contact Information:',
            contact.email ? `Email: ${contact.email.join(', ')}` : '',
            contact.phone ? `Phone: ${contact.phone.join(', ')}` : '',
            contact.social_media ? 'Social Media: ' + 
              Object.entries(contact.social_media)
                .map(([platform, url]) => `${platform}: ${url}`)
                .join(', ') : ''
          ].filter(Boolean).join('\n\n');
          
          knowledgeItems.push({
            title: `Contact Information from ${hostname}`,
            content: contactContent,
            source: contact.url,
            contentType: 'enthusiast',
            status: 'active',
            createdBy: userId,
            contactEmail: contact.email ? contact.email[0] : '',
            contactPhone: contact.phone ? contact.phone[0] : '',
            linkedinUrl: contact.social_media?.linkedin || '',
            instagramUrl: contact.social_media?.instagram || '',
            twitterUrl: contact.social_media?.twitter || '',
            facebookUrl: contact.social_media?.facebook || '',
            rawContent: JSON.stringify(contact)
          });
        }
      }
    }
    
    // Process social media
    if (results.social_media && results.social_media.length > 0) {
      for (const social of results.social_media) {
        if (social.platform && social.embed_code) {
          const socialContent = [
            `Platform: ${social.platform}`,
            social.post_date ? `Posted: ${social.post_date}` : '',
            social.embed_code ? `Embed Code: ${social.embed_code}` : '',
            `Source: ${social.url}`
          ].filter(Boolean).join('\n\n');
          
          // Create structured socialMediaInfo object to store in the json field
          const socialMediaInfo = {
            platform: social.platform || null,
            profileUrl: social.url || null,
            handle: null, // We don't have this info from extraction
            mediaUrls: []
          };
          
          knowledgeItems.push({
            title: `${social.platform || 'Social Media'} Post from ${hostname}`,
            content: socialContent,
            source: social.url,
            contentType: 'social-media',
            status: 'active',
            createdBy: userId,
            // Store media URL
            mediaUrl: social.url,
            // Store social media details in the proper field
            socialMediaInfo: socialMediaInfo,
            rawContent: JSON.stringify(social)
          });
        }
      }
    }
    
    // Insert all knowledge items into the database
    console.log(`Adding ${knowledgeItems.length} items to knowledge base`);
    
    let successCount = 0;
    for (const item of knowledgeItems) {
      try {
        // Filter to include only fields that exist in the database schema
        // This uses a whitelist approach to ensure only valid fields are sent to the database
        const validItem = {
          title: item.title,
          content: item.content,
          contentType: item.contentType,
          createdBy: item.createdBy,
          source: item.source || null,
          status: item.status || 'active',
          rawContent: item.rawContent || null,
          mediaUrl: item.mediaUrl || null,
          mediaType: item.mediaType || null,
          socialMediaInfo: item.socialMediaInfo || null,
          contactEmail: item.contactEmail || null,
          contactPhone: item.contactPhone || null,
          eventDate: item.eventDate || null,
          eventLocation: item.eventLocation || null,
          registrationLink: item.registrationLink || null,
          price: item.price || null
        };
        
        // Use createAiKnowledgeContent to save to database with only valid fields
        const result = await storage.createAiKnowledgeContent(validItem);
        if (result && result.id) {
          successCount++;
        }
      } catch (error: any) {
        console.error(`Error adding knowledge item: ${error.message}`);
      }
    }
    
    return successCount;
  } catch (error) {
    console.error('Error processing Scrapy results:', error);
    return 0;
  }
}