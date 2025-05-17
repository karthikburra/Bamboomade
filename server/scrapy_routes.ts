/**
 * Scrapy Routes
 * API endpoints for the Scrapy-based web scraping functionality
 */
import { Request, Response } from 'express';
import { scrapeWebsite, processScrapyResults } from './scrapy_manager';

/**
 * Register Scrapy-related routes
 * @param app Express application
 */
export function registerScrapyRoutes(app: any) {
  /**
   * Scrape a website and add its content to the knowledge base
   * POST /api/scrapy/extract
   * Body: { url: string, maxDepth?: number }
   */
  app.post('/api/scrapy/extract', async (req: Request, res: Response) => {
    try {
      const { url, maxDepth = 2 } = req.body;
      
      // Check if user is logged in
      if (!req.session.userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      // Validate URL
      if (!url || typeof url !== 'string' || !url.match(/^(http|https):\/\/[^ "]+$/)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid URL. Please provide a valid HTTP or HTTPS URL.' 
        });
      }
      
      // Validate max depth
      const depth = Math.min(Math.max(parseInt(String(maxDepth), 10) || 2, 1), 5);
      
      console.log(`Starting Scrapy extraction for ${url} with depth ${depth}`);
      
      // Start scraping
      const scrapyResults = await scrapeWebsite(url, depth);
      
      // Process results and add to knowledge base
      const itemsAdded = await processScrapyResults(scrapyResults, req.session.userId);
      
      // Summarize the results
      const summary = {
        url,
        pagesFound: scrapyResults.results.pages.length,
        eventsFound: scrapyResults.results.events.length,
        contactsFound: scrapyResults.results.contacts.length,
        imagesFound: scrapyResults.results.images.length,
        booksFound: scrapyResults.results.books.length,
        socialMediaFound: scrapyResults.results.social_media.length,
        itemsAddedToKnowledgeBase: itemsAdded
      };
      
      return res.json({
        success: true,
        message: `Successfully scraped ${url} and added ${itemsAdded} items to the knowledge base`,
        summary
      });
    } catch (error) {
      console.error('Error in Scrapy extraction:', error);
      return res.status(500).json({
        success: false,
        message: `Error extracting content: ${error.message || 'Unknown error'}`,
        error: error.message
      });
    }
  });
  
  /**
   * Get status of current Scrapy extraction (for long-running extractions)
   * GET /api/scrapy/status
   */
  app.get('/api/scrapy/status', (req: Request, res: Response) => {
    // In a more complex implementation, this would track ongoing extractions
    res.json({
      success: true,
      status: 'No active extractions',
      isRunning: false
    });
  });
}