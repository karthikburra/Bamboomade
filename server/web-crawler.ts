import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import OpenAI from 'openai';

// Check if OpenAI API key is available
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn('OpenAI API key not found. Web crawling analysis will be limited.');
}

// Initialize OpenAI client if key is available
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

/**
 * Data structure for crawled page content
 */
interface CrawledPage {
  url: string;
  title: string;
  content: string;
  links: string[];
  headers: string[];
  images: {
    url: string;
    alt: string;
  }[];
  metaTags: {
    [key: string]: string;
  };
}

/**
 * Extraction result interface for structured data
 */
interface WebsiteExtractionResult {
  title: string;
  contentType: string;
  mainContent: string;
  companyInfo?: {
    name: string;
    mission?: string;
    vision?: string;
    about?: string;
    team?: { name: string; role: string }[];
  };
  upcomingEvents?: {
    title: string;
    date: string;
    description: string;
  }[];
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
    socialLinks?: { platform: string; url: string }[];
  };
  originalPages: CrawledPage[];
}

/**
 * Extract the base domain from a URL
 */
function extractBaseDomain(inputUrl: string): string {
  try {
    const url = new URL(inputUrl);
    return url.hostname;
  } catch (error) {
    console.error('Invalid URL:', inputUrl);
    return '';
  }
}

/**
 * Normalize and validate a URL
 */
function normalizeUrl(url: string, baseUrl: string): string | null {
  try {
    if (url.startsWith('/')) {
      // Handle relative URLs
      const baseUrlObj = new URL(baseUrl);
      return `${baseUrlObj.protocol}//${baseUrlObj.host}${url}`;
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      // Already absolute URL
      return url;
    } else if (!url.startsWith('#') && !url.startsWith('javascript:') && !url.startsWith('mailto:')) {
      // Handle URLs without protocol (e.g. example.com/page)
      const baseUrlObj = new URL(baseUrl);
      return `${baseUrlObj.protocol}//${baseUrlObj.host}/${url}`;
    }
    return null;
  } catch (error) {
    console.error('URL normalization error:', error);
    return null;
  }
}

/**
 * Check if a URL belongs to the same domain
 */
function isSameDomain(url: string, baseDomain: string): boolean {
  try {
    const urlDomain = new URL(url).hostname;
    return urlDomain === baseDomain || urlDomain.endsWith(`.${baseDomain}`);
  } catch (error) {
    return false;
  }
}

/**
 * Process HTML content to extract structured information
 */
async function processHtmlContent(html: string, url: string): Promise<CrawledPage> {
  const $ = cheerio.load(html);
  const title = $('title').text().trim();
  
  // Extract meta tags
  const metaTags: { [key: string]: string } = {};
  $('meta').each((_, element) => {
    const name = $(element).attr('name') || $(element).attr('property');
    const content = $(element).attr('content');
    if (name && content) {
      metaTags[name] = content;
    }
  });

  // Extract main content by removing navigation, headers, footers
  $('nav, header, footer, script, style, iframe, noscript').remove();
  
  // Collect all text content
  let content = '';
  $('body p, body h1, body h2, body h3, body h4, body h5, body h6, body li, body td, body th, body dd, body dt')
    .each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > 0) {
        content += text + '\n';
      }
    });
  
  // Extract all headers
  const headers: string[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, element) => {
    const text = $(element).text().trim();
    if (text.length > 0) {
      headers.push(text);
    }
  });
  
  // Extract all links
  const links: string[] = [];
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const normalizedUrl = normalizeUrl(href, url);
      if (normalizedUrl) {
        links.push(normalizedUrl);
      }
    }
  });
  
  // Extract images
  const images: { url: string; alt: string }[] = [];
  $('img').each((_, element) => {
    const src = $(element).attr('src');
    const alt = $(element).attr('alt') || '';
    if (src) {
      const normalizedUrl = normalizeUrl(src, url);
      if (normalizedUrl) {
        images.push({ url: normalizedUrl, alt });
      }
    }
  });

  return {
    url,
    title,
    content,
    links,
    headers,
    images,
    metaTags,
  };
}

/**
 * Crawl a website starting from a root URL
 * @param rootUrl The starting URL
 * @param maxPages Maximum number of pages to crawl
 * @param maxDepth Maximum depth of links to follow
 */
export async function crawlWebsite(
  rootUrl: string, 
  maxPages: number = 10, 
  maxDepth: number = 2
): Promise<CrawledPage[]> {
  const baseDomain = extractBaseDomain(rootUrl);
  if (!baseDomain) {
    throw new Error('Invalid URL');
  }

  const visitedUrls = new Set<string>();
  const pagesToVisit: Array<{ url: string; depth: number }> = [{ url: rootUrl, depth: 0 }];
  const crawledPages: CrawledPage[] = [];

  while (pagesToVisit.length > 0 && crawledPages.length < maxPages) {
    const { url: currentUrl, depth } = pagesToVisit.shift()!;
    
    if (visitedUrls.has(currentUrl)) {
      continue;
    }
    
    visitedUrls.add(currentUrl);
    
    try {
      console.log(`Crawling page: ${currentUrl}`);
      const response = await axios.get(currentUrl, {
        headers: {
          'User-Agent': 'BambooMade-WebCrawler/1.0',
          'Accept': 'text/html',
        },
        timeout: 10000, // 10 seconds
      });
      
      if (response.status === 200 && response.headers['content-type']?.includes('text/html')) {
        const crawledPage = await processHtmlContent(response.data, currentUrl);
        crawledPages.push(crawledPage);
        
        // Add new links to visit if we haven't reached max depth
        if (depth < maxDepth) {
          for (const link of crawledPage.links) {
            if (isSameDomain(link, baseDomain) && !visitedUrls.has(link)) {
              pagesToVisit.push({ url: link, depth: depth + 1 });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error crawling ${currentUrl}:`, error);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return crawledPages;
}

/**
 * Extract structured information from crawled pages using AI
 * @param crawledPages Array of crawled pages
 */
export async function extractStructuredInformation(
  crawledPages: CrawledPage[]
): Promise<WebsiteExtractionResult> {
  if (!openai) {
    // Fallback without OpenAI
    const mainPage = crawledPages[0];
    return {
      title: mainPage.title,
      contentType: 'webpage',
      mainContent: crawledPages.map(p => p.content).join('\n\n'),
      originalPages: crawledPages,
    };
  }

  // Concatenate crawled page data for analysis
  const websiteData = crawledPages.map(page => {
    return `PAGE: ${page.url}\nTITLE: ${page.title}\nCONTENT:\n${page.content}\n`;
  }).join('\n---\n');

  const prompt = `
  You are analyzing the content from a crawled website. I will provide you with the content from multiple pages of the site.
  Extract the following information in JSON format:
  
  1. Website title (a concise title for the overall website)
  2. Main content (a comprehensive summary of what the website is about)
  3. Company information:
     - Company name
     - Mission/vision statements
     - About information
     - Team members and their roles (if available)
  4. Any upcoming events with dates, titles, and descriptions
  5. Contact information (email, phone, address, social links)
  
  Website content:
  ${websiteData}
  
  Return only valid JSON without any additional explanation. Use this structure:
  {
    "title": "Website Title",
    "contentType": "webpage",
    "mainContent": "Comprehensive summary...",
    "companyInfo": {
      "name": "Company Name",
      "mission": "Mission statement...",
      "vision": "Vision statement...",
      "about": "About the company...",
      "team": [{"name": "Person Name", "role": "Job Title"}]
    },
    "upcomingEvents": [
      {"title": "Event Title", "date": "Event Date", "description": "Event Description"}
    ],
    "contactInfo": {
      "email": "contact@example.com",
      "phone": "Phone number",
      "address": "Physical address",
      "socialLinks": [{"platform": "LinkedIn", "url": "https://..."}]
    }
  }
  
  If some information is not available, omit those fields.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const extractedData = JSON.parse(response.choices[0].message.content);
    
    // Ensure contentType is always set
    extractedData.contentType = 'webpage';
    
    // Format the data as required by our system
    return {
      ...extractedData,
      originalPages: crawledPages,
    };
  } catch (error) {
    console.error('Error extracting structured information:', error);
    
    // Fallback if AI analysis fails
    return {
      title: crawledPages[0].title,
      contentType: 'webpage',
      mainContent: crawledPages.map(p => p.content).join('\n\n').substring(0, 10000),
      originalPages: crawledPages,
    };
  }
}

/**
 * Main function to crawl a website and extract structured information
 * @param url The URL to crawl and analyze
 */
export async function analyzeWebsite(url: string): Promise<{
  title: string;
  contentType: string;
  content: string;
}> {
  try {
    // Validate the URL
    new URL(url);
    
    // Crawl the website
    const crawledPages = await crawlWebsite(url);
    if (crawledPages.length === 0) {
      throw new Error('Failed to crawl any pages');
    }
    
    // Extract structured information
    const extractionResult = await extractStructuredInformation(crawledPages);
    
    // Format content for knowledge base
    let formattedContent = `# ${extractionResult.title}\n\n`;
    formattedContent += extractionResult.mainContent + '\n\n';
    
    // Add company info if available
    if (extractionResult.companyInfo) {
      formattedContent += `## About ${extractionResult.companyInfo.name || 'the Company'}\n`;
      if (extractionResult.companyInfo.about) {
        formattedContent += extractionResult.companyInfo.about + '\n\n';
      }
      if (extractionResult.companyInfo.mission) {
        formattedContent += `### Mission\n${extractionResult.companyInfo.mission}\n\n`;
      }
      if (extractionResult.companyInfo.vision) {
        formattedContent += `### Vision\n${extractionResult.companyInfo.vision}\n\n`;
      }
      if (extractionResult.companyInfo.team && extractionResult.companyInfo.team.length > 0) {
        formattedContent += '### Team Members\n';
        for (const member of extractionResult.companyInfo.team) {
          formattedContent += `- ${member.name}: ${member.role}\n`;
        }
        formattedContent += '\n';
      }
    }
    
    // Add events if available
    if (extractionResult.upcomingEvents && extractionResult.upcomingEvents.length > 0) {
      formattedContent += '## Upcoming Events\n';
      for (const event of extractionResult.upcomingEvents) {
        formattedContent += `### ${event.title} (${event.date})\n${event.description}\n\n`;
      }
    }
    
    // Add contact info if available
    if (extractionResult.contactInfo) {
      formattedContent += '## Contact Information\n';
      if (extractionResult.contactInfo.email) {
        formattedContent += `- Email: ${extractionResult.contactInfo.email}\n`;
      }
      if (extractionResult.contactInfo.phone) {
        formattedContent += `- Phone: ${extractionResult.contactInfo.phone}\n`;
      }
      if (extractionResult.contactInfo.address) {
        formattedContent += `- Address: ${extractionResult.contactInfo.address}\n`;
      }
      if (extractionResult.contactInfo.socialLinks && extractionResult.contactInfo.socialLinks.length > 0) {
        formattedContent += '- Social Media:\n';
        for (const social of extractionResult.contactInfo.socialLinks) {
          formattedContent += `  - ${social.platform}: ${social.url}\n`;
        }
      }
    }
    
    // Add crawled pages info
    formattedContent += `\n## Source\nOriginal URL: ${url}\nPages crawled: ${crawledPages.length}\n`;
    formattedContent += `Last crawled: ${new Date().toISOString()}\n`;
    
    return {
      title: extractionResult.title,
      contentType: 'webpage',
      content: formattedContent,
    };
  } catch (error) {
    console.error('Website analysis error:', error);
    throw new Error(`Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Detect if content is likely a document that should be processed differently
 */
export function detectContentType(content: string): 'url' | 'document' | 'event' {
  // Check if it's a URL
  if (isValidUrl(content.trim())) {
    return 'url';
  }
  
  // Check for event indicators
  const eventKeywords = [
    'workshop', 'seminar', 'conference', 'event', 'webinar',
    'schedule', 'registration', 'session', 'ticket'
  ];
  const datePatterns = [
    /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/,  // MM/DD/YYYY
    /\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/,    // YYYY/MM/DD
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(st|nd|rd|th)?, \d{4}\b/i,
    /\b\d{1,2}(st|nd|rd|th)? (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/i
  ];
  
  const hasEventKeywords = eventKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content)
  );
  const hasDatePattern = datePatterns.some(pattern => pattern.test(content));
  
  if (hasEventKeywords && hasDatePattern) {
    return 'event';
  }
  
  // Default to document
  return 'document';
}