import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from scrapy.http import Request
from scrapy.linkextractors import LinkExtractor
import re
import json
import os
from urllib.parse import urlparse, urljoin
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
)
logger = logging.getLogger(__name__)

class BambooSpider(scrapy.Spider):
    name = 'bamboo_spider'
    
    def __init__(self, start_url=None, allowed_domains=None, depth=1, *args, **kwargs):
        super(BambooSpider, self).__init__(*args, **kwargs)
        
        # Set starting URL
        if start_url:
            self.start_urls = [start_url]
            
            # Set allowed domains based on start URL if not provided
            if not allowed_domains:
                parsed_url = urlparse(start_url)
                self.allowed_domains = [parsed_url.netloc]
            else:
                self.allowed_domains = [allowed_domains]
        
        # Max crawl depth
        self.max_depth = int(depth)
        
        # Initialize results storage
        self.crawled_pages = []
        self.images = []
        self.events = []
        self.contacts = []
        
    def parse(self, response):
        """Parse the main response and extract content"""
        # Extract page metadata
        title = response.css('title::text').get() or ''
        title = title.strip()
        
        # Get clean text content
        content = self.extract_text_content(response)
        
        # Try to extract event details
        event_details = self.extract_event_details(response)
        if event_details:
            self.events.append(event_details)
        
        # Try to extract contact information
        contact_info = self.extract_contact_info(response)
        if contact_info:
            self.contacts.append(contact_info)
        
        # Extract image URLs
        image_urls = self.extract_images(response)
        for img_url in image_urls:
            if img_url not in [img['url'] for img in self.images]:
                self.images.append({
                    'url': img_url,
                    'page_url': response.url,
                    'page_title': title
                })
        
        # Store the page content
        self.crawled_pages.append({
            'url': response.url,
            'title': title,
            'content': content,
            'event_details': event_details,
            'contact_info': contact_info,
            'timestamp': datetime.now().isoformat()
        })
        
        # Extract and follow links if within depth limit
        if 'depth' not in response.meta or response.meta['depth'] < self.max_depth:
            link_extractor = LinkExtractor(allow_domains=self.allowed_domains)
            links = link_extractor.extract_links(response)
            
            for link in links:
                # Skip certain file types and URL patterns
                if self.should_follow_link(link.url):
                    next_depth = response.meta.get('depth', 0) + 1
                    yield Request(link.url, callback=self.parse, meta={'depth': next_depth})
    
    def extract_text_content(self, response):
        """Extract clean text content from the page"""
        # Remove scripts, styles, and other unwanted elements
        for script in response.css('script, style, nav, footer, header'):
            script.drop()
        
        # Extract text from remaining elements, focusing on content areas
        content_sections = []
        
        # Try to find main content section
        main_content = response.css('main, #content, .content, article, .post, .entry')
        if main_content:
            for section in main_content:
                paragraphs = section.css('p, h1, h2, h3, h4, h5, h6, li, blockquote')
                for p in paragraphs:
                    text = p.css('::text').getall()
                    if text:
                        content_sections.append(' '.join([t.strip() for t in text if t.strip()]))
        else:
            # Fallback to all paragraphs and headings if no main content found
            paragraphs = response.css('p, h1, h2, h3, h4, h5, h6, li, blockquote')
            for p in paragraphs:
                text = p.css('::text').getall()
                if text:
                    content_sections.append(' '.join([t.strip() for t in text if t.strip()]))
        
        # Join all content sections
        content = '\n\n'.join(content_sections)
        return content
    
    def extract_images(self, response):
        """Extract image URLs from the page"""
        image_urls = []
        # Get all image sources
        for img in response.css('img'):
            src = img.css('::attr(src)').get()
            if src:
                # Convert relative URLs to absolute
                if not src.startswith(('http://', 'https://')):
                    src = urljoin(response.url, src)
                image_urls.append(src)
        return image_urls
    
    def extract_event_details(self, response):
        """Extract event details from the page"""
        event = {}
        
        # Look for schema.org event markup
        event_schema = response.css('script[type="application/ld+json"]::text').getall()
        for schema in event_schema:
            try:
                data = json.loads(schema)
                if isinstance(data, dict) and data.get('@type') == 'Event':
                    event['name'] = data.get('name', '')
                    event['startDate'] = data.get('startDate', '')
                    event['endDate'] = data.get('endDate', '')
                    event['location'] = data.get('location', {}).get('name', '')
                    event['description'] = data.get('description', '')
                    return event
            except json.JSONDecodeError:
                pass
        
        # Look for common event patterns in content
        title = response.css('h1::text').get() or response.css('title::text').get() or ''
        if re.search(r'workshop|event|seminar|conference|webinar', title, re.IGNORECASE):
            event['name'] = title.strip()
            
            # Find date patterns
            date_patterns = response.css('*:contains("Date:"), *:contains("When:"), *:contains("Time:")::text').getall()
            date_text = ' '.join(date_patterns)
            
            # Extract dates using regex
            date_match = re.search(r'\b\d{1,2}[\s/-]\d{1,2}[\s/-]\d{2,4}\b', date_text)
            if date_match:
                event['date'] = date_match.group(0)
            
            # Extract location information
            location_patterns = response.css('*:contains("Location:"), *:contains("Venue:"), *:contains("Where:")::text').getall()
            location_text = ' '.join(location_patterns)
            event['location'] = location_text.strip()
            
            return event if event.get('name') else None
        
        return None
    
    def extract_contact_info(self, response):
        """Extract contact information from the page"""
        contact = {}
        
        # Look for email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, response.text)
        if emails:
            contact['email'] = list(set(emails))
        
        # Look for phone numbers
        phone_pattern = r'\b(?:\+\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b'
        phones = re.findall(phone_pattern, response.text)
        if phones:
            contact['phone'] = list(set(phones))
        
        # Look for social media links
        social_links = {}
        for link in response.css('a::attr(href)').getall():
            if 'facebook.com' in link:
                social_links['facebook'] = link
            elif 'twitter.com' in link or 'x.com' in link:
                social_links['twitter'] = link
            elif 'instagram.com' in link:
                social_links['instagram'] = link
            elif 'linkedin.com' in link:
                social_links['linkedin'] = link
            elif 'youtube.com' in link:
                social_links['youtube'] = link
        
        if social_links:
            contact['social'] = social_links
        
        return contact if contact else None
    
    def should_follow_link(self, url):
        """Determine if a link should be followed"""
        # Skip file types not useful for content extraction
        file_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', 
                           '.zip', '.rar', '.exe', '.mp3', '.mp4', '.avi', '.mov']
        for ext in file_extensions:
            if url.lower().endswith(ext):
                return False
        
        # Skip common non-content URLs
        skip_patterns = ['login', 'signup', 'register', 'logout', 'signin', 
                         'cart', 'checkout', 'account', 'basket', 'search', 
                         'download', 'wp-admin', 'admin', 'wp-content']
        for pattern in skip_patterns:
            if f'/{pattern}/' in url.lower():
                return False
        
        return True

def run_scrapy_crawler(url, depth=1, output_file=None):
    """Run the Scrapy crawler on a given URL and return the results"""
    try:
        # Configure the process settings
        settings = get_project_settings()
        settings.update({
            'USER_AGENT': 'BambooMade Spider/1.0 (+http://bamboomade.in)',
            'ROBOTSTXT_OBEY': True,
            'LOG_LEVEL': 'ERROR',
            'REQUEST_FINGERPRINTER_IMPLEMENTATION': '2.7'
        })
        
        # Create a temporary file for output if none provided
        if not output_file:
            output_file = f'scrapy_output_{urlparse(url).netloc.replace(".", "_")}.json'
        
        # Initialize the crawler process
        process = CrawlerProcess(settings)
        
        # Create a spider reference variable to store results
        spider = BambooSpider()
        spider.start_urls = [url]
        spider.allowed_domains = [urlparse(url).netloc]
        spider.max_depth = int(depth)
        
        # Run the crawler with the spider class
        process.crawl(BambooSpider, start_url=url, depth=depth)
        process.start()  # This will block until the crawling is finished
        
        # Prepare results
        results = {
            'url': url,
            'crawled_pages': spider.crawled_pages,
            'images': spider.images,
            'events': spider.events,
            'contacts': spider.contacts
        }
        
        # Write results to file if needed
        if output_file:
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2)
        
        return results
        
    except Exception as e:
        logger.error(f"Error running Scrapy crawler: {str(e)}")
        return {
            'error': str(e),
            'url': url,
            'crawled_pages': []
        }

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