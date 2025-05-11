import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  X, Filter, RefreshCcw, Search, Trash2, Edit, Copy, ExternalLink, 
  AlertTriangle, AlertCircle, Save, Mail, Phone, Linkedin, Instagram, Twitter, Facebook,
  UploadCloud, CheckCircle, Clock, ThumbsUp, ThumbsDown, Bell, Loader2, Eye
} from "lucide-react";
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
import ContentEditDialog from "@/components/ContentEditDialog";

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
  // Event-specific fields
  eventDate?: string | null;
  eventLocation?: string | null;
  registrationLink?: string | null;
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
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [isApproving, setIsApproving] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all AI knowledge content
  const { data: aiContent, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/ai-knowledge"],
    queryFn: async () => {
      // Add a timeout for the fetch operation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch("/api/ai-knowledge", {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error("Failed to fetch AI knowledge content");
        }
        
        return response.json();
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err?.name === 'AbortError') {
          throw new Error("Request timed out. The server is taking too long to respond.");
        }
        throw err;
      }
    },
    // Increase stale time to reduce number of background refetches
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch pending AI knowledge content
  const { data: pendingContent, isLoading: isPendingLoading, error: pendingError, refetch: refetchPending } = useQuery({
    queryKey: ["/api/ai-knowledge/pending"],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch("/api/ai-knowledge/pending", {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error("Failed to fetch pending AI knowledge content");
        }
        
        return response.json();
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err?.name === 'AbortError') {
          throw new Error("Request timed out. The server is taking too long to respond.");
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Function to approve content
  const approveContent = async (contentId: number) => {
    setIsApproving(true);
    
    try {
      const response = await fetch(`/api/ai-knowledge/${contentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve content");
      }
      
      // Success! Refetch both queries to update the UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/ai-knowledge"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/ai-knowledge/pending"] })
      ]);
      
      toast({
        title: "Content approved",
        description: "The content has been approved and is now active in the AI knowledge base.",
        variant: "default",
      });
      
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message || "There was an error approving the content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "webpage":
        return "Web Page";
      case "article":
        return "Article";
      case "book":
        return "Book";
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
      case "book":
        return "bg-orange-600";
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
    <div className="pb-16 pt-8 px-6 md:px-8 lg:px-12 max-w-7xl dark min-h-screen bg-gray-950 mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-amber-400">AI Knowledge Database</h1>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <Button 
          variant={activeTab === "all" ? "default" : "outline"}
          onClick={() => setActiveTab("all")}
          className={activeTab === "all" ? "bg-amber-600 hover:bg-amber-700" : "border-amber-600 text-amber-400 hover:bg-amber-900/20"}
        >
          All Content
        </Button>
        
        <Button 
          variant={activeTab === "pending" ? "default" : "outline"}
          onClick={() => setActiveTab("pending")}
          className={activeTab === "pending" ? "bg-amber-600 hover:bg-amber-700" : "border-amber-600 text-amber-400 hover:bg-amber-900/20"}
        >
          Pending Content
          {pendingContent && pendingContent.length > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {pendingContent.length}
            </span>
          )}
        </Button>
      </div>
      
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
                      <SelectItem value="book" className="hover:bg-zinc-800 focus:bg-zinc-800 text-orange-400">Books</SelectItem>
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
              {activeTab === "all" ? (
                filteredContent ? (
                  <span><span className="text-amber-400 font-semibold">{filteredContent.length}</span> items found</span>
                ) : (
                  <span>Loading...</span>
                )
              ) : (
                pendingContent ? (
                  <span><span className="text-amber-400 font-semibold">{pendingContent.length}</span> pending items</span>
                ) : (
                  <span>Loading pending content...</span>
                )
              )}
            </div>

            {(activeTab === "all" && isLoading) || (activeTab === "pending" && isPendingLoading) ? (
              <div className="space-y-10">
                <div className="flex justify-center items-center gap-3 py-6">
                  <LoadingSpinner size="md" />
                  <span className="text-gray-400 animate-pulse">Fetching AI knowledge content...</span>
                </div>
                
                {/* Loading skeletons for content */}
                {[1, 2, 3].map((i) => (
                  <div key={`skeleton-${i}`} className="space-y-4">
                    <div className="h-7 bg-gray-800 rounded-md w-60 animate-pulse mb-3"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map((j) => (
                        <div key={`card-${i}-${j}`} className="bg-gray-900 rounded-lg border border-gray-800 shadow-md overflow-hidden">
                          <div className="p-4 border-b border-gray-800">
                            <div className="h-5 bg-gray-800 rounded-md w-3/4 animate-pulse"></div>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="h-4 bg-gray-800 rounded-md w-full animate-pulse"></div>
                            <div className="h-4 bg-gray-800 rounded-md w-5/6 animate-pulse"></div>
                            <div className="h-4 bg-gray-800 rounded-md w-4/6 animate-pulse"></div>
                          </div>
                          <div className="px-4 py-3 bg-gray-850 flex justify-between items-center border-t border-gray-800">
                            <div className="h-4 bg-gray-800 rounded-md w-20 animate-pulse"></div>
                            <div className="flex space-x-2">
                              <div className="h-6 w-6 bg-gray-800 rounded-md animate-pulse"></div>
                              <div className="h-6 w-6 bg-gray-800 rounded-md animate-pulse"></div>
                              <div className="h-6 w-6 bg-gray-800 rounded-md animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (activeTab === "all" && error) || (activeTab === "pending" && pendingError) ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <AlertCircle className="h-10 w-10 text-red-400" />
                  <p className="text-lg font-semibold text-red-400">Error loading AI knowledge content</p>
                  <p className="text-gray-400 max-w-md mx-auto mb-2">
                    {activeTab === "pending" 
                      ? (pendingError instanceof Error 
                          ? pendingError.message 
                          : "There was a problem connecting to the server while fetching pending content.")
                      : (error instanceof Error 
                          ? error.message
                          : "There was a problem connecting to the server. This could be due to high server load or network issues.")}
                  </p>
                  
                  <div className="bg-red-900/30 border border-red-800/50 p-4 rounded-md text-sm text-left w-full max-w-lg my-2">
                    <p className="text-gray-300 font-medium mb-2">Troubleshooting tips:</p>
                    <ul className="list-disc pl-5 text-gray-400 space-y-1">
                      <li>Check your internet connection</li>
                      <li>The server might be processing a large amount of data</li>
                      <li>Try refreshing after a few moments</li>
                      <li>Contact an administrator if the problem persists</li>
                    </ul>
                  </div>
                  
                  <Button 
                    variant="default" 
                    onClick={() => activeTab === "pending" ? refetchPending() : refetch()} 
                    className="mt-2 bg-red-900 hover:bg-red-800 border border-red-700"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Retry Loading
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "pending" ? (
                  pendingContent && pendingContent.length === 0 ? (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
                      <p className="text-gray-400">There are no pending content items waiting for approval.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingContent && pendingContent.map((content: AiKnowledgeContent) => (
                        <div key={content.id} className="bg-orange-950/30 border border-orange-900/50 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white">{content.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getContentTypeColor(content.contentType)}>
                                  {getContentTypeLabel(content.contentType)}
                                </Badge>
                                <span className="text-sm text-gray-400">Added on {new Date(content.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <Button 
                              variant="default"
                              size="sm" 
                              className="bg-green-700 hover:bg-green-600 border-none text-white"
                              onClick={() => approveContent(content.id)}
                              disabled={isApproving}
                            >
                              {isApproving ? (
                                <>
                                  <LoadingSpinner size="sm" className="mr-2" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </>
                              )}
                            </Button>
                          </div>
                          
                          <div className="bg-gray-900/50 rounded border border-gray-800 p-4 mb-4">
                            <p className="text-gray-300 whitespace-pre-wrap">{content.content}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-400">Content Type: <span className="text-white">{getContentTypeLabel(content.contentType)}</span></p>
                              {content.source && <p className="text-sm text-gray-400">Source: <span className="text-white">{content.source}</span></p>}
                              
                              {content.contentType === "event" && (
                                <>
                                  {content.eventDate && <p className="text-sm text-gray-400">Event Date: <span className="text-white">{new Date(content.eventDate).toLocaleDateString()}</span></p>}
                                  {content.eventLocation && <p className="text-sm text-gray-400">Location: <span className="text-white">{content.eventLocation}</span></p>}
                                </>
                              )}
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline"
                                size="sm" 
                                className="border-amber-600 text-amber-400 hover:bg-amber-900/20"
                                onClick={() => handleViewDetails(content)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Button>
                              <Button 
                                variant="outline"
                                size="sm" 
                                className="border-red-600 text-red-400 hover:bg-red-900/20"
                                onClick={() => handleDeleteContent(content)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : Object.keys(groupedContent || {}).length === 0 ? (
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
                                {content.contentType === 'enthusiast' ? (
                                  <div className="space-y-2">
                                    <p className="text-sm text-gray-300 line-clamp-2">
                                      {truncateText(content.content, 100)}
                                    </p>
                                    
                                    {/* Profile photo and contact info */}
                                    <div className="flex items-center mt-2 gap-3">
                                      {content.mediaUrl && (
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border border-gray-700">
                                          <img 
                                            src={content.mediaUrl} 
                                            alt={content.title} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.src = "https://via.placeholder.com/100?text=Profile";
                                            }}
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1 overflow-hidden">
                                        {content.contactEmail && (
                                          <div className="flex items-center text-xs text-teal-300 truncate">
                                            <Mail className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                            <span className="truncate">{content.contactEmail}</span>
                                          </div>
                                        )}
                                        {content.contactPhone && (
                                          <div className="flex items-center text-xs text-teal-300 truncate">
                                            <Phone className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                            <span className="truncate">{content.contactPhone}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Social media links */}
                                    {(content.linkedinUrl || content.instagramUrl || content.twitterUrl || content.facebookUrl) && (
                                      <div className="flex gap-2 mt-2">
                                        {content.linkedinUrl && (
                                          <a 
                                            href={content.linkedinUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-[#0077b5] hover:bg-[#0077b5]/10 p-1 rounded"
                                          >
                                            <Linkedin className="h-3.5 w-3.5" />
                                          </a>
                                        )}
                                        {content.instagramUrl && (
                                          <a 
                                            href={content.instagramUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-[#E1306C] hover:bg-[#E1306C]/10 p-1 rounded"
                                          >
                                            <Instagram className="h-3.5 w-3.5" />
                                          </a>
                                        )}
                                        {content.twitterUrl && (
                                          <a 
                                            href={content.twitterUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-[#1DA1F2] hover:bg-[#1DA1F2]/10 p-1 rounded"
                                          >
                                            <Twitter className="h-3.5 w-3.5" />
                                          </a>
                                        )}
                                        {content.facebookUrl && (
                                          <a 
                                            href={content.facebookUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-[#4267B2] hover:bg-[#4267B2]/10 p-1 rounded"
                                          >
                                            <Facebook className="h-3.5 w-3.5" />
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : content.contentType === 'event' ? (
                                  <div className="space-y-3">
                                    <p className="text-sm text-gray-300 line-clamp-2">
                                      {truncateText(content.content, 100)}
                                    </p>
                                    
                                    {/* Event details */}
                                    <div className="space-y-2 mt-1">
                                      {content.eventDate && (
                                        <div className="flex items-center text-xs text-amber-300">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 flex-shrink-0">
                                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                            <line x1="16" x2="16" y1="2" y2="6" />
                                            <line x1="8" x2="8" y1="2" y2="6" />
                                            <line x1="3" x2="21" y1="10" y2="10" />
                                          </svg>
                                          {content.eventDate && new Date(content.eventDate).toLocaleString('en-IN', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                      )}
                                      
                                      {content.eventLocation && (
                                        <div className="flex items-center text-xs text-amber-300">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 flex-shrink-0">
                                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                            <circle cx="12" cy="10" r="3" />
                                          </svg>
                                          <span className="truncate">{content.eventLocation}</span>
                                        </div>
                                      )}
                                      
                                      {content.registrationLink && (
                                        <div className="mt-2">
                                          <a 
                                            href={content.registrationLink}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded inline-flex items-center transition-colors"
                                          >
                                            Register
                                            <ExternalLink className="ml-1 h-2.5 w-2.5" />
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-300 line-clamp-3">
                                    {truncateText(content.content, 120)}
                                  </p>
                                )}
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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-800 shadow-xl dark px-4 sm:px-6">
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
              
              {/* Bamboo Enthusiast specific information */}
              {selectedContent.contentType === 'enthusiast' && (
                <div className="bg-teal-900/20 rounded-lg p-4 border border-teal-800">
                  <h3 className="text-sm font-medium text-teal-400 mb-3">Bamboo Enthusiast Profile</h3>
                  
                  <div className="space-y-4">
                    {/* Contact Information */}
                    {(selectedContent.contactEmail || selectedContent.contactPhone) && (
                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                        <h4 className="text-xs font-medium text-amber-400 mb-2">Contact Information:</h4>
                        <div className="space-y-2">
                          {selectedContent.contactEmail && (
                            <div className="flex items-center">
                              <span className="text-xs text-gray-400 mr-2">Email:</span>
                              <a 
                                href={`mailto:${selectedContent.contactEmail}`} 
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                {selectedContent.contactEmail}
                              </a>
                            </div>
                          )}
                          
                          {selectedContent.contactPhone && (
                            <div className="flex items-center">
                              <span className="text-xs text-gray-400 mr-2">Phone:</span>
                              <a 
                                href={`tel:${selectedContent.contactPhone}`} 
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                {selectedContent.contactPhone}
                              </a>
                            </div>
                          )}
                          
                          {selectedContent.personalWebsite && (
                            <div className="flex items-center">
                              <span className="text-xs text-gray-400 mr-2">Website:</span>
                              <a 
                                href={selectedContent.personalWebsite} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 flex items-center text-sm break-all"
                              >
                                {selectedContent.personalWebsite}
                                <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Social Media Links */}
                    {(selectedContent.linkedinUrl || selectedContent.instagramUrl || selectedContent.twitterUrl || selectedContent.facebookUrl) && (
                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                        <h4 className="text-xs font-medium text-amber-400 mb-2">Social Media Links:</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedContent.linkedinUrl && (
                            <a 
                              href={selectedContent.linkedinUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-3 py-1.5 bg-[#0077b5]/10 text-[#0077b5] border border-[#0077b5]/20 rounded-lg text-sm font-medium hover:bg-[#0077b5]/20 flex items-center"
                            >
                              LinkedIn
                              <ExternalLink className="ml-1.5 h-3 w-3" />
                            </a>
                          )}
                          
                          {selectedContent.instagramUrl && (
                            <a 
                              href={selectedContent.instagramUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-3 py-1.5 bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/20 rounded-lg text-sm font-medium hover:bg-[#E1306C]/20 flex items-center"
                            >
                              Instagram
                              <ExternalLink className="ml-1.5 h-3 w-3" />
                            </a>
                          )}
                          
                          {selectedContent.twitterUrl && (
                            <a 
                              href={selectedContent.twitterUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-3 py-1.5 bg-[#1DA1F2]/10 text-[#1DA1F2] border border-[#1DA1F2]/20 rounded-lg text-sm font-medium hover:bg-[#1DA1F2]/20 flex items-center"
                            >
                              Twitter
                              <ExternalLink className="ml-1.5 h-3 w-3" />
                            </a>
                          )}
                          
                          {selectedContent.facebookUrl && (
                            <a 
                              href={selectedContent.facebookUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-3 py-1.5 bg-[#4267B2]/10 text-[#4267B2] border border-[#4267B2]/20 rounded-lg text-sm font-medium hover:bg-[#4267B2]/20 flex items-center"
                            >
                              Facebook
                              <ExternalLink className="ml-1.5 h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Event specific information */}
              {selectedContent.contentType === 'event' && (
                <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-800">
                  <h3 className="text-sm font-medium text-amber-400 mb-3">Event Details</h3>
                  
                  <div className="space-y-4">
                    {/* Event Date and Location */}
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      {selectedContent.eventDate && (
                        <div className="flex items-start mb-3">
                          <span className="text-xs text-gray-400 mr-2 mt-0.5">Date & Time:</span>
                          <div className="text-white text-sm font-medium">
                            {new Date(selectedContent.eventDate).toLocaleString('en-IN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      )}
                      
                      {selectedContent.eventLocation && (
                        <div className="flex items-start">
                          <span className="text-xs text-gray-400 mr-2 mt-0.5">Location:</span>
                          <div className="text-white text-sm">
                            {selectedContent.eventLocation}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Registration Link */}
                    {selectedContent.registrationLink && (
                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                        <h4 className="text-xs font-medium text-amber-400 mb-2">Registration:</h4>
                        <a 
                          href={selectedContent.registrationLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium inline-flex items-center transition-colors"
                        >
                          Register for Event
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                        <p className="text-xs text-gray-400 mt-2">Click the button above to register for this event</p>
                      </div>
                    )}
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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-800 shadow-xl dark px-4 sm:px-6">
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
                      <SelectItem value="book" className="hover:bg-zinc-800 text-orange-300 focus:bg-zinc-800 focus:text-orange-300">Book</SelectItem>
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
              
              {/* Event-specific fields */}
              {selectedContent.contentType === "event" && (
                <div className="mt-6 mb-4 border-t border-gray-800 pt-4">
                  <h3 className="font-medium text-amber-400 text-base mb-3">Event Details</h3>
                  
                  {/* Event Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 mb-3 bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                    <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Event Date</label>
                    <div className="col-span-1 sm:col-span-3">
                      <Input 
                        type="datetime-local"
                        value={selectedContent.eventDate || ""}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          setSelectedContent({...selectedContent, eventDate: dateValue});
                        }}
                        className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Set the date and time for this event</p>
                    </div>
                  </div>
                  
                  {/* Event Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 mb-3 bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                    <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Event Location</label>
                    <div className="col-span-1 sm:col-span-3">
                      <Input 
                        value={selectedContent.eventLocation || ""}
                        onChange={(e) => setSelectedContent({...selectedContent, eventLocation: e.target.value})}
                        className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        placeholder="Online or physical location"
                      />
                      <p className="text-xs text-gray-500 mt-1">Where the event will take place</p>
                    </div>
                  </div>
                  
                  {/* Registration Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 mb-3 bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                    <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Registration Link</label>
                    <div className="col-span-1 sm:col-span-3">
                      <Input 
                        value={selectedContent.registrationLink || ""}
                        onChange={(e) => setSelectedContent({...selectedContent, registrationLink: e.target.value})}
                        className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        placeholder="https://example.com/register"
                      />
                      <p className="text-xs text-gray-500 mt-1">URL where users can register for the event</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Media field - URL or Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                <label className="sm:text-right text-sm font-medium text-amber-400 mt-2">Profile Photo</label>
                <div className="col-span-1 sm:col-span-3">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">URL:</span>
                      <Input 
                        value={selectedContent.mediaUrl || ""}
                        onChange={(e) => setSelectedContent({...selectedContent, mediaUrl: e.target.value})}
                        className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400 mr-2">Or upload:</span>
                      <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-md border border-zinc-700 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                // Create a FormData object to send the file
                                const formData = new FormData();
                                formData.append('image', file);
                                
                                // Add required title and contentType parameters
                                formData.append('title', selectedContent.title || 'Uploaded Image');
                                formData.append('contentType', selectedContent.contentType || 'enthusiast');
                                formData.append('description', selectedContent.content || '');
                                
                                // Make request to upload endpoint
                                const uploadResponse = await fetch('/api/ai-knowledge/upload-file', {
                                  method: 'POST',
                                  body: formData,
                                });
                                
                                if (!uploadResponse.ok) {
                                  // Get error details from the response
                                  const errorData = await uploadResponse.json();
                                  
                                  if (uploadResponse.status === 401) {
                                    // Authentication error
                                    throw new Error('Your admin session has expired. Please log in again.');
                                  } else {
                                    throw new Error(errorData.error || 'Failed to upload image');
                                  }
                                }
                                
                                const data = await uploadResponse.json();
                                
                                // Update the mediaUrl with the path to the uploaded file
                                setSelectedContent({
                                  ...selectedContent, 
                                  mediaUrl: data.fileUrl
                                });
                                
                                toast({
                                  title: "Image uploaded",
                                  description: "The image has been successfully uploaded.",
                                });
                              } catch (error) {
                                console.error("File upload error:", error);
                                
                                // Try to get more detailed error message
                                let errorMessage = "Failed to upload the image. Please try again.";
                                
                                if (error instanceof Error) {
                                  errorMessage = error.message;
                                } else if (typeof error === 'string') {
                                  errorMessage = error;
                                }
                                
                                toast({
                                  title: "Upload failed",
                                  description: errorMessage,
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        />
                        <span className="flex items-center">
                          <UploadCloud className="h-4 w-4 mr-2" />
                          Choose File
                        </span>
                      </label>
                    </div>
                    
                    {selectedContent.mediaUrl && (
                      <div className="mt-2">
                        <div className="relative w-24 h-24 overflow-hidden rounded-md border border-gray-700">
                          <img 
                            src={selectedContent.mediaUrl.startsWith('http') ? selectedContent.mediaUrl : selectedContent.mediaUrl} 
                            alt="Preview" 
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">Provide a URL or upload a profile photo/headshot</p>
                  </div>
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
                      
                      // Add event-specific fields if relevant
                      if (selectedContent.contentType === "event") {
                        Object.assign(updateData, {
                          eventDate: selectedContent.eventDate,
                          eventLocation: selectedContent.eventLocation,
                          registrationLink: selectedContent.registrationLink,
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
          <DialogContent className="bg-gray-900 border-gray-800 shadow-xl dark px-4 sm:px-6">
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