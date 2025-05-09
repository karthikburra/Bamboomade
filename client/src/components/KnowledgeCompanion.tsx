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
import { Send, RefreshCcw, Plus } from 'lucide-react';

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
          status: 'active'
        });
        
        toast({
          title: 'Added to Knowledge Base',
          description: `"${suggestion.title}" has been added to the knowledge base.`,
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
        className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
      >
        <div 
          className={`inline-block p-3 rounded-lg ${
            msg.role === 'user' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {msg.content}
          
          {/* Show refresh button for website URLs in assistant messages */}
          {msg.role === 'assistant' && msg.content.includes('website') && msg.content.includes('http') && (
            <div className="mt-2 flex justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
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
                      <RefreshCcw className="h-4 w-4 mr-1" />
                      Refresh Website
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
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
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>Knowledge Companion</CardTitle>
        <CardDescription>
          Chat to add content to the knowledge base - all information is automatically processed and added
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {chatHistory.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      <CardFooter>
        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          {isProcessing ? (
            <Textarea
              placeholder="Processing your message..."
              disabled
              className="resize-none"
            />
          ) : (
            <Textarea
              placeholder="Share information or paste a website URL..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="resize-none"
            />
          )}
          
          <Button type="submit" disabled={isProcessing || !message.trim()}>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}