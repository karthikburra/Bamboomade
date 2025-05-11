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
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Lightbulb, RefreshCw } from 'lucide-react';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExtractingFacts, setIsExtractingFacts] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (content) {
      setTitle(content.title || '');
      setBodyContent(content.content || '');
      setContentType(content.contentType || '');
      setSource(content.source || '');
      setStatus(content.status || '');
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
    onSuccess: (response) => {
      const data = response.data;
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
      extractFacts: true
    });
  };

  const saveFact = async (factContent: string) => {
    try {
      setIsExtractingFacts(true);
      
      // Add the fact to the knowledge base
      const response = await apiRequest('POST', '/api/ai-knowledge', {
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
      
      // Remove from the extracted facts list
      setExtractedFacts(prev => prev.filter(fact => fact !== factContent));
      
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
            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Extracted Bamboo Facts</h3>
                {source && source.startsWith('http') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshWebsite}
                    disabled={isRefreshing}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Extract New Facts
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {extractedFacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No facts extracted from this content yet.</p>
                    <p className="text-sm">Click "Re-crawl Content" to extract facts from this source.</p>
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
                          disabled={isExtractingFacts}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <Lightbulb className="h-4 w-4 mr-1" />
                          Add as Fact
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