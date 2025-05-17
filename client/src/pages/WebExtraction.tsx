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
  
  const [url, setUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState<string>('2');
  const [isUrlValid, setIsUrlValid] = useState(true);
  const [activeTab, setActiveTab] = useState('extract');
  const [activeDetailTab, setActiveDetailTab] = useState<string | null>(null);
  const [extractionSummary, setExtractionSummary] = useState<ExtractSummary | null>(null);
  const [extractionData, setExtractionData] = useState<ScrapyResults | null>(null);
  
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
                    <p className="text-sm text-red-400">
                      Please enter a valid URL starting with http:// or https://
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxDepth" className="text-green-200">Crawl Depth</Label>
                  <Select
                    value={maxDepth}
                    onValueChange={(value) => setMaxDepth(value)}
                  >
                    <SelectTrigger className="bg-gray-900/70 border-green-800/50 text-green-50">
                      <SelectValue placeholder="Select crawl depth" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-green-800/50">
                      <SelectItem value="1" className="text-green-50 focus:bg-green-700/30 focus:text-green-100">Minimal (1 level)</SelectItem>
                      <SelectItem value="2" className="text-green-50 focus:bg-green-700/30 focus:text-green-100">Standard (2 levels)</SelectItem>
                      <SelectItem value="3" className="text-green-50 focus:bg-green-700/30 focus:text-green-100">Deep (3 levels)</SelectItem>
                      <SelectItem value="4" className="text-green-50 focus:bg-green-700/30 focus:text-green-100">Very Deep (4 levels)</SelectItem>
                      <SelectItem value="5" className="text-green-50 focus:bg-green-700/30 focus:text-green-100">Exhaustive (5 levels)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-green-500">
                    Higher depth values will extract more content but take longer to complete.
                  </p>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleExtract} 
                disabled={extractMutation.isPending}
                className="w-full bg-green-700 hover:bg-green-600 text-white"
              >
                {extractMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Start Extraction
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="status">
          <Card className="bg-gray-800/50 border-green-800/30">
            <CardHeader>
              <CardTitle className="text-green-300">Extraction Status</CardTitle>
              <CardDescription className="text-green-400">
                Current status of the web extraction process.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {extractMutation.isPending ? (
                <div className="space-y-4">
                  <p className="text-green-200">Extracting content from <span className="text-green-300 font-medium">{url}</span></p>
                  <Progress value={50} className="h-2 bg-gray-700" />
                  <p className="text-sm text-green-500">
                    Please wait while we crawl the website and extract content.
                    This process may take several minutes depending on the size of the website.
                  </p>
                </div>
              ) : extractionStatus.isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
              ) : extractionStatus.isError ? (
                <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-red-300">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to fetch extraction status. Please try again.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <p className="text-green-200">{extractionStatus.data?.status || "No active extractions"}</p>
                  {extractionStatus.data?.isRunning && (
                    <Progress value={75} className="h-2 bg-gray-700" />
                  )}
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
                Summary of content extracted from the website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {extractionSummary ? (
                <div className="space-y-6">
                  <p className="font-medium text-green-200">Content extracted from: <span className="text-green-300">{extractionSummary.url}</span></p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-green-800/30 bg-gray-900/50 rounded-lg flex flex-col items-center">
                      <FileText className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-2xl font-bold text-green-300">{extractionSummary.pagesFound}</p>
                      <p className="text-sm text-green-400">Pages</p>
                    </div>
                    
                    <div 
                      className="p-4 border border-green-800/30 bg-gray-900/50 rounded-lg flex flex-col items-center cursor-pointer hover:bg-green-900/30"
                      onClick={() => {
                        // Get the actual extraction data if not already loaded
                        if (!extractionData && extractionSummary?.url) {
                          fetch(`/api/scrapy/results?url=${encodeURIComponent(extractionSummary.url)}`)
                            .then(res => res.json())
                            .then(data => {
                              if (data.success && data.results) {
                                setExtractionData(data.results);
                                setActiveDetailTab('events');
                              } else {
                                toast({
                                  title: "Error Loading Results",
                                  description: data.message || "There was a problem loading the extraction results.",
                                  variant: "destructive",
                                });
                              }
                            })
                            .catch(err => {
                              console.error("Error loading extraction data:", err);
                              toast({
                                title: "Error Loading Results",
                                description: "Failed to load extraction results. Please try again.",
                                variant: "destructive",
                              });
                            });
                        } else {
                          setActiveDetailTab('events');
                        }
                      }}
                    >
                      <Calendar className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-2xl font-bold text-green-300">{extractionSummary.eventsFound}</p>
                      <p className="text-sm text-green-400">Events</p>
                    </div>
                    
                    <div 
                      className="p-4 border border-green-800/30 bg-gray-900/50 rounded-lg flex flex-col items-center cursor-pointer hover:bg-green-900/30"
                      onClick={() => {
                        // Get the actual extraction data if not already loaded
                        if (!extractionData && extractionSummary?.url) {
                          fetch(`/api/scrapy/results?url=${encodeURIComponent(extractionSummary.url)}`)
                            .then(res => res.json())
                            .then(data => {
                              if (data.success && data.results) {
                                setExtractionData(data.results);
                                setActiveDetailTab('contacts');
                              } else {
                                toast({
                                  title: "Error Loading Results",
                                  description: data.message || "There was a problem loading the extraction results.",
                                  variant: "destructive",
                                });
                              }
                            })
                            .catch(err => {
                              console.error("Error loading extraction data:", err);
                              toast({
                                title: "Error Loading Results",
                                description: "Failed to load extraction results. Please try again.",
                                variant: "destructive",
                              });
                            });
                        } else {
                          setActiveDetailTab('contacts');
                        }
                      }}
                    >
                      <Phone className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-2xl font-bold text-green-300">{extractionSummary.contactsFound}</p>
                      <p className="text-sm text-green-400">Contacts</p>
                    </div>
                    
                    <div 
                      className="p-4 border border-green-800/30 bg-gray-900/50 rounded-lg flex flex-col items-center cursor-pointer hover:bg-green-900/30"
                      onClick={() => {
                        // Get the actual extraction data if not already loaded
                        if (!extractionData && extractionSummary?.url) {
                          fetch(`/api/scrapy/results?url=${encodeURIComponent(extractionSummary.url)}`)
                            .then(res => res.json())
                            .then(data => {
                              if (data.success && data.results) {
                                setExtractionData(data.results);
                                setActiveDetailTab('images');
                              } else {
                                toast({
                                  title: "Error Loading Results",
                                  description: data.message || "There was a problem loading the extraction results.",
                                  variant: "destructive",
                                });
                              }
                            })
                            .catch(err => {
                              console.error("Error loading extraction data:", err);
                              toast({
                                title: "Error Loading Results",
                                description: "Failed to load extraction results. Please try again.",
                                variant: "destructive",
                              });
                            });
                        } else {
                          setActiveDetailTab('images');
                        }
                      }}
                    >
                      <Image className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-2xl font-bold text-green-300">{extractionSummary.imagesFound}</p>
                      <p className="text-sm text-green-400">Images</p>
                    </div>
                    
                    <div 
                      className="p-4 border border-green-800/30 bg-gray-900/50 rounded-lg flex flex-col items-center cursor-pointer hover:bg-green-900/30"
                      onClick={() => {
                        // Get the actual extraction data if not already loaded
                        if (!extractionData && extractionSummary?.url) {
                          fetch(`/api/scrapy/results?url=${encodeURIComponent(extractionSummary.url)}`)
                            .then(res => res.json())
                            .then(data => {
                              if (data.success && data.results) {
                                setExtractionData(data.results);
                                setActiveDetailTab('books');
                              } else {
                                toast({
                                  title: "Error Loading Results",
                                  description: data.message || "There was a problem loading the extraction results.",
                                  variant: "destructive",
                                });
                              }
                            })
                            .catch(err => {
                              console.error("Error loading extraction data:", err);
                              toast({
                                title: "Error Loading Results",
                                description: "Failed to load extraction results. Please try again.",
                                variant: "destructive",
                              });
                            });
                        } else {
                          setActiveDetailTab('books');
                        }
                      }}
                    >
                      <Book className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-2xl font-bold text-green-300">{extractionSummary.booksFound}</p>
                      <p className="text-sm text-green-400">Books</p>
                    </div>
                    
                    <div className="p-4 border border-green-800/30 bg-gray-900/50 rounded-lg flex flex-col items-center">
                      <MessageSquare className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-2xl font-bold text-green-300">{extractionSummary.socialMediaFound}</p>
                      <p className="text-sm text-green-400">Social Media</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <Alert className="bg-green-900/30 border-green-800">
                      <AlertTitle className="text-green-300">Knowledge Base Update</AlertTitle>
                      <AlertDescription className="text-green-200">
                        <span className="font-bold text-green-300">{extractionSummary.itemsAddedToKnowledgeBase}</span> new items were added to the knowledge base.
                      </AlertDescription>
                    </Alert>
                    
                    {/* Action panel for manual content extraction */}
                    <div className="p-4 border border-green-700/30 rounded-lg bg-green-900/20">
                      <h3 className="text-xl font-semibold text-green-300 mb-2">Manual Content Actions</h3>
                      <p className="text-green-200 mb-4">
                        Content has been categorized by type (events, books, contacts, etc.) and linked to original sources.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          className="bg-green-700 hover:bg-green-600 text-white"
                          onClick={async () => {
                            try {
                              toast({
                                title: "Saving Extraction Results",
                                description: `Adding ${extractionSummary.contactsFound} contacts and ${extractionSummary.eventsFound + extractionSummary.booksFound + extractionSummary.socialMediaFound} other items to the knowledge base.`,
                                variant: "default",
                              });
                              
                              // Call the actual API endpoint to save the extracted content
                              const response = await fetch('/api/scrapy/save-extraction', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  url: extractionSummary.url,
                                }),
                              });
                              
                              const result = await response.json();
                              
                              if (result.success) {
                                toast({
                                  title: "Content Added Successfully",
                                  description: `${result.itemsAdded} items have been added to your knowledge database.`,
                                  variant: "default",
                                });
                                
                                // Update the extraction summary with the new count
                                setExtractionSummary({
                                  ...extractionSummary,
                                  itemsAddedToKnowledgeBase: result.itemsAdded,
                                });
                              } else {
                                toast({
                                  title: "Error Saving Content",
                                  description: result.message || "There was a problem saving the content to the database.",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Error saving extraction:", error);
                              toast({
                                title: "Error Saving Content",
                                description: "Failed to connect to the server. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Save All Content to Knowledge Base
                        </Button>
                        <Button
                          variant="outline" 
                          className="border-green-700 text-green-200 hover:bg-green-800/30"
                          onClick={() => setActiveTab('extract')}
                        >
                          Extract Different Website
                        </Button>
                      </div>
                    </div>
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