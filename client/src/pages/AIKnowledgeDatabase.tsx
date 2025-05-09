import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, Filter, RefreshCcw, Search, Trash2, Edit, Copy, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

import AdminTabs from "@/components/AdminTabs";

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

export default function AIKnowledgeDatabase() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [selectedContent, setSelectedContent] = useState<AiKnowledgeContent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);

  // Fetch AI knowledge content
  const { data: aiContent, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/ai-knowledge"],
    queryFn: async () => {
      const response = await fetch("/api/ai-knowledge");
      if (!response.ok) {
        throw new Error("Failed to fetch AI knowledge content");
      }
      return response.json();
    },
  });

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "webpage":
        return "Web Page";
      case "article":
        return "Article";
      case "social":
        return "Social Media";
      case "fact":
        return "Bamboo Fact";
      case "event":
        return "Event";
      case "youtube":
        return "YouTube";
      case "training":
        return "Training";
      case "custom":
        return "Custom";
      default:
        return type;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case "webpage":
        return "bg-blue-600";
      case "article":
        return "bg-purple-600";
      case "social":
        return "bg-pink-600";
      case "fact":
        return "bg-amber-600";
      case "event":
        return "bg-green-600";
      case "youtube":
        return "bg-red-600";
      case "training":
        return "bg-cyan-600";
      case "custom":
        return "bg-slate-600";
      default:
        return "bg-gray-600";
    }
  };

  const getSocialPlatformIcon = (info: any) => {
    if (!info || !info.platform) return null;
    
    switch (info.platform.toLowerCase()) {
      case "instagram":
        return "instagram";
      case "twitter":
      case "x":
        return "twitter";
      case "facebook":
        return "facebook";
      case "linkedin":
        return "linkedin";
      default:
        return null;
    }
  };

  const handleEditContent = (content: AiKnowledgeContent) => {
    setSelectedContent(content);
    setIsEditDialogOpen(true);
  };

  const handleDeleteContent = (content: AiKnowledgeContent) => {
    setSelectedContent(content);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (content: AiKnowledgeContent) => {
    setSelectedContent(content);
    setIsViewDetailsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedContent) return;

    try {
      const response = await fetch(`/api/ai-knowledge/${selectedContent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete content");
      }

      toast({
        title: "Content deleted",
        description: "The content has been removed from the AI knowledge base.",
      });
      
      refetch();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDomainFromUrl = (url: string | null) => {
    if (!url) return "";
    try {
      const domain = new URL(url);
      return domain.hostname.replace("www.", "");
    } catch (e) {
      return url;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Filter content based on search term, status, and content type
  const filteredContent = aiContent?.filter((content: AiKnowledgeContent) => {
    const matchesSearch = 
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (content.source && content.source.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatusFilter = filter === "all" || content.status === filter;
    
    const matchesContentTypeFilter = contentTypeFilter === "all" || content.contentType === contentTypeFilter;
    
    return matchesSearch && matchesStatusFilter && matchesContentTypeFilter;
  });

  // Group content by type for better organization
  const groupedContent = filteredContent?.reduce((acc: Record<string, AiKnowledgeContent[]>, content: AiKnowledgeContent) => {
    const type = content.contentType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(content);
    return acc;
  }, {});

  return (
    <div className="container pb-16 pt-8 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6 text-amber-400">AI Knowledge Database</h1>
      
      <AdminTabs value="database">
        <TabsContent value="database" className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title, content, or source..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-gray-800 border-gray-700"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 w-full">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 sm:flex-none">
                  <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 w-full">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by content type" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="webpage">Web Pages</SelectItem>
                      <SelectItem value="article">Articles</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="fact">Bamboo Facts</SelectItem>
                      <SelectItem value="event">Events</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => refetch()}
                  className="bg-gray-800 border-gray-700"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-400 mb-2">
              {filteredContent ? (
                <span>{filteredContent.length} items found</span>
              ) : (
                <span>Loading...</span>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
                <p className="text-red-400">Error loading AI knowledge content</p>
                <Button variant="ghost" onClick={() => refetch()} className="mt-2">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : (
              <>
                {Object.keys(groupedContent || {}).length === 0 ? (
                  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
                    <p className="text-gray-400">No content matches your search criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(groupedContent || {}).map(([contentType, contents]) => (
                      <div key={contentType} className="space-y-4">
                        <h2 className="text-xl font-semibold text-white flex items-center">
                          <Badge className={`mr-2 ${getContentTypeColor(contentType)}`}>
                            {contents.length}
                          </Badge>
                          {getContentTypeLabel(contentType)}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {contents.map((content) => (
                            <Card key={content.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-1">
                                  <Badge className={`${getContentTypeColor(content.contentType)}`}>
                                    {getContentTypeLabel(content.contentType)}
                                  </Badge>
                                  <Badge className={content.status === 'active' ? 'bg-green-600' : content.status === 'inactive' ? 'bg-red-600' : 'bg-yellow-600'}>
                                    {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                                  </Badge>
                                </div>
                                <CardTitle className="text-base cursor-pointer hover:text-amber-400 transition-colors" 
                                  onClick={() => handleViewDetails(content)}>
                                  {truncateText(content.title, 60)}
                                </CardTitle>
                                {content.source && (
                                  <CardDescription className="text-xs text-gray-400 flex items-center">
                                    <span className="mr-1">Source:</span>
                                    {getDomainFromUrl(content.source)}
                                  </CardDescription>
                                )}
                              </CardHeader>
                              <CardContent className="pb-2">
                                <p className="text-sm text-gray-300 line-clamp-3">
                                  {truncateText(content.content, 120)}
                                </p>
                              </CardContent>
                              <CardFooter className="flex justify-between items-center pt-0">
                                <span className="text-xs text-gray-400">
                                  {formatDate(content.createdAt)}
                                </span>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleViewDetails(content)} className="h-8 w-8">
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleEditContent(content)} className="h-8 w-8">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteContent(content)} className="h-8 w-8 text-red-400 hover:text-red-300">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </AdminTabs>
      
      {/* View Details Dialog */}
      {selectedContent && (
        <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{selectedContent.title}</DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge className={`${getContentTypeColor(selectedContent.contentType)}`}>
                  {getContentTypeLabel(selectedContent.contentType)}
                </Badge>
                <Badge className={selectedContent.status === 'active' ? 'bg-green-600' : selectedContent.status === 'inactive' ? 'bg-red-600' : 'bg-yellow-600'}>
                  {selectedContent.status.charAt(0).toUpperCase() + selectedContent.status.slice(1)}
                </Badge>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedContent.source && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Source:</h3>
                  <div className="flex items-center mt-1">
                    <a 
                      href={selectedContent.source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center"
                    >
                      {selectedContent.source}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-400">Content:</h3>
                <div className="mt-1 whitespace-pre-wrap text-gray-200 p-3 bg-gray-800 rounded-md border border-gray-700">
                  {selectedContent.content}
                </div>
              </div>
              
              {selectedContent.mediaUrl && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Media:</h3>
                  <div className="mt-1">
                    {selectedContent.mediaType?.includes('image') ? (
                      <div className="border border-gray-700 rounded-md overflow-hidden max-w-md mx-auto">
                        <img 
                          src={selectedContent.mediaUrl} 
                          alt={selectedContent.title} 
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    ) : (
                      <a 
                        href={selectedContent.mediaUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center"
                      >
                        {selectedContent.mediaUrl}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {selectedContent.socialMediaInfo && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Social Media Info:</h3>
                  <div className="mt-1 p-3 bg-gray-800 rounded-md border border-gray-700">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedContent.socialMediaInfo, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm text-gray-400">
                <div>Created: {formatDate(selectedContent.createdAt)}</div>
                <div>Updated: {formatDate(selectedContent.updatedAt)}</div>
              </div>
            </div>
            
            <DialogFooter>
              <div className="flex justify-between w-full">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewDetailsDialogOpen(false);
                    handleDeleteContent(selectedContent);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewDetailsDialogOpen(false);
                      handleEditContent(selectedContent);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  
                  <Button onClick={() => setIsViewDetailsDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Dialog */}
      {selectedContent && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle>Edit Content</DialogTitle>
              <DialogDescription>
                Make changes to the AI knowledge content below. 
                These changes will affect how the AI responds to related queries.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-400">Title</label>
                <Input 
                  value={selectedContent.title}
                  onChange={(e) => setSelectedContent({...selectedContent, title: e.target.value})}
                  className="col-span-3 bg-gray-800 border-gray-700"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-400">Source</label>
                <Input 
                  value={selectedContent.source || ''}
                  onChange={(e) => setSelectedContent({...selectedContent, source: e.target.value})}
                  className="col-span-3 bg-gray-800 border-gray-700"
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <label className="text-right text-sm font-medium text-gray-400">Content</label>
                <textarea 
                  value={selectedContent.content}
                  onChange={(e) => setSelectedContent({...selectedContent, content: e.target.value})}
                  className="col-span-3 min-h-[150px] bg-gray-800 border-gray-700 rounded-md p-2 text-white resize-y"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-400">Status</label>
                <Select 
                  value={selectedContent.status}
                  onValueChange={(value) => setSelectedContent({...selectedContent, status: value})}
                >
                  <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-400">Content Type</label>
                <Select 
                  value={selectedContent.contentType}
                  onValueChange={(value) => setSelectedContent({...selectedContent, contentType: value})}
                >
                  <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select a content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webpage">Web Page</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="fact">Bamboo Fact</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedContent.mediaUrl && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-gray-400">Media URL</label>
                  <Input 
                    value={selectedContent.mediaUrl}
                    onChange={(e) => setSelectedContent({...selectedContent, mediaUrl: e.target.value})}
                    className="col-span-3 bg-gray-800 border-gray-700"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={async () => {
                try {
                  const response = await fetch(`/api/ai-knowledge/${selectedContent.id}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      title: selectedContent.title,
                      content: selectedContent.content,
                      source: selectedContent.source,
                      status: selectedContent.status,
                      contentType: selectedContent.contentType,
                      mediaUrl: selectedContent.mediaUrl,
                    }),
                  });
                  
                  if (!response.ok) {
                    throw new Error("Failed to update content");
                  }
                  
                  toast({
                    title: "Content updated",
                    description: "The AI knowledge content has been updated successfully.",
                  });
                  
                  refetch();
                  setIsEditDialogOpen(false);
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to update content. Please try again.",
                    variant: "destructive",
                  });
                }
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedContent && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle>Delete Content</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this content from the AI knowledge base?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-gray-800 border border-gray-700 rounded-md p-3 my-2">
              <h3 className="font-medium text-white">{selectedContent.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{truncateText(selectedContent.content, 100)}</p>
              {selectedContent.source && (
                <p className="text-xs text-gray-500 mt-1">Source: {getDomainFromUrl(selectedContent.source)}</p>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}