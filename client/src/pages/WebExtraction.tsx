import React, { useState } from 'react';
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
import { Loader2, Globe, FileText, Calendar, Users, Image, Book, MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/hooks/useAuth';

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

const WebExtraction = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [url, setUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState<string>('2');
  const [isUrlValid, setIsUrlValid] = useState(true);
  const [activeTab, setActiveTab] = useState('extract');
  const [extractionSummary, setExtractionSummary] = useState<ExtractSummary | null>(null);
  
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
    <div className="max-w-4xl mx-auto mt-12 pb-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Web Content Extraction</h1>
        <p className="text-lg text-muted-foreground">
          Extract content from websites and add it to the Bamboo Knowledge Base
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="extract">Extract Content</TabsTrigger>
          <TabsTrigger value="status">Extraction Status</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="extract">
          <Card>
            <CardHeader>
              <CardTitle>Start Web Extraction</CardTitle>
              <CardDescription>
                Enter a URL to extract content from. Our system will crawl the website and extract 
                relevant information about bamboo architecture, events, contacts, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExtract} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <Input
                    id="url"
                    type="text"
                    placeholder="https://example.com"
                    value={url}
                    onChange={handleUrlChange}
                    className={!isUrlValid ? "border-red-500" : ""}
                  />
                  {!isUrlValid && (
                    <p className="text-sm text-red-500">
                      Please enter a valid URL starting with http:// or https://
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxDepth">Crawl Depth</Label>
                  <Select
                    value={maxDepth}
                    onValueChange={(value) => setMaxDepth(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select crawl depth" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Minimal (1 level)</SelectItem>
                      <SelectItem value="2">Standard (2 levels)</SelectItem>
                      <SelectItem value="3">Deep (3 levels)</SelectItem>
                      <SelectItem value="4">Very Deep (4 levels)</SelectItem>
                      <SelectItem value="5">Exhaustive (5 levels)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Higher depth values will extract more content but take longer to complete.
                  </p>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleExtract} 
                disabled={extractMutation.isPending}
                className="w-full"
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
          <Card>
            <CardHeader>
              <CardTitle>Extraction Status</CardTitle>
              <CardDescription>
                Current status of the web extraction process.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {extractMutation.isPending ? (
                <div className="space-y-4">
                  <p>Extracting content from {url}</p>
                  <Progress value={50} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Please wait while we crawl the website and extract content.
                    This process may take several minutes depending on the size of the website.
                  </p>
                </div>
              ) : extractionStatus.isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : extractionStatus.isError ? (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to fetch extraction status. Please try again.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <p>{extractionStatus.data?.status || "No active extractions"}</p>
                  {extractionStatus.data?.isRunning && (
                    <Progress value={75} className="h-2" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Extraction Results</CardTitle>
              <CardDescription>
                Summary of content extracted from the website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {extractionSummary ? (
                <div className="space-y-6">
                  <p className="font-medium">Content extracted from: {extractionSummary.url}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg flex flex-col items-center">
                      <FileText className="h-8 w-8 text-primary mb-2" />
                      <p className="text-2xl font-bold">{extractionSummary.pagesFound}</p>
                      <p className="text-sm text-muted-foreground">Pages</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg flex flex-col items-center">
                      <Calendar className="h-8 w-8 text-primary mb-2" />
                      <p className="text-2xl font-bold">{extractionSummary.eventsFound}</p>
                      <p className="text-sm text-muted-foreground">Events</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg flex flex-col items-center">
                      <Users className="h-8 w-8 text-primary mb-2" />
                      <p className="text-2xl font-bold">{extractionSummary.contactsFound}</p>
                      <p className="text-sm text-muted-foreground">Contacts</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg flex flex-col items-center">
                      <Image className="h-8 w-8 text-primary mb-2" />
                      <p className="text-2xl font-bold">{extractionSummary.imagesFound}</p>
                      <p className="text-sm text-muted-foreground">Images</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg flex flex-col items-center">
                      <Book className="h-8 w-8 text-primary mb-2" />
                      <p className="text-2xl font-bold">{extractionSummary.booksFound}</p>
                      <p className="text-sm text-muted-foreground">Books</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg flex flex-col items-center">
                      <MessageSquare className="h-8 w-8 text-primary mb-2" />
                      <p className="text-2xl font-bold">{extractionSummary.socialMediaFound}</p>
                      <p className="text-sm text-muted-foreground">Social Media</p>
                    </div>
                  </div>
                  
                  <Alert className="mt-6">
                    <AlertTitle>Knowledge Base Update</AlertTitle>
                    <AlertDescription>
                      {extractionSummary.itemsAddedToKnowledgeBase} new items were added to the knowledge base.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No extraction results to display yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
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
                className="w-full"
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