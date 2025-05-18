import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Lightbulb, RefreshCw, Save, Plus, Trash2, AlertTriangle, Sparkles,
  Calendar, Book, MessageSquare, FileText, Info, Upload, Check,
  User, Link, Mail, Phone, Linkedin, Instagram, Twitter, Facebook
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContentItem {
  id: number;
  title: string;
  content: string;
  contentType: string;
  source: string | null;
  status: string;
  mediaUrl?: string | null;
  rawContent?: string | null;
  lastResummarizedAt?: Date | null;
  
  // Event fields
  eventDate?: string | null;
  eventEndDate?: string | null;
  eventTimings?: string | null;
  eventLocation?: string | null;
  registrationLink?: string | null;
  price?: string | null;
  currency?: string | null;
  priceRange?: string | null;
  discountPrice?: string | null;
  additionalInfo?: string | null;
  
  // Book fields
  authorName?: string | null;
  publicationYear?: string | null;
  publisherName?: string | null;
  purchaseLink?: string | null;
  
  // Enthusiast fields
  contactEmail?: string | null;
  contactPhone?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
  personalWebsite?: string | null;
  
  // Social media fields
  embedCode?: string | null;
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
  const [existingFacts, setExistingFacts] = useState<Array<{id: number, fact: string}>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResummarizing, setIsResummarizing] = useState(false);
  const [isExtractingFacts, setIsExtractingFacts] = useState(false);
  const [isSavingFact, setIsSavingFact] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [factToDelete, setFactToDelete] = useState<number | null>(null);
  
  // Content-specific fields
  // Event fields
  const [eventDate, setEventDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventTimings, setEventTimings] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [priceRange, setPriceRange] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Book fields
  const [authorName, setAuthorName] = useState('');
  const [purchaseLink, setPurchaseLink] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [publisherName, setPublisherName] = useState('');
  
  // Enthusiast fields
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [personalWebsite, setPersonalWebsite] = useState('');
  
  // Social media fields
  const [embedCode, setEmbedCode] = useState('');
  
  // Media URL
  const [mediaUrl, setMediaUrl] = useState('');
  
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
      // Set basic fields
      setTitle(content.title || '');
      setBodyContent(content.content || '');
      setContentType(content.contentType || '');
      setSource(content.source || '');
      setStatus(content.status || '');
      setMediaUrl(content.mediaUrl || '');
      
      // Set content type specific fields
      // Event fields
      setEventDate(content.eventDate || '');
      setEventEndDate(content.eventEndDate || '');
      setEventTimings(content.eventTimings || '');
      setEventLocation(content.eventLocation || '');
      setRegistrationLink(content.registrationLink || '');
      setPrice(content.price || '');
      setCurrency(content.currency || 'INR');
      setPriceRange(content.priceRange || '');
      setDiscountPrice(content.discountPrice || '');
      setAdditionalInfo(content.additionalInfo || '');
      
      // Book fields
      setAuthorName(content.authorName || '');
      setPurchaseLink(content.purchaseLink || '');
      setPublicationYear(content.publicationYear || '');
      setPublisherName(content.publisherName || '');
      
      // Enthusiast fields
      setContactEmail(content.contactEmail || '');
      setContactPhone(content.contactPhone || '');
      setLinkedinUrl(content.linkedinUrl || '');
      setInstagramUrl(content.instagramUrl || '');
      setTwitterUrl(content.twitterUrl || '');
      setFacebookUrl(content.facebookUrl || '');
      setPersonalWebsite(content.personalWebsite || '');
      
      // Social media fields
      setEmbedCode(content.embedCode || '');
      
      // Reset extracted facts when content changes
      setExtractedFacts([]);
      
      // Set the active tab based on content type
      if (content.contentType === 'event' || content.contentType === 'competition') {
        setActiveTab('event');
      } else if (content.contentType === 'book') {
        setActiveTab('book');
      } else if (content.contentType === 'enthusiast') {
        setActiveTab('enthusiast');
      } else if (content.contentType === 'social') {
        setActiveTab('social');
      } else {
        setActiveTab('content');
      }
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
  
  const resummarizeContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      return apiRequest('POST', `/api/ai-knowledge/regenerate-summary`, { id: contentId });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      if (data.success && data.content) {
        setBodyContent(data.content.content);
        
        // Update all form fields with the latest data
        setTitle(data.content.title);
        
        if (data.message) {
          toast({
            title: 'Content resummarized',
            description: data.message,
          });
        } else {
          toast({
            title: 'Content resummarized',
            description: 'The content has been regenerated successfully.',
          });
        }
        
        // If the content has extracted facts, refresh them
        if (content?.id) {
          refetchFacts();
        }
      } else {
        toast({
          title: 'Warning',
          description: data.error || 'Re-summarization may not have completed successfully.',
          variant: 'destructive',
        });
      }
      
      setIsResummarizing(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error resummarizing content',
        description: error.message || 'Unable to regenerate content from stored data.',
        variant: 'destructive',
      });
      setIsResummarizing(false);
    },
  });

  const handleSave = () => {
    // Common fields for all content types
    const baseData = {
      title,
      content: bodyContent,
      contentType,
      source,
      status,
      mediaUrl
    };
    
    // Add type-specific fields based on content type
    let updateData = { ...baseData };
    
    if (contentType === 'event' || contentType === 'competition') {
      updateData = {
        ...updateData,
        eventDate,
        eventEndDate,
        eventTimings,
        eventLocation,
        registrationLink,
        price,
        currency,
        priceRange,
        discountPrice,
        additionalInfo
      };
    } else if (contentType === 'book') {
      updateData = {
        ...updateData,
        authorName,
        publicationYear,
        publisherName,
        purchaseLink
      };
    } else if (contentType === 'enthusiast') {
      updateData = {
        ...updateData,
        contactEmail,
        contactPhone,
        linkedinUrl,
        instagramUrl,
        twitterUrl,
        facebookUrl,
        personalWebsite
      };
    } else if (contentType === 'social') {
      updateData = {
        ...updateData,
        embedCode
      };
    }
    
    updateMutation.mutate(updateData);
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
  
  const handleResummarizeContent = () => {
    if (!content?.id) {
      toast({
        title: 'Cannot resummarize content',
        description: 'Content ID is missing.',
        variant: 'destructive',
      });
      return;
    }
    
    // If this is a web page and we have a source but no raw content,
    // inform the user that we'll try to re-crawl the page
    if (!content.rawContent && content.source && 
        (content.source.startsWith('http') || 
         content.contentType === 'webpage' || 
         content.contentType === 'article')) {
      toast({
        title: 'Re-crawling content',
        description: 'No raw content found. Attempting to re-crawl the source URL first.',
      });
    }
    
    setIsResummarizing(true);
    resummarizeContentMutation.mutate(content.id);
    
    // Update the UI to show correct indicators
    queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
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
  
  // Function to open delete confirmation dialog
  const confirmDeleteFact = (factId: number) => {
    setFactToDelete(factId);
    setIsDeleteDialogOpen(true);
  };
  
  // Delete a fact from the database
  const deleteFact = async () => {
    if (!factToDelete) return;
    
    try {
      setIsSavingFact(true);
      
      // Delete the fact
      await apiRequest('DELETE', `/api/bamboo-facts/${factToDelete}`);
      
      // Update the UI by removing the deleted fact
      setExistingFacts(prev => prev.filter(f => f.id !== factToDelete));
      
      toast({
        title: 'Fact deleted',
        description: 'The fact has been removed from this content source.',
      });
      
      // Reset state
      setFactToDelete(null);
      setIsDeleteDialogOpen(false);
      setIsSavingFact(false);
    } catch (error: any) {
      toast({
        title: 'Error deleting fact',
        description: error.message || 'An error occurred while deleting the fact.',
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
    <>
      {/* Alert Dialog for Fact Deletion Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setFactToDelete(null);
                setIsDeleteDialogOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteFact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[95vw] max-w-full sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[700px] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Edit Content</span>
            
            <div className="flex flex-wrap gap-2">
              {source && source.startsWith('http') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshWebsite}
                  disabled={isRefreshing || isResummarizing}
                  className="flex items-center gap-1 text-xs sm:text-sm"
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Re-crawl Content'}
                </Button>
              )}
              
              {/* Show for all content types */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResummarizeContent}
                  disabled={isResummarizing || isRefreshing}
                  className="flex items-center gap-1 text-xs sm:text-sm"
                  title={content?.rawContent ? "Regenerate summary using stored raw content" : "Attempt to re-crawl and regenerate summary"}
                >
                  <Sparkles className={`h-3 w-3 sm:h-4 sm:w-4 ${isResummarizing ? 'animate-spin' : ''}`} />
                  {isResummarizing ? 'Processing...' : 'Resummarize'}
                </Button>
              
              <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                {status}
              </Badge>
              
              <Badge variant="outline">{contentType}</Badge>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit content details and extract bamboo facts from the source
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="content" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="event" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Event
            </TabsTrigger>
            <TabsTrigger value="book" className="flex items-center gap-1">
              <Book className="h-4 w-4" />
              Book
            </TabsTrigger>
            <TabsTrigger value="enthusiast" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Enthusiast
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              Social
            </TabsTrigger>
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
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="title" className="sm:text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="content-type" className="sm:text-right">
                  Content Type
                </Label>
                <div className="col-span-1 sm:col-span-3">
                  <Select
                    value={contentType}
                    onValueChange={setContentType}
                  >
                    <SelectTrigger id="content-type">
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
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="source" className="sm:text-right">
                  Source
                </Label>
                <Input
                  id="source"
                  placeholder="URL or source reference"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="status" className="sm:text-right">
                  Status
                </Label>
                <div className="col-span-1 sm:col-span-3">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                <Label htmlFor="content" className="sm:text-right">
                  Content
                </Label>
                <div className="col-span-1 sm:col-span-3 space-y-2">
                  <Textarea
                    id="content"
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                    className="w-full min-h-[200px] sm:min-h-[300px]"
                  />
                  {content?.rawContent && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleResummarizeContent}
                      disabled={isResummarizing}
                      className="flex items-center gap-1 text-xs sm:text-sm ml-auto"
                    >
                      <Sparkles className={`h-3 w-3 sm:h-4 sm:w-4 ${isResummarizing ? 'animate-spin' : ''}`} />
                      {isResummarizing ? 'Processing...' : 'Resummarize Content'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Event Tab */}
          <TabsContent value="event" className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="eventDate" className="sm:text-right">
                  Event Date
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate || ''}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="eventEndDate" className="sm:text-right">
                  End Date (optional)
                </Label>
                <Input
                  id="eventEndDate"
                  type="date"
                  value={eventEndDate || ''}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="eventTimings" className="sm:text-right">
                  Timings
                </Label>
                <Input
                  id="eventTimings"
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                  value={eventTimings || ''}
                  onChange={(e) => setEventTimings(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="eventLocation" className="sm:text-right">
                  Location
                </Label>
                <Input
                  id="eventLocation"
                  value={eventLocation || ''}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="registrationLink" className="sm:text-right">
                  Registration Link
                </Label>
                <Input
                  id="registrationLink"
                  value={registrationLink || ''}
                  onChange={(e) => setRegistrationLink(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="price" className="sm:text-right">
                  Price
                </Label>
                <div className="col-span-1 sm:col-span-3 grid grid-cols-2 gap-2">
                  <Input
                    id="price"
                    placeholder="e.g., 500"
                    value={price || ''}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <Select 
                    value={currency || 'INR'} 
                    onValueChange={(value) => setCurrency(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="priceRange" className="sm:text-right">
                  Price Range (optional)
                </Label>
                <Input
                  id="priceRange"
                  placeholder="e.g., ₹500-₹1000"
                  value={priceRange || ''}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="discountPrice" className="sm:text-right">
                  Discount Price (optional)
                </Label>
                <Input
                  id="discountPrice"
                  placeholder="e.g., 400"
                  value={discountPrice || ''}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <Label htmlFor="additionalInfo" className="sm:text-right pt-2">
                  Additional Info
                </Label>
                <Textarea
                  id="additionalInfo"
                  value={additionalInfo || ''}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="min-h-[100px] col-span-1 sm:col-span-3"
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Book Tab */}
          <TabsContent value="book" className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="authorName" className="sm:text-right">
                  Author Name
                </Label>
                <Input
                  id="authorName"
                  value={authorName || ''}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="publicationYear" className="sm:text-right">
                  Publication Year
                </Label>
                <Input
                  id="publicationYear"
                  value={publicationYear || ''}
                  onChange={(e) => setPublicationYear(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="publisherName" className="sm:text-right">
                  Publisher
                </Label>
                <Input
                  id="publisherName"
                  value={publisherName || ''}
                  onChange={(e) => setPublisherName(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="purchaseLink" className="sm:text-right">
                  Purchase Link
                </Label>
                <Input
                  id="purchaseLink"
                  value={purchaseLink || ''}
                  onChange={(e) => setPurchaseLink(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Enthusiast Tab */}
          <TabsContent value="enthusiast" className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="contactEmail" className="sm:text-right">
                  <Mail className="h-4 w-4 inline mr-1" /> Email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail || ''}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="contactPhone" className="sm:text-right">
                  <Phone className="h-4 w-4 inline mr-1" /> Phone
                </Label>
                <Input
                  id="contactPhone"
                  value={contactPhone || ''}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="personalWebsite" className="sm:text-right">
                  <Link className="h-4 w-4 inline mr-1" /> Website
                </Label>
                <Input
                  id="personalWebsite"
                  value={personalWebsite || ''}
                  onChange={(e) => setPersonalWebsite(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="linkedinUrl" className="sm:text-right">
                  <Linkedin className="h-4 w-4 inline mr-1" /> LinkedIn
                </Label>
                <Input
                  id="linkedinUrl"
                  value={linkedinUrl || ''}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="instagramUrl" className="sm:text-right">
                  <Instagram className="h-4 w-4 inline mr-1" /> Instagram
                </Label>
                <Input
                  id="instagramUrl"
                  value={instagramUrl || ''}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="twitterUrl" className="sm:text-right">
                  <Twitter className="h-4 w-4 inline mr-1" /> Twitter
                </Label>
                <Input
                  id="twitterUrl"
                  value={twitterUrl || ''}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="facebookUrl" className="sm:text-right">
                  <Facebook className="h-4 w-4 inline mr-1" /> Facebook
                </Label>
                <Input
                  id="facebookUrl"
                  value={facebookUrl || ''}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="col-span-1 sm:col-span-3"
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <Label htmlFor="embedCode" className="sm:text-right pt-2">
                  Embed Code
                </Label>
                <Textarea
                  id="embedCode"
                  value={embedCode || ''}
                  onChange={(e) => setEmbedCode(e.target.value)}
                  className="min-h-[150px] col-span-1 sm:col-span-3 font-mono text-xs"
                  placeholder="<iframe>, <blockquote> or other social media embed code..."
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <div className="sm:text-right pt-2">
                  <Label>Preview</Label>
                  <p className="text-xs text-muted-foreground mt-1">This preview may not be fully functional</p>
                </div>
                <div className="col-span-1 sm:col-span-3 border rounded-md p-4 min-h-[150px] bg-background">
                  {embedCode ? (
                    <div dangerouslySetInnerHTML={{ __html: embedCode }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No embed code provided
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="facts" className="space-y-4 pt-4">
            {/* Existing Facts Section - Only shows facts from this specific source */}
            <div className="border rounded-md p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-medium">Facts from This Source</h3>
                <span><Badge variant="outline">{existingFacts.length}</Badge></span>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {existingFacts.length === 0 ? (
                  <div className="text-center py-3 sm:py-4 text-muted-foreground">
                    <p>No facts have been extracted from this specific source yet.</p>
                  </div>
                ) : (
                  existingFacts.map((fact) => (
                    <div key={fact.id} className="border rounded-md p-2 sm:p-3 bg-amber-950/30">
                      <p className="mb-2 text-sm sm:text-base">{fact.fact}</p>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          disabled={isSavingFact}
                          onClick={() => confirmDeleteFact(fact.id)}
                          className="text-xs border-destructive text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Extracted Facts Section */}
            <div className="border rounded-md p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-medium">Extract New Facts</h3>
                {source && source.startsWith('http') && (
                  <span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRefreshWebsite}
                      disabled={isRefreshing}
                      className="flex items-center gap-1 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Extracting...' : 'Extract Facts from Source'}
                    </Button>
                  </span>
                )}
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {extractedFacts.length === 0 ? (
                  <div className="text-center py-4 sm:py-8 text-muted-foreground">
                    <Lightbulb className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm sm:text-base">No new facts found to extract.</p>
                    {source && source.startsWith('http') ? (
                      <p className="text-xs sm:text-sm">Click "Extract Facts from Source" to analyze this content for bamboo facts.</p>
                    ) : (
                      <p className="text-xs sm:text-sm">Enter a valid URL source to extract facts automatically.</p>
                    )}
                  </div>
                ) : (
                  extractedFacts.map((fact, index) => (
                    <div key={index} className="border rounded-md p-2 sm:p-3 bg-muted/30">
                      <p className="mb-2 text-sm sm:text-base">{fact}</p>
                      <div className="flex justify-end">
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => saveFactToDb(fact)}
                          disabled={isExtractingFacts || isSavingFact}
                          className="bg-amber-600 hover:bg-amber-700 text-xs sm:text-sm"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Save to This Source
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 sm:mt-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            size="sm"
            className="sm:mr-2 w-full sm:w-auto text-xs sm:text-sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}