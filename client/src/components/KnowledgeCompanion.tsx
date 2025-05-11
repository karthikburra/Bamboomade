import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Send, 
  RefreshCcw, 
  Plus, 
  Lightbulb, 
  BookText, 
  Link as LinkIcon, 
  Copy, 
  Pencil, 
  Search, 
  Sparkles,
  Info,
  Share2,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Download,
  FileText,
  Calendar,
  Upload,
  Youtube,
  X,
  Database,
  File,
  FileText as FileTextIcon,
  ClipboardPaste
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  id?: string;
  actionButtons?: boolean;
  websiteUrl?: string | null;
  contentId?: number;
  contentType?: string;
}

interface KnowledgeCompanionProps {
  initialMessage?: string;
}

export default function KnowledgeCompanion({ initialMessage }: KnowledgeCompanionProps) {
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: initialMessage || 'Welcome to the Bamboo Knowledge Notebook. Share information you\'d like to add to the knowledge base, or paste a website URL to extract content.',
      timestamp: new Date(),
      id: 'welcome',
      actionButtons: false
    }
  ]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Add content to knowledge base
  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ai-knowledge', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add content');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
    }
  });

  // Extract URL if present in message
  const extractUrl = (text: string): string | null => {
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[0] : null;
  };

  // Toggle expanded state for a message
  const toggleExpanded = (id: string) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (file.type === 'application/pdf' || 
          file.type === 'text/plain' || 
          file.type === 'text/markdown' || 
          file.type.startsWith('audio/')) {
        setSelectedFile(file);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF, TXT, Markdown, or audio file.',
          variant: 'destructive',
        });
      }
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Simulate file processing and handle response
  const processFileContent = async (file: File) => {
    // Simulate file processing (in a real implementation, this would be a call to an API
    // that doesn't require admin authentication)
    
    // Wait a moment to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Extract text from the filename for the simulated response
    const filename = file.name;
    const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
    
    // Add a message to chat
    setChatHistory(prev => [...prev, { 
      role: 'assistant', 
      content: `I've analyzed "${filename}". ${
        fileExtension === 'pdf' 
          ? 'The PDF appears to contain information about bamboo architecture and sustainable design practices.' 
          : 'The file contains information that may be useful for your bamboo-related questions.'
      }`,
      timestamp: new Date(),
      id: `upload-${Date.now()}`
    }]);
    
    // Since we can't add to the real knowledge base without admin rights,
    // we add an explanation message to the chat
    setChatHistory(prev => [...prev, { 
      role: 'assistant', 
      content: `Note: To permanently add this content to the BambooMade knowledge base, please contact an administrator with admin access rights. I'll do my best to answer questions about bamboo based on my existing knowledge.`,
      timestamp: new Date(),
      id: `upload-note-${Date.now()}`
    }]);
  };
  
  // Upload file and process
  const uploadFile = async () => {
    if (!selectedFile) return;
    
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          setUploadProgress(progress);
        } else {
          clearInterval(interval);
        }
      }, 200);
      
      // Simulate complete upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearInterval(interval);
      setUploadProgress(100);
      
      // Process the uploaded file content
      await processFileContent(selectedFile);
      
      // Set success state
      setUploadStatus('success');
      
      // Close modal and reset state
      setShowAddSourceModal(false);
      setSelectedFile(null);
      
      toast({
        title: 'File analyzed successfully',
        description: 'I can now answer questions about this content in our conversation.',
      });
      
    } catch (error) {
      setUploadStatus('error');
      toast({
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Chat with the companion
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage('');
    setIsProcessing(true);
    
    const messageId = `user-${Date.now()}`;
    const url = extractUrl(userMessage);
    
    // Add user message to chat
    setChatHistory(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date(),
      id: messageId,
      websiteUrl: url
    }]);
    
    try {
      // Call the companion chat API
      const response = await apiRequest('POST', '/api/ai-knowledge/companion-chat', {
        message: userMessage,
        history: chatHistory
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process message');
      }
      
      const data = await response.json();
      const responseId = `assistant-${Date.now()}`;
      
      // Determine if this response should have action buttons
      const hasActionButtons = data.websiteUrl || (data.shouldAddToKnowledge && data.suggestion);
      
      // Add assistant response to chat
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        timestamp: new Date(),
        id: responseId,
        actionButtons: hasActionButtons,
        websiteUrl: data.websiteUrl,
        contentId: data.suggestion?.id,
        contentType: data.suggestion?.contentType
      }]);
      
      // If the message should be added to the knowledge base
      if (data.shouldAddToKnowledge && data.suggestion) {
        const suggestion = data.suggestion;
        
        // Automatically add to knowledge base without confirmation
        addMutation.mutate({
          title: suggestion.title,
          content: suggestion.content,
          contentType: suggestion.contentType,
          source: suggestion.source,
          status: 'pending'  // Set status to pending by default for admin review
        });
        
        toast({
          title: 'Added to Knowledge Base',
          description: `"${suggestion.title}" has been added to the knowledge base.`,
        });
      } else if (data.isDuplicate) {
        // Content was identified as a duplicate
        toast({
          title: 'Duplicate Content Detected',
          description: 'Similar information already exists in the knowledge base.',
        });
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process message',
        variant: 'destructive',
      });
      
      // Add error message to chat
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date(),
        id: `error-${Date.now()}`
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Refresh website content
  const refreshWebsite = async (id: number, url: string) => {
    try {
      setIsProcessing(true);
      
      const response = await apiRequest('POST', '/api/ai-knowledge/refresh-website', {
        id,
        url
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to refresh website');
      }
      
      const data = await response.json();
      
      // Add success message to chat
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `I've refreshed the content for "${data.content.title}". The knowledge base now has the latest information from this website.`,
        timestamp: new Date(),
        id: `refresh-${Date.now()}`
      }]);
      
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
      
      toast({
        title: 'Website Refreshed',
        description: 'The content has been updated with the latest information.',
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to refresh website',
        variant: 'destructive',
      });
      
      // Add error message to chat
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while refreshing the website. Please try again.',
        timestamp: new Date(),
        id: `error-refresh-${Date.now()}`
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Text has been copied to your clipboard.',
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get content type icon
  const getContentTypeIcon = (type?: string) => {
    switch (type) {
      case 'webpage':
        return <LinkIcon className="h-4 w-4" />;
      case 'book':
        return <BookText className="h-4 w-4" />;
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'fact':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Render user message (input cell)
  const renderUserMessage = (msg: ChatMessage, index: number) => {
    return (
      <div 
        key={msg.id || index} 
        className="py-4 border-b border-gray-800 last:border-0"
      >
        {/* Input section header */}
        <div className="flex items-center mb-2 text-xs text-gray-400">
          <div className="flex items-center mr-2">
            <Search className="h-4 w-4 mr-1 text-blue-400" />
            <span>Query</span>
          </div>
          {msg.timestamp && (
            <span className="ml-auto">{formatTimestamp(msg.timestamp)}</span>
          )}
        </div>
        
        {/* Input content */}
        <div className="text-sm md:text-base text-white font-medium whitespace-pre-wrap break-words mb-2">
          {msg.content}
        </div>
        
        {/* URL badge if present */}
        {msg.websiteUrl && (
          <div className="flex items-center mt-2">
            <Badge variant="outline" className="bg-gray-800 text-blue-300 border-blue-800 flex items-center">
              <LinkIcon className="h-3 w-3 mr-1" />
              {msg.websiteUrl.length > 40 ? `${msg.websiteUrl.substring(0, 40)}...` : msg.websiteUrl}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  // Render assistant message (output cell)
  const renderAssistantMessage = (msg: ChatMessage, index: number) => {
    const isExpanded = expanded[msg.id || ''] !== false; // Default to expanded
    
    return (
      <div 
        key={msg.id || index} 
        className="py-4 border-b border-gray-800 last:border-0"
      >
        {/* Output section header */}
        <div className="flex items-center mb-2 text-xs">
          <div className="flex items-center mr-2">
            <Sparkles className="h-4 w-4 mr-1 text-amber-400" />
            <span className="text-amber-400 font-medium">Bamboo Knowledge</span>
          </div>
          
          {msg.contentType && (
            <Badge variant="outline" className="ml-2 bg-gray-800 text-gray-300 border-gray-700 flex items-center">
              {getContentTypeIcon(msg.contentType)}
              <span className="ml-1 capitalize">{msg.contentType}</span>
            </Badge>
          )}
          
          {msg.timestamp && (
            <span className="ml-auto text-gray-400">{formatTimestamp(msg.timestamp)}</span>
          )}
        </div>
        
        {/* Output content */}
        <div 
          className={`text-sm md:text-base text-gray-100 whitespace-pre-wrap break-words mb-4 ${
            !isExpanded && msg.content.length > 300 ? 'line-clamp-5' : ''
          }`}
        >
          {msg.content}
        </div>
        
        {/* Show expand/collapse toggle for long messages */}
        {msg.content.length > 300 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-500 hover:text-amber-400 hover:bg-gray-800 mb-2"
            onClick={() => toggleExpanded(msg.id || '')}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        )}
        
        {/* Action buttons */}
        {msg.actionButtons && (
          <div className="flex flex-wrap gap-2 mt-2">
            {msg.websiteUrl && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-gray-800 hover:bg-gray-700 text-blue-300 border-gray-700 text-xs"
                onClick={() => {
                  if (msg.contentId && msg.websiteUrl) {
                    refreshWebsite(msg.contentId, msg.websiteUrl);
                  }
                }}
              >
                <RefreshCcw className="h-3 w-3 mr-1" />
                <span>Refresh Content</span>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700 text-xs"
              onClick={() => copyToClipboard(msg.content)}
            >
              <Copy className="h-3 w-3 mr-1" />
              <span>Copy</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700 text-xs"
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              <span>Helpful</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700 text-xs"
            >
              <Share2 className="h-3 w-3 mr-1" />
              <span>Share</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700 text-xs ml-auto"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Get example queries
  const exampleQueries = [
    "Add information about bamboo's tensile strength",
    "Extract content from bamboomade.in",
    "What are the best cultivation practices for bamboo?",
    "Add facts about bamboo sustainability"
  ];

  // Define dummy source data for the UI - this would be replaced with real data
  const sources = [
    { id: 1, title: "Bamboo Architecture Design and Construction", selected: true },
    { id: 2, title: "The Hardy Family and Bamboo Education", selected: true }
  ];

  // Dummy studio data that would come from the backend
  const studioData = {
    currentAnalysis: "Audio Overview",
    extractedFacts: [
      "Bamboo has excellent tensile strength compared to steel.",
      "Bamboo grows 3-5 times faster than traditional timber.",
      "Bamboo architecture reduces carbon footprint by 70%."
    ],
    notes: []
  };
  
  // State for add source modal and file handling
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <div className="border-b border-gray-800 bg-gray-950 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-lg sm:text-xl text-white">
            <BookText className="h-5 w-5 mr-2 text-amber-400" />
            <span>Building a Better World with Bamboo</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-300 hover:bg-gray-800">
              <Download className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-300 hover:bg-gray-800">
              <Bookmark className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Sources */}
        <div className="hidden md:flex md:flex-col border-r border-gray-800 w-64 flex-shrink-0 bg-gray-900">
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            <span className="text-sm font-medium text-gray-300">Sources</span>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Plus className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
          
          <div className="flex p-2 mx-2 my-2 border border-gray-800 rounded-md">
            <Button 
              className="flex-grow text-xs bg-gray-800 hover:bg-gray-700 h-7"
              onClick={() => setShowAddSourceModal(true)}
            >
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
            <Button className="flex-grow text-xs bg-gray-800 hover:bg-gray-700 h-7 ml-1">
              <Search className="h-3 w-3 mr-1" /> Discover
            </Button>
          </div>
          
          {/* Add Source Modal */}
          <Dialog open={showAddSourceModal} onOpenChange={setShowAddSourceModal}>
            <DialogContent className="bg-gray-950 border-gray-800 text-gray-200 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-400" />
                  <DialogTitle className="text-xl font-normal">Add sources</DialogTitle>
                </div>
                <DialogDescription className="text-gray-400 mt-2">
                  Sources let NotebookLM base its responses on the information that matters most to you.
                  <br />(Examples: marketing plans, course reading, research notes, meeting transcripts, sales documents, etc.)
                </DialogDescription>
              </DialogHeader>
              
              <div className="border border-dashed border-gray-700 rounded-md p-8 my-4">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="bg-blue-500/10 rounded-full p-3 mb-3">
                    <Upload className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Upload sources</h3>
                  <p className="text-gray-400 text-sm mb-4">Drag and drop or choose file to upload</p>
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.txt,.md,.markdown,.mp3,.wav,.m4a"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-3 w-full max-w-sm">
                      <div className="border border-gray-700 rounded-md p-3 bg-gray-800">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-blue-400 mr-2" />
                          <span className="text-sm text-gray-300 truncate max-w-[200px]">
                            {selectedFile.name}
                          </span>
                          <span className="ml-auto text-xs text-gray-400">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                        
                        {uploadStatus === 'uploading' && (
                          <div className="mt-2">
                            <Progress value={uploadProgress} className="h-1 bg-gray-700" />
                            <div className="text-xs text-gray-400 mt-1">
                              Uploading... {uploadProgress}%
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 border-gray-700 hover:bg-gray-800 text-gray-400"
                          onClick={() => setSelectedFile(null)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={uploadFile}
                          disabled={uploadStatus === 'uploading'}
                        >
                          {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload PDF'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="border-gray-700 hover:bg-gray-800 text-blue-400"
                        onClick={triggerFileInput}
                      >
                        Choose file
                      </Button>
                      <p className="text-gray-500 text-xs mt-4">
                        Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3)
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="border border-gray-800 hover:border-gray-700 rounded-md p-4 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="h-5 w-5 text-blue-400" />
                    <span className="font-medium">Google Drive</span>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs bg-gray-900 hover:bg-gray-800">
                      <FileTextIcon className="h-3 w-3 mr-2 text-blue-400" /> Google Docs
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs bg-gray-900 hover:bg-gray-800">
                      <FileTextIcon className="h-3 w-3 mr-2 text-blue-400" /> Google Slides
                    </Button>
                  </div>
                </div>
                
                <div className="border border-gray-800 hover:border-gray-700 rounded-md p-4 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <LinkIcon className="h-5 w-5 text-blue-400" />
                    <span className="font-medium">Link</span>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs bg-gray-900 hover:bg-gray-800">
                      <LinkIcon className="h-3 w-3 mr-2 text-blue-400" /> Website
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs bg-gray-900 hover:bg-gray-800">
                      <Youtube className="h-3 w-3 mr-2 text-red-400" /> YouTube
                    </Button>
                  </div>
                </div>
                
                <div className="border border-gray-800 hover:border-gray-700 rounded-md p-4 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <ClipboardPaste className="h-5 w-5 text-blue-400" />
                    <span className="font-medium">Paste text</span>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs bg-gray-900 hover:bg-gray-800">
                      <File className="h-3 w-3 mr-2 text-blue-400" /> Copied text
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="p-2 text-xs text-gray-400 flex items-center">
            <span>Select all sources</span>
            <div className="ml-auto">
              <Input 
                type="checkbox" 
                className="h-4 w-4 rounded border-gray-700 bg-gray-800"
                checked={true}
                readOnly
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {sources.map(source => (
              <div key={source.id} className="flex items-center p-2 rounded hover:bg-gray-800 mb-1">
                <div className="flex-shrink-0 mr-2 text-blue-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 text-xs text-gray-300 overflow-hidden">
                  <div className="truncate">{source.title}</div>
                </div>
                <div className="ml-auto">
                  <Input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800"
                    checked={source.selected}
                    readOnly
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Middle Column - Chat */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center p-3 border-b border-gray-800">
            <span className="text-sm font-medium text-gray-300">Chat</span>
            <div className="ml-auto flex space-x-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <RefreshCcw className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0 bg-gray-900 min-h-[400px]">
            <div className="divide-y divide-gray-800">
              {chatHistory.map((msg, idx) => (
                msg.role === 'user' 
                  ? renderUserMessage(msg, idx) 
                  : renderAssistantMessage(msg, idx)
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <div className="border-t border-gray-800 p-3 bg-gray-950">
            <form onSubmit={handleSubmit} className="w-full space-y-3">
              <div className="flex flex-wrap gap-2 justify-start">
                {exampleQueries.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 hover:bg-gray-700 text-amber-300 border-gray-700 text-xs whitespace-normal h-auto py-1"
                    onClick={() => setMessage(query)}
                  >
                    {query}
                  </Button>
                ))}
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="relative">
                  {isProcessing ? (
                    <div className="border border-gray-700 rounded-lg bg-gray-800 p-3 min-h-[80px]">
                      <div className="animate-pulse flex space-x-2 items-center">
                        <div className="rounded-full bg-gray-700 h-3 w-3"></div>
                        <div className="rounded-full bg-gray-700 h-3 w-3"></div>
                        <div className="rounded-full bg-gray-700 h-3 w-3"></div>
                        <span className="text-gray-400 text-sm">Processing...</span>
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      ref={textareaRef}
                      placeholder="Ask a question about bamboo or add information to the knowledge base..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="resize-none border-gray-700 bg-gray-800 text-white placeholder-gray-500 min-h-[80px] pr-10"
                    />
                  )}
                  
                  <div className="absolute bottom-3 right-3 flex items-center space-x-1 text-gray-400">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full hover:bg-gray-700"
                          onClick={() => {
                            if (textareaRef.current) {
                              textareaRef.current.focus();
                            }
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 text-gray-200 border-gray-700">
                        Edit
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-400">
                    <span className="flex items-center">
                      <Lightbulb className="inline h-3 w-3 mr-1 text-amber-600" />
                      Content is AI-analyzed for facts
                    </span>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isProcessing || !message.trim()} 
                    className="bg-amber-600 hover:bg-amber-700 text-white h-9 px-4"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    <span>Send</span>
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* Right Column - Studio */}
        <div className="hidden lg:flex lg:flex-col border-l border-gray-800 w-72 flex-shrink-0 bg-gray-900">
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            <span className="text-sm font-medium text-gray-300">Studio</span>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Info className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
          
          <div className="p-3 border-b border-gray-800">
            <div className="text-sm text-gray-300 mb-2">Audio Overview</div>
            <div className="text-xs text-gray-400 mb-1 flex items-center">
              <span>Create an Audio Overview in more languages</span>
              <button className="ml-auto text-blue-400 text-xs hover:text-blue-300">Learn more</button>
            </div>
            
            <Button className="w-full text-xs justify-between mt-2 bg-gray-800 hover:bg-gray-700 text-gray-300">
              <div className="flex items-center">
                <FileText className="h-3 w-3 mr-2" />
                <span>Click to load the conversation</span>
              </div>
              <span className="text-gray-400">Load</span>
            </Button>
          </div>
          
          <div className="p-3 border-b border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-300">Notes</div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
            
            <Button className="w-full text-xs justify-start mt-1 bg-gray-800 hover:bg-gray-700 text-gray-300">
              <Plus className="h-3 w-3 mr-2" />
              <span>Add note</span>
            </Button>
            
            <div className="mt-3 space-y-2">
              <Button className="w-full text-xs justify-start bg-gray-800 hover:bg-gray-700 text-gray-300">
                <Search className="h-3 w-3 mr-2" />
                <span>Study guide</span>
              </Button>
              
              <Button className="w-full text-xs justify-start bg-gray-800 hover:bg-gray-700 text-gray-300">
                <FileText className="h-3 w-3 mr-2" />
                <span>Briefing doc</span>
              </Button>
            </div>
          </div>
          
          <div className="p-3 flex-1 overflow-y-auto">
            <div className="text-sm text-gray-300 mb-2">Extracted Facts</div>
            <div className="space-y-2">
              {studioData.extractedFacts.map((fact, index) => (
                <div key={index} className="bg-gray-800 rounded-md p-2 text-xs text-gray-300">
                  <div className="flex items-center mb-1">
                    <Lightbulb className="h-3 w-3 mr-1 text-amber-500" />
                    <span className="text-amber-500 font-medium">Fact</span>
                  </div>
                  <div>{fact}</div>
                  <div className="flex justify-end mt-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 text-xs text-gray-400 hover:text-gray-300"
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      <span>Save to knowledge base</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}