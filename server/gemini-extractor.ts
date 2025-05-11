import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { storage } from './storage';
import { getGeminiAI } from './gemini-service';
import * as fs from 'fs';
import * as path from 'path';

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
 * Content categories for extraction and classification
 */
export enum ContentCategory {
  FACT = 'fact',
  EVENT = 'event',
  BLOG = 'blog',
  DOCUMENT = 'document',
  PROJECT = 'project',
  WORKSHOP = 'workshop',
  TUTORIAL = 'tutorial',
  RESEARCH = 'research',
  CASE_STUDY = 'case_study',
}

/**
 * Common interface for all extracted content types
 */
interface ExtractedContent {
  id?: string;
  saved?: boolean;
  source: string;
  sourceType: string;
}

/**
 * Extracted fact content
 */
export interface ExtractedFact extends ExtractedContent {
  content: string;
}

/**
 * Extracted event content
 */
export interface ExtractedEvent extends ExtractedContent {
  title: string;
  date: string;
  description: string;
  location?: string;
  registrationLink?: string;
}

/**
 * Extracted blog content
 */
export interface ExtractedBlog extends ExtractedContent {
  title: string;
  summary: string;
  content?: string;
  author?: string;
  publishDate?: string;
}

/**
 * Extracted document content
 */
export interface ExtractedDocument extends ExtractedContent {
  title: string;
  summary: string;
  content?: string;
  fileType?: string;
  fileSize?: string;
  downloadLink?: string;
}

/**
 * Extracted project content
 */
export interface ExtractedProject extends ExtractedContent {
  title: string;
  summary: string;
  location?: string;
  completionDate?: string;
  architects?: string[];
  images?: string[];
}

/**
 * Combined extraction result
 */
export interface ExtractionResult {
  facts: ExtractedFact[];
  events: ExtractedEvent[];
  blogContent: ExtractedBlog[];
  documents: ExtractedDocument[];
  projects: ExtractedProject[];
  loading: boolean;
}

/**
 * Process content from a URL using Google Gemini
 * @param url The URL to crawl and process
 * @returns Structured extraction results
 */
export async function processUrlWithGemini(url: string): Promise<ExtractionResult> {
  try {
    // Validate URL format
    new URL(url);
    
    // Crawl the website to get content
    const crawledPages = await crawlWebsite(url);
    if (crawledPages.length === 0) {
      console.error('Failed to crawl any pages from', url);
      return createEmptyExtractionResult();
    }
    
    // Get website content from crawled pages
    const websiteContent = crawledPages.map(page => {
      return `PAGE: ${page.url}\nTITLE: ${page.title}\nCONTENT:\n${page.content}\n`;
    }).join('\n---\n');
    
    // Get the Gemini API client
    const gemini = getGeminiAI();
    if (!gemini) {
      console.error('Gemini AI is not configured');
      return createEmptyExtractionResult();
    }
    
    // Use the most advanced model available
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Extract different content types
    const [facts, events, blogContent, documents, projects] = await Promise.all([
      extractFacts(model, websiteContent, url),
      extractEvents(model, websiteContent, url),
      extractBlogContent(model, websiteContent, url),
      extractDocuments(model, websiteContent, url),
      extractProjects(model, websiteContent, url)
    ]);
    
    return {
      facts,
      events,
      blogContent,
      documents,
      projects,
      loading: false
    };
  } catch (error) {
    console.error('Error processing URL with Gemini:', error);
    return createEmptyExtractionResult();
  }
}

/**
 * Process content from a file using Google Gemini
 * @param filePath Path to the file to process
 * @returns Structured extraction results
 */
export async function processFileWithGemini(filePath: string): Promise<ExtractionResult> {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Get the Gemini API client
    const gemini = getGeminiAI();
    if (!gemini) {
      console.error('Gemini AI is not configured');
      return createEmptyExtractionResult();
    }
    
    // Use the most advanced model available
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Extract different content types
    const [facts, events, blogContent, documents, projects] = await Promise.all([
      extractFacts(model, fileContent, fileName),
      extractEvents(model, fileContent, fileName),
      extractBlogContent(model, fileContent, fileName),
      extractDocuments(model, fileContent, fileName),
      extractProjects(model, fileContent, fileName)
    ]);
    
    return {
      facts,
      events,
      blogContent,
      documents,
      projects,
      loading: false
    };
  } catch (error) {
    console.error('Error processing file with Gemini:', error);
    return createEmptyExtractionResult();
  }
}

/**
 * Extract facts from content
 */
async function extractFacts(model: any, content: string, source: string): Promise<ExtractedFact[]> {
  try {
    const prompt = `
    You are an expert in bamboo architecture and design. Extract 3-5 specific, informative facts about bamboo from the following content.
    
    FORMATTING REQUIREMENTS:
    1. Return a JSON array of fact objects
    2. Each fact object should have a 'content' property with the fact text
    3. Facts should be specific, informative, and directly derived from the content
    4. Focus on technical aspects, measurements, or applications when possible
    
    Example response format:
    [
      {
        "content": "Bamboo has a higher tensile strength than steel, making it an excellent structural material."
      },
      {
        "content": "Some bamboo species can grow up to 91 cm (36 in) in a single day."
      }
    ]
    
    SOURCE: ${source}
    
    CONTENT:
    ${content.substring(0, 15000)}
    `;
    
    const result = await model.generateContent(prompt);
    const textResult = result.response.text();
    
    let facts: ExtractedFact[] = [];
    try {
      const parsedFacts = JSON.parse(textResult);
      if (Array.isArray(parsedFacts)) {
        facts = parsedFacts.map((fact, index) => ({
          id: `fact-${index}-${Date.now()}`,
          content: fact.content,
          source,
          sourceType: 'content',
          saved: false
        }));
      }
    } catch (error) {
      console.error('Error parsing facts JSON:', error);
    }
    
    return facts;
  } catch (error) {
    console.error('Error extracting facts:', error);
    return [];
  }
}

/**
 * Extract events from content
 */
async function extractEvents(model: any, content: string, source: string): Promise<ExtractedEvent[]> {
  try {
    const prompt = `
    You are an expert in bamboo architecture and design events. Extract any events related to bamboo, architecture, or sustainability from the content.
    
    FORMATTING REQUIREMENTS:
    1. Return a JSON array of event objects
    2. Each event object should have:
       - 'title': Event name
       - 'date': Date of the event
       - 'description': Brief description
       - 'location': Where the event is happening (if available)
       - 'registrationLink': Link to register (if available)
    3. Only include events that are clearly mentioned in the content
    4. If no events are found, return an empty array []
    
    Example response format:
    [
      {
        "title": "Bamboo Architecture Workshop",
        "date": "June 15-20, 2025",
        "description": "Hands-on workshop for learning bamboo construction techniques",
        "location": "Hyderabad, India",
        "registrationLink": "https://example.com/register"
      }
    ]
    
    SOURCE: ${source}
    
    CONTENT:
    ${content.substring(0, 15000)}
    `;
    
    const result = await model.generateContent(prompt);
    const textResult = result.response.text();
    
    let events: ExtractedEvent[] = [];
    try {
      const parsedEvents = JSON.parse(textResult);
      if (Array.isArray(parsedEvents)) {
        events = parsedEvents.map((event, index) => ({
          id: `event-${index}-${Date.now()}`,
          title: event.title,
          date: event.date,
          description: event.description,
          location: event.location,
          registrationLink: event.registrationLink,
          source,
          sourceType: 'content',
          saved: false
        }));
      }
    } catch (error) {
      console.error('Error parsing events JSON:', error);
    }
    
    return events;
  } catch (error) {
    console.error('Error extracting events:', error);
    return [];
  }
}

/**
 * Extract blog content
 */
async function extractBlogContent(model: any, content: string, source: string): Promise<ExtractedBlog[]> {
  try {
    const prompt = `
    You are an expert in bamboo architecture and design. Extract any blog posts, articles, or informational content about bamboo from the provided content.
    
    FORMATTING REQUIREMENTS:
    1. Return a JSON array of blog objects
    2. Each blog object should have:
       - 'title': Title of the article or content section
       - 'summary': Brief summary of the content
       - 'author': Author name (if available)
       - 'publishDate': Publication date (if available)
    3. Focus on identifying distinct content sections that could stand as separate blog posts
    4. If no blog-like content is found, return an empty array []
    
    Example response format:
    [
      {
        "title": "Innovations in Bamboo Joinery Techniques",
        "summary": "This article explores the latest developments in bamboo joinery, focusing on techniques that don't require metal fasteners.",
        "author": "Architect Jane Smith",
        "publishDate": "March 2025"
      }
    ]
    
    SOURCE: ${source}
    
    CONTENT:
    ${content.substring(0, 15000)}
    `;
    
    const result = await model.generateContent(prompt);
    const textResult = result.response.text();
    
    let blogPosts: ExtractedBlog[] = [];
    try {
      const parsedBlogs = JSON.parse(textResult);
      if (Array.isArray(parsedBlogs)) {
        blogPosts = parsedBlogs.map((blog, index) => ({
          id: `blog-${index}-${Date.now()}`,
          title: blog.title,
          summary: blog.summary,
          author: blog.author,
          publishDate: blog.publishDate,
          source,
          sourceType: 'content',
          saved: false
        }));
      }
    } catch (error) {
      console.error('Error parsing blog JSON:', error);
    }
    
    return blogPosts;
  } catch (error) {
    console.error('Error extracting blog content:', error);
    return [];
  }
}

/**
 * Extract documents from content
 */
async function extractDocuments(model: any, content: string, source: string): Promise<ExtractedDocument[]> {
  try {
    const prompt = `
    You are an expert in bamboo architecture and design resources. Identify any documents, PDFs, research papers, guides, or downloadable resources mentioned in the content.
    
    FORMATTING REQUIREMENTS:
    1. Return a JSON array of document objects
    2. Each document object should have:
       - 'title': Document title
       - 'summary': Brief description of the document
       - 'fileType': Type of file (PDF, DOC, etc.) if mentioned
       - 'fileSize': Size of the file if mentioned
       - 'downloadLink': Link to download (if available)
    3. Only include documents that are clearly mentioned in the content
    4. If no documents are found, return an empty array []
    
    Example response format:
    [
      {
        "title": "Bamboo Construction Manual",
        "summary": "Comprehensive guide to building with bamboo, including structural calculations",
        "fileType": "PDF",
        "fileSize": "4.2 MB",
        "downloadLink": "https://example.com/download/manual.pdf"
      }
    ]
    
    SOURCE: ${source}
    
    CONTENT:
    ${content.substring(0, 15000)}
    `;
    
    const result = await model.generateContent(prompt);
    const textResult = result.response.text();
    
    let documents: ExtractedDocument[] = [];
    try {
      const parsedDocs = JSON.parse(textResult);
      if (Array.isArray(parsedDocs)) {
        documents = parsedDocs.map((doc, index) => ({
          id: `doc-${index}-${Date.now()}`,
          title: doc.title,
          summary: doc.summary,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          downloadLink: doc.downloadLink,
          source,
          sourceType: 'content',
          saved: false
        }));
      }
    } catch (error) {
      console.error('Error parsing documents JSON:', error);
    }
    
    return documents;
  } catch (error) {
    console.error('Error extracting documents:', error);
    return [];
  }
}

/**
 * Extract projects from content
 */
async function extractProjects(model: any, content: string, source: string): Promise<ExtractedProject[]> {
  try {
    const prompt = `
    You are an expert in bamboo architecture and design projects. Identify any completed or ongoing bamboo construction projects, case studies, or architectural works mentioned in the content.
    
    FORMATTING REQUIREMENTS:
    1. Return a JSON array of project objects
    2. Each project object should have:
       - 'title': Project name
       - 'summary': Brief description of the project
       - 'location': Where the project was built (if available)
       - 'completionDate': When the project was completed (if available)
       - 'architects': Array of architect names involved (if available)
       - 'images': Array of image URLs if present in the content
    3. Only include projects that are clearly mentioned in the content
    4. If no projects are found, return an empty array []
    
    Example response format:
    [
      {
        "title": "Bamboo Canopy Restaurant",
        "summary": "A 200-seat restaurant constructed entirely of bamboo with innovative roof design",
        "location": "Bali, Indonesia",
        "completionDate": "2024",
        "architects": ["John Smith", "Maria Garcia"],
        "images": []
      }
    ]
    
    SOURCE: ${source}
    
    CONTENT:
    ${content.substring(0, 15000)}
    `;
    
    const result = await model.generateContent(prompt);
    const textResult = result.response.text();
    
    let projects: ExtractedProject[] = [];
    try {
      const parsedProjects = JSON.parse(textResult);
      if (Array.isArray(parsedProjects)) {
        projects = parsedProjects.map((project, index) => ({
          id: `project-${index}-${Date.now()}`,
          title: project.title,
          summary: project.summary,
          location: project.location,
          completionDate: project.completionDate,
          architects: project.architects,
          images: project.images,
          source,
          sourceType: 'content',
          saved: false
        }));
      }
    } catch (error) {
      console.error('Error parsing projects JSON:', error);
    }
    
    return projects;
  } catch (error) {
    console.error('Error extracting projects:', error);
    return [];
  }
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
 * Create an empty extraction result
 */
function createEmptyExtractionResult(): ExtractionResult {
  return {
    facts: [],
    events: [],
    blogContent: [],
    documents: [],
    projects: [],
    loading: false
  };
}