import axios from 'axios';
import * as cheerio from 'cheerio';
import { getGeminiAI } from "./gemini-service";
import { storage } from "./storage";

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

    // Fetch the webpage content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract basic metadata
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Content';
    
    // Remove scripts, styles, and comments to get cleaner content
    $('script, style, noscript, iframe').remove();
    $('*').contents().each(function() {
      if (this.type === 'comment') {
        $(this).remove();
      }
    });

    // Extract text content
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Only use first 15000 characters to avoid token limits
    const truncatedContent = bodyText.slice(0, 15000);

    // Use Gemini to categorize and summarize the content
    const analysis = await categorizeAndSummarizeContent(title, truncatedContent, url);

    // Use date pattern to attempt to extract a date from the HTML
    const extractedDate = extractDateFromHTML($);

    // Create a new knowledge base entry
    const newContent = await storage.createAIKnowledgeContent({
      title: analysis.title || title,
      content: analysis.summary,
      rawContent: truncatedContent,
      source: url,
      contentType: analysis.contentType,
      status: 'active',
      mediaUrl: analysis.imageUrl,
      mediaType: 'webpage',
      socialMediaInfo: {},
      createdBy: userId,
      eventDate: extractedDate || undefined
    });

    // Extract facts if this content provides useful factual information
    if (['article', 'webpage', 'document', 'event'].includes(analysis.contentType)) {
      const facts = await extractFactsFromContent(truncatedContent, newContent.id, userId);
    }

    return {
      id: newContent.id,
      title: newContent.title,
      contentType: newContent.contentType,
      source: newContent.source,
      extractedDate: newContent.eventDate || null,
      success: true
    };
  } catch (error) {
    console.error('Error importing from URL:', error);
    throw error;
  }
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

  // Look for time elements
  const timeElement = $('time').attr('datetime');
  if (timeElement) {
    return timeElement;
  }

  // Look for common date class names or structures
  const dateElement = $('.date, .published, .publish-date, .post-date').first().text().trim();
  if (dateElement) {
    return dateElement;
  }

  return null;
}

/**
 * Use Gemini AI to categorize and summarize content
 */
async function categorizeAndSummarizeContent(title: string, content: string, url: string) {
  try {
    const gemini = getGeminiAI();
    
    const prompt = `
    I need help analyzing this web content about bamboo. Please:
    
    1. Identify the content type from these options:
       - article (informational/news)
       - event (workshop/conference/webinar)
       - social_media (post from social platforms)
       - webpage (general website content)
       - document (technical document/guide)
       - project (bamboo project showcase)
       - enthusiast (profile of bamboo expert/enthusiast)
       - fact (specific factual information)
    
    2. Determine if there's a better/more specific title than: "${title}"
    
    3. Extract 1-2 key images (provide URLs if found)
    
    4. Create a concise summary (~200 words) that captures the most important bamboo-related information
    
    5. Respond in this JSON format:
    {
      "contentType": "type from above",
      "title": "improved title if possible",
      "imageUrl": "main image URL or null",
      "summary": "concise summary"
    }
    
    Here's the content (from ${url}):
    
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
        console.error('Failed to parse JSON from Gemini response:', e);
      }
    }
    
    // If we couldn't parse JSON, return default values
    return {
      contentType: 'webpage',
      title: title,
      imageUrl: null,
      summary: content.substring(0, 1000) + '...'
    };
  } catch (error) {
    console.error('Error categorizing content with Gemini:', error);
    // Fallback to basic categorization
    return {
      contentType: 'webpage',
      title: title,
      imageUrl: null,
      summary: content.substring(0, 1000) + '...'
    };
  }
}

/**
 * Extract bamboo facts from content
 */
async function extractFactsFromContent(content: string, contentId: number, userId: number) {
  try {
    const gemini = getGeminiAI();
    
    const prompt = `
    Extract 3-5 interesting, educational facts about bamboo from this content.
    Each fact should be:
    - Self-contained and meaningful on its own
    - 1-2 sentences long
    - Focused on bamboo properties, uses, cultivation, or sustainability
    - Scientific/technical where appropriate
    
    Format your response as a JSON array of facts:
    ["Fact 1", "Fact 2", "Fact 3"]
    
    Content:
    ${content.substring(0, 8000)}
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