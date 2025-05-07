import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Send, AlertTriangle, ChevronDown, 
  Copy, CheckCircle, Sparkles, Share2, RotateCcw
} from "lucide-react";
import { processAiChat } from "@/lib/bamboo-ai";
import { Link } from "wouter";
import TokenCounter from "./TokenCounter";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onTokensUsed: (tokens: number) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onTokensUsed }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm BambooMade AI, your expert on bamboo architecture and sustainable design. How can I assist you today?",
    },
  ]);
  // Check if we have an initial question from the home page
  const initialQuestion = typeof window !== 'undefined' ? sessionStorage.getItem("initialQuestion") || "" : "";
  const [input, setInput] = useState(initialQuestion);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Number of free questions before showing login prompt
  const FREE_QUESTION_LIMIT = 5;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatHistory } = useQuery({
    queryKey: ["/api/chat/history"],
    enabled: true,
  });
  
  // Process chat history when it loads
  useEffect(() => {
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      // Convert chat history to messages format, only if we don't have messages yet
      if (messages.length <= 1) {
        const historyMessages = chatHistory.map((msg: any) => ([
          {
            id: `user-${msg.id}`,
            role: "user" as const,
            content: msg.message,
          },
          {
            id: `assistant-${msg.id}`,
            role: "assistant" as const,
            content: msg.response,
          },
        ])).flat();
        
        setMessages([messages[0], ...historyMessages]);
      }
    }
  }, [chatHistory, messages.length]);

  // Auto-scroll only when the user sends a message, not when receiving responses
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShouldAutoScroll(false);
    }
  }, [messages, shouldAutoScroll]);
  
  // Submit initial question from homepage if available
  useEffect(() => {
    const initialQuestion = sessionStorage.getItem("initialQuestion");
    if (initialQuestion && messages.length === 1 && !isProcessing) {
      setInput(initialQuestion);
      // Use setTimeout to ensure the input is set before submitting
      const timer = setTimeout(() => {
        if (!isProcessing) {
          // Removed auto-scrolling for initial question too
          handleSendMessage();
          // Clear from session storage to avoid resubmitting if user navigates back
          sessionStorage.removeItem("initialQuestion");
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, isProcessing]);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    
    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);
    
    // Check if we should show login prompt after this question
    if (newQuestionCount >= FREE_QUESTION_LIMIT && !showLoginPrompt) {
      setShowLoginPrompt(true);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    // Removed auto-scrolling completely

    try {
      const { response, tokensUsed, remainingTokens } = await processAiChat(userMessage.content);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      // We still call onTokensUsed for compatibility, but it doesn't do anything now
      onTokensUsed(0);
      
      // After reaching the question limit, add a login suggestion
      if (showLoginPrompt && newQuestionCount === FREE_QUESTION_LIMIT) {
        const loginMessage: Message = {
          id: `login-prompt-${Date.now()}`,
          role: "assistant",
          content: "You've reached your 5 free questions limit. To continue our conversation and access unlimited bamboo architecture assistance, please create a free account. This also allows you to save your chat history and access premium features. Click the Login or Register button below to continue.",
        };
        setMessages((prev) => [...prev, loginMessage]);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      
      // Create a user-friendly error message
      const errorContent = "I'm sorry, I encountered an error processing your request. Please try again later.";
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: errorContent,
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

  // We no longer need to check user data since there's no login requirement
  
  // Add copy functionality
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedMessageId(messageId);
        toast({
          title: "Copied to clipboard",
          description: "The message has been copied to your clipboard.",
          duration: 2000,
        });
        
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setCopiedMessageId(null);
        }, 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast({
          title: "Failed to copy",
          description: "Could not copy text to clipboard.",
          variant: "destructive",
        });
      }
    );
  };
  
  // Function to clear the chat history
  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm BambooMade AI, your expert on bamboo architecture and sustainable design. How can I assist you today?",
    }]);
    setQuestionCount(0);
    setShowLoginPrompt(false);
    toast({
      title: "Chat cleared",
      description: "Your conversation history has been cleared.",
    });
  };
  
  // Sample questions that users can ask
  const sampleQuestions = [
    "What are the best bamboo species for structural applications?",
    "How can I treat bamboo to increase its durability?",
    "Tell me about upcoming bamboo workshops",
    "What are sustainable joinery techniques for bamboo?",
    "How does bamboo compare to other sustainable building materials?"
  ];
  
  // Function to set a sample question as input
  const useSampleQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <Card className="flex-grow flex flex-col overflow-hidden border-zinc-800 bg-zinc-950">
        <div className="flex justify-between items-center p-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-green-500 mr-2" />
            <span className="font-medium text-zinc-200">BambooMade Assistant</span>
            <Badge variant="outline" className="ml-2 bg-green-900/40 text-green-400 hover:bg-green-900/40 border-green-700">
              BETA
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              onClick={clearChat}
              title="Clear conversation"
            >
              <RotateCcw size={16} />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-grow p-4 bg-gradient-to-b from-zinc-900 to-zinc-950">
          <div className="space-y-4 relative">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 shadow-md group relative ${
                    message.role === "user"
                      ? "bg-green-700 text-zinc-100"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Copy button - only for assistant messages */}
                  {message.role === "assistant" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-700/70 hover:bg-zinc-700 text-green-400"
                      onClick={() => copyToClipboard(message.content, message.id)}
                    >
                      {copiedMessageId === message.id ? <CheckCircle size={14} /> : <Copy size={14} />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-zinc-800 border border-zinc-700 text-zinc-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                    <span className="text-sm text-zinc-400">Generating response...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Manual scroll button with improved styling */}
            {messages.length > 3 && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full shadow-md bg-green-600 text-zinc-100 hover:bg-green-700"
                onClick={() => {
                  setShouldAutoScroll(true);
                }}
              >
                <ChevronDown size={16} />
              </Button>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        {/* Sample questions section - only shown when there's 0 or 1 message (just welcome) */}
        {messages.length <= 1 && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900">
            <h4 className="text-sm font-medium text-zinc-200 mb-2 flex items-center">
              <Sparkles className="h-4 w-4 mr-1 text-green-500" />
              Sample Questions
            </h4>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs text-left border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 truncate max-w-full"
                  onClick={() => useSampleQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <CardContent className="p-4 border-t border-zinc-800 bg-zinc-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-grow">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about bamboo architecture, sustainability, or our workshops..."
                className="flex-grow resize-none min-h-[60px] pr-12 bg-zinc-800 border-zinc-700 text-zinc-200 focus-visible:ring-green-500 placeholder:text-zinc-500"
                disabled={isProcessing}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 bottom-2 h-8 w-8 bg-green-600 hover:bg-green-700 text-zinc-100 rounded-full"
                disabled={!input.trim() || isProcessing}
              >
                <Send size={16} />
              </Button>
            </div>
          </form>
          
          {/* Login prompt alert - shown when user reaches question limit */}
          {showLoginPrompt && questionCount >= FREE_QUESTION_LIMIT && (
            <div className="mt-4">
              <Alert className="bg-zinc-800 border-zinc-700">
                <AlertTriangle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-sm text-zinc-300">
                  <div className="flex flex-col space-y-2">
                    <span className="font-semibold">You've used all {FREE_QUESTION_LIMIT} free questions!</span>
                    <p className="text-sm">Create a free account to continue learning about bamboo architecture and access:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1 text-zinc-400">
                      <li>Unlimited AI-guided bamboo architecture advice</li>
                      <li>Personal chat history saved for future reference</li>
                      <li>Advanced project guidance and design recommendations</li>
                      <li>Early access to workshop information</li>
                    </ul>
                    <div className="flex gap-2 mt-2">
                      <Link href="/login">
                        <Button size="sm" variant="default" className="w-full bg-green-600 hover:bg-green-700 text-zinc-100">Login</Button>
                      </Link>
                      <Link href="/register">
                        <Button size="sm" variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">Register Free Account</Button>
                      </Link>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;
