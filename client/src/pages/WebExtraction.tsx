import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, Globe, FileText, Calendar, Users, Image, Book, MessageSquare, 
  Phone, MapPin, ExternalLink, Ticket, Mail, ShoppingCart 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/hooks/useAuth';
import { cn } from "@/lib/utils";

interface ExtractSummary {
  url: string;
  pagesFound: number;
  eventsFound: number;
  contactsFound: number;
  imagesFound: number;
  booksFound: number;
  socialMediaFound: number;
  itemsAddedToKnowledgeBase: number;
}

// Interfaces for the different extraction content types
interface ScrapyPage {
  url: string;
  title: string;
  content: string;
  timestamp: string;
}

interface ScrapyEvent {
  title: string;
  url: string;
  date?: string;
  location?: string;
  registration_link?: string;
  price?: string;
}

interface ScrapyContact {
  url: string;
  email?: string[];
  phone?: string[];
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

interface ScrapyImage {
  url: string;
  alt_text?: string;
  title?: string;
  page_url: string;
}

interface ScrapyBook {
  title: string;
  url: string;
  author?: string;
  publication_year?: string;
  publisher?: string;
  purchase_link?: string;
  price?: string;
}

interface ScrapySocialMedia {
  url: string;
  platform?: string;
  embed_code?: string;
  post_date?: string;
}

interface ScrapyResults {
  pages: ScrapyPage[];
  events: ScrapyEvent[];
  contacts: ScrapyContact[];
  images: ScrapyImage[];
  books: ScrapyBook[];
  social_media: ScrapySocialMedia[];
}

interface ExtractionData {
  url: string;
  results: ScrapyResults;
}

const WebExtraction = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Add mutation to save individual items to the knowledge base
  const saveItemMutation = useMutation({
    mutationFn: async ({ item, type, sourceUrl }: { item: any, type: string, sourceUrl: string }) => {
      const response = await apiRequest('POST', '/api/scrapy/save-item', {
        item, 
        type, 
        sourceUrl
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Mark the item as added to prevent duplicate additions
      const itemKey = `${variables.type}-${JSON.stringify(variables.item)}`;
      setAddedItems(prev => ({ ...prev, [itemKey]: true }));

      toast({
        title: "Item Added",
        description: "Successfully added to knowledge base",
      });
      
      // Invalidate relevant queries to refresh content
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Item",
        description: error.message || "Failed to add item to knowledge base",
        variant: "destructive",
      });
    }
  });
  
  const [url, setUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState<string>('2');
  const [isUrlValid, setIsUrlValid] = useState(true);
  const [activeTab, setActiveTab] = useState('extract');
  const [activeDetailTab, setActiveDetailTab] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [extractionSummary, setExtractionSummary] = useState<ExtractSummary | null>(null);
  const [extractionData, setExtractionData] = useState<ScrapyResults | null>(null);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [pageContentMap, setPageContentMap] = useState<Record<string, any>>({});
  
  // Validate URL format
  const validateUrl = (input: string) => {
    const urlPattern = /^(https?:\/\/)[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+([\/?#].*)?$/;
    return urlPattern.test(input);
  };
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsUrlValid(newUrl === '' || validateUrl(newUrl));
  };

  // Function to check if an item has already been added to knowledge base
  const isItemAdded = (type: string, item: any) => {
    const itemKey = `${type}-${JSON.stringify(item)}`;
    return addedItems[itemKey] === true;
  };

  // Function to add an item to the knowledge base
  const handleAddItem = (type: string, item: any) => {
    saveItemMutation.mutate({ 
      item, 
      type, 
      sourceUrl: extractionSummary?.url || url 
    });
  };

  // Render individual content items with add buttons
  const renderContentItems = (type: string, items: any[]) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-8 text-green-400">
          No {type} items found
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item, index) => {
          // Create a unique ID for this item
          const itemAdded = isItemAdded(type, item);
          
          return (
            <div key={index} className="border border-green-800/30 bg-gray-900/50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  {/* Display item details based on type */}
                  {type === 'event' && (
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium text-green-300">{item.title}</h3>
                      {item.date && <p className="text-green-200"><Calendar className="inline w-4 h-4 mr-2" /> {item.date}</p>}
                      {item.location && <p className="text-green-200"><MapPin className="inline w-4 h-4 mr-2" /> {item.location}</p>}
                      {item.price && <p className="text-green-200"><Ticket className="inline w-4 h-4 mr-2" /> Price: {item.price}</p>}
                      <p className="text-green-400 text-sm"><Globe className="inline w-4 h-4 mr-1" /> {item.url}</p>
                    </div>
                  )}
                  
                  {type === 'contact' && (
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium text-green-300">Contact Information</h3>
                      {item.email && item.email.length > 0 && (
                        <p className="text-green-200">
                          <Mail className="inline w-4 h-4 mr-2" /> 
                          {item.email.join(', ')}
                        </p>
                      )}
                      {item.phone && item.phone.length > 0 && (
                        <p className="text-green-200">
                          <Phone className="inline w-4 h-4 mr-2" /> 
                          {item.phone.join(', ')}
                        </p>
                      )}
                      <p className="text-green-400 text-sm"><Globe className="inline w-4 h-4 mr-1" /> {item.url}</p>
                    </div>
                  )}
                  
                  {type === 'book' && (
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium text-green-300">{item.title}</h3>
                      {item.author && <p className="text-green-200">By {item.author}</p>}
                      {item.publication_year && <p className="text-green-200">Published in {item.publication_year}</p>}
                      {item.publisher && <p className="text-green-200">Publisher: {item.publisher}</p>}
                      {item.price && <p className="text-green-200"><ShoppingCart className="inline w-4 h-4 mr-2" /> Price: {item.price}</p>}
                      <p className="text-green-400 text-sm"><Globe className="inline w-4 h-4 mr-1" /> {item.url}</p>
                    </div>
                  )}
                  
                  {type === 'page' && (
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium text-green-300">{item.title}</h3>
                      <p className="text-green-200 truncate">{item.content.substring(0, 150)}...</p>
                      <p className="text-green-400 text-sm"><Globe className="inline w-4 h-4 mr-1" /> {item.url}</p>
                    </div>
                  )}
                  
                  {type === 'image' && (
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium text-green-300">{item.title || 'Image'}</h3>
                      {item.url && (
                        <div className="relative h-40 w-full">
                          <img 
                            src={item.url} 
                            alt={item.alt_text || 'Extracted image'} 
                            className="object-contain h-full mx-auto rounded-md"
                          />
                        </div>
                      )}
                      <p className="text-green-400 text-sm"><Globe className="inline w-4 h-4 mr-1" /> {item.page_url}</p>
                    </div>
                  )}

                  {type === 'social_media' && (
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium text-green-300">Social Media {item.platform || ''}</h3>
                      {item.post_date && <p className="text-green-200">Posted: {item.post_date}</p>}
                      <p className="text-green-400 text-sm"><Globe className="inline w-4 h-4 mr-1" /> {item.url}</p>
                    </div>
                  )}
                </div>
                
                {/* Add to knowledge base button */}
                <Button
                  size="sm"
                  variant={itemAdded ? "outline" : "default"}
                  className={itemAdded ? "bg-green-900/30 text-green-300 border-green-700" : "bg-green-700 text-white"}
                  onClick={() => handleAddItem(type, item)}
                  disabled={itemAdded || saveItemMutation.isPending}
                >
                  {saveItemMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : itemAdded ? (
                    "Added ✓"
                  ) : (
                    "Add to Database"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  const extractionStatus = useQuery({
    queryKey: ['/api/scrapy/status'],
    enabled: activeTab === 'status',
    refetchInterval: activeTab === 'status' ? 5000 : false, // Poll every 5 seconds when on status tab
  });
  
  const extractMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/scrapy/extract', {
        url,
        maxDepth: parseInt(maxDepth),
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Extraction Successful",
        description: data.message,
      });
      
      // Set the extraction summary for display
      if (data.summary) {
        setExtractionSummary(data.summary);
      }
      
      // Store the extraction data if available
      if (data.results) {
        setExtractionData(data.results);
        
        // Organize content by page URL
        const pageMap: Record<string, any> = {};
        
        // Add pages
        if (data.results.pages) {
          data.results.pages.forEach(page => {
            if (!pageMap[page.url]) {
              pageMap[page.url] = {
                url: page.url,
                title: page.title,
                events: [],
                books: [],
                contacts: [],
                images: [],
                social_media: []
              };
            }
          });
        }
        
        // Map events to pages
        if (data.results.events) {
          data.results.events.forEach(event => {
            const pageUrl = event.url;
            if (pageMap[pageUrl]) {
              pageMap[pageUrl].events.push(event);
            } else {
              // If the page isn't in our map yet, add it
              pageMap[pageUrl] = {
                url: pageUrl,
                title: "Unknown Page",
                events: [event],
                books: [],
                contacts: [],
                images: [],
                social_media: []
              };
            }
          });
        }
        
        // Map books to pages
        if (data.results.books) {
          data.results.books.forEach(book => {
            const pageUrl = book.url;
            if (pageMap[pageUrl]) {
              pageMap[pageUrl].books.push(book);
            } else {
              pageMap[pageUrl] = {
                url: pageUrl,
                title: "Unknown Page",
                events: [],
                books: [book],
                contacts: [],
                images: [],
                social_media: []
              };
            }
          });
        }
        
        // Map contacts to pages
        if (data.results.contacts) {
          data.results.contacts.forEach(contact => {
            const pageUrl = contact.url;
            if (pageMap[pageUrl]) {
              pageMap[pageUrl].contacts.push(contact);
            } else {
              pageMap[pageUrl] = {
                url: pageUrl,
                title: "Unknown Page",
                events: [],
                books: [],
                contacts: [contact],
                images: [],
                social_media: []
              };
            }
          });
        }
        
        // Map images to pages
        if (data.results.images) {
          data.results.images.forEach(image => {
            const pageUrl = image.page_url || image.url;
            if (pageMap[pageUrl]) {
              pageMap[pageUrl].images.push(image);
            } else {
              pageMap[pageUrl] = {
                url: pageUrl,
                title: "Unknown Page",
                events: [],
                books: [],
                contacts: [],
                images: [image],
                social_media: []
              };
            }
          });
        }
        
        // Map social media to pages
        if (data.results.social_media) {
          data.results.social_media.forEach(social => {
            const pageUrl = social.url;
            if (pageMap[pageUrl]) {
              pageMap[pageUrl].social_media.push(social);
            } else {
              pageMap[pageUrl] = {
                url: pageUrl,
                title: "Unknown Page",
                events: [],
                books: [],
                contacts: [],
                images: [],
                social_media: [social]
              };
            }
          });
        }
        
        setPageContentMap(pageMap);
      }
      
      // Switch to the results tab
      setActiveTab('results');
      
      // Invalidate relevant queries to refresh content
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
    },
    onError: (error: any) => {
      toast({
        title: "Extraction Failed",
        description: error.message || "There was an error extracting content from the URL",
        variant: "destructive",
      });
    },
  });
  
  const handleExtract = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(url)) {
      setIsUrlValid(false);
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }
    
    extractMutation.mutate();
    setActiveTab('status');
  };
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto mt-12 p-6">
        <Alert className="mb-6">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to use the Web Extraction tool.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto mt-12 pb-20 text-green-50">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-green-300">Web Content Extraction</h1>
        <p className="text-lg text-green-400">
          Extract content from websites and add it to the Bamboo Knowledge Base
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8 bg-gray-800/50">
          <TabsTrigger 
            value="extract"
            className={cn(
              "data-[state=active]:bg-green-700/30 data-[state=active]:text-green-100",
              "data-[state=inactive]:text-green-400 data-[state=inactive]:hover:bg-gray-700/50"
            )}
          >
            Extract Content
          </TabsTrigger>
          <TabsTrigger 
            value="status"
            className={cn(
              "data-[state=active]:bg-green-700/30 data-[state=active]:text-green-100",
              "data-[state=inactive]:text-green-400 data-[state=inactive]:hover:bg-gray-700/50"
            )}
          >
            Extraction Status
          </TabsTrigger>
          <TabsTrigger 
            value="results"
            className={cn(
              "data-[state=active]:bg-green-700/30 data-[state=active]:text-green-100",
              "data-[state=inactive]:text-green-400 data-[state=inactive]:hover:bg-gray-700/50"
            )}
          >
            Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="extract">
          <Card className="bg-gray-800/50 border-green-800/30">
            <CardHeader>
              <CardTitle className="text-green-300">Start Web Extraction</CardTitle>
              <CardDescription className="text-green-400">
                Enter a URL to extract content from. Our system will crawl the website and extract 
                relevant information about bamboo architecture, events, contacts, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExtract} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-green-200">Website URL</Label>
                  <Input
                    id="url"
                    type="text"
                    placeholder="https://example.com"
                    value={url}
                    onChange={handleUrlChange}
                    className={cn(
                      "bg-gray-900/70 border-green-800/50 text-green-50 placeholder:text-gray-500",
                      !isUrlValid && "border-red-500"
                    )}
                  />
                  {!isUrlValid && (
                    <p className="text-red-500 text-sm mt-1">
                      Please enter a valid URL (e.g., https://example.com)
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxDepth" className="text-green-200">Crawl Depth</Label>
                  <Select 
                    value={maxDepth} 
                    onValueChange={setMaxDepth}
                  >
                    <SelectTrigger id="maxDepth" className="bg-gray-900/70 border-green-800/50 text-green-50">
                      <SelectValue placeholder="Select crawl depth" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-green-800/50 text-green-50">
                      <SelectItem value="1">1 (Basic - Homepage Only)</SelectItem>
                      <SelectItem value="2">2 (Standard - Homepage + Linked Pages)</SelectItem>
                      <SelectItem value="3">3 (Deep - Multiple Levels)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-green-400">
                    Higher depth values will crawl more pages but take longer to complete.
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-green-700 text-white hover:bg-green-600"
                  disabled={extractMutation.isPending}
                >
                  {extractMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    "Start Extraction"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="status">
          <Card className="bg-gray-800/50 border-green-800/30">
            <CardHeader>
              <CardTitle className="text-green-300">Extraction Status</CardTitle>
              <CardDescription className="text-green-400">
                Monitor the progress of your web content extraction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {extractMutation.isPending ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                    <div>
                      <h3 className="text-green-300 text-lg">Extraction in Progress</h3>
                      <p className="text-green-400">
                        Crawling {url} (Depth: {maxDepth})
                      </p>
                    </div>
                  </div>
                  <Progress 
                    value={45} 
                    className="h-2 bg-gray-700" 
                  />
                  <p className="text-sm text-green-400">
                    This may take a few minutes depending on the size of the website and crawl depth.
                  </p>
                </div>
              ) : extractionStatus.data ? (
                <div>
                  <h3 className="text-green-300 text-lg">
                    {extractionStatus.data.status === 'completed' 
                      ? 'Extraction Complete' 
                      : 'Extraction in Progress'}
                  </h3>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-400">Status:</span>
                      <span className="text-green-200 capitalize">{extractionStatus.data.status}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-green-400">URL:</span>
                      <span className="text-green-200">{extractionStatus.data.url}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-green-400">Pages Crawled:</span>
                      <span className="text-green-200">{extractionStatus.data.pagesCrawled || 0}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-green-400">Items Found:</span>
                      <span className="text-green-200">{extractionStatus.data.itemsFound || 0}</span>
                    </div>
                  </div>
                  
                  {extractionStatus.data.status === 'completed' && (
                    <div className="mt-6">
                      <Button 
                        onClick={() => setActiveTab('results')}
                        className="w-full bg-green-700 text-white hover:bg-green-600"
                      >
                        View Results
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-green-300">No active extraction</p>
                  <p className="text-sm text-green-400 mt-2">
                    Start an extraction from the "Extract Content" tab to see status here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <Card className="bg-gray-800/50 border-green-800/30">
            <CardHeader>
              <CardTitle className="text-green-300">Extraction Results</CardTitle>
              <CardDescription className="text-green-400">
                Browse and add extracted content to the Bamboo Knowledge Base.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {extractionSummary ? (
                  <div>
                    <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
                      <h3 className="text-lg font-medium text-green-300 mb-2">Extraction Summary</h3>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="block text-sm text-green-400">URL</span>
                          <span className="text-green-200 text-sm break-all">{extractionSummary.url}</span>
                        </div>
                        <div>
                          <span className="block text-sm text-green-400">Pages</span>
                          <span className="text-xl">{extractionSummary.pagesFound}</span>
                        </div>
                        <div>
                          <span className="block text-sm text-green-400">Events</span>
                          <span className="text-xl">{extractionSummary.eventsFound}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <span className="block text-sm text-green-400">Books</span>
                          <span className="text-xl">{extractionSummary.booksFound}</span>
                        </div>
                        <div>
                          <span className="block text-sm text-green-400">Contacts</span>
                          <span className="text-xl">{extractionSummary.contactsFound}</span>
                        </div>
                        <div>
                          <span className="block text-sm text-green-400">Images</span>
                          <span className="text-xl">{extractionSummary.imagesFound}</span>
                        </div>
                        <div>
                          <span className="block text-sm text-green-400">Social Media</span>
                          <span className="text-xl">{extractionSummary.socialMediaFound}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <Tabs defaultValue={activePage || "by-type"} onValueChange={setActivePage}>
                        <TabsList className="w-full bg-gray-800/50 mb-4 flex flex-wrap">
                          <TabsTrigger 
                            value="by-type" 
                            className="data-[state=active]:bg-green-700/30 data-[state=active]:text-green-100 flex-grow"
                          >
                            View by Content Type
                          </TabsTrigger>
                          
                          {Object.keys(pageContentMap).length > 0 && 
                            Object.keys(pageContentMap).map((pageUrl, index) => (
                              <TabsTrigger 
                                key={pageUrl}
                                value={pageUrl}
                                className="data-[state=active]:bg-green-700/30 data-[state=active]:text-green-100 flex-grow"
                              >
                                {pageContentMap[pageUrl].title ? 
                                  (pageContentMap[pageUrl].title.length > 20 ? 
                                    pageContentMap[pageUrl].title.substring(0, 20) + '...' : 
                                    pageContentMap[pageUrl].title) : 
                                  `Page ${index + 1}`}
                              </TabsTrigger>
                            ))
                          }
                        </TabsList>
                        
                        <TabsContent value="by-type" className="space-y-6">
                          <div>
                            <h3 className="text-lg font-medium text-green-300 mb-4">Events</h3>
                            {extractionData?.events && renderContentItems('event', extractionData.events)}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium text-green-300 mb-4">Books</h3>
                            {extractionData?.books && renderContentItems('book', extractionData.books)}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium text-green-300 mb-4">Contacts</h3>
                            {extractionData?.contacts && renderContentItems('contact', extractionData.contacts)}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium text-green-300 mb-4">Pages</h3>
                            {extractionData?.pages && renderContentItems('page', extractionData.pages)}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium text-green-300 mb-4">Images</h3>
                            {extractionData?.images && renderContentItems('image', extractionData.images)}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium text-green-300 mb-4">Social Media</h3>
                            {extractionData?.social_media && renderContentItems('social_media', extractionData.social_media)}
                          </div>
                        </TabsContent>
                        
                        {/* Page-specific content tabs */}
                        {Object.keys(pageContentMap).map(pageUrl => (
                          <TabsContent key={pageUrl} value={pageUrl} className="space-y-6">
                            <div className="mb-4 p-4 bg-gray-900/50 rounded-lg">
                              <h3 className="text-lg font-medium text-green-300 mb-2">
                                {pageContentMap[pageUrl].title || "Page Content"}
                              </h3>
                              <a 
                                href={pageUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-green-400 hover:text-green-300 text-sm flex items-center"
                              >
                                <Globe className="w-4 h-4 mr-1" /> {pageUrl}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </div>
                            
                            {pageContentMap[pageUrl].events.length > 0 && (
                              <div>
                                <h3 className="text-lg font-medium text-green-300 mb-4">Events on this Page</h3>
                                {renderContentItems('event', pageContentMap[pageUrl].events)}
                              </div>
                            )}
                            
                            {pageContentMap[pageUrl].books.length > 0 && (
                              <div>
                                <h3 className="text-lg font-medium text-green-300 mb-4">Books on this Page</h3>
                                {renderContentItems('book', pageContentMap[pageUrl].books)}
                              </div>
                            )}
                            
                            {pageContentMap[pageUrl].contacts.length > 0 && (
                              <div>
                                <h3 className="text-lg font-medium text-green-300 mb-4">Contacts on this Page</h3>
                                {renderContentItems('contact', pageContentMap[pageUrl].contacts)}
                              </div>
                            )}
                            
                            {/* Find the page details in the pages array */}
                            {extractionData?.pages && extractionData.pages.filter(p => p.url === pageUrl).length > 0 && (
                              <div>
                                <h3 className="text-lg font-medium text-green-300 mb-4">Page Content</h3>
                                {renderContentItems('page', extractionData.pages.filter(p => p.url === pageUrl))}
                              </div>
                            )}
                            
                            {pageContentMap[pageUrl].images.length > 0 && (
                              <div>
                                <h3 className="text-lg font-medium text-green-300 mb-4">Images on this Page</h3>
                                {renderContentItems('image', pageContentMap[pageUrl].images)}
                              </div>
                            )}
                            
                            {pageContentMap[pageUrl].social_media.length > 0 && (
                              <div>
                                <h3 className="text-lg font-medium text-green-300 mb-4">Social Media on this Page</h3>
                                {renderContentItems('social_media', pageContentMap[pageUrl].social_media)}
                              </div>
                            )}
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-green-300">No extraction results to display yet.</p>
                    <p className="text-sm text-green-500 mt-2">
                      Run an extraction from the "Extract Content" tab to see results here.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => {
                  setUrl('');
                  setMaxDepth('2');
                  setActiveTab('extract');
                }}
                variant="outline"
                className="w-full border-green-700 text-green-300 hover:bg-green-700/20 hover:text-green-200"
              >
                Start New Extraction
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebExtraction;