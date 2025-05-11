import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Lightbulb, RefreshCw, Save, Plus } from 'lucide-react';

interface ContentItem {
  id: number;
  title: string;
  content: string;
  contentType: string;
  source: string | null;
  status: string;
  mediaUrl?: string | null;
}

interface ContentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem | null;
}

export default function ContentEditDialog({ isOpen, onClose, content }: ContentEditDialogProps) {
  const [title, setTitle] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [contentType, setContentType] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState('content');
  const [extractedFacts, setExtractedFacts] = useState<string[]>([]);
  const [existingFacts, setExistingFacts] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExtractingFacts, setIsExtractingFacts] = useState(false);
  const [isSavingFact, setIsSavingFact] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch source-specific facts when content changes
  const { data: factsData, refetch: refetchFacts } = useQuery({
    queryKey: [`/api/ai-knowledge/${content?.id}/facts`],
    queryFn: async () => {
      if (!content?.id) return { success: true, facts: [] };
      
      const response = await apiRequest('GET', `/api/ai-knowledge/${content.id}/facts`);
      return response.json();
    },
    enabled: !!content?.id && isOpen,
  });

  useEffect(() => {
    if (factsData?.facts) {
      setExistingFacts(factsData.facts);
      
      // If there are existing facts, switch to the facts tab
      if (factsData.facts.length > 0 && activeTab === 'content') {
        setActiveTab('facts');
      }
    }
  }, [factsData]);

  useEffect(() => {
    if (content) {
      setTitle(content.title || '');
      setBodyContent(content.content || '');
      setContentType(content.contentType || '');
      setSource(content.source || '');
      setStatus(content.status || '');
      
      // Reset extracted facts when content changes
      setExtractedFacts([]);
    }
  }, [content]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/ai-knowledge/${content?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Content updated',
        description: 'The content has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating content',
        description: error.message || 'An error occurred while updating the content.',
        variant: 'destructive',
      });
    },
  });

  const refreshWebsiteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/ai-knowledge/refresh-website`, data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setBodyContent(data.content.content);
      setTitle(data.content.title);
      
      if (data.extractedFacts && data.extractedFacts.length > 0) {
        setExtractedFacts(data.extractedFacts);
        setActiveTab('facts');
      }
      
      toast({
        title: 'Content refreshed',
        description: 'Website content has been refreshed successfully.',
      });
      
      setIsRefreshing(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error refreshing content',
        description: error.message || 'An error occurred while refreshing the content.',
        variant: 'destructive',
      });
      setIsRefreshing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      title,
      content: bodyContent,
      contentType,
      source,
      status,
    });
  };

  const handleRefreshWebsite = () => {
    if (!source || !source.startsWith('http')) {
      toast({
        title: 'Invalid source URL',
        description: 'Please enter a valid URL to refresh content.',
        variant: 'destructive',
      });
      return;
    }

    setIsRefreshing(true);
    refreshWebsiteMutation.mutate({
      id: content?.id,
      url: source,
      extractFacts: true,
      saveExtractedFacts: false
    });
  };

  const saveFactToDb = async (factContent: string) => {
    try {
      setIsSavingFact(true);
      
      // Add the fact directly to bamboo_facts table
      const response = await apiRequest('POST', '/api/bamboo-facts', {
        fact: factContent,
        sourceContentId: content?.id
      });
      
      // Refresh the facts list
      refetchFacts();
      
      toast({
        title: 'Fact saved',
        description: 'The fact has been associated with this content.',
      });
      
      // Remove from the extracted facts list
      setExtractedFacts(prev => prev.filter(fact => fact !== factContent));
      
      setIsSavingFact(false);
    } catch (error: any) {
      toast({
        title: 'Error saving fact',
        description: error.message || 'An error occurred while saving the fact.',
        variant: 'destructive',
      });
      setIsSavingFact(false);
    }
  };
  
  // For backward compatibility - saves to general fact pool
  const saveFact = async (factContent: string) => {
    try {
      setIsExtractingFacts(true);
      
      // Save fact to this specific content source
      await saveFactToDb(factContent);
      
      // Also add the fact to the knowledge base (legacy approach)
      await apiRequest('POST', '/api/ai-knowledge', {
        title: `Bamboo Fact from ${title}`,
        content: factContent,
        contentType: 'fact',
        source: source || null,
        status: 'active'
      });
      
      toast({
        title: 'Fact added',
        description: 'The fact has been added to the "Did You Know" section.',
      });
      
      setIsExtractingFacts(false);
    } catch (error: any) {
      toast({
        title: 'Error adding fact',
        description: error.message || 'An error occurred while adding the fact.',
        variant: 'destructive',
      });
      setIsExtractingFacts(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Content</span>
            
            <div className="flex gap-2">
              {source && source.startsWith('http') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshWebsite}
                  disabled={isRefreshing}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Re-crawl Content'}
                </Button>
              )}
              
              <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                {status}
              </Badge>
              
              <Badge variant="outline">{contentType}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="facts" className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4" />
              Facts
              {extractedFacts.length > 0 && (
                <Badge variant="outline" className="ml-1">{extractedFacts.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content-type" className="text-right">
                  Content Type
                </Label>
                <Select
                  value={contentType}
                  onValueChange={setContentType}
                >
                  <SelectTrigger className="col-span-3" id="content-type">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="blog_post">Blog Post</SelectItem>
                    <SelectItem value="webpage">Webpage</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="fact">Fact</SelectItem>
                    <SelectItem value="enthusiast">Bamboo Enthusiast</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="source" className="text-right">
                  Source
                </Label>
                <Input
                  id="source"
                  placeholder="URL or source reference"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="col-span-3" id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <Label htmlFor="content" className="text-right">
                  Content
                </Label>
                <Textarea
                  id="content"
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  className="col-span-3 min-h-[300px]"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="facts" className="space-y-4 pt-4">
            {/* Existing Facts Section */}
            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Source-Specific Facts</h3>
                <Badge variant="outline">{existingFacts.length}</Badge>
              </div>
              
              <div className="space-y-4">
                {existingFacts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No source-specific facts yet.</p>
                  </div>
                ) : (
                  existingFacts.map((fact, index) => (
                    <div key={index} className="border rounded-md p-3 bg-amber-950/30">
                      <p className="mb-2">{fact}</p>
                      <div className="flex justify-end">
                        <Button 
                          variant="outline"
                          size="sm"
                          disabled={true}
                          className="text-xs"
                        >
                          <Save className="h-3 w-3 mr-1 opacity-50" />
                          Saved
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Extracted Facts Section */}
            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Extract New Facts</h3>
                {source && source.startsWith('http') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshWebsite}
                    disabled={isRefreshing}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Extracting...' : 'Extract New Facts'}
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {extractedFacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No new facts extracted yet.</p>
                    <p className="text-sm">Click "Extract New Facts" to analyze this content for bamboo facts.</p>
                  </div>
                ) : (
                  extractedFacts.map((fact, index) => (
                    <div key={index} className="border rounded-md p-3 bg-muted/30">
                      <p className="mb-2">{fact}</p>
                      <div className="flex justify-end">
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => saveFact(fact)}
                          disabled={isExtractingFacts || isSavingFact}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Save Fact
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}