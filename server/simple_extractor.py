#!/usr/bin/env python3
"""
BambooMade Simple Web Extractor
Web scraping and data extraction using BeautifulSoup for the BambooMade Knowledge Base
"""
import os
import sys
import json
import re
from datetime import datetime
from urllib.parse import urlparse, urljoin
import requests
from bs4 import BeautifulSoup
from collections import deque

def extract_website(url, max_depth=2, output_file=None):
    """
    Extract content from a website using BeautifulSoup
    
    Args:
        url (str): URL to crawl
        max_depth (int): Maximum depth to crawl
        output_file (str): Output file to save results
        
    Returns:
        dict: Extracted data
    """
    # Initialize results
    results = {
        "url": url,
        "results": {
            "pages": [],
            "events": [],
            "contacts": [],
            "images": [],
            "books": [],
            "social_media": []
        }
    }
    
    # Initialize crawl queue and visited set
    queue = deque([(url, 0)])  # (url, depth)
    visited = set()
    parsed_domain = urlparse(url).netloc
    
    # Set up headers to mimic a browser
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    
    # BFS crawl
    while queue:
        current_url, depth = queue.popleft()
        
        # Skip if already visited or at max depth
        if current_url in visited or depth > max_depth:
            continue
        
        visited.add(current_url)
        print(f"Crawling {current_url} (depth: {depth})")
        
        try:
            response = requests.get(current_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Skip non-HTML responses
            if 'text/html' not in response.headers.get('Content-Type', ''):
                continue
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract data from the page
            page_data = extract_page_data(soup, current_url)
            if page_data:
                results["results"]["pages"].append(page_data)
            
            # Extract specialized content
            event_data = extract_event_data(soup, current_url)
            if event_data:
                results["results"]["events"].append(event_data)
                
            contact_data = extract_contact_data(soup, current_url)
            if contact_data:
                results["results"]["contacts"].append(contact_data)
                
            images = extract_images(soup, current_url)
            if images:
                results["results"]["images"].extend(images)
                
            book_data = extract_book_data(soup, current_url)
            if book_data:
                results["results"]["books"].append(book_data)
                
            social_data = extract_social_media_data(soup, current_url)
            if social_data:
                results["results"]["social_media"].append(social_data)
            
            # Find links to follow
            if depth < max_depth:
                links = soup.find_all('a', href=True)
                for link in links:
                    href = link['href']
                    
                    # Skip empty links and anchors
                    if not href or href.startswith('#'):
                        continue
                    
                    # Convert relative URLs to absolute
                    if not href.startswith(('http://', 'https://')):
                        href = urljoin(current_url, href)
                    
                    # Only follow links in the same domain
                    if urlparse(href).netloc == parsed_domain:
                        # Skip certain file types
                        if should_skip_url(href):
                            continue
                        
                        # Skip already visited
                        if href not in visited:
                            queue.append((href, depth + 1))
        
        except Exception as e:
            print(f"Error crawling {current_url}: {e}")
            continue
    
    # Save results to file if specified
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
    
    return results

def extract_page_data(soup, url):
    """Extract basic page data"""
    title = soup.title.text.strip() if soup.title else "Untitled Page"
    
    # Extract main content
    main_content = soup.find(["main", "article"]) or soup.find("div", class_=["content", "main-content"])
    
    if main_content:
        # Get paragraphs and headings from the main content
        content_elements = main_content.find_all(["p", "h1", "h2", "h3", "h4", "h5", "h6"])
        content = "\n\n".join([el.get_text().strip() for el in content_elements if el.get_text().strip()])
    else:
        # Fallback to paragraphs in the whole page
        content_elements = soup.find_all(["p", "h1", "h2", "h3", "h4", "h5", "h6"])
        content = "\n\n".join([el.get_text().strip() for el in content_elements if el.get_text().strip()])
    
    # Return None if no meaningful content
    if not content or len(content) < 100:
        return None
    
    return {
        "url": url,
        "title": title,
        "content": content,
        "timestamp": datetime.now().isoformat()
    }

def extract_images(soup, page_url):
    """Extract image information"""
    images = []
    for img in soup.find_all('img', src=True):
        src = img['src']
        
        # Skip very small images, data URLs, and SVGs
        if 'data:' in src or src.endswith('.svg'):
            continue
            
        # Convert relative URLs to absolute
        if not src.startswith(('http://', 'https://')):
            src = urljoin(page_url, src)
        
        alt_text = img.get('alt', '')
        title = img.get('title', '')
        
        # Only collect images with decent alt text or title
        if len(src) > 10:
            images.append({
                'url': src,
                'alt_text': alt_text,
                'title': title,
                'page_url': page_url
            })
    
    return images

def extract_event_data(soup, page_url):
    """Extract event information"""
    # Check if page might be an event
    page_text = soup.get_text().lower()
    title = soup.title.text if soup.title else ""
    
    event_indicators = ['event', 'workshop', 'seminar', 'conference', 'webinar', 'training']
    is_event_page = any(indicator in title.lower() for indicator in event_indicators) or \
                   any(indicator in page_text for indicator in event_indicators)
    
    if not is_event_page:
        return None
    
    # Extract event details
    event = {
        'title': title,
        'url': page_url
    }
    
    # Extract date information
    date_patterns = [
        r'\b(\d{1,2}[\s/-]\d{1,2}[\s/-]\d{2,4})\b',  # 10/25/2023, 10-25-2023
        r'\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b',  # 25 December 2023
        r'\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})\b'  # December 25, 2023
    ]
    
    page_content = soup.get_text()
    for pattern in date_patterns:
        date_match = re.search(pattern, page_content, re.IGNORECASE)
        if date_match:
            event['date'] = date_match.group(1)
            break
    
    # Extract location
    location_elements = soup.find_all(text=re.compile(r'location|venue|where|address', re.IGNORECASE))
    for element in location_elements:
        parent = element.parent
        if parent:
            location_text = parent.get_text()
            location_match = re.search(r'(?:location|venue|where|address)[:\s]+(.*?)(?:\n|$)', 
                                      location_text, 
                                      re.IGNORECASE)
            if location_match:
                event['location'] = location_match.group(1).strip()
                break
    
    # Extract registration links
    reg_links = soup.find_all('a', href=re.compile(r'regist|signup|book|ticket', re.IGNORECASE))
    if reg_links:
        reg_url = reg_links[0]['href']
        # Convert relative URLs to absolute
        if reg_url and not reg_url.startswith(('http://', 'https://')):
            reg_url = urljoin(page_url, reg_url)
        event['registration_link'] = reg_url
    
    # Extract price information
    price_match = re.search(r'(?:Price|Cost|Fee)[:\s]+((?:₹|Rs\.?|INR)?\s*\d+(?:,\d+)*(?:\.\d+)?)', 
                           page_content, 
                           re.IGNORECASE)
    if price_match:
        event['price'] = price_match.group(1).strip()
    
    return event

def extract_contact_data(soup, page_url):
    """Extract contact information"""
    # Check if this is a contact page
    url_path = urlparse(page_url).path.lower()
    page_text = soup.get_text().lower()
    title = soup.title.text.lower() if soup.title else ""
    
    is_contact_page = 'contact' in url_path or 'about' in url_path or \
                     'contact' in title or \
                     any(text in page_text for text in ['contact us', 'get in touch', 'reach us'])
    
    if not is_contact_page:
        return None
    
    # Extract contact information
    contact = {
        'url': page_url
    }
    
    # Extract email addresses
    page_content = str(soup)
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, page_content)
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
        matches = re.findall(pattern, page_content)
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
        matches = re.findall(pattern, page_content)
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

def extract_book_data(soup, page_url):
    """Extract book information"""
    # Check if this might be a book page
    page_text = soup.get_text().lower()
    title = soup.title.text.lower() if soup.title else ""
    
    book_indicators = ['book', 'publication', 'author', 'isbn', 'edition']
    is_book_page = any(indicator in title for indicator in book_indicators) or \
                  any(indicator in page_text for indicator in book_indicators)
    
    if not is_book_page:
        return None
    
    # Extract book details
    book = {
        'title': soup.title.text if soup.title else "Unknown Book",
        'url': page_url
    }
    
    # Extract author information
    author_elements = soup.find_all(text=re.compile(r'author|written by|by:', re.IGNORECASE))
    for element in author_elements:
        parent = element.parent
        if parent:
            author_text = parent.get_text()
            author_match = re.search(r'(?:author|written by|by)[:\s]+(.*?)(?:\n|$)', 
                                    author_text, 
                                    re.IGNORECASE)
            if author_match:
                book['author'] = author_match.group(1).strip()
                break
    
    # Extract publication year
    page_content = soup.get_text()
    year_match = re.search(r'(?:published|publication|year)[:\s]+(\d{4})', 
                          page_content, 
                          re.IGNORECASE)
    if year_match:
        book['publication_year'] = year_match.group(1)
    
    # Extract publisher
    publisher_elements = soup.find_all(text=re.compile(r'publisher|published by', re.IGNORECASE))
    for element in publisher_elements:
        parent = element.parent
        if parent:
            publisher_text = parent.get_text()
            publisher_match = re.search(r'(?:publisher|published by)[:\s]+(.*?)(?:\n|$)', 
                                      publisher_text, 
                                      re.IGNORECASE)
            if publisher_match:
                book['publisher'] = publisher_match.group(1).strip()
                break
    
    # Extract purchase links
    purchase_links = soup.find_all('a', href=True, text=re.compile(r'buy|purchase|order', re.IGNORECASE))
    if not purchase_links:
        purchase_links = soup.find_all('a', href=re.compile(r'buy|purchase|order', re.IGNORECASE))
    
    if purchase_links:
        purchase_url = purchase_links[0]['href']
        # Convert relative URLs to absolute
        if purchase_url and not purchase_url.startswith(('http://', 'https://')):
            purchase_url = urljoin(page_url, purchase_url)
        book['purchase_link'] = purchase_url
    
    return book

def extract_social_media_data(soup, page_url):
    """Extract social media post information"""
    # Check for social media embed codes
    embeds = soup.find_all(['iframe', 'blockquote'], attrs={
        'class': lambda c: c and any(s in c for s in ['twitter', 'instagram', 'facebook']) if c else False,
        'src': lambda s: s and any(p in s for p in ['twitter', 'instagram', 'facebook']) if s else False
    })
    
    if not embeds:
        return None
    
    social_post = {
        'url': page_url,
        'platform': None,
        'embed_code': None,
        'post_date': None
    }
    
    # Determine platform and extract embed code
    for embed in embeds:
        embed_html = str(embed)
        if 'facebook' in embed_html:
            social_post['platform'] = 'facebook'
        elif 'twitter' in embed_html or 'x.com' in embed_html:
            social_post['platform'] = 'twitter'
        elif 'instagram' in embed_html:
            social_post['platform'] = 'instagram'
        
        social_post['embed_code'] = embed_html
        break  # Just use the first embed for now
    
    # Try to extract post date
    page_content = soup.get_text()
    date_match = re.search(r'(?:posted|published|date)[:\s]+(\d{1,2}[\s/-]\d{1,2}[\s/-]\d{2,4})', 
                           page_content, 
                           re.IGNORECASE)
    if date_match:
        social_post['post_date'] = date_match.group(1)
    
    return social_post

def should_skip_url(url):
    """Check if a URL should be skipped"""
    # Skip certain file types
    skip_exts = ['.pdf', '.docx', '.xlsx', '.zip', '.rar', '.jpg', '.jpeg', '.png', '.gif']
    parsed = urlparse(url)
    path = parsed.path.lower()
    
    if any(path.endswith(ext) for ext in skip_exts):
        return True
    
    # Skip URLs with fragments or queries
    if '#' in url:
        return True
    
    return False

if __name__ == "__main__":
    # Handle command line arguments
    if len(sys.argv) >= 2:
        url = sys.argv[1]
        max_depth = int(sys.argv[2]) if len(sys.argv) >= 3 else 2
        output_file = sys.argv[3] if len(sys.argv) >= 4 else None
        
        print(f"Crawling {url} with depth {max_depth}...")
        result = extract_website(url, max_depth, output_file)
        
        print(f"Crawling complete!")
        print(f"Pages: {len(result['results']['pages'])}")
        print(f"Events: {len(result['results']['events'])}")
        print(f"Contacts: {len(result['results']['contacts'])}")
        print(f"Images: {len(result['results']['images'])}")
    else:
        print("Usage: python simple_extractor.py <url> [max_depth] [output_file]")