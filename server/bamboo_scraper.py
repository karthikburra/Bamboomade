#!/usr/bin/env python3
"""
BambooMade Web Scraper
Simple web scraping tool to extract content from websites for the BambooMade Knowledge Base
"""

import sys
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
import re
from datetime import datetime

def scrape_website(url, max_pages=3):
    """
    Scrape a website for content, following a limited number of links
    to gather information about bamboo, events, and other relevant content
    """
    print(f"Starting scrape of {url}")
    
    # Keep track of visited URLs to avoid duplicates
    visited_urls = set()
    
    # Store results
    results = {
        "url": url,
        "pages": [],
        "images": [],
        "events": [],
        "contacts": []
    }
    
    # Define a headers to mimic a browser
    headers = {
        'User-Agent': 'BambooMade Knowledge Assistant/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    
    def extract_page_content(page_url):
        """Extract content from a single page"""
        if page_url in visited_urls or len(visited_urls) >= max_pages:
            return None
        
        try:
            # Mark as visited
            visited_urls.add(page_url)
            
            # Fetch page content
            response = requests.get(page_url, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"Failed to fetch {page_url}: Status code {response.status_code}")
                return None
                
            # Parse the HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Get the title
            title = soup.title.string if soup.title else "Untitled Page"
            
            # Get main content by removing unwanted elements
            for unwanted in soup.select('script, style, nav, footer, header, iframe, noscript'):
                unwanted.extract()
            
            # Try to find main content area
            main_content = soup.select('main, #content, .content, article, .post, .entry')
            
            if main_content:
                # Use the first matching main content container
                content_text = main_content[0].get_text(separator='\n', strip=True)
            else:
                # Fallback to all paragraphs and headings
                content_elements = soup.select('p, h1, h2, h3, h4, h5, h6')
                content_text = '\n'.join([elem.get_text(strip=True) for elem in content_elements if elem.get_text(strip=True)])
            
            # Extract images
            image_elements = soup.select('img')
            for img in image_elements:
                src = img.get('src')
                if src:
                    # Convert relative URLs to absolute
                    if not src.startswith(('http://', 'https://')):
                        src = urljoin(page_url, src)
                    
                    # Add to results if not already present
                    if src not in [img['url'] for img in results['images']]:
                        results['images'].append({
                            'url': src,
                            'page_url': page_url,
                            'alt_text': img.get('alt', ''),
                        })
            
            # Extract event information
            event_info = extract_event_info(soup, page_url)
            if event_info:
                results['events'].append(event_info)
            
            # Extract contact information
            contact_info = extract_contact_info(soup, page_url)
            if contact_info:
                results['contacts'].append(contact_info)
            
            # Store the page data
            page_data = {
                'url': page_url,
                'title': title,
                'content': content_text,
                'timestamp': datetime.now().isoformat()
            }
            results['pages'].append(page_data)
            
            # Find links to follow if we haven't reached max pages
            if len(visited_urls) < max_pages:
                domain = urlparse(page_url).netloc
                links = []
                
                # Find all links
                for a_tag in soup.select('a[href]'):
                    href = a_tag.get('href')
                    if href and not href.startswith('#') and not href.startswith('javascript:'):
                        # Convert relative URLs to absolute
                        if not href.startswith(('http://', 'https://')):
                            href = urljoin(page_url, href)
                        
                        # Only follow links to the same domain
                        if urlparse(href).netloc == domain:
                            # Skip certain file types and patterns
                            if not should_skip_url(href):
                                links.append(href)
                
                # Process up to 5 links per page, prioritizing ones that might contain bamboo content
                bamboo_related_links = [link for link in links if 'bamboo' in link.lower()]
                event_related_links = [link for link in links if any(term in link.lower() for term in ['event', 'workshop', 'course'])]
                
                # Prioritize bamboo and event links, then add other links
                priority_links = bamboo_related_links + event_related_links
                remaining_links = [link for link in links if link not in priority_links]
                
                follow_links = priority_links + remaining_links
                follow_links = follow_links[:5]  # Limit to 5 links
                
                for link in follow_links:
                    extract_page_content(link)
            
            return page_data
            
        except Exception as e:
            print(f"Error processing {page_url}: {str(e)}")
            return None
    
    # Start the crawl with the initial URL
    extract_page_content(url)
    
    # Return the results
    return results

def extract_event_info(soup, page_url):
    """Extract event information from a page"""
    # Look for event-related content
    event = {}
    
    # Check page title for event indicators
    title = soup.title.string if soup.title else ""
    page_text = soup.get_text().lower()
    
    event_indicators = ['event', 'workshop', 'webinar', 'course', 'training', 'seminar', 'conference']
    if any(indicator in title.lower() for indicator in event_indicators) or \
       any(indicator in page_text[:1000] for indicator in event_indicators):
        
        # This might be an event page
        event['title'] = title.strip()
        event['url'] = page_url
        
        # Look for date information (common patterns)
        date_patterns = [
            re.compile(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'),                   # MM/DD/YYYY
            re.compile(r'(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})', re.IGNORECASE),  # DD Month YYYY
            re.compile(r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{2,4})', re.IGNORECASE)  # Month DD, YYYY
        ]
        
        # Try to find date elements with date-related text
        date_elements = soup.find_all(string=re.compile(r'date|when|schedule', re.IGNORECASE))
        for date_element in date_elements:
            # Get containing paragraph or div
            container = date_element.parent
            container_text = container.get_text()
            
            # Check all date patterns
            for pattern in date_patterns:
                match = pattern.search(container_text)
                if match:
                    event['date'] = match.group(1)
                    break
        
        # Look for location information
        location_elements = soup.find_all(string=re.compile(r'location|venue|where|place', re.IGNORECASE))
        for location_element in location_elements:
            container = location_element.parent
            container_text = container.get_text().strip()
            
            # Try to extract location after label
            location_match = re.search(r'(?:location|venue|where|place):\s*(.*?)(?:\n|$)', container_text, re.IGNORECASE)
            if location_match:
                event['location'] = location_match.group(1).strip()
                break
        
        # Look for registration or ticket links
        reg_links = soup.select('a[href*=register], a[href*=signup], a[href*=enroll], a[href*=book], a[href*=ticket]')
        if reg_links:
            reg_url = reg_links[0].get('href')
            if not reg_url.startswith(('http://', 'https://')):
                reg_url = urljoin(page_url, reg_url)
            event['registration_link'] = reg_url
        
        # Look for price information
        price_elements = soup.find_all(string=re.compile(r'(?:price|cost|fee):\s*(?:₹|Rs|INR|$|€|£)?\s*\d+', re.IGNORECASE))
        if price_elements:
            price_text = price_elements[0]
            price_match = re.search(r'(?:₹|Rs|INR|$|€|£)?\s*\d+', price_text)
            if price_match:
                event['price'] = price_match.group(0).strip()
        
        return event
    
    return None

def extract_contact_info(soup, page_url):
    """Extract contact information from a page"""
    contact = {}
    
    # Check if this is a contact page
    is_contact_page = False
    page_url_lower = page_url.lower()
    page_title_lower = soup.title.string.lower() if soup.title else ""
    
    if 'contact' in page_url_lower or 'contact' in page_title_lower:
        is_contact_page = True
    
    # Look for email addresses
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', soup.get_text())
    if emails:
        contact['email'] = list(set(emails))
    
    # Look for phone numbers (Indian format)
    phone_patterns = [
        r'\+91[- ]?\d{10}',                  # +91 format
        r'0\d{10}',                          # 0 prefix
        r'\(\d{3,5}\)[- ]?\d{6,8}',          # (area) local
        r'\d{3,5}[- ]?\d{6,8}'               # without parentheses
    ]
    
    phones = []
    for pattern in phone_patterns:
        matches = re.findall(pattern, soup.get_text())
        phones.extend(matches)
    
    if phones:
        contact['phone'] = list(set(phones))
    
    # Look for social media links
    social_media = {}
    social_patterns = {
        'facebook': r'facebook\.com',
        'twitter': r'twitter\.com|x\.com',
        'instagram': r'instagram\.com',
        'linkedin': r'linkedin\.com',
        'youtube': r'youtube\.com'
    }
    
    for link in soup.select('a[href]'):
        href = link.get('href')
        if href:
            for platform, pattern in social_patterns.items():
                if re.search(pattern, href):
                    social_media[platform] = href
    
    if social_media:
        contact['social_media'] = social_media
    
    # If we found information or if this is a contact page, return the contact info
    if contact or is_contact_page:
        contact['source_url'] = page_url
        return contact
    
    return None

def should_skip_url(url):
    """Check if a URL should be skipped"""
    # Skip certain file types
    file_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', 
                       '.zip', '.rar', '.exe', '.mp3', '.mp4', '.avi', '.mov']
    
    for ext in file_extensions:
        if url.lower().endswith(ext):
            return True
    
    # Skip common non-content URLs
    skip_patterns = ['login', 'signup', 'register', 'logout', 'signin', 
                     'cart', 'checkout', 'account', 'basket', 'search', 
                     'download', 'wp-admin', 'admin']
    
    for pattern in skip_patterns:
        if f'/{pattern}/' in url.lower() or f'/{pattern}?' in url.lower():
            return True
    
    return False

if __name__ == "__main__":
    # Get command line arguments
    if len(sys.argv) >= 2:
        url = sys.argv[1]
        max_pages = int(sys.argv[2]) if len(sys.argv) >= 3 else 3
        output_file = sys.argv[3] if len(sys.argv) >= 4 else None
        
        print(f"Scraping {url} (max {max_pages} pages)")
        results = scrape_website(url, max_pages)
        
        # Save to file if specified
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2)
            print(f"Results saved to {output_file}")
        else:
            # Print summary
            print(f"Scraping complete:")
            print(f"  - Pages: {len(results['pages'])}")
            print(f"  - Images: {len(results['images'])}")
            print(f"  - Events: {len(results['events'])}")
            print(f"  - Contacts: {len(results['contacts'])}")
    else:
        print("Usage: python bamboo_scraper.py <url> [max_pages] [output_file]")