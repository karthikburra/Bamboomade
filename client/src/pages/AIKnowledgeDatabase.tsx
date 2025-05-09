import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// UI Components
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Import Admin Components
import AdminTabs from '@/components/AdminTabs';

// Import Icons
import { Database, Link, FileText, Search, Edit, Trash, ExternalLink, FilePlus, BookOpen, List, Calendar, Image, Video, Instagram, Youtube, Newspaper, Info, Download, Upload, MoreHorizontal, RefreshCw, CheckCircle } from 'lucide-react';

// Knowledge Content Types
const CONTENT_TYPES = [
  { value: "webpage", label: "Webpage", icon: <BookOpen className="w-4 h-4" /> },
  { value: "article", label: "Article", icon: <Newspaper className="w-4 h-4" /> },
  { value: "blog_post", label: "Blog Post", icon: <FileText className="w-4 h-4" /> },
  { value: "event", label: "Event", icon: <Calendar className="w-4 h-4" /> },
  { value: "image", label: "Image", icon: <Image className="w-4 h-4" /> },
  { value: "video", label: "Video", icon: <Video className="w-4 h-4" /> },
  { value: "instagram_post", label: "Instagram Post", icon: <Instagram className="w-4 h-4" /> },
  { value: "youtube_video", label: "YouTube Video", icon: <Youtube className="w-4 h-4" /> },
  { value: "fact", label: "Bamboo Fact", icon: <Info className="w-4 h-4" /> },
];

// Status types
const STATUS_TYPES = [
  { value: "active", label: "Active", className: "bg-green-800/30 text-green-400 border-green-800" },
  { value: "draft", label: "Draft", className: "bg-amber-800/30 text-amber-400 border-amber-800" },
  { value: "archived", label: "Archived", className: "bg-gray-700/30 text-gray-400 border-gray-600" },
];

// Get platform icon based on source or content type
const getPlatformIcon = (source: string | null, contentType: string) => {
  if (!source) return <Link className="w-4 h-4" />;
  
  const sourceUrl = source.toLowerCase();
  
  if (sourceUrl.includes('instagram')) return <Instagram className="w-4 h-4" />;
  if (sourceUrl.includes('youtube') || contentType === 'youtube_video') return <Youtube className="w-4 h-4" />;
  if (sourceUrl.includes('medium') || sourceUrl.includes('blog')) return <Newspaper className="w-4 h-4" />;
  if (contentType === 'image') return <Image className="w-4 h-4" />;
  if (contentType === 'video') return <Video className="w-4 h-4" />;
  if (contentType === 'event') return <Calendar className="w-4 h-4" />;
  
  return <Link className="w-4 h-4" />;
};

// Get status badge style
const getStatusBadgeClass = (status: string) => {
  const statusObj = STATUS_TYPES.find(s => s.value === status);
  return statusObj ? statusObj.className : "bg-gray-700/30 text-gray-400 border-gray-600";
};

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Truncate text with ellipsis
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

interface AiKnowledgeContent {
  id: number;
  title: string;
  content: string;
  source: string | null;
  status: string;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  mediaUrl: string | null;
  mediaType: string | null;
  socialMediaInfo: any | null;
}

const AIKnowledgeDatabase: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingContent, setEditingContent] = useState<AiKnowledgeContent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [contentToDelete, setContentToDelete] = useState<AiKnowledgeContent | null>(null);
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isLoadingQuery, setIsLoadingQuery] = useState<boolean>(false);

  // Fetch all knowledge content
  const { data: knowledgeContent, isLoading, refetch } = useQuery<AiKnowledgeContent[]>({
    queryKey: ['/api/ai-knowledge'],
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (content: Partial<AiKnowledgeContent> & { id: number }) => {
      const { id, ...updateData } = content;
      return apiRequest('PUT', `/api/ai-knowledge/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
      toast({
        title: "Content updated",
        description: "The knowledge content was updated successfully",
        variant: "default",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: "There was an error updating the content",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/ai-knowledge/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
      toast({
        title: "Content deleted",
        description: "The knowledge content was deleted successfully",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      setContentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the content",
        variant: "destructive",
      });
    }
  });

  // Bulk action mutation
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string, ids: number[] }) => {
      return apiRequest('POST', `/api/ai-knowledge/bulk-action`, { action, ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
      toast({
        title: "Bulk action completed",
        description: `Successfully applied ${bulkAction} to ${selectedItems.length} items`,
        variant: "default",
      });
      setIsBulkActionDialogOpen(false);
      setSelectedItems([]);
      setBulkAction('');
    },
    onError: (error) => {
      toast({
        title: "Bulk action failed",
        description: "There was an error applying the bulk action",
        variant: "destructive",
      });
    }
  });

  // Execute SQL-like query
  const executeQuery = async () => {
    if (!sqlQuery.trim()) return;
    
    setIsLoadingQuery(true);
    
    try {
      const response = await apiRequest('POST', '/api/ai-knowledge/query', { query: sqlQuery });
      const data = await response.json();
      setQueryResult(data);
    } catch (error) {
      toast({
        title: "Query failed",
        description: "There was an error executing the query",
        variant: "destructive",
      });
      setQueryResult({ error: "Query execution failed" });
    } finally {
      setIsLoadingQuery(false);
    }
  };

  // Handle editing a content item
  const handleEditContent = (content: AiKnowledgeContent) => {
    setEditingContent({ ...content });
    setIsEditDialogOpen(true);
  };

  // Handle deleting a content item
  const handleDeleteContent = (content: AiKnowledgeContent) => {
    setContentToDelete(content);
    setIsDeleteDialogOpen(true);
  };

  // Handle saving edited content
  const handleSaveEdit = () => {
    if (!editingContent) return;
    
    editMutation.mutate(editingContent);
  };

  // Handle confirming deletion
  const handleConfirmDelete = () => {
    if (!contentToDelete) return;
    
    deleteMutation.mutate(contentToDelete.id);
  };

  // Handle bulk action
  const handleBulkAction = () => {
    if (!bulkAction || selectedItems.length === 0) return;
    
    bulkMutation.mutate({ action: bulkAction, ids: selectedItems });
  };

  // Toggle item selection for bulk actions
  const toggleItemSelection = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Select all displayed items
  const selectAllDisplayed = () => {
    if (!filteredContent || filteredContent.length === 0) return;
    
    const allIds = filteredContent.map(item => item.id);
    
    if (selectedItems.length === allIds.length) {
      // If all are selected, unselect all
      setSelectedItems([]);
    } else {
      // Otherwise select all
      setSelectedItems(allIds);
    }
  };

  // Filter content based on search and filters
  const filteredContent = React.useMemo(() => {
    if (!knowledgeContent) return [];
    
    return knowledgeContent.filter(item => {
      // Apply content type filter
      if (contentTypeFilter !== 'all' && item.contentType !== contentTypeFilter) {
        return false;
      }
      
      // Apply status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) || 
          item.content.toLowerCase().includes(query) || 
          (item.source && item.source.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [knowledgeContent, searchQuery, contentTypeFilter, statusFilter]);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 bg-gray-950 min-h-screen">
      <Helmet>
        <title>AI Knowledge Database | Bamboo Made</title>
      </Helmet>

      <AdminTabs value="knowledge">
        <TabsContent value="knowledge" className="mt-3 sm:mt-6">
          <div className="w-full max-w-full mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">AI Knowledge Database</h2>
                <p className="text-sm text-gray-400">
                  Manage content sources used by the AI chatbot for answering questions
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsQueryDialogOpen(true)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Advanced Query
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => window.location.href = '/ai-knowledge-management'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FilePlus className="w-4 h-4 mr-2" />
                  Add New Content
                </Button>
              </div>
            </div>
            
            {/* Filters and search */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search by title, content or source..."
                      className="pl-8 bg-gray-800 border-gray-700"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select 
                    value={contentTypeFilter} 
                    onValueChange={setContentTypeFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Content Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Content Types</SelectItem>
                      {CONTENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            {type.icon}
                            <span className="ml-2">{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={statusFilter} 
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[150px] bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {STATUS_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Bulk actions section */}
              {selectedItems.length > 0 && (
                <div className="mt-4 flex items-center gap-3 pt-3 border-t border-gray-800">
                  <p className="text-sm text-gray-400">
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedItems([])}
                    >
                      Cancel
                    </Button>
                    
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        setBulkAction('');
                        setIsBulkActionDialogOpen(true);
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4 mr-2" />
                      Bulk Actions
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Content list */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex gap-3 items-start">
                      <Skeleton className="h-5 w-5 rounded-md" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-full max-w-[70%] rounded-md" />
                        <Skeleton className="h-4 w-full max-w-[90%] rounded-md" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="border-b border-gray-800 p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <Switch
                        id="select-all"
                        checked={filteredContent.length > 0 && selectedItems.length === filteredContent.length}
                        onCheckedChange={selectAllDisplayed}
                      />
                      <Label htmlFor="select-all" className="ml-2 text-sm font-medium">
                        {filteredContent.length} entries {filteredContent.length !== knowledgeContent?.length && `(filtered from ${knowledgeContent?.length})`}
                      </Label>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => refetch()}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  
                  {filteredContent.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-400">No matching content found</p>
                      {(searchQuery || contentTypeFilter !== 'all' || statusFilter !== 'all') && (
                        <Button 
                          variant="link" 
                          className="mt-2" 
                          onClick={() => {
                            setSearchQuery('');
                            setContentTypeFilter('all');
                            setStatusFilter('all');
                          }}
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {filteredContent.map(item => (
                        <div key={item.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                          <div className="flex gap-3">
                            <div className="pt-0.5">
                              <Switch
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={() => toggleItemSelection(item.id)}
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                <h3 className="font-medium text-gray-200 flex items-center gap-2">
                                  {getPlatformIcon(item.source, item.contentType)}
                                  <span>{item.title}</span>
                                </h3>
                                
                                <div className="flex flex-wrap gap-2">
                                  <Badge className={getStatusBadgeClass(item.status)}>
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </Badge>
                                  
                                  <Badge variant="outline" className="border-gray-700">
                                    {CONTENT_TYPES.find(t => t.value === item.contentType)?.label || item.contentType}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-400 mt-1 mb-2">
                                {truncateText(item.content, 150)}
                              </p>
                              
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500 mt-2">
                                <div>
                                  ID: {item.id}
                                </div>
                                {item.source && (
                                  <a 
                                    href={item.source} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center hover:text-blue-400 transition-colors"
                                  >
                                    Source <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                )}
                                <div>
                                  Updated: {formatDate(item.updatedAt)}
                                </div>
                              </div>
                              
                              <div className="flex gap-2 mt-3">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => handleEditContent(item)}
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1" />
                                  Edit
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 px-2 text-xs border-red-900 hover:bg-red-900/20 hover:text-red-400"
                                  onClick={() => handleDeleteContent(item)}
                                >
                                  <Trash className="w-3.5 h-3.5 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </AdminTabs>
      
      {/* Edit Content Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Content</DialogTitle>
            <DialogDescription>
              Make changes to the AI knowledge content below
            </DialogDescription>
          </DialogHeader>
          
          {editingContent && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingContent.title}
                  onChange={(e) => setEditingContent({...editingContent, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={editingContent.status} 
                    onValueChange={(value) => setEditingContent({...editingContent, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select 
                    value={editingContent.contentType} 
                    onValueChange={(value) => setEditingContent({...editingContent, contentType: value})}
                  >
                    <SelectTrigger id="content-type">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            {type.icon}
                            <span className="ml-2">{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="source">Source URL</Label>
                <Input
                  id="source"
                  value={editingContent.source || ''}
                  onChange={(e) => setEditingContent({...editingContent, source: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={editingContent.content}
                  onChange={(e) => setEditingContent({...editingContent, content: e.target.value})}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              
              {editingContent.mediaUrl && (
                <div className="grid gap-2">
                  <Label>Media</Label>
                  <div className="bg-gray-800 p-2 rounded border border-gray-700">
                    <a 
                      href={editingContent.mediaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 text-sm flex items-center"
                    >
                      {editingContent.mediaType === 'image' ? (
                        <Image className="w-4 h-4 mr-2" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      View media <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 pt-2 mt-2 border-t border-gray-800">
                <p>ID: {editingContent.id}</p>
                <p>Created: {formatDate(editingContent.createdAt)}</p>
                <p>Last Updated: {formatDate(editingContent.updatedAt)}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editMutation.isPending}>
              {editMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this content? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {contentToDelete && (
            <div className="py-4">
              <div className="bg-gray-800 p-3 rounded-md mb-4">
                <h4 className="font-medium text-white">{contentToDelete.title}</h4>
                <div className="flex gap-2 mt-2">
                  <Badge className={getStatusBadgeClass(contentToDelete.status)}>
                    {contentToDelete.status.charAt(0).toUpperCase() + contentToDelete.status.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="border-gray-700">
                    {CONTENT_TYPES.find(t => t.value === contentToDelete.contentType)?.label || contentToDelete.contentType}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Action Dialog */}
      <Dialog open={isBulkActionDialogOpen} onOpenChange={setIsBulkActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Choose an action to apply to {selectedItems.length} selected items
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-action">Action</Label>
              <Select 
                value={bulkAction} 
                onValueChange={setBulkAction}
              >
                <SelectTrigger id="bulk-action">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Set Status to Active</SelectItem>
                  <SelectItem value="draft">Set Status to Draft</SelectItem>
                  <SelectItem value="archive">Set Status to Archived</SelectItem>
                  <SelectItem value="delete">Delete Items</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {bulkAction === 'delete' && (
              <div className="bg-red-900/20 border border-red-900 rounded-md p-3 text-red-400 text-sm">
                <p>Warning: This will permanently delete the selected items and cannot be undone!</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
              onClick={handleBulkAction}
              disabled={!bulkAction || bulkMutation.isPending}
            >
              {bulkMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Apply to {selectedItems.length} items
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Advanced Query Dialog */}
      <Dialog open={isQueryDialogOpen} onOpenChange={setIsQueryDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Advanced SQL-Like Query</DialogTitle>
            <DialogDescription>
              Execute SQL-like queries against the AI knowledge database
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-4 flex-grow overflow-hidden flex flex-col">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sql-query">Query</Label>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => setSqlQuery('SELECT * FROM content WHERE contentType = "webpage" ORDER BY createdAt DESC LIMIT 10')}
                >
                  Example
                </Button>
              </div>
              <Textarea
                id="sql-query"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="SELECT * FROM content WHERE contentType = 'webpage' ORDER BY createdAt DESC LIMIT 10"
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={executeQuery}
                disabled={isLoadingQuery || !sqlQuery.trim()}
              >
                {isLoadingQuery ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Execute Query
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex-grow overflow-hidden">
              <div className="text-sm font-medium mb-2">Result</div>
              <ScrollArea className="h-[300px] border border-gray-800 rounded-md bg-gray-900 p-4">
                {!queryResult ? (
                  <p className="text-gray-500 text-center py-8">Execute a query to see results</p>
                ) : queryResult.error ? (
                  <div className="text-red-400">
                    <p>Error: {queryResult.error}</p>
                    {queryResult.message && <p>{queryResult.message}</p>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-400 flex justify-between">
                      <span>Found {queryResult.results?.length ?? 0} results</span>
                      <span>Execution time: {queryResult.executionTime ?? '0'}ms</span>
                    </div>
                    
                    {queryResult.results && queryResult.results.length > 0 ? (
                      <div className="space-y-3">
                        {queryResult.results.map((item: any, index: number) => (
                          <div key={index} className="bg-gray-800 p-3 rounded-md border border-gray-700">
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(item, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No results found</p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIKnowledgeDatabase;