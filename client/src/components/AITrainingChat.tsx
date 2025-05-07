import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Lightbulb, MessageSquare, SendHorizonal, Plus, HelpCircle, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AITrainingChatProps {
  open: boolean;
  onClose: () => void;
  onContentAdded?: (content: any) => void;
}

const exampleQueries = [
  "Add information about bamboo's environmental benefits",
  "Create content about bamboo joinery techniques",
  "Add a new event for the bamboo workshop in June",
  "How should the AI respond to questions about bamboo architecture?"
];

const AITrainingChat: React.FC<AITrainingChatProps> = ({ open, onClose, onContentAdded }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Create chat mutation
  const sendChatMessage = useMutation({
    mutationFn: async (message: string) => {
      // Include previous messages for context (limit to last 5 messages)
      const previousMessages = chatMessages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await apiRequest(
        'POST',
        '/api/chat/ai-training',
        { message, previousMessages }
      );
      return response.json();
    },
    onSuccess: (data) => {
      // Add AI response to chat
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      setIsProcessingChat(false);
      
      // If content was added to the knowledge base
      if (data.addedContent) {
        toast({
          title: "Content Added to Knowledge Base",
          description: `"${data.addedContent.title}" has been added to the knowledge base.`,
          variant: "default"
        });
        
        // Notify parent component
        if (onContentAdded) {
          onContentAdded(data.addedContent);
        }
      }
    },
    onError: (error) => {
      console.error("Error sending chat message:", error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, there was an error processing your request. Please try again." 
      }]);
      setIsProcessingChat(false);
      
      toast({
        title: "Chat Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSendChat = () => {
    if (!chatInput.trim() || isProcessingChat) return;
    
    // Add user message to chat
    const newMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, newMessage]);
    
    // Process message
    setIsProcessingChat(true);
    sendChatMessage.mutate(chatInput);
    
    // Clear input
    setChatInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Message content copied to clipboard",
      variant: "default",
    });
  };

  const clearChat = () => {
    setChatMessages([]);
    toast({
      title: "Chat cleared",
      description: "All messages have been cleared",
      variant: "default"
    });
  };

  const addExampleQuery = (query: string) => {
    setChatInput(query);
  };

  // Scroll to bottom when new messages come in
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center dark:text-white">
              <Lightbulb className="w-5 h-5 mr-2 text-primary" />
              AI Training Chat
              <Button 
                variant="ghost" 
                size="icon"
                className="ml-auto h-8 w-8 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                onClick={() => setShowHelpDialog(true)}
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Interact with the AI to add knowledge content or learn how to train responses for specific questions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Example Suggestions */}
            {chatMessages.length === 0 && (
              <div className="mb-4 space-y-4">
                <Alert className="dark:bg-gray-700/50 dark:border-gray-600">
                  <AlertDescription className="dark:text-gray-200">
                    Start by asking the AI to add new content to the knowledge base or how to handle specific questions.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {exampleQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600"
                      onClick={() => addExampleQuery(query)}
                    >
                      <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{query}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Chat Messages */}
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-4 pt-2 pb-6">
                {chatMessages.map((message, index) => (
                  <Card key={index} className={`
                    flex flex-col break-words dark:border-gray-700
                    ${message.role === 'user' 
                      ? 'dark:bg-gray-700 ml-12' 
                      : 'dark:bg-gray-900 mr-12 border-l-4 dark:border-l-primary'}
                  `}>
                    <CardContent className="p-3 relative">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center mb-2">
                          {message.role === 'user' ? (
                            <MessageSquare className="h-5 w-5 mr-2 text-gray-400" />
                          ) : (
                            <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                          )}
                          <span className="text-sm font-medium dark:text-gray-300">
                            {message.role === 'user' ? 'You' : 'AI Training Assistant'}
                          </span>
                        </div>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded-full dark:hover:bg-gray-700 dark:text-gray-400"
                              onClick={() => copyMessageToClipboard(message.content)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy message</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      <div className="pl-7 dark:text-gray-200 prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
            
            {/* Input Area */}
            <div className="mt-4 pt-2 border-t dark:border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about training the AI or adding content..."
                  className="flex-1 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  disabled={isProcessingChat}
                />
                <Button 
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isProcessingChat}
                  className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                >
                  {isProcessingChat ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  ) : (
                    <SendHorizonal className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={clearChat}
                  disabled={chatMessages.length === 0 || isProcessingChat}
                  className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center dark:text-white">
              <HelpCircle className="w-5 h-5 mr-2" />
              AI Training Guide
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <h3 className="font-medium text-lg dark:text-white">Adding Knowledge Content</h3>
              <p className="text-sm dark:text-gray-300 mt-1">
                Ask the AI to "add information about [topic]" or "create content about [subject]" to populate the knowledge base.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-lg dark:text-white">Content Format</h3>
              <p className="text-sm dark:text-gray-300 mt-1">
                The AI will structure content with a title, body text, content type, and optional source. All fields should be properly formatted for best results.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-lg dark:text-white">Training Guidance</h3>
              <p className="text-sm dark:text-gray-300 mt-1">
                Ask "How should the AI respond to [specific question type]?" for guidance on training the AI response patterns for particular questions.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              onClick={() => setShowHelpDialog(false)}
              className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AITrainingChat;