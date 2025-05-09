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
  // Author information for articles
  author?: string;
  publishedDate?: string;
  // Video information
  videoDescription?: string;
  // Company information
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

    const extractedData = JSON.parse(response.choices[0].message.content || '{}');
    
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
    
    // Detect content type
    const detectedType = detectContentTypeFromUrl(url);
    
    // Format content for knowledge base based on content type
    let formattedContent = `# ${extractionResult.title}\n\n`;
    
    // For articles, format in a special way
    if (detectedType === 'article') {
      // Add article metadata if available
      formattedContent += `**Article Type**: ${detectedType}\n`;
      formattedContent += `**Source**: ${url}\n`;
      
      // Check if we have an author
      if (extractionResult.author) {
        formattedContent += `**Author**: ${extractionResult.author}\n`;
      }
      
      // Check if we have a published date
      if (extractionResult.publishedDate) {
        formattedContent += `**Published**: ${extractionResult.publishedDate}\n`;
      }
      
      formattedContent += `\n## Article Content\n\n`;
      formattedContent += extractionResult.mainContent + '\n\n';
      
      formattedContent += `\n## Article Source\nOriginal URL: ${url}\n`;
      formattedContent += `Last crawled: ${new Date().toISOString()}\n`;
      
      return {
        title: extractionResult.title,
        contentType: 'article',
        content: formattedContent,
      };
    }
    
    // For social media content
    if (detectedType === 'social-media') {
      formattedContent += `**Content Type**: Social Media Post\n`;
      formattedContent += `**Platform**: ${getPlatformFromUrl(url)}\n`;
      formattedContent += `**Source**: ${url}\n\n`;
      formattedContent += extractionResult.mainContent + '\n\n';
      
      return {
        title: extractionResult.title,
        contentType: 'social-media',
        content: formattedContent,
      };
    }
    
    // For video content
    if (detectedType === 'video') {
      formattedContent += `**Content Type**: Video\n`;
      formattedContent += `**Platform**: ${getPlatformFromUrl(url)}\n`;
      formattedContent += `**Source**: ${url}\n\n`;
      
      if (extractionResult.videoDescription) {
        formattedContent += `## Video Description\n${extractionResult.videoDescription}\n\n`;
      }
      
      formattedContent += extractionResult.mainContent + '\n\n';
      
      return {
        title: extractionResult.title,
        contentType: 'video',
        content: formattedContent,
      };
    }
    
    // Default webpage format
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
      contentType: detectedType,
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
 * Determine the content type of a URL
 * @param url The URL to analyze
 * @returns The detected content type
 */
export /**
 * Detects content type from URL, using standardized types that match the frontend display categories
 * 
 * @param url URL string to analyze
 * @returns Standardized content type: 'article', 'social', 'video', 'webpage', 'event', 'document'
 */
function detectContentTypeFromUrl(url: string): string {
  if (!isValidUrl(url)) {
    return 'unknown';
  }
  
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.toLowerCase();
  const path = parsedUrl.pathname.toLowerCase();
  
  // Check for BambooMade's own website first
  if (hostname.includes('bamboomade.in')) {
    // For events on BambooMade's site
    if (
      path.includes('/events/') ||
      path.includes('/workshops/') ||
      path.includes('/webinar/')
    ) {
      return 'event';
    }
    // Always categorize BambooMade's own content as webpage
    return 'webpage';
  }
  
  // SOCIAL MEDIA - all social media platforms get classified as 'social'
  if (
    hostname.includes('instagram.com') ||
    hostname.includes('facebook.com') ||
    hostname.includes('twitter.com') ||
    hostname.includes('x.com') ||
    hostname.includes('linkedin.com') ||
    hostname.includes('threads.net') ||
    hostname.includes('pinterest.com')
  ) {
    return 'social';
  }
  
  // VIDEO - all video platforms get classified as 'video'
  if (
    hostname.includes('youtube.com') ||
    hostname.includes('youtu.be') ||
    hostname.includes('vimeo.com') ||
    hostname.includes('dailymotion.com') ||
    hostname.includes('tiktok.com') ||
    hostname.includes('instagram.com/reels') ||
    hostname.includes('fb.watch') ||
    path.includes('/watch/') ||
    path.includes('/video/')
  ) {
    return 'video';
  }
  
  // ARTICLES - all external articles get classified as 'article'
  // Article platforms
  if (
    hostname.includes('medium.com') ||
    hostname.includes('substack.com') ||
    hostname.includes('wordpress.com') ||
    hostname.includes('blogger.com') ||
    hostname.includes('blogspot.com') ||
    hostname.includes('tumblr.com') ||
    hostname.includes('wixsite.com') ||
    hostname.includes('wordpress.org') ||
    hostname.includes('news')
  ) {
    return 'article';
  }
  
  // Article path indicators
  if (
    path.includes('/blog/') ||
    path.includes('/article/') ||
    path.includes('/post/') ||
    path.includes('/news/') ||
    path.includes('/stories/') ||
    path.includes('/publications/')
  ) {
    return 'article';
  }
  
  // Architecture and design specific websites - treat as articles
  if (
    hostname.includes('archdaily.com') ||
    hostname.includes('dezeen.com') ||
    hostname.includes('architecturaldigest.com') ||
    hostname.includes('archidust.com') ||
    hostname.includes('architecture.com')
  ) {
    return 'article';
  }
  
  // Document links
  if (
    path.endsWith('.pdf') ||
    path.endsWith('.doc') ||
    path.endsWith('.docx') ||
    path.endsWith('.ppt') ||
    path.endsWith('.pptx')
  ) {
    return 'document';
  }
  
  // EVENT - websites related to events
  if (
    hostname.includes('eventbrite.com') ||
    hostname.includes('meetup.com') ||
    hostname.includes('evite.com') ||
    path.includes('/events/') ||
    path.includes('/workshops/') ||
    path.includes('/conference/') ||
    path.includes('/webinar/')
  ) {
    return 'event';
  }
  
  // Default external websites as articles for better organization
  // This ensures all external websites are treated as articles by default
  return 'article';
}

/**
 * Get the platform name from a URL
 * @param url The URL to analyze
 * @returns The platform name
 */
export function getPlatformFromUrl(url: string): string {
  if (!isValidUrl(url)) {
    return 'Unknown';
  }
  
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.toLowerCase();
  
  if (hostname.includes('instagram.com')) return 'Instagram';
  if (hostname.includes('facebook.com')) return 'Facebook';
  if (hostname.includes('twitter.com')) return 'Twitter';
  if (hostname.includes('x.com')) return 'X (Twitter)';
  if (hostname.includes('linkedin.com')) return 'LinkedIn';
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube';
  if (hostname.includes('vimeo.com')) return 'Vimeo';
  if (hostname.includes('medium.com')) return 'Medium';
  if (hostname.includes('wordpress.com')) return 'WordPress';
  if (hostname.includes('blogger.com')) return 'Blogger';
  
  // Return the domain name if no specific platform is recognized
  return hostname.replace('www.', '');
}

/**
 * Extract social media handle from a URL
 * @param url The social media URL
 * @param platform Platform name (Instagram, Twitter, etc.)
 * @returns The extracted handle or null if cannot be determined
 */
export function getHandleFromUrl(url: string, platform: string): string | null {
  if (!isValidUrl(url)) {
    return null;
  }
  
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    
    // Instagram - format: instagram.com/username or instagram.com/p/postId
    if (platform === 'Instagram') {
      // For post URLs, we need to find the account differently
      if (pathname.includes('/p/')) {
        return null; // We'd need to crawl the page to get the author
      }
      
      // Direct profile URLs: instagram.com/username
      const segments = pathname.split('/').filter(s => s);
      if (segments.length > 0) {
        return segments[0]; // First path segment is usually the handle
      }
    }
    
    // Twitter/X - format: twitter.com/username or twitter.com/username/status/id
    if (platform === 'Twitter' || platform === 'X (Twitter)') {
      const segments = pathname.split('/').filter(s => s);
      if (segments.length > 0) {
        return segments[0]; // First path segment is the handle
      }
    }
    
    // Facebook - harder to get consistent handles
    if (platform === 'Facebook') {
      // Facebook URLs come in many formats
      const segments = pathname.split('/').filter(s => s);
      
      // facebook.com/username
      if (segments.length === 1 && !['posts', 'photos', 'videos'].includes(segments[0])) {
        return segments[0];
      }
      
      // For pages, often the first segment is the handle
      if (segments.length > 1 && ['pages'].includes(segments[0])) {
        return segments[1];
      }
    }
    
    // LinkedIn - format: linkedin.com/in/username
    if (platform === 'LinkedIn') {
      const segments = pathname.split('/').filter(s => s);
      if (segments.length > 1 && segments[0] === 'in') {
        return segments[1];
      }
    }
    
    // YouTube - format: youtube.com/c/channelname or youtube.com/channel/id
    if (platform === 'YouTube') {
      const segments = pathname.split('/').filter(s => s);
      if (segments.length > 1 && (segments[0] === 'c' || segments[0] === 'channel' || segments[0] === 'user')) {
        return segments[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting handle from URL:', error);
    return null;
  }
}

/**
 * Detect if content is likely a document that should be processed differently
 * Returns a standardized content type that matches the frontend display categories
 */
export function detectContentType(content: string): 'url' | 'document' | 'event' | 'article' | 'social-media' | 'video' | 'webpage' {
  // Check if it's a URL
  if (isValidUrl(content.trim())) {
    const url = content.trim();
    // Use our enhanced detection for URLs
    const specificType = detectContentTypeFromUrl(url);
    
    // Map to standardized content types that match frontend display categories
    switch (specificType) {
      case 'article':
      case 'medium_article':
      case 'substack_article':
      case 'blog_post':
        return 'article';
        
      case 'social':
        return 'social-media';
        
      case 'video':
      case 'youtube_video':
      case 'vimeo_video':
        return 'video';
        
      case 'event':
        return 'event';
        
      case 'document':
      case 'pdf_document':
      case 'word_document':
        return 'document';
        
      case 'webpage':
        // Only bamboomade.in content should be classified as webpage
        if (url.includes('bamboomade.in')) {
          return 'webpage';
        }
        // Default external websites as articles
        return 'article';
        
      default:
        // Unknown type defaults to article for better organization
        return 'article';
    }
  }
  
  // Check for article indicators with enhanced keywords
  const articleKeywords = [
    'published', 'author', 'article', 'opinion', 'editorial', 
    'column', 'blog post', 'feature', 'story', 'interview',
    'journal', 'publication', 'review', 'analysis', 'report',
    'case study', 'whitepaper', 'research'
  ];
  
  const hasArticleKeywords = articleKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content)
  );
  
  // Detect specific article platforms in text
  const hasMediumReference = content.toLowerCase().includes('medium.com') || 
                            content.toLowerCase().includes('published on medium');
  const hasSubstackReference = content.toLowerCase().includes('substack.com') || 
                              content.toLowerCase().includes('published on substack');
  const hasBlogReference = content.toLowerCase().includes('blog post') || 
                          content.toLowerCase().includes('on my blog') ||
                          content.toLowerCase().includes('on our blog');
  
  if (hasMediumReference || hasSubstackReference || hasBlogReference) {
    return 'article';
  }
  
  if (hasArticleKeywords && content.length > 500) {
    return 'article';
  }
  
  // Enhanced event indicators
  const eventKeywords = [
    'workshop', 'seminar', 'conference', 'event', 'webinar',
    'schedule', 'registration', 'session', 'ticket', 'symposium', 
    'exhibition', 'expo', 'fair', 'meetup', 'gathering',
    'training', 'course', 'class', 'lecture', 'presentation'
  ];
  
  // More comprehensive date patterns
  const datePatterns = [
    /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/,  // MM/DD/YYYY
    /\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/,    // YYYY/MM/DD
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(st|nd|rd|th)?, \d{4}\b/i,
    /\b\d{1,2}(st|nd|rd|th)? (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/i,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(st|nd|rd|th)?, \d{4}\b/i,
    /\b\d{1,2}(st|nd|rd|th)? (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\b/i
  ];
  
  // Time patterns
  const timePatterns = [
    /\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)\b/,
    /\b\d{1,2}\s*(am|pm|AM|PM)\b/,
    /\b\d{1,2}:\d{2}\b/  // 24-hour format
  ];
  
  const hasEventKeywords = eventKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content)
  );
  const hasDatePattern = datePatterns.some(pattern => pattern.test(content));
  const hasTimePattern = timePatterns.some(pattern => pattern.test(content));
  
  if (hasEventKeywords && (hasDatePattern || hasTimePattern)) {
    return 'event';
  }
  
  // Check for social media content indicators
  const socialMediaKeywords = [
    'instagram', 'facebook', 'twitter', 'x.com', 'linkedin',
    'post', 'tweet', 'status', 'social media', 'reels', 
    'stories', 'profile', 'followers', 'follow us', 'like'
  ];
  
  const hasSocialMediaKeywords = socialMediaKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content)
  );
  
  if (hasSocialMediaKeywords) {
    return 'social';
  }
  
  // Check for video content indicators
  const videoKeywords = [
    'youtube', 'vimeo', 'video', 'watch', 'stream', 'streaming',
    'channel', 'playlist', 'subscribe', 'views', 'played'
  ];
  
  const hasVideoKeywords = videoKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content)
  );
  
  if (hasVideoKeywords) {
    return 'video';
  }
  
  // Default to document
  return 'document';
}