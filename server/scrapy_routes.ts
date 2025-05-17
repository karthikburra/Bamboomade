/**
 * Web Extraction Routes
 * API endpoints for the web content extraction functionality
 */
import { Request, Response } from 'express';
import { scrapeWebsite, processScrapyResults } from './scrapy_manager';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Register web extraction routes
 * @param app Express application
 */
export function registerScrapyRoutes(app: any) {
  /**
   * Save extraction results to the knowledge base
   * POST /api/scrapy/save-extraction
   * Body: { url: string }
   */
  app.post('/api/scrapy/save-extraction', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      // Check if user is logged in
      if (!req.session.userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      // Get the cached extraction results based on URL
      let cachedResultsStr;
      try {
        cachedResultsStr = await fs.readFile(
          path.join(process.cwd(), 'scrapy-results.json'), 
          'utf8'
        );
      } catch (err) {
        console.error('Error reading cached extraction results:', err);
        cachedResultsStr = null;
      }
      
      if (!cachedResultsStr) {
        return res.status(404).json({ 
          success: false, 
          message: 'No extraction results found. Please run an extraction first.' 
        });
      }
      
      let extractionResults;
      try {
        extractionResults = JSON.parse(cachedResultsStr);
      } catch (parseError) {
        console.error('Error parsing extraction results:', parseError);
        return res.status(500).json({ 
          success: false, 
          message: 'Invalid extraction results format. Please run a new extraction.' 
        });
      }
      
      // Only process if it's the same URL
      if (extractionResults.url !== url) {
        return res.status(400).json({ 
          success: false, 
          message: 'URL mismatch. Please run a new extraction with the correct URL.' 
        });
      }
      
      // Process results and add to knowledge base
      const itemsAdded = await processScrapyResults(extractionResults, req.session.userId);
      
      return res.json({
        success: true,
        message: `Successfully added ${itemsAdded} items to the knowledge base.`,
        itemsAdded
      });
    } catch (error: any) {
      console.error('Error saving extraction results:', error);
      return res.status(500).json({ 
        success: false, 
        message: `Error saving extraction results: ${error.message}` 
      });
    }
  });
  /**
   * Extract content from a website and add it to the knowledge base
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
      
      console.log(`Starting web extraction for ${url} with depth ${depth}`);
      
      // Start extracting content
      const extractionResults = await scrapeWebsite(url, depth);
      
      // Process results and add to knowledge base
      const itemsAdded = await processScrapyResults(extractionResults, req.session.userId);
      
      // Summarize the results
      const summary = {
        url,
        pagesFound: extractionResults.results.pages.length,
        eventsFound: extractionResults.results.events.length,
        contactsFound: extractionResults.results.contacts.length,
        imagesFound: extractionResults.results.images.length,
        booksFound: extractionResults.results.books.length,
        socialMediaFound: extractionResults.results.social_media.length,
        itemsAddedToKnowledgeBase: itemsAdded
      };
      
      return res.json({
        success: true,
        message: `Successfully extracted content from ${url} and added ${itemsAdded} items to the knowledge base`,
        summary
      });
    } catch (error: any) {
      console.error('Error in web extraction:', error);
      return res.status(500).json({
        success: false,
        message: `Error extracting content: ${error?.message || 'Unknown error'}`,
        error: error?.message
      });
    }
  });
  
  /**
   * Get status of current web extraction (for long-running extractions)
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