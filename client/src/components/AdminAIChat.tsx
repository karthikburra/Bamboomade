import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertTriangle, Bot, Send, Loader2, UserCircle2, 
  CheckCircle, ThumbsUp, DatabaseIcon, Sparkles 
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Types for our messages
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
  isThinking?: boolean;
  shouldAddToKnowledge?: boolean;
  suggestion?: string;
  isDuplicate?: boolean;
  addedContent?: AiKnowledgeContent;
}

const AdminAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to the Knowledge Assistant! I can help you add content to the knowledge base. Ask me questions about bamboo architecture or share information you'd like to store in the knowledge base."
    }
  ]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addToKnowledgeDialogOpen, setAddToKnowledgeDialogOpen] = useState<boolean>(false);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [currentSuggestion, setCurrentSuggestion] = useState<string>("");
  const { toast } = useToast();
  
  // Reference to the message container for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    // Create new user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setInputValue("");
    
    // Create thinking message from assistant
    const thinkingId = (Date.now() + 1).toString();
    const thinkingMessage: Message = {
      id: thinkingId,
      role: "assistant",
      content: "Thinking...",
      isThinking: true
    };
    
    // Add thinking message
    setMessages(prev => [...prev, thinkingMessage]);
    
    // Start loading
    setIsLoading(true);
    
    try {
      // Call the knowledge companion API
      const response = await fetch("/api/knowledge-companion/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: inputValue })
      });
      
      if (!response.ok) {
        throw new Error("Failed to communicate with the knowledge assistant");
      }
      
      const data = await response.json();
      
      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.id !== thinkingId));
      
      // Create assistant message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        shouldAddToKnowledge: data.shouldAddToKnowledge,
        suggestion: data.suggestion,
        isDuplicate: data.isDuplicate
      };
      
      // Add assistant message
      setMessages(prev => [...prev, assistantMessage]);
      
      // If the AI suggests adding to knowledge base, show dialog
      if (data.shouldAddToKnowledge && !data.isDuplicate) {
        setCurrentMessage(userMessage.content);
        setCurrentSuggestion(data.suggestion || "");
        setAddToKnowledgeDialogOpen(true);
      }
      
    } catch (error) {
      console.error("Knowledge chat error:", error);
      
      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.id !== thinkingId));
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again later."
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Communication Error",
        description: "Failed to communicate with the knowledge assistant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle adding to knowledge base
  const addToKnowledgeBase = async () => {
    try {
      setIsLoading(true);
      
      // Call the API to add to knowledge base
      const response = await fetch("/api/ai-knowledge/from-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userMessage: currentMessage,
          aiSuggestion: currentSuggestion
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to add to knowledge base");
      }
      
      const data = await response.json();
      
      // Create confirmation message
      const resultMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I've added this content to the knowledge base for review.",
        addedContent: data.addedContent
      };
      
      // Add confirmation message
      setMessages(prev => [...prev, resultMessage]);
      
      toast({
        title: "Content Added",
        description: "The content has been added to the knowledge base for review.",
        variant: "default"
      });
      
    } catch (error) {
      console.error("Error adding to knowledge base:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error adding this content to the knowledge base. Please try again later."
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to add content to the knowledge base",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setAddToKnowledgeDialogOpen(false);
    }
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px] bg-gray-950 rounded-lg border border-amber-800/40 shadow-xl">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8 border border-amber-600/40 bg-gray-900">
                <AvatarFallback className="bg-amber-950 text-amber-500">
                  <Bot size={16} />
                </AvatarFallback>
              </Avatar>
            )}

            <div 
              className={`rounded-lg px-4 py-2 max-w-[85%] ${
                message.role === "user"
                  ? "bg-amber-900/40 text-amber-100 border border-amber-800/50"
                  : message.isThinking
                  ? "bg-gray-900 text-gray-300 border border-gray-800"
                  : "bg-gray-900 text-gray-200 border border-gray-800"
              }`}
            >
              {message.isThinking ? (
                <div className="flex items-center gap-2">
                  <span>Thinking</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Knowledge base suggestion indicator */}
                  {message.shouldAddToKnowledge && (
                    <div className="mt-2 text-sm">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>This looks like valuable content for our knowledge base.</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Knowledge base addition confirmation */}
                  {message.addedContent && (
                    <div className="mt-2 text-sm">
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Added to knowledge base: {message.addedContent.title}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {message.role === "user" && (
              <Avatar className="h-8 w-8 border border-amber-600/40 bg-gray-900">
                <AvatarFallback className="bg-amber-950 text-amber-500">
                  <UserCircle2 size={16} />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-amber-800/30 p-4 bg-gray-950">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            placeholder="Share information about bamboo, projects, or events..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 min-h-[60px] max-h-[200px] bg-gray-900 border-amber-800/30 text-gray-100 focus-visible:ring-amber-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="bg-amber-800 hover:bg-amber-700 text-white h-[60px] w-[60px]"
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>

      {/* Add to knowledge base confirmation dialog */}
      <AlertDialog 
        open={addToKnowledgeDialogOpen} 
        onOpenChange={setAddToKnowledgeDialogOpen}
      >
        <AlertDialogContent className="bg-gray-900 border-amber-800/30 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-400">Add to Knowledge Base?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This information appears to be valuable for the knowledge base. Would you like to add it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="mt-2 mb-4">
            <Card className="bg-gray-950 border-amber-800/40">
              <CardContent className="p-3 text-sm text-gray-200">
                <p className="font-medium mb-1 text-amber-400">Content to add:</p>
                <p className="whitespace-pre-wrap">{currentMessage}</p>
              </CardContent>
            </Card>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isLoading}
              className="border-amber-800/40 bg-gray-800 text-gray-200 hover:bg-gray-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={addToKnowledgeBase}
              disabled={isLoading}
              className="bg-amber-700 hover:bg-amber-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <DatabaseIcon className="h-4 w-4 mr-2" />
                  Add to Knowledge Base
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAIChat;