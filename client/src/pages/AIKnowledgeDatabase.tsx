import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, Filter, RefreshCcw, Search, Trash2, Edit, Copy, ExternalLink, AlertTriangle, Save } from "lucide-react";
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
  // Enthusiast-specific fields
  contactEmail?: string | null;
  contactPhone?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
  personalWebsite?: string | null;
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
      case "enthusiast":
        return "Bamboo Enthusiast";
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
      case "enthusiast":
        return "bg-teal-600";
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
    // Create a deep copy to ensure we're not editing the reference directly
    const contentCopy = JSON.parse(JSON.stringify(content));
    console.log("Opening edit dialog for content type:", contentCopy.contentType);
    setSelectedContent(contentCopy);
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
    <div className="container pb-16 pt-8 max-w-7xl dark min-h-screen bg-gray-950">
      <h1 className="text-2xl font-bold mb-6 text-amber-400">AI Knowledge Database</h1>
      
      <AdminTabs value="database">
        <TabsContent value="database" className="space-y-6">
          <div className="space-y-4 bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-800 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title, content, or source..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none min-w-[140px]">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-200 w-full hover:border-zinc-600 focus:ring-amber-500 focus:border-amber-500">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                      <SelectItem value="all" className="hover:bg-zinc-800 focus:bg-zinc-800 text-gray-300">All Statuses</SelectItem>
                      <SelectItem value="active" className="hover:bg-zinc-800 focus:bg-zinc-800 text-green-400">Active</SelectItem>
                      <SelectItem value="inactive" className="hover:bg-zinc-800 focus:bg-zinc-800 text-red-400">Inactive</SelectItem>
                      <SelectItem value="pending" className="hover:bg-zinc-800 focus:bg-zinc-800 text-yellow-400">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 sm:flex-none min-w-[140px]">
                  <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-200 w-full hover:border-zinc-600 focus:ring-amber-500 focus:border-amber-500">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by content type" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                      <SelectItem value="all" className="hover:bg-zinc-800 focus:bg-zinc-800 text-gray-300">All Types</SelectItem>
                      <SelectItem value="webpage" className="hover:bg-zinc-800 focus:bg-zinc-800 text-blue-400">Web Pages</SelectItem>
                      <SelectItem value="article" className="hover:bg-zinc-800 focus:bg-zinc-800 text-purple-400">Articles</SelectItem>
                      <SelectItem value="social" className="hover:bg-zinc-800 focus:bg-zinc-800 text-pink-400">Social Media</SelectItem>
                      <SelectItem value="fact" className="hover:bg-zinc-800 focus:bg-zinc-800 text-green-400">Bamboo Facts</SelectItem>
                      <SelectItem value="event" className="hover:bg-zinc-800 focus:bg-zinc-800 text-amber-400">Events</SelectItem>
                      <SelectItem value="youtube" className="hover:bg-zinc-800 focus:bg-zinc-800 text-red-400">YouTube</SelectItem>
                      <SelectItem value="training" className="hover:bg-zinc-800 focus:bg-zinc-800 text-cyan-400">Training</SelectItem>
                      <SelectItem value="enthusiast" className="hover:bg-zinc-800 focus:bg-zinc-800 text-teal-400">Bamboo Enthusiasts</SelectItem>
                      <SelectItem value="custom" className="hover:bg-zinc-800 focus:bg-zinc-800 text-gray-400">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => refetch()}
                  className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:border-amber-500 text-zinc-200"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-400 mt-2 mb-4 px-1">
              {filteredContent ? (
                <span><span className="text-amber-400 font-semibold">{filteredContent.length}</span> items found</span>
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
                            {(contents as AiKnowledgeContent[]).length}
                          </Badge>
                          {getContentTypeLabel(contentType)}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(contents as AiKnowledgeContent[]).map((content: AiKnowledgeContent) => (
                            <Card key={content.id} className="group bg-gray-800 border-gray-700 hover:border-amber-500 transition-all shadow-lg hover:shadow-amber-700/20 overflow-hidden relative">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                  <Badge className={`${getContentTypeColor(content.contentType)}`}>
                                    {getContentTypeLabel(content.contentType)}
                                  </Badge>
                                  <Badge className={content.status === 'active' ? 'bg-green-600' : content.status === 'inactive' ? 'bg-red-600' : 'bg-yellow-600'}>
                                    {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                                  </Badge>
                                </div>
                                <CardTitle className="text-base cursor-pointer text-white group-hover:text-amber-400 transition-colors" 
                                  onClick={() => handleViewDetails(content)}>
                                  {truncateText(content.title, 60)}
                                </CardTitle>
                                {content.source && (
                                  <CardDescription className="text-xs text-gray-400 flex items-center mt-1">
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
                                  <Button variant="ghost" size="icon" onClick={() => handleViewDetails(content)} className="h-8 w-8 text-gray-400 hover:text-amber-400 hover:bg-gray-700">
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleEditContent(content)} className="h-8 w-8 text-gray-400 hover:text-blue-400 hover:bg-gray-700">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteContent(content)} className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-gray-700">
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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-800 shadow-xl dark">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-amber-400">{selectedContent.title}</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={`${getContentTypeColor(selectedContent.contentType)}`}>
                  {getContentTypeLabel(selectedContent.contentType)}
                </Badge>
                <Badge className={selectedContent.status === 'active' ? 'bg-green-600' : selectedContent.status === 'inactive' ? 'bg-red-600' : 'bg-yellow-600'}>
                  {selectedContent.status.charAt(0).toUpperCase() + selectedContent.status.slice(1)}
                </Badge>
              </div>
            </DialogHeader>
            
            <div className="space-y-5 mt-2">
              {selectedContent.source && (
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <h3 className="text-sm font-medium text-amber-400 mb-2">Source:</h3>
                  <div className="flex items-center">
                    <a 
                      href={selectedContent.source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center text-sm break-all"
                    >
                      {selectedContent.source}
                      <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <h3 className="text-sm font-medium text-amber-400 mb-2">Content:</h3>
                <div className="whitespace-pre-wrap text-gray-200 p-3 bg-gray-800 rounded-md border border-gray-700 text-sm">
                  {selectedContent.content}
                </div>
              </div>
              
              {selectedContent.mediaUrl && (
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <h3 className="text-sm font-medium text-amber-400 mb-2">Media:</h3>
                  <div className="mt-1">
                    {selectedContent.mediaType?.includes('image') ? (
                      <div className="border border-gray-700 rounded-md overflow-hidden max-w-md mx-auto shadow-lg">
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
                        className="text-blue-400 hover:text-blue-300 flex items-center text-sm break-all"
                      >
                        {selectedContent.mediaUrl}
                        <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {selectedContent.socialMediaInfo && (
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <h3 className="text-sm font-medium text-amber-400 mb-2">Social Media Info:</h3>
                  <div className="p-3 bg-gray-800 rounded-md border border-gray-700">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedContent.socialMediaInfo, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-between text-sm text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">Created:</span> 
                  {formatDate(selectedContent.createdAt)}
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">Updated:</span> 
                  {formatDate(selectedContent.updatedAt)}
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6 border-t border-gray-800 pt-4">
              <div className="flex flex-wrap gap-3 justify-between w-full">
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
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
                    className="border-gray-600 text-white hover:bg-gray-800 hover:text-amber-400"
                    onClick={() => {
                      setIsViewDetailsDialogOpen(false);
                      handleEditContent(selectedContent);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  
                  <Button 
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => setIsViewDetailsDialogOpen(false)}
                  >
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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-800 shadow-xl dark">
            <DialogHeader className="border-b border-gray-800 pb-4">
              <DialogTitle className="text-xl font-bold text-amber-400">Edit Content</DialogTitle>
              <DialogDescription className="text-gray-400">
                Make changes to the AI knowledge content below. 
                These changes will affect how the AI responds to related queries.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Title</label>
                <div className="col-span-1 sm:col-span-3">
                  <Input 
                    value={selectedContent.title}
                    onChange={(e) => setSelectedContent({...selectedContent, title: e.target.value})}
                    className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">The title will be used for identification in the AI Knowledge database</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Source</label>
                <div className="col-span-1 sm:col-span-3">
                  <Input 
                    value={selectedContent.source || ''}
                    onChange={(e) => setSelectedContent({...selectedContent, source: e.target.value})}
                    className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="https://example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">The original URL or source of this content</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Content</label>
                <div className="col-span-1 sm:col-span-3">
                  <textarea 
                    value={selectedContent.content}
                    onChange={(e) => setSelectedContent({...selectedContent, content: e.target.value})}
                    className="w-full min-h-[200px] bg-zinc-800 border-zinc-700 rounded-md p-3 text-zinc-200 resize-y focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">The main content that will be used by the AI system to respond to queries</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <div className="col-span-1 sm:col-span-2 bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                  <label className="text-sm font-medium text-amber-400 block mb-2">Status</label>
                  <Select 
                    value={selectedContent.status}
                    onValueChange={(value) => setSelectedContent({...selectedContent, status: value})}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200 w-full hover:border-zinc-600 focus:ring-amber-500 focus:border-amber-500">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                      <SelectItem value="active" className="text-green-400 hover:bg-zinc-800 focus:bg-zinc-800 focus:text-green-400">Active</SelectItem>
                      <SelectItem value="inactive" className="text-red-400 hover:bg-zinc-800 focus:bg-zinc-800 focus:text-red-400">Inactive</SelectItem>
                      <SelectItem value="pending" className="text-yellow-400 hover:bg-zinc-800 focus:bg-zinc-800 focus:text-yellow-400">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Controls whether this content is used by the AI</p>
                </div>
                
                <div className="col-span-1 sm:col-span-2 bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                  <label className="text-sm font-medium text-amber-400 block mb-2">Content Type</label>
                  <Select 
                    defaultValue={selectedContent.contentType}
                    value={selectedContent.contentType}
                    onValueChange={(value) => {
                      console.log("Content type changed to:", value);
                      setSelectedContent({...selectedContent, contentType: value});
                    }}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200 w-full hover:border-zinc-600 focus:ring-amber-500 focus:border-amber-500">
                      <SelectValue placeholder="Select a content type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                      <SelectItem value="webpage" className="hover:bg-zinc-800 text-blue-300 focus:bg-zinc-800 focus:text-blue-300">Web Page</SelectItem>
                      <SelectItem value="article" className="hover:bg-zinc-800 text-purple-300 focus:bg-zinc-800 focus:text-purple-300">Article</SelectItem>
                      <SelectItem value="social" className="hover:bg-zinc-800 text-pink-300 focus:bg-zinc-800 focus:text-pink-300">Social Media</SelectItem>
                      <SelectItem value="fact" className="hover:bg-zinc-800 text-green-300 focus:bg-zinc-800 focus:text-green-300">Bamboo Fact</SelectItem>
                      <SelectItem value="event" className="hover:bg-zinc-800 text-amber-300 focus:bg-zinc-800 focus:text-amber-300">Event</SelectItem>
                      <SelectItem value="youtube" className="hover:bg-zinc-800 text-red-300 focus:bg-zinc-800 focus:text-red-300">YouTube</SelectItem>
                      <SelectItem value="training" className="hover:bg-zinc-800 text-sky-300 focus:bg-zinc-800 focus:text-sky-300">Training</SelectItem>
                      <SelectItem value="enthusiast" className="hover:bg-zinc-800 text-teal-300 focus:bg-zinc-800 focus:text-teal-300">Bamboo Enthusiast</SelectItem>
                      <SelectItem value="custom" className="hover:bg-zinc-800 text-gray-300 focus:bg-zinc-800 focus:text-gray-300">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Categorizes the content for organization</p>
                </div>
              </div>
              
              {/* Media URL field */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Profile Photo URL</label>
                <div className="col-span-1 sm:col-span-3">
                  <Input 
                    value={selectedContent.mediaUrl || ""}
                    onChange={(e) => setSelectedContent({...selectedContent, mediaUrl: e.target.value})}
                    className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">URL to person's profile photo or headshot</p>
                </div>
              </div>
              
              {/* Bamboo Enthusiast specific fields */}
              {selectedContent.contentType === "enthusiast" && (
                <>
                  <div className="mt-6 mb-4 border-t border-gray-800 pt-4">
                    <h3 className="font-medium text-teal-400 text-base mb-3">Contact Information</h3>
                    
                    {/* Contact Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 mb-3">
                      <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Email</label>
                      <div className="col-span-1 sm:col-span-3">
                        <Input 
                          value={selectedContent.contactEmail || ""}
                          onChange={(e) => setSelectedContent({...selectedContent, contactEmail: e.target.value})}
                          className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          placeholder="example@email.com"
                        />
                      </div>
                    </div>
                    
                    {/* Contact Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 mb-3">
                      <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Phone</label>
                      <div className="col-span-1 sm:col-span-3">
                        <Input 
                          value={selectedContent.contactPhone || ""}
                          onChange={(e) => setSelectedContent({...selectedContent, contactPhone: e.target.value})}
                          className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>
                    
                    {/* Personal Website */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 mb-3">
                      <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Website</label>
                      <div className="col-span-1 sm:col-span-3">
                        <Input 
                          value={selectedContent.personalWebsite || ""}
                          onChange={(e) => setSelectedContent({...selectedContent, personalWebsite: e.target.value})}
                          className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-medium text-teal-400 text-base mb-3">Social Media Links</h3>
                    
                    {/* LinkedIn */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 mb-3">
                      <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">LinkedIn</label>
                      <div className="col-span-1 sm:col-span-3">
                        <Input 
                          value={selectedContent.linkedinUrl || ""}
                          onChange={(e) => setSelectedContent({...selectedContent, linkedinUrl: e.target.value})}
                          className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>
                    
                    {/* Instagram */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 mb-3">
                      <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Instagram</label>
                      <div className="col-span-1 sm:col-span-3">
                        <Input 
                          value={selectedContent.instagramUrl || ""}
                          onChange={(e) => setSelectedContent({...selectedContent, instagramUrl: e.target.value})}
                          className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          placeholder="https://instagram.com/username"
                        />
                      </div>
                    </div>
                    
                    {/* Twitter */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 mb-3">
                      <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Twitter</label>
                      <div className="col-span-1 sm:col-span-3">
                        <Input 
                          value={selectedContent.twitterUrl || ""}
                          onChange={(e) => setSelectedContent({...selectedContent, twitterUrl: e.target.value})}
                          className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          placeholder="https://twitter.com/username"
                        />
                      </div>
                    </div>
                    
                    {/* Facebook */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                      <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Facebook</label>
                      <div className="col-span-1 sm:col-span-3">
                        <Input 
                          value={selectedContent.facebookUrl || ""}
                          onChange={(e) => setSelectedContent({...selectedContent, facebookUrl: e.target.value})}
                          className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          placeholder="https://facebook.com/username"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter className="mt-2 border-t border-gray-800 pt-4">
              <div className="flex flex-wrap gap-3 sm:gap-2 w-full justify-between sm:justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-grow sm:flex-grow-0 border-gray-600 text-white hover:bg-gray-800 hover:text-amber-400"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-grow sm:flex-grow-0 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={async () => {
                    try {
                      console.log("Updating content with type:", selectedContent.contentType);
                      // Prepare data for API
                      const updateData = {
                        title: selectedContent.title,
                        content: selectedContent.content,
                        source: selectedContent.source,
                        status: selectedContent.status,
                        contentType: selectedContent.contentType,
                        mediaUrl: selectedContent.mediaUrl,
                      };
                      
                      // Add enthusiast-specific fields if relevant
                      if (selectedContent.contentType === "enthusiast") {
                        Object.assign(updateData, {
                          contactEmail: selectedContent.contactEmail,
                          contactPhone: selectedContent.contactPhone,
                          linkedinUrl: selectedContent.linkedinUrl,
                          instagramUrl: selectedContent.instagramUrl,
                          twitterUrl: selectedContent.twitterUrl,
                          facebookUrl: selectedContent.facebookUrl,
                          personalWebsite: selectedContent.personalWebsite,
                        });
                      }
                      
                      const response = await fetch(`/api/ai-knowledge/${selectedContent.id}`, {
                        method: "PUT", // Changed from PATCH to PUT to match server endpoint
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updateData),
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
                  }}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedContent && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 shadow-xl dark">
            <DialogHeader className="border-b border-gray-800 pb-4">
              <DialogTitle className="text-xl font-bold text-red-400">
                <AlertTriangle className="h-5 w-5 inline-block mr-2 text-red-400" />
                Delete Content
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-2">
                Are you sure you want to delete this content from the AI knowledge base?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-gray-800/50 border border-red-900/30 rounded-md p-4 my-4 shadow-inner">
              <h3 className="font-medium text-white flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getContentTypeColor(selectedContent.contentType).replace('bg-', '')}`}></span>
                {selectedContent.title}
              </h3>
              <p className="text-sm text-gray-300 mt-2 bg-gray-800 p-2 rounded border border-gray-700">{truncateText(selectedContent.content, 100)}</p>
              <div className="flex flex-wrap justify-between text-xs text-gray-500 mt-3">
                {selectedContent.source && (
                  <p>Source: {getDomainFromUrl(selectedContent.source)}</p>
                )}
                <p>
                  <Badge className={selectedContent.status === 'active' ? 'bg-green-600' : selectedContent.status === 'inactive' ? 'bg-red-600' : 'bg-yellow-600'}>
                    {selectedContent.status.charAt(0).toUpperCase() + selectedContent.status.slice(1)}
                  </Badge>
                </p>
              </div>
            </div>
            
            <DialogFooter className="mt-2 border-t border-gray-800 pt-4">
              <div className="flex flex-wrap gap-3 sm:gap-2 w-full justify-between sm:justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="flex-grow sm:flex-grow-0 border-gray-600 text-white hover:bg-gray-800 hover:text-amber-400"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  className="flex-grow sm:flex-grow-0 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Permanently Delete
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}