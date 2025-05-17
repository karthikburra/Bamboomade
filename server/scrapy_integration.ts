/**
 * Scrapy integration service
 * This file handles running the Python Scrapy crawler and processing its results
 */
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { InsertAiKnowledgeContent } from '@shared/schema';

const execPromise = promisify(exec);

interface ScrapyResult {
  url: string;
  crawled_pages: Array<{
    url: string;
    title: string;
    content: string;
    event_details?: any;
    contact_info?: any;
    timestamp: string;
  }>;
  images: Array<{
    url: string;
    page_url: string;
    page_title: string;
  }>;
  events: any[];
  contacts: any[];
  error?: string;
}

/**
 * Run the Scrapy crawler on a given URL and return structured data
 * @param url The URL to crawl
 * @param depth The crawl depth (default: 1)
 */
export async function crawlWebsite(
  url: string,
  depth: number = 1
): Promise<ScrapyResult> {
  try {
    console.log(`Starting Scrapy crawler for URL: ${url} with depth: ${depth}`);
    
    // Create a temporary output file
    const outputFile = path.join(
      process.cwd(),
      `temp_scrapy_${Date.now()}.json`
    );
    
    // Run the Python script with the URL and depth
    const command = `python3 server/scrapy_crawler.py "${url}" ${depth} "${outputFile}"`;
    
    // Execute the command
    await execPromise(command);
    
    // Read and parse the output file
    let scrapyResult: ScrapyResult;
    
    if (fs.existsSync(outputFile)) {
      const fileContent = fs.readFileSync(outputFile, 'utf8');
      scrapyResult = JSON.parse(fileContent);
      
      // Clean up the temporary file
      fs.unlinkSync(outputFile);
    } else {
      throw new Error('Scrapy crawler did not produce output file');
    }
    
    return scrapyResult;
  } catch (error) {
    console.error('Error running Scrapy crawler:', error);
    return {
      url,
      crawled_pages: [],
      images: [],
      events: [],
      contacts: [],
      error: error.message || 'Unknown error running Scrapy crawler'
    };
  }
}

/**
 * Convert Scrapy crawl results to knowledge content format
 * @param crawlResults The results from the Scrapy crawler
 */
export function convertCrawlResultsToKnowledgeContent(
  crawlResults: ScrapyResult,
  createdBy: number
): InsertAiKnowledgeContent[] {
  const knowledgeItems: InsertAiKnowledgeContent[] = [];
  
  try {
    // Main content from the crawled pages
    if (crawlResults.crawled_pages && crawlResults.crawled_pages.length > 0) {
      // Process each crawled page
      crawlResults.crawled_pages.forEach((page) => {
        // Basic web page content
        knowledgeItems.push({
          title: page.title || `Content from ${page.url}`,
          content: page.content,
          source: page.url,
          contentType: 'webpage',
          status: 'active',
          createdBy,
          // Store the full raw content
          rawContent: JSON.stringify(page)
        });
        
        // If the page has event details, create a separate event entry
        if (page.event_details && Object.keys(page.event_details).length > 0) {
          const event = page.event_details;
          
          knowledgeItems.push({
            title: event.name || `Event from ${page.url}`,
            content: `Event: ${event.name || 'Unnamed Event'}\n` +
                    `Date: ${event.startDate || event.date || 'Not specified'}\n` +
                    `Location: ${event.location || 'Not specified'}\n` +
                    `Description: ${event.description || 'No description available'}`,
            source: page.url,
            contentType: 'event',
            status: 'active',
            createdBy,
            // Event-specific fields
            eventDate: event.startDate || event.date || '',
            eventEndDate: event.endDate || '',
            eventLocation: event.location || '',
            // Store the full raw event data
            rawContent: JSON.stringify(event)
          });
        }
      });
    }
    
    // Process contact information if available
    if (crawlResults.contacts && crawlResults.contacts.length > 0) {
      crawlResults.contacts.forEach((contact) => {
        const contactContent = [
          'Contact Information:',
          contact.email ? `Email: ${contact.email.join(', ')}` : '',
          contact.phone ? `Phone: ${contact.phone.join(', ')}` : '',
          contact.social ? `Social Media: ${Object.entries(contact.social)
            .map(([platform, url]) => `${platform}: ${url}`)
            .join(', ')}` : ''
        ].filter(Boolean).join('\n');
        
        knowledgeItems.push({
          title: `Contact Information from ${crawlResults.url}`,
          content: contactContent,
          source: crawlResults.url,
          contentType: 'enthusiast',
          status: 'active',
          createdBy,
          // Contact specific fields
          contactEmail: contact.email ? contact.email[0] : '',
          contactPhone: contact.phone ? contact.phone[0] : '',
          // Social media links
          linkedinUrl: contact.social?.linkedin || '',
          instagramUrl: contact.social?.instagram || '',
          twitterUrl: contact.social?.twitter || '',
          facebookUrl: contact.social?.facebook || '',
          // Store the full raw content
          rawContent: JSON.stringify(contact)
        });
      });
    }
    
    return knowledgeItems;
  } catch (error) {
    console.error('Error converting crawl results to knowledge content:', error);
    
    // Fallback with basic information
    return [{
      title: `Content from ${crawlResults.url}`,
      content: `This content was crawled from ${crawlResults.url}, but there was an error processing the structured data.`,
      source: crawlResults.url,
      contentType: 'webpage',
      status: 'active',
      createdBy,
      rawContent: JSON.stringify(crawlResults)
    }];
  }
}

/**
 * Update the Python Scrapy crawler script with the correct command line arguments
 * This ensures the script can be called correctly from the integration
 */
export async function fixScrapyScriptForCommandLine(): Promise<void> {
  try {
    const scriptPath = path.join(process.cwd(), 'server/scrapy_crawler.py');
    
    if (fs.existsSync(scriptPath)) {
      let scriptContent = fs.readFileSync(scriptPath, 'utf8');
      
      // Check if the script already has the updated main block
      if (!scriptContent.includes('import sys')) {
        // Update the main block to accept command line arguments
        const updatedMainBlock = `
if __name__ == "__main__":
    import sys
    
    # Get command line arguments
    if len(sys.argv) >= 2:
        url = sys.argv[1]
        depth = int(sys.argv[2]) if len(sys.argv) >= 3 else 1
        output_file = sys.argv[3] if len(sys.argv) >= 4 else None
        
        # Run the crawler
        results = run_scrapy_crawler(url, depth, output_file)
        print(f"Crawled {len(results['crawled_pages'])} pages from {url}")
    else:
        print("Usage: python scrapy_crawler.py <url> [depth] [output_file]")
`;
        
        // Replace the existing main block
        scriptContent = scriptContent.replace(
          /if __name__ == "__main__":.+?(?=\n\n|$)/s,
          updatedMainBlock.trim()
        );
        
        // Write the updated script back to the file
        fs.writeFileSync(scriptPath, scriptContent);
        console.log('Updated Scrapy script for command line usage');
      }
    }
  } catch (error) {
    console.error('Error updating Scrapy script for command line:', error);
  }
}