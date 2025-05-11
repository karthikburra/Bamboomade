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
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Send, 
  RefreshCcw, 
  Plus, 
  Lightbulb, 
  BookText, 
  Link, 
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
  Calendar
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
        return <Link className="h-4 w-4" />;
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
              <Link className="h-3 w-3 mr-1" />
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

  return (
    <Card className="w-full h-full flex flex-col bg-gray-900 border-gray-800 shadow-lg max-w-full overflow-hidden">
      <CardHeader className="border-b border-gray-800 bg-gray-950 rounded-t-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center text-lg sm:text-xl">
            <BookText className="h-5 w-5 mr-2 text-amber-400" />
            Bamboo Knowledge Notebook
          </CardTitle>
          
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
        <CardDescription className="text-gray-400 text-xs sm:text-sm mt-2">
          Add knowledge about bamboo architecture, sustainability, and techniques to our knowledge base.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-0 bg-gray-900 min-h-[400px] h-[60vh] sm:h-[50vh] md:h-[60vh]">
        <div className="divide-y divide-gray-800">
          {chatHistory.map((msg, idx) => (
            msg.role === 'user' 
              ? renderUserMessage(msg, idx) 
              : renderAssistantMessage(msg, idx)
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-gray-800 p-4 sm:p-6 bg-gray-950 rounded-b-lg">
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* Example queries */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
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
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              {isProcessing ? (
                <div className="border border-gray-700 rounded-lg bg-gray-800 p-3 min-h-[100px]">
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
                  placeholder="Add information to the knowledge base, ask a question, or paste a URL..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="resize-none border-gray-700 bg-gray-800 text-white placeholder-gray-500 min-h-[100px] pr-10"
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
            
            <div>
              <Button 
                type="submit" 
                disabled={isProcessing || !message.trim()} 
                className="bg-amber-600 hover:bg-amber-700 text-white h-10 px-4 w-full"
              >
                <Send className="h-5 w-5" />
                <span className="ml-2 hidden sm:inline">Process</span>
              </Button>
              
              <div className="mt-2 text-xs text-gray-400 text-center">
                <span className="flex items-center justify-center">
                  <Lightbulb className="inline h-3 w-3 mr-1 text-amber-600" />
                  Content is AI-analyzed for facts
                </span>
              </div>
            </div>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}