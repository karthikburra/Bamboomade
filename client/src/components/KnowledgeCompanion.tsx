import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Lightbulb, MessageSquare, SendHorizontal, Plus, HelpCircle, Copy, RefreshCw, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    addedToKnowledge?: boolean;
    websiteUrl?: string;
    title?: string;
    id?: number;
  };
}

interface KnowledgeCompanionProps {
  open: boolean;
  onClose: () => void;
}

const KnowledgeCompanion: React.FC<KnowledgeCompanionProps> = ({ open, onClose }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'I\'m your Knowledge Companion. Share anything with me - websites, events, documents, or just your thoughts about bamboo. I\'ll help you add it to the knowledge base automatically.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const examplePrompts = [
    "Check this website: https://bamboomade.in",
    "I just learned about a new bamboo joinery technique called 'fish mouth' that allows for clean diagonal connections",
    "There's an upcoming bamboo workshop on June 15 in Delhi",
    "Dendrocalamus asper is a bamboo species I recently worked with - it's great for construction"
  ];

  // Add to knowledge base mutation
  const addToKnowledgeBase = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      contentType: string;
      source?: string;
      status: string;
    }) => {
      const response = await apiRequest('POST', '/api/ai-knowledge', data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Added to Knowledge Base",
        description: `"${variables.title}" has been added successfully.`,
      });
      
      // Update chat messages to show that content was added
      setChatMessages(prevMessages => {
        return prevMessages.map((msg, index) => {
          if (index === prevMessages.length - 2 && msg.role === 'user') {
            return {
              ...msg,
              metadata: {
                ...msg.metadata,
                addedToKnowledge: true,
              }
            };
          }
          return msg;
        });
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add to knowledge base: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Refresh website mutation
  const refreshWebsite = useMutation({
    mutationFn: async (data: { id: number, url: string }) => {
      const response = await apiRequest('POST', '/api/ai-knowledge/refresh-website', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Website Refreshed",
        description: "Successfully updated with the latest content.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
    },
    onError: (error: any) => {
      toast({
        title: "Refresh Failed",
        description: `Failed to refresh website: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create chat mutation
  const sendChatMessage = useMutation({
    mutationFn: async (message: string) => {
      // Check if it's a URL
      const isUrl = message.trim().startsWith('http');

      if (isUrl) {
        // Process as URL
        const response = await apiRequest('POST', '/api/ai-knowledge/analyze', {
          content: message.trim()
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze URL');
        }
        
        const data = await response.json();
        
        // If it's a website, automatically add to knowledge base
        if (data.isWebsite && data.content) {
          await addToKnowledgeBase.mutateAsync({
            title: data.title,
            content: data.content,
            contentType: data.contentType,
            source: data.sourceUrl,
            status: "active"
          });
          
          return {
            result: "website_added",
            title: data.title,
            id: data.id,
            url: message.trim(),
            message: `I've added "${data.title}" to your knowledge base from the website. It contains comprehensive information about the company, their projects, and any upcoming events mentioned on the site.`
          };
        }
      }
      
      // Process with AI to determine content type and suggestion
      const response = await apiRequest('POST', '/api/ai-knowledge/companion-chat', {
        message,
        history: chatMessages
          .filter(msg => msg.role !== 'system')
          .slice(-5)
          .map(msg => ({ role: msg.role, content: msg.content }))
      });
      
      if (!response.ok) {
        throw new Error('Failed to process message');
      }
      
      const data = await response.json();
      
      // If the AI suggests adding to knowledge base
      if (data.shouldAddToKnowledge && data.suggestion) {
        await addToKnowledgeBase.mutateAsync({
          title: data.suggestion.title,
          content: data.suggestion.content,
          contentType: data.suggestion.contentType,
          source: data.suggestion.source || "",
          status: "active"
        });
        
        return {
          result: "content_added",
          title: data.suggestion.title,
          message: data.response,
          id: data.id
        };
      }
      
      return {
        result: "chat_only",
        message: data.response
      };
    },
    onSuccess: (data, variables) => {
      // Add assistant response
      setChatMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: data.message,
          metadata: data.result !== 'chat_only' ? {
            addedToKnowledge: true,
            title: data.title,
            id: data.id,
            websiteUrl: data.url
          } : undefined
        }
      ]);
    },
    onError: (error: any) => {
      setChatMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `I'm sorry, I encountered an error processing your request: ${error.message}. Please try again.` 
        }
      ]);
    },
    onSettled: () => {
      setIsProcessingChat(false);
    }
  });

  // Handle refresh of website content
  const handleRefreshWebsite = (id: number, url: string) => {
    refreshWebsite.mutate({ id, url });
    setChatMessages(prev => [
      ...prev, 
      { 
        role: 'system', 
        content: `Refreshing website content from ${url}...` 
      }
    ]);
  };

  // Scroll to bottom of chat on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Handle sending a chat message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!chatInput.trim() || isProcessingChat) return;
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: chatInput }]);
    
    // Start processing
    setIsProcessingChat(true);
    
    // Reset input
    setChatInput('');
    
    // Send to AI
    sendChatMessage.mutate(chatInput);
  };

  // Show example message in input
  const handleExampleClick = (example: string) => {
    setChatInput(example);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 dark:bg-gray-900">
        <DialogHeader className="px-6 py-4 border-b dark:border-gray-800 mb-0 pb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-primary" />
              Knowledge Companion
              <Badge variant="outline" className="ml-2 bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400">
                <Lightbulb className="h-3 w-3 mr-1" />
                AI
              </Badge>
            </DialogTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowHelpDialog(true)}
                  className="h-8 w-8"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Help & Tips</TooltipContent>
            </Tooltip>
          </div>
          <DialogDescription className="text-sm">
            Share anything about bamboo and I'll help add it to the knowledge base.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((message, index) => (
                <div key={index} className="flex flex-col">
                  {message.role === 'system' ? (
                    <div className="bg-muted/50 dark:bg-gray-800/50 rounded-md p-3 text-center text-sm text-muted-foreground">
                      {message.content}
                    </div>
                  ) : (
                    <Card 
                      className={`${message.role === 'assistant' 
                        ? 'bg-primary/10 border-primary/20 dark:bg-primary/5' 
                        : 'bg-background'} max-w-[85%] ${message.role === 'assistant' ? 'ml-auto' : 'mr-auto'}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="text-sm prose dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        </div>
                        
                        {message.metadata?.addedToKnowledge && (
                          <div className="mt-2 text-xs flex items-center justify-end gap-2">
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400">
                              <Plus className="h-3 w-3 mr-1" />
                              Added to Knowledge Base
                            </Badge>
                            
                            {message.metadata?.websiteUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleRefreshWebsite(message.metadata?.id || 0, message.metadata?.websiteUrl || '')}
                                disabled={refreshWebsite.isPending}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Refresh
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t dark:border-gray-800">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Share a URL, event details, or any bamboo knowledge..."
                className="flex-1"
                disabled={isProcessingChat}
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={isProcessingChat || !chatInput.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isProcessingChat ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
              </Button>
            </form>
            
            {/* Example prompts */}
            <div className="mt-2 flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleExampleClick(example)}
                >
                  {example.startsWith('http') ? (
                    <Globe className="h-3 w-3 mr-1.5" />
                  ) : (
                    <Lightbulb className="h-3 w-3 mr-1.5" />
                  )}
                  {example.length > 40 ? example.substring(0, 37) + '...' : example}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-[600px] dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Knowledge Companion Help</DialogTitle>
            <DialogDescription>
              How to use this feature effectively
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Adding Website Content</h3>
              <p className="text-sm text-muted-foreground">
                Just paste any URL and I'll crawl and extract all the information for your knowledge base automatically, including company info, events, and projects.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Adding Events</h3>
              <p className="text-sm text-muted-foreground">
                Describe an event with details like date, location, and topic. I'll structure it properly in the knowledge base.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Adding Technical Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Share facts, techniques, or materials related to bamboo. I'll organize and categorize this information.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Refreshing Website Content</h3>
              <p className="text-sm text-muted-foreground">
                Use the "Refresh" button on any previously added website to get the latest updates, events, and project details.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default KnowledgeCompanion;