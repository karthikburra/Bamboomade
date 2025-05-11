import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { apiRequest } from "@/lib/queryClient";
import { 
  Send, Sparkles, Copy, CheckCircle, Save, 
  AlertTriangle, ThumbsUp, ThumbsDown, 
  RefreshCcw, FileText, Database
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface AiKnowledgeContent {
  id: number;
  title: string;
  content: string;
  source: string | null;
  contentType: string;
  status: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isProcessingKnowledge?: boolean;
  addedContent?: AiKnowledgeContent;
}

const AdminAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm the BambooMade Knowledge Assistant. I can help you add content to the knowledge base. Just share any information about bamboo architecture, events, or sustainable design, and I'll help you format and categorize it for the database.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Auto-scroll when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // First, send the message to the AI
      const response = await apiRequest("POST", "/api/knowledge-companion/chat", { message: input.trim() });
      
      if (!response.ok) {
        throw new Error("Failed to process message");
      }
      
      const data = await response.json();
      
      // Regular assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // If the AI suggests adding to knowledge base
      if (data.shouldAddToKnowledge) {
        // Show a processing message
        const processingMessage: Message = {
          id: `processing-${Date.now()}`,
          role: "assistant",
          content: "Analyzing and formatting your content for the knowledge base...",
          isProcessingKnowledge: true
        };
        
        setMessages((prev) => [...prev, processingMessage]);
        
        // Try to add the knowledge
        try {
          const knowledgeResponse = await apiRequest("POST", "/api/ai-knowledge/from-chat", { userMessage: input.trim(), aiSuggestion: data.suggestion });
          const knowledgeData = await knowledgeResponse.json();
          
          // Remove the processing message
          setMessages((prev) => prev.filter(msg => !msg.isProcessingKnowledge));
          
          // Show the final result message with the added content
          const resultMessage: Message = {
            id: `result-${Date.now()}`,
            role: "assistant",
            content: knowledgeData.addedContent 
              ? `✅ Successfully added to the knowledge base as *${knowledgeData.addedContent.contentType}*:\n\n**${knowledgeData.addedContent.title}**\n\n${knowledgeData.message}` 
              : `${knowledgeData.message}`,
            addedContent: knowledgeData.addedContent
          };
          
          setMessages((prev) => [...prev, resultMessage]);
          
          // If content was added, invalidate the knowledge query cache
          if (knowledgeData.addedContent) {
            queryClient.invalidateQueries({ queryKey: ["/api/ai-knowledge"] });
            queryClient.invalidateQueries({ queryKey: ["/api/ai-knowledge/pending"] });
            
            toast({
              title: "Content Added",
              description: `"${knowledgeData.addedContent.title}" has been added to the knowledge base.`,
              duration: 3000,
            });
          }
        } catch (error) {
          console.error("Error adding knowledge:", error);
          
          // Remove the processing message
          setMessages((prev) => prev.filter(msg => !msg.isProcessingKnowledge));
          
          // Show error message
          const errorMessage: Message = {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "There was an error adding this content to the knowledge base. Please try again or add it manually.",
          };
          
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy functionality
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      },
      (err) => {
        console.error("Failed to copy:", err);
      }
    );
  };
  
  // Function to clear the chat history
  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm the BambooMade Knowledge Assistant. I can help you add content to the knowledge base. Just share any information about bamboo architecture, events, or sustainable design, and I'll help you format and categorize it for the database.",
    }]);
    
    toast({
      title: "Chat cleared",
      description: "Your conversation history has been cleared.",
    });
  };
  
  // Save content directly
  const saveContentDirectly = async (message: Message) => {
    if (!message.addedContent) return;
    
    try {
      // Content is already saved, so just show a toast
      toast({
        title: "Content Already Saved",
        description: "This content has already been added to the knowledge base.",
      });
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Error",
        description: "Failed to save content to knowledge base.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-950 h-full flex flex-col">
      <CardHeader className="bg-zinc-900 border-b border-zinc-800 py-3 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-amber-400" />
            <CardTitle className="text-base text-zinc-100">Knowledge Assistant</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-amber-900/40 text-amber-400 hover:bg-amber-900/40 border-amber-700 text-xs">
              ADMIN
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={clearChat}
              title="Clear chat"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs text-zinc-400 mt-1">
          Share bamboo content to add to the knowledge base
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-[500px] p-4 bg-gradient-to-b from-zinc-900 to-zinc-950">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-lg px-4 py-3 shadow-md group relative ${
                    message.role === "user"
                      ? "bg-amber-700 text-zinc-100"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-200"
                  }`}
                >
                  {message.isProcessingKnowledge && (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  )}
                  
                  {!message.isProcessingKnowledge && (
                    <>
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                      
                      {/* Action buttons */}
                      {message.role === "assistant" && (
                        <div className="absolute -right-1 -top-2 invisible group-hover:visible flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-zinc-900 hover:bg-zinc-800"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copiedMessageId === message.id ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          
                          {/* Save to knowledge base button (only for messages with content) */}
                          {message.addedContent && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full bg-zinc-900 hover:bg-zinc-800"
                              onClick={() => saveContentDirectly(message)}
                            >
                              <Database className="h-3 w-3 text-green-500" />
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* If this message has added content, show details */}
                  {message.addedContent && (
                    <div className="mt-2 pt-2 border-t border-zinc-700">
                      <div className="flex justify-between items-center text-xs text-zinc-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          Added to Knowledge Base
                        </span>
                        <Badge variant="outline" className="text-[10px] h-4">
                          {message.addedContent.contentType}
                        </Badge>
                      </div>
                      <div className="text-zinc-300 text-sm font-medium">
                        {message.addedContent.title}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-4 bg-zinc-900 border-t border-zinc-800">
        <div className="flex w-full gap-2">
          <Textarea
            className="min-h-[60px] bg-zinc-800 border-zinc-700 resize-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share bamboo content, events, or other knowledge..."
            disabled={isProcessing}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isProcessing || !input.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isProcessing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AdminAIChat;