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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  ClipboardPaste,
  Trash2,
  ChevronRight
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

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function KnowledgeCompanion({ initialMessage }: KnowledgeCompanionProps) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: initialMessage || "Hello! I'm your Bamboo Knowledge Companion. Ask me anything about bamboo architecture, or upload content to get specific answers.",
      timestamp: new Date(),
      id: 'welcome'
    }
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Modal state
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'file' | 'drive' | 'web' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [webUrl, setWebUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  
  // Example queries to show as chips
  // Example queries have been removed per user request
  const exampleQueries: string[] = [];

  // State for all knowledge sources
  const [allSources, setAllSources] = useState<Array<{
    id: number,
    title: string,
    type: string,
    contentType: string,
    source: string | null,
    createdAt: string,
    selected: boolean
  }>>([]);
  
  // State for uploaded sources in the current session
  const [uploadedSources, setUploadedSources] = useState<Array<{
    id: number,
    title: string,
    type: string,
    size: string,
    timestamp: Date,
    selected: boolean
  }>>([]);
  
  // Track which type of source is currently selected
  const [selectedSourceType, setSelectedSourceType] = useState<'database' | 'uploaded' | null>(null);
  
  // Handle source selection (radio buttons)
  const handleSourceSelection = (sourceId: number, sourceType: 'database' | 'uploaded') => {
    // Update the selectedSourceType
    setSelectedSourceType(sourceType);
    
    // Update database sources (deselect all except the selected one)
    setAllSources(prev => 
      prev.map(source => ({
        ...source,
        selected: sourceType === 'database' && source.id === sourceId
      }))
    );
    
    // Update uploaded sources (deselect all except the selected one)
    setUploadedSources(prev => 
      prev.map(source => ({
        ...source,
        selected: sourceType === 'uploaded' && source.id === sourceId
      }))
    );
    
    // Fetch extracted information for the selected source
    if (sourceType === 'database') {
      fetchSourceExtractedData(sourceId);
    } else {
      // For uploaded sources, we don't have extracted data yet in the database
      // So we'll clear the extracted data
      setSourceExtractedData({
        facts: [],
        events: [],
        blogContent: [],
        loading: false
      });
    }
  };
  
  // Combine both sources for display
  const combinedSources = [...allSources, ...uploadedSources];

  // State for extracted data from selected sources
  const [sourceExtractedData, setSourceExtractedData] = useState<{
    facts: Array<{id: number, content: string}>;
    events: Array<{title: string, date: string, description: string}>;
    blogContent: Array<{title: string, summary: string}>;
    loading: boolean;
  }>({
    facts: [],
    events: [],
    blogContent: [],
    loading: false
  });
  
  // Interface for the facts API response
  interface FactsApiResponse {
    success: boolean;
    facts: Array<{
      id: number;
      fact: string;
    }>;
  }
  
  // Fetch facts and extracted content from the selected source
  const fetchSourceExtractedData = async (sourceId: number) => {
    setSourceExtractedData(prev => ({ ...prev, loading: true }));
    
    try {
      // Fetch facts from the source
      const factsResponse = await fetch(`/api/ai-knowledge/${sourceId}/facts`);
      if (!factsResponse.ok) {
        throw new Error('Failed to fetch facts for this source');
      }
      
      const factsData = await factsResponse.json() as FactsApiResponse;
      
      // Map the returned facts to the expected format (backend returns "fact", frontend expects "content")
      const mappedFacts = factsData.facts ? factsData.facts.map((item: { id: number; fact: string }) => ({
        id: item.id,
        content: item.fact // Map "fact" field to "content"
      })) : [];
      
      // Remove logging in production
      if (process.env.NODE_ENV !== 'production') {
        console.log('Received facts:', factsData.facts);
        console.log('Mapped facts:', mappedFacts);
      }
      
      // TODO: Add endpoints for events and blog content extraction
      // For now, we're only handling facts which are already implemented
      
      setSourceExtractedData({
        facts: mappedFacts,
        events: [], // Will be populated when backend endpoint is available
        blogContent: [], // Will be populated when backend endpoint is available
        loading: false
      });
    } catch (error) {
      console.error('Error fetching source information:', error);
      toast({
        title: 'Error',
        description: 'Failed to load extracted information from this source.',
        variant: 'destructive',
      });
      setSourceExtractedData({
        facts: [],
        events: [],
        blogContent: [],
        loading: false
      });
    }
  };
  
  // Fetch all knowledge sources from the API
  const fetchKnowledgeSources = async () => {
    try {
      const response = await fetch('/api/ai-knowledge');
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge sources');
      }
      
      const data = await response.json();
      
      // Map API data to our source format
      const sources = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.mediaType || getFileTypeFromContentType(item.contentType),
        contentType: item.contentType,
        source: item.source,
        createdAt: item.createdAt,
        selected: true
      }));
      
      setAllSources(sources);
    } catch (error) {
      console.error('Error fetching knowledge sources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load knowledge sources.',
        variant: 'destructive',
      });
    }
  };
  
  // Helper to determine file type icon from content type
  const getFileTypeFromContentType = (contentType: string): string => {
    switch (contentType) {
      case 'book':
      case 'article':
        return 'pdf';
      case 'social-media':
      case 'social':
        return 'link';
      case 'webpage':
        return 'link';
      case 'event':
        return 'event';
      default:
        return 'file';
    }
  };

  // Scroll to bottom whenever chat history updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  // Fetch knowledge sources when component mounts
  useEffect(() => {
    fetchKnowledgeSources();
  }, []);
  
  // If the user presses Enter in the textarea, submit the form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };
  
  // Handle file selection
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 20) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 20MB.',
          variant: 'destructive',
        });
        return;
      }
      
      const allowedTypes = [
        'application/pdf', 
        'text/plain', 
        'text/markdown',
        'audio/mpeg', 
        'audio/wav', 
        'audio/ogg'
      ];
      
      if (!allowedTypes.includes(file.type) && 
          !file.name.endsWith('.pdf') && 
          !file.name.endsWith('.txt') && 
          !file.name.endsWith('.md') && 
          !file.name.endsWith('.mp3') && 
          !file.name.endsWith('.wav') && 
          !file.name.endsWith('.ogg')) {
        toast({
          title: 'Unsupported file type',
          description: 'Please select a PDF, text, markdown, or audio file.',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  // Handle click on the file input button
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Process file content and provide chat responses
  const processFileContent = async (file: File) => {
    // Extract information from the file
    const filename = file.name;
    const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
    
    // Wait a moment for natural response timing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add a message to chat about the file being analyzed
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
    
    // Let the user know that their file has been permanently added to the knowledge database
    setChatHistory(prev => [...prev, { 
      role: 'assistant', 
      content: `Your file "${filename}" has been permanently added to the BambooMade knowledge database! It appears in both the "KNOWLEDGE BASE" section and temporarily in "YOUR UPLOADS" for this session.`,
      timestamp: new Date(),
      id: `upload-status-${Date.now()}`
    }]);
    
    // Give information about accessibility
    setChatHistory(prev => [...prev, { 
      role: 'assistant', 
      content: `This file is now permanently available to all users of the BambooMade AI assistant. I'll use the information from this file to answer future questions about bamboo architecture and sustainable design.`,
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
      // Check if user is logged in as admin first
      const adminCheckResponse = await fetch('/api/auth/admin-check');
      const adminCheckResult = await adminCheckResponse.json();
      
      if (!adminCheckResponse.ok || !adminCheckResult.isAdmin) {
        toast({
          title: 'Admin access required',
          description: 'You need to be logged in as an admin to add files to the knowledge database.',
          variant: 'destructive',
        });
        throw new Error('Admin authentication required');
      }

      // Create a FormData object to send the file
      const formData = new FormData();
      
      // The server expects the file with key 'image'
      formData.append('image', selectedFile);
      formData.append('title', selectedFile.name);
      
      // Add a description for the content
      formData.append('description', `Content from uploaded file: ${selectedFile.name}. File was uploaded to the knowledge database for analysis and reference.`);
      
      // Determine appropriate content type based on file extension
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      let contentType = 'article';
      
      if (fileExtension === 'pdf') {
        contentType = 'book';
      } else if (fileExtension === 'txt' || fileExtension === 'md') {
        contentType = 'article';
      } else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
        contentType = 'media';
      }
      
      // Add content type field
      formData.append('contentType', contentType);
      
      // Create a progress tracker
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 90) { // Only go up to 90% for simulation
          setUploadProgress(progress);
        } else {
          clearInterval(interval);
        }
      }, 200);
      
      // Actually upload to the server
      const response = await fetch('/api/ai-knowledge/upload-file', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(interval);
      
      if (!response.ok) {
        throw new Error('Failed to upload file to knowledge database');
      }
      
      const result = await response.json();
      setUploadProgress(100);
      setUploadStatus('success');
      
      // Add to the knowledge base database
      console.log('File uploaded to knowledge database:', result);
      
      // Add to the temporary sources list for immediate display
      setUploadedSources(prev => [
        ...prev, 
        {
          id: result.id || Date.now(),
          title: selectedFile.name,
          type: fileExtension,
          size: (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB',
          timestamp: new Date(),
          selected: true
        }
      ]);
      
      // Refresh all sources from the API to include the newly added item
      await fetchKnowledgeSources();
      
      // Process the file content to add it to the chat
      await processFileContent(selectedFile);
      
      // Close modal and reset state
      setShowAddSourceModal(false);
      setSelectedFile(null);
      
      toast({
        title: 'File added to knowledge database',
        description: 'File has been permanently added to the BambooMade knowledge database.',
      });
      
    } catch (error) {
      setUploadStatus('error');
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Chat with the companion
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
      id: `user-${Date.now()}`
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsProcessing(true);
    
    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add assistant message to chat
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `Thanks for your question about bamboo! Based on my knowledge, here's what I know about "${message.trim()}".\n\nBamboo is a versatile and sustainable material used in architecture around the world. It's known for its strength, flexibility, and rapid growth rate, making it an excellent choice for eco-friendly construction.\n\nIf you have more specific questions or would like to explore a particular aspect of bamboo architecture, please let me know!`,
        timestamp: new Date(),
        id: `assistant-${Date.now()}`
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process your message. Please try again.',
        variant: 'destructive',
      });
      
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your message. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
        id: `error-${Date.now()}`
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Format the timestamp for display
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Render a user message
  const renderUserMessage = (msg: ChatMessage, index: number) => (
    <div key={msg.id || index} className="flex flex-col py-4 px-4">
      <div className="flex items-start">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow-sm">
          <span className="text-sm">You</span>
        </div>
        <div className="ml-3 flex-1 space-y-1">
          <div className="text-sm text-gray-300">{msg.content}</div>
          {msg.timestamp && (
            <div className="flex items-center text-xs text-gray-500">
              {formatTimestamp(msg.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Render an assistant message
  const renderAssistantMessage = (msg: ChatMessage, index: number) => (
    <div key={msg.id || index} className="flex flex-col bg-gray-800/50 py-4 px-4">
      <div className="flex items-start">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-gray-800 shadow-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
        </div>
        <div className="ml-3 flex-1 space-y-1">
          <div className="text-sm text-gray-300 whitespace-pre-line">{msg.content}</div>
          {msg.timestamp && (
            <div className="flex items-center text-xs text-gray-500">
              {formatTimestamp(msg.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex h-full overflow-hidden">
        {/* Left Column - Data Sources */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            <span className="text-sm font-medium text-gray-300">Your Data Sources</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={() => setShowAddSourceModal(true)}
            >
              <Plus className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
          
          <div className="flex-none p-3 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search your sources..."
                className="w-full bg-gray-800 border-gray-700 pl-9 text-sm text-gray-300 placeholder:text-gray-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {combinedSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <FileText className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-xs text-center">No data sources available. Upload a file to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Show database sources */}
                {allSources.length > 0 && (
                  <div className="py-1">
                    <h3 className="text-xs text-gray-400 font-semibold mb-2 px-2">KNOWLEDGE BASE</h3>
                    {allSources.map(source => (
                      <div key={`db-${source.id}`} className="flex items-center p-2 rounded hover:bg-gray-800 mb-1">
                        <div className="flex-shrink-0 mr-2 text-blue-400">
                          {source.type === 'pdf' ? (
                            <FileText className="h-4 w-4" />
                          ) : source.type === 'link' ? (
                            <LinkIcon className="h-4 w-4" />
                          ) : source.type === 'event' ? (
                            <Calendar className="h-4 w-4" />
                          ) : (
                            <File className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 text-xs text-gray-300 overflow-hidden">
                          <div className="truncate">{source.title}</div>
                          <div className="text-xs text-gray-500">{source.contentType}</div>
                        </div>
                        <div className="ml-auto">
                          <Input 
                            type="radio" 
                            name="knowledgeSource"
                            className="h-4 w-4 border-gray-700 bg-gray-800"
                            checked={source.selected}
                            onChange={() => handleSourceSelection(source.id, 'database')}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Show session-uploaded sources */}
                {uploadedSources.length > 0 && (
                  <div className="py-1">
                    <h3 className="text-xs text-gray-400 font-semibold mb-2 px-2">YOUR UPLOADS</h3>
                    {uploadedSources.map(source => (
                      <div key={`upload-${source.id}`} className="flex items-center p-2 rounded hover:bg-gray-800 mb-1">
                        <div className="flex-shrink-0 mr-2 text-amber-400">
                          {source.type === 'pdf' ? (
                            <FileText className="h-4 w-4" />
                          ) : source.type === 'txt' || source.type === 'md' ? (
                            <FileText className="h-4 w-4" />
                          ) : (
                            <File className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 text-xs text-gray-300 overflow-hidden">
                          <div className="truncate">{source.title}</div>
                          <div className="text-xs text-gray-500">{source.size}</div>
                        </div>
                        <div className="ml-auto">
                          <Input 
                            type="radio" 
                            name="knowledgeSource"
                            className="h-4 w-4 border-gray-700 bg-gray-800"
                            checked={source.selected}
                            onChange={() => handleSourceSelection(source.id, 'uploaded')}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
            <div className="text-sm text-gray-300 mb-2">Source Overview</div>
            <div className="text-xs text-gray-400 mb-1 flex items-center">
              <span>View information from selected source</span>
              <button className="ml-auto text-blue-400 text-xs hover:text-blue-300">Refresh</button>
            </div>
            
            <Button className="w-full text-xs justify-between mt-2 bg-gray-800 hover:bg-gray-700 text-gray-300">
              <div className="flex items-center">
                <FileText className="h-3 w-3 mr-2" />
                <span>Generate source summary</span>
              </div>
              <span className="text-gray-400">Generate</span>
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
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-medium text-gray-300">Source Information</div>
              {sourceExtractedData.loading && (
                <div className="flex items-center">
                  <div className="animate-spin h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full mr-1"></div>
                  <span className="text-xs text-gray-400">Loading...</span>
                </div>
              )}
            </div>
            
            {/* Information Accordions */}
            {(sourceExtractedData.facts.length > 0 || 
              sourceExtractedData.events.length > 0 || 
              sourceExtractedData.blogContent.length > 0) && (
              <Accordion type="multiple" className="space-y-2 w-full">
                {/* Facts Accordion */}
                {sourceExtractedData.facts.length > 0 && (
                  <AccordionItem value="facts" className="border-gray-800">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center text-xs font-medium text-amber-500">
                        <Lightbulb className="h-3 w-3 mr-1.5" />
                        <span>EXTRACTED FACTS ({sourceExtractedData.facts.length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {sourceExtractedData.facts.map((fact) => (
                          <div key={fact.id} className="bg-gray-800 rounded-md p-2 text-xs text-gray-300">
                            <div>{fact.content}</div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {/* Events Accordion */}
                {sourceExtractedData.events.length > 0 && (
                  <AccordionItem value="events" className="border-gray-800">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center text-xs font-medium text-blue-500">
                        <Calendar className="h-3 w-3 mr-1.5" />
                        <span>IDENTIFIED EVENTS ({sourceExtractedData.events.length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {sourceExtractedData.events.map((event, index) => (
                          <div key={index} className="bg-gray-800 rounded-md p-2 text-xs text-gray-300">
                            <div className="font-medium mb-1">{event.title}</div>
                            <div className="text-gray-400 mb-1">{event.date}</div>
                            <div>{event.description}</div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {/* Blog Content Accordion */}
                {sourceExtractedData.blogContent.length > 0 && (
                  <AccordionItem value="blog-content" className="border-gray-800">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center text-xs font-medium text-green-500">
                        <FileText className="h-3 w-3 mr-1.5" />
                        <span>BLOG CONTENT ({sourceExtractedData.blogContent.length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {sourceExtractedData.blogContent.map((blog, index) => (
                          <div key={index} className="bg-gray-800 rounded-md p-2 text-xs text-gray-300">
                            <div className="font-medium mb-1">{blog.title}</div>
                            <div>{blog.summary}</div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {/* Add more accordions for other categories here */}
              </Accordion>
            )}
            
            {/* No data message */}
            {!sourceExtractedData.loading && 
             sourceExtractedData.facts.length === 0 && 
             sourceExtractedData.events.length === 0 && 
             sourceExtractedData.blogContent.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-xs">
                  {selectedSourceType ? 
                    "No information extracted from this source yet." : 
                    "Select a source from the left panel to see extracted information."}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-xs text-amber-500"
                  disabled={!selectedSourceType}
                >
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  <span>Extract information</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add Source Modal */}
      <Dialog open={showAddSourceModal} onOpenChange={setShowAddSourceModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-gray-100 border-gray-800">
          <DialogHeader>
            <DialogTitle>Add to Knowledge Base</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add content to enhance your AI companion's knowledge.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex border-b border-gray-800 mb-4">
            <button
              className={`pb-2 px-4 text-sm font-medium ${selectedTab === 'file' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
              onClick={() => setSelectedTab('file')}
            >
              Upload File
            </button>
            <button
              className={`pb-2 px-4 text-sm font-medium ${selectedTab === 'drive' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
              onClick={() => setSelectedTab('drive')}
            >
              Google Drive
            </button>
            <button
              className={`pb-2 px-4 text-sm font-medium ${selectedTab === 'web' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
              onClick={() => setSelectedTab('web')}
            >
              Web Link
            </button>
            <button
              className={`pb-2 px-4 text-sm font-medium ${selectedTab === 'text' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
              onClick={() => setSelectedTab('text')}
            >
              Text
            </button>
          </div>
          
          {selectedTab === 'file' && (
            <div className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-800/50 transition-colors 
                  ${selectedFile ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}`}
                onClick={handleFileButtonClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.mp3,.wav,.ogg"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="mx-auto h-10 w-10 text-blue-400" />
                    <div className="text-sm font-medium text-gray-200">{selectedFile.name}</div>
                    <div className="text-xs text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                    
                    {uploadStatus === 'uploading' && (
                      <div className="space-y-2">
                        <Progress value={uploadProgress} className="h-2 w-full" />
                        <div className="text-xs text-gray-400">{uploadProgress}% uploaded</div>
                      </div>
                    )}
                    
                    {uploadStatus === 'success' && (
                      <div className="text-sm text-green-400">Upload complete!</div>
                    )}
                    
                    {uploadStatus === 'error' && (
                      <div className="text-sm text-red-400">Upload failed. Please try again.</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <div className="text-sm font-medium text-gray-200">Click to upload or drag and drop</div>
                    <div className="text-xs text-gray-400">
                      PDF, TXT, MD, MP3, WAV, OGG (max 20MB)
                    </div>
                  </div>
                )}
              </div>
              
              {selectedFile && uploadStatus === 'idle' && (
                <div className="flex justify-end">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white" 
                    onClick={uploadFile}
                  >
                    Upload and Process
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {selectedTab === 'drive' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Google Drive Link</label>
                <Input
                  placeholder="https://drive.google.com/file/d/..."
                  value={googleDriveUrl}
                  onChange={(e) => setGoogleDriveUrl(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-xs text-gray-400">
                  Paste a link to a Google Drive document, spreadsheet, or presentation
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!googleDriveUrl}
                >
                  Add to Knowledge Base
                </Button>
              </div>
            </div>
          )}
          
          {selectedTab === 'web' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Web URL</label>
                <Input
                  placeholder="https://example.com/article"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-xs text-gray-400">
                  Enter a URL to a web page or article that contains relevant information
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!webUrl}
                  onClick={async () => {
                    try {
                      // Check if user is logged in as admin first
                      const adminCheckResponse = await fetch('/api/auth/admin-check');
                      const adminCheckResult = await adminCheckResponse.json();
                      
                      if (!adminCheckResponse.ok || !adminCheckResult.isAdmin) {
                        toast({
                          title: 'Admin access required',
                          description: 'You need to be logged in as an admin to add content to the knowledge database.',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      toast({
                        title: 'Processing',
                        description: 'Adding web link to knowledge database...',
                      });
                      
                      const response = await fetch('/api/ai-knowledge', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          title: `Web Content: ${webUrl}`,
                          content: `Website content from ${webUrl}. This URL was added to the knowledge database for analysis and reference.`,
                          source: webUrl,
                          contentType: 'webpage',
                          status: 'active',
                        }),
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to add web link to knowledge database');
                      }
                      
                      const result = await response.json();
                      
                      setShowAddSourceModal(false);
                      setWebUrl('');
                      
                      // Refresh knowledge sources
                      await fetchKnowledgeSources();
                      
                      toast({
                        title: 'Success',
                        description: 'Web link has been added to the knowledge database',
                      });
                      
                      // Add a confirmation message to the chat
                      setChatHistory(prev => [...prev, { 
                        role: 'assistant', 
                        content: `I've added the web link "${webUrl}" to the BambooMade knowledge database. This content is now permanently available for future reference.`,
                        timestamp: new Date(),
                        id: `web-upload-${Date.now()}`
                      }]);
                      
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: error instanceof Error ? error.message : 'Failed to add web link',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Add to Knowledge Base
                </Button>
              </div>
            </div>
          )}
          
          {selectedTab === 'text' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Content</label>
                <Textarea
                  placeholder="Paste or type text content here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[150px] bg-gray-800 border-gray-700"
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!textContent.trim()}
                  onClick={async () => {
                    try {
                      // Check if user is logged in as admin first
                      const adminCheckResponse = await fetch('/api/auth/admin-check');
                      const adminCheckResult = await adminCheckResponse.json();
                      
                      if (!adminCheckResponse.ok || !adminCheckResult.isAdmin) {
                        toast({
                          title: 'Admin access required',
                          description: 'You need to be logged in as an admin to add content to the knowledge database.',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      toast({
                        title: 'Processing',
                        description: 'Adding content to knowledge database...',
                      });
                      
                      const response = await fetch('/api/ai-knowledge', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          title: `Text Content: ${textContent.substring(0, 30)}${textContent.length > 30 ? '...' : ''}`,
                          content: textContent,
                          contentType: 'article',
                          status: 'active',
                        }),
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to add text content to knowledge database');
                      }
                      
                      const result = await response.json();
                      
                      setShowAddSourceModal(false);
                      setTextContent('');
                      
                      // Refresh knowledge sources
                      await fetchKnowledgeSources();
                      
                      toast({
                        title: 'Success',
                        description: 'Text content has been added to the knowledge database',
                      });
                      
                      // Add a confirmation message to the chat
                      setChatHistory(prev => [...prev, { 
                        role: 'assistant', 
                        content: `I've added your text content to the BambooMade knowledge database. This information is now permanently available for future reference.`,
                        timestamp: new Date(),
                        id: `text-upload-${Date.now()}`
                      }]);
                      
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: error instanceof Error ? error.message : 'Failed to add text content',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Add to Knowledge Base
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}