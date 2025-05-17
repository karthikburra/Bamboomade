#!/usr/bin/env python3
"""
BambooMade Scrapy Extractor
Advanced web scraping and data extraction using Scrapy for the BambooMade Knowledge Base
"""
import os
import sys
import json
import tempfile
from urllib.parse import urlparse, urljoin
import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
import re
from datetime import datetime

class BambooSpider(scrapy.Spider):
    name = "bamboo_spider"
    
    def __init__(self, start_url=None, max_depth=2, output_file=None, *args, **kwargs):
        super(BambooSpider, self).__init__(*args, **kwargs)
        self.output_file = output_file
        self.max_depth = int(max_depth)
        self.visited_urls = set()
        
        # Results storage
        self.results = {
            "pages": [],
            "events": [],
            "contacts": [],
            "images": [],
            "books": [],
            "social_media": []
        }
        
        # Set allowed domains and start URLs
        if start_url:
            self.start_urls = [start_url]
            parsed_url = urlparse(start_url)
            self.allowed_domains = [parsed_url.netloc]
    
    def parse(self, response):
        """Main parsing function for each visited page"""
        # Skip if we've already visited this URL or reached depth limit
        if (response.url in self.visited_urls or 
            response.meta.get('depth', 0) > self.max_depth):
            return
        
        self.visited_urls.add(response.url)
        current_depth = response.meta.get('depth', 0)
        
        # Extract page data
        title = response.css('title::text').get() or 'Untitled Page'
        
        # Extract content with proper structure
        main_content = response.xpath('//main | //article | //div[@id="content" or contains(@class, "content")]')
        
        if main_content:
            # Use the first matching main content element
            content = self.extract_text_from_element(main_content[0])
        else:
            # Fallback to paragraphs and headings in the body
            content = self.extract_text_from_selector(response.css('body p, body h1, body h2, body h3, body h4, body h5, body h6'))
        
        # Extract structured data
        event_data = self.extract_event_data(response)
        contact_data = self.extract_contact_data(response)
        images = self.extract_images(response)
        book_data = self.extract_book_data(response)
        social_data = self.extract_social_media_data(response)
        
        # Store page data
        page_data = {
            "url": response.url,
            "title": title,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        self.results["pages"].append(page_data)
        
        # Store other extracted data if found
        if event_data:
            self.results["events"].append(event_data)
        if contact_data:
            self.results["contacts"].append(contact_data)
        if images:
            self.results["images"].extend(images)
        if book_data:
            self.results["books"].append(book_data)
        if social_data:
            self.results["social_media"].append(social_data)
        
        # Follow links within the same domain if not at max depth
        if current_depth < self.max_depth:
            for href in response.css('a::attr(href)').extract():
                if not href or href.startswith('#'):
                    continue
                
                # Handle relative URLs
                if not href.startswith(('http://', 'https://')):
                    href = urljoin(response.url, href)
                
                # Check if URL is within allowed domains
                if not self.is_allowed_domain(href):
                    continue
                
                # Skip certain types of URLs
                if self.should_skip_url(href):
                    continue
                
                # Follow link with increased depth
                yield response.follow(
                    href, 
                    callback=self.parse, 
                    meta={'depth': current_depth + 1}
                )
    
    def extract_text_from_element(self, element):
        """Extract text from a Scrapy selector with proper spacing"""
        texts = []
        for node in element.xpath('.//*[self::p or self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6 or self::li]'):
            text = node.xpath('string()').get().strip()
            if text:
                texts.append(text)
        return '\n\n'.join(texts)
    
    def extract_text_from_selector(self, selector):
        """Extract text from multiple elements with proper spacing"""
        texts = []
        for element in selector:
            text = element.xpath('string()').get().strip()
            if text:
                texts.append(text)
        return '\n\n'.join(texts)
    
    def extract_images(self, response):
        """Extract image information from the page"""
        images = []
        for img in response.css('img'):
            src = img.css('::attr(src)').get()
            if not src:
                continue
                
            # Convert relative URLs to absolute
            if not src.startswith(('http://', 'https://')):
                src = urljoin(response.url, src)
            
            alt_text = img.css('::attr(alt)').get() or ''
            title = img.css('::attr(title)').get() or ''
            
            images.append({
                'url': src,
                'alt_text': alt_text,
                'title': title,
                'page_url': response.url
            })
        
        return images
    
    def extract_event_data(self, response):
        """Extract event information from the page"""
        # Check if this page might be an event
        title = response.css('title::text').get() or ''
        body_text = ' '.join(response.css('body::text').extract()).lower()
        
        event_indicators = ['event', 'workshop', 'seminar', 'conference', 'webinar', 'training']
        is_event_page = any(indicator in title.lower() for indicator in event_indicators) or \
                        any(indicator in body_text for indicator in event_indicators)
        
        if not is_event_page:
            return None
        
        # It's probably an event, extract event details
        event = {
            'title': title,
            'url': response.url
        }
        
        # Extract date information
        date_patterns = [
            r'\b(\d{1,2}[\s/-]\d{1,2}[\s/-]\d{2,4})\b',  # 10/25/2023, 10-25-2023
            r'\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b',  # 25 December 2023
            r'\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})\b'  # December 25, 2023
        ]
        
        for pattern in date_patterns:
            date_match = re.search(pattern, response.text, re.IGNORECASE)
            if date_match:
                event['date'] = date_match.group(1)
                break
        
        # Extract location information
        location_selectors = [
            response.css('*:contains("Location:"), *:contains("Venue:"), *:contains("Where:"), *:contains("Address:")')
        ]
        
        for selector in location_selectors:
            if selector:
                location_text = selector.xpath('string()').get()
                if location_text:
                    # Try to extract just the location part
                    location_match = re.search(r'(?:location|venue|where|address)[:\s]+(.*?)(?:\n|$)', 
                                              location_text, 
                                              re.IGNORECASE)
                    if location_match:
                        event['location'] = location_match.group(1).strip()
                        break
        
        # Extract registration links
        reg_links = response.css('a[href*=regist], a[href*=signup], a[href*=book], a[href*=ticket]')
        if reg_links:
            reg_url = reg_links.css('::attr(href)').get()
            # Convert relative URLs to absolute
            if reg_url and not reg_url.startswith(('http://', 'https://')):
                reg_url = urljoin(response.url, reg_url)
            
            if reg_url:
                event['registration_link'] = reg_url
        
        # Extract price information with Indian rupee symbol ₹
        price_match = re.search(r'(?:Price|Cost|Fee)[:\s]+((?:₹|Rs\.?|INR)?\s*\d+(?:,\d+)*(?:\.\d+)?)', 
                               response.text, 
                               re.IGNORECASE)
        if price_match:
            event['price'] = price_match.group(1).strip()
        
        return event
    
    def extract_contact_data(self, response):
        """Extract contact information from the page"""
        # Check if this is a contact page
        url_path = urlparse(response.url).path.lower()
        is_contact_page = 'contact' in url_path or 'about' in url_path
        
        if not is_contact_page and 'contact' not in response.css('title::text').get().lower():
            # Look for contact sections
            contact_sections = response.css('*:contains("Contact Us"), *:contains("Get in Touch"), *:contains("Reach Us")')
            if not contact_sections:
                return None
        
        # Extract contact information
        contact = {
            'url': response.url
        }
        
        # Extract email addresses
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, response.text)
        if emails:
            contact['email'] = list(set(emails))
        
        # Extract phone numbers (focus on Indian formats)
        phone_patterns = [
            r'\+91[\s-]?\d{10}',
            r'0\d{10}',
            r'\d{5}[\s-]?\d{5}',
            r'\(\d{3,4}\)[\s-]?\d{6,7}'
        ]
        
        phones = []
        for pattern in phone_patterns:
            matches = re.findall(pattern, response.text)
            phones.extend(matches)
        
        if phones:
            contact['phone'] = list(set(phones))
        
        # Extract social media links
        social_links = {}
        social_patterns = {
            'facebook': r'facebook\.com\/([^\/\s"\']+)',
            'twitter': r'twitter\.com\/([^\/\s"\']+)|x\.com\/([^\/\s"\']+)',
            'instagram': r'instagram\.com\/([^\/\s"\']+)',
            'linkedin': r'linkedin\.com\/(?:company|in)\/([^\/\s"\']+)',
            'youtube': r'youtube\.com\/(?:channel|user|c)\/([^\/\s"\']+)'
        }
        
        for platform, pattern in social_patterns.items():
            matches = re.findall(pattern, response.text)
            if matches:
                if isinstance(matches[0], tuple):
                    # For patterns with multiple capture groups (like Twitter)
                    handle = next((m for m in matches[0] if m), '')
                else:
                    handle = matches[0]
                
                if handle:
                    social_links[platform] = handle
        
        if social_links:
            contact['social_media'] = social_links
        
        return contact if (contact.get('email') or contact.get('phone') or contact.get('social_media')) else None
    
    def extract_book_data(self, response):
        """Extract book information from the page"""
        # Check if this might be a book page
        title = response.css('title::text').get() or ''
        body_text = ' '.join(response.css('body::text').extract()).lower()
        
        book_indicators = ['book', 'publication', 'author', 'isbn', 'edition']
        is_book_page = any(indicator in title.lower() for indicator in book_indicators) or \
                       any(indicator in body_text for indicator in book_indicators)
        
        if not is_book_page:
            return None
        
        # It's probably a book, extract book details
        book = {
            'title': title,
            'url': response.url
        }
        
        # Extract author information
        author_selectors = response.css('*:contains("Author:"), *:contains("Written by"), *:contains("By:")')
        for selector in author_selectors:
            if selector:
                author_text = selector.xpath('string()').get()
                if author_text:
                    author_match = re.search(r'(?:author|written by|by)[:\s]+(.*?)(?:\n|$)', 
                                            author_text, 
                                            re.IGNORECASE)
                    if author_match:
                        book['author'] = author_match.group(1).strip()
                        break
        
        # Extract publication year
        year_match = re.search(r'(?:published|publication|year)[:\s]+(\d{4})', 
                              response.text, 
                              re.IGNORECASE)
        if year_match:
            book['publication_year'] = year_match.group(1)
        
        # Extract publisher
        publisher_selectors = response.css('*:contains("Publisher:"), *:contains("Published by")')
        for selector in publisher_selectors:
            if selector:
                publisher_text = selector.xpath('string()').get()
                if publisher_text:
                    publisher_match = re.search(r'(?:publisher|published by)[:\s]+(.*?)(?:\n|$)', 
                                              publisher_text, 
                                              re.IGNORECASE)
                    if publisher_match:
                        book['publisher'] = publisher_match.group(1).strip()
                        break
        
        # Extract purchase links
        purchase_links = response.css('a[href*=buy], a[href*=purchase], a[href*=order], a:contains("Buy"), a:contains("Purchase")')
        if purchase_links:
            purchase_url = purchase_links.css('::attr(href)').get()
            # Convert relative URLs to absolute
            if purchase_url and not purchase_url.startswith(('http://', 'https://')):
                purchase_url = urljoin(response.url, purchase_url)
            
            if purchase_url:
                book['purchase_link'] = purchase_url
        
        return book
    
    def extract_social_media_data(self, response):
        """Extract social media post information from the page"""
        # Check for social media embed codes
        embeds = response.css('iframe[src*="facebook"], iframe[src*="twitter"], iframe[src*="instagram"], blockquote[class*="twitter"], blockquote[class*="instagram"]')
        
        if not embeds:
            return None
        
        social_post = {
            'url': response.url,
            'platform': None,
            'embed_code': None,
            'post_date': None
        }
        
        # Determine platform and extract embed code
        for embed in embeds:
            embed_html = embed.get()
            if 'facebook' in embed_html:
                social_post['platform'] = 'facebook'
            elif 'twitter' in embed_html or 'x.com' in embed_html:
                social_post['platform'] = 'twitter'
            elif 'instagram' in embed_html:
                social_post['platform'] = 'instagram'
            
            social_post['embed_code'] = embed_html
            break  # Just use the first embed for now
        
        # Try to extract post date
        date_match = re.search(r'(?:posted|published|date)[:\s]+(\d{1,2}[\s/-]\d{1,2}[\s/-]\d{2,4})', 
                               response.text, 
                               re.IGNORECASE)
        if date_match:
            social_post['post_date'] = date_match.group(1)
        
        return social_post
    
    def is_allowed_domain(self, url):
        """Check if URL is within allowed domains"""
        parsed_url = urlparse(url)
        return parsed_url.netloc in self.allowed_domains
    
    def should_skip_url(self, url):
        """Check if URL should be skipped"""
        # Skip file extensions
        skip_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', 
                         '.zip', '.rar', '.tar', '.gz', '.jpg', '.jpeg', '.png', '.gif', 
                         '.mp3', '.mp4', '.avi', '.mov']
        
        for ext in skip_extensions:
            if url.lower().endswith(ext):
                return True
        
        # Skip common admin/utility paths
        skip_paths = ['login', 'logout', 'signup', 'register', 'admin', 'wp-admin', 
                     'cart', 'checkout', 'account', 'search']
        
        parsed_url = urlparse(url)
        path_parts = parsed_url.path.split('/')
        
        for part in path_parts:
            if part.lower() in skip_paths:
                return True
        
        return False
    
    def closed(self, reason):
        """Called when the crawler is closed"""
        # Write results to the specified output file
        if self.output_file:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'url': self.start_urls[0] if self.start_urls else '',
                    'results': self.results
                }, f, indent=2)

def run_spider(url, max_depth=2, output_file=None):
    """Run the Scrapy spider for a given URL"""
    # Create a temporary output file if none provided
    if not output_file:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp:
            output_file = tmp.name
    
    # Configure Scrapy settings
    settings = get_project_settings()
    settings.update({
        'USER_AGENT': 'BambooMade Spider/1.0 (+https://bamboomade.in)',
        'ROBOTSTXT_OBEY': True,
        'LOG_LEVEL': 'ERROR',
        'COOKIES_ENABLED': False,
        'DOWNLOAD_TIMEOUT': 15,
        'CONCURRENT_REQUESTS': 8,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 4,
        'REQUEST_FINGERPRINTER_IMPLEMENTATION': 'scrapy.utils.request.RequestFingerprinter'
    })
    
    # Run the crawler
    process = CrawlerProcess(settings)
    process.crawl(BambooSpider, start_url=url, max_depth=max_depth, output_file=output_file)
    process.start()  # This blocks until crawling is finished
    
    # Read and return the results
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Clean up the temporary file
        if os.path.exists(output_file):
            os.unlink(output_file)
        
        return data
    except Exception as e:
        print(f"Error reading crawler output: {e}")
        # Return a basic structure if file reading fails
        return {
            'url': url,
            'results': {
                'pages': [],
                'events': [],
                'contacts': [],
                'images': [],
                'books': [],
                'social_media': []
            }
        }

if __name__ == "__main__":
    # Handle command line arguments
    if len(sys.argv) >= 2:
        url = sys.argv[1]
        max_depth = int(sys.argv[2]) if len(sys.argv) >= 3 else 2
        output_file = sys.argv[3] if len(sys.argv) >= 4 else None
        
        print(f"Crawling {url} with depth {max_depth}...")
        result = run_spider(url, max_depth, output_file)
        
        print(f"Crawling complete!")
        print(f"Pages: {len(result['results']['pages'])}")
        print(f"Events: {len(result['results']['events'])}")
        print(f"Contacts: {len(result['results']['contacts'])}")
        print(f"Images: {len(result['results']['images'])}")
    else:
        print("Usage: python scrapy_extractor.py <url> [max_depth] [output_file]")