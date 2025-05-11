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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Send, RefreshCcw, Plus, Lightbulb } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
      content: initialMessage || 'Hi! I\'m your Knowledge Companion. Share any information you\'d like to add to the knowledge base, or paste a website URL to automatically extract and add its content.'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

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

  // Chat with the companion
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage('');
    setIsProcessing(true);
    
    // Add user message to chat
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    
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
      
      // Add assistant response to chat
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      
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
          title: 'Submitted for Approval',
          description: `"${suggestion.title}" has been added to the pending queue and will be reviewed by an admin.`,
        });
      } else if (data.isDuplicate) {
        // Content was identified as a duplicate
        toast({
          title: 'Duplicate Content Detected',
          description: 'Similar information already exists in the knowledge base. Content was merged or skipped to prevent duplication.',
        });
      }
      
      // Handle website URL for refresh
      if (data.websiteUrl) {
        toast({
          title: 'Website Content Added',
          description: 'The content from this website has been successfully extracted and added to the knowledge base.',
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
        content: 'Sorry, I encountered an error while processing your message. Please try again.' 
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
        content: `I've refreshed the content for "${data.content.title}". The knowledge base now has the latest information from this website.` 
      }]);
      
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
      
      toast({
        title: 'Website Refreshed',
        description: 'The content has been updated with the latest information from the website.',
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
        content: 'Sorry, I encountered an error while refreshing the website. Please try again.' 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Render chat message
  const renderMessage = (msg: ChatMessage, index: number) => {
    return (
      <div 
        key={index} 
        className={`mb-3 sm:mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
      >
        <div 
          className={`inline-block p-2 sm:p-3 md:p-4 rounded-lg max-w-[90%] sm:max-w-[85%] md:max-w-[70%] ${
            msg.role === 'user' 
              ? 'bg-amber-700 text-white shadow-md' 
              : 'bg-gray-800 text-gray-200 border border-gray-700 shadow-md'
          }`}
        >
          <div className="text-xs sm:text-sm md:text-base whitespace-pre-wrap break-words">
            {msg.content}
          </div>
          
          {/* Show refresh button for website URLs in assistant messages */}
          {msg.role === 'assistant' && msg.content.includes('website') && msg.content.includes('http') && (
            <div className="mt-2 sm:mt-3 flex justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-600 text-gray-200 h-6 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
                      onClick={() => {
                        const urlMatch = msg.content.match(/(https?:\/\/[^\s]+)/);
                        if (urlMatch) {
                          // Extract ID from message if available
                          const idMatch = msg.content.match(/ID:\s*(\d+)/i);
                          const id = idMatch ? parseInt(idMatch[1]) : 0;
                          refreshWebsite(id, urlMatch[0]);
                        }
                      }}
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      <span>Refresh</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-gray-200 border-gray-700 text-xs">
                    Update with the latest content from this website
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full h-full flex flex-col bg-gray-900 border-gray-800 shadow-lg max-w-full overflow-hidden">
      <CardHeader className="border-b border-gray-800 bg-gray-950 rounded-t-lg px-3 py-3 sm:px-6 sm:py-4">
        <CardTitle className="text-white flex items-center text-lg sm:text-xl">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-amber-400">
            <path d="M12 2a5 5 0 0 1 5 5c0 2.69-5 11-5 11s-5-8.31-5-11a5 5 0 0 1 5-5z"></path>
            <path d="m14 16 6 6"></path>
            <path d="M8 16v.8A4 4 0 0 0 12 20v0a4 4 0 0 0 4-3.2v-.8"></path>
          </svg>
          Knowledge Companion
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs sm:text-sm">
          Chat to add content to the knowledge base - all information is automatically processed and added
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto px-2 sm:px-6 py-3 sm:py-4 bg-gray-900 min-h-[300px] h-[60vh] sm:h-[50vh] md:h-[60vh]">
        <div className="space-y-3 sm:space-y-4">
          {chatHistory.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-gray-800 p-2 sm:p-4 bg-gray-950 rounded-b-lg">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1">
                <span className="flex items-center">
                  <Lightbulb className="inline h-3 w-3 mr-1 text-amber-600" />
                  Facts are automatically extracted from all data sources
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              {isProcessing ? (
                <Textarea
                  placeholder="Processing your message..."
                  disabled
                  className="resize-none bg-gray-800 border-gray-700 text-gray-300 placeholder-gray-500 min-h-[60px] sm:min-h-[80px] text-sm sm:text-base"
                />
              ) : (
                <Textarea
                  placeholder="Share information, paste a website URL, or add a 'Did You Know' fact about bamboo..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="resize-none bg-gray-800 border-gray-700 text-gray-300 placeholder-gray-500 min-h-[60px] sm:min-h-[80px] text-sm sm:text-base"
                />
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isProcessing || !message.trim()} 
                className="bg-amber-600 hover:bg-amber-700 text-white h-10 px-4 w-full sm:w-auto"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="ml-2">Send</span>
              </Button>
            </div>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}