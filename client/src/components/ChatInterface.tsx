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
  Copy, CheckCircle, Sparkles, Info
} from "lucide-react";
import { processAiChat } from "@/lib/bamboo-ai";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";

// Citation interface for source references
interface Citation {
  source: string;
  url?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[]; // Optional array of citation sources
}

interface ChatInterfaceProps {
  onTokensUsed: (tokens: number) => void;
  initialQuestion?: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onTokensUsed, initialQuestion: propInitialQuestion }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm BambooMade AI, your expert on bamboo architecture and sustainable design. How can I assist you today?",
    },
  ]);
  
  // Get the initial question from props first, then from sessionStorage as fallback
  const storedQuestion = typeof window !== 'undefined' ? sessionStorage.getItem("initialQuestion") || "" : "";
  const effectiveInitialQuestion = propInitialQuestion || storedQuestion || "";
  const [input, setInput] = useState(effectiveInitialQuestion);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Number of free questions before showing login prompt
  const FREE_QUESTION_LIMIT = 5;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is admin - this determines if admin commands are available
  const { data: adminData } = useQuery({
    queryKey: ["/api/auth/admin-check"],
    enabled: true
  });
  
  // Set admin status whenever the admin data changes
  useEffect(() => {
    if (adminData && (adminData as any).isAdmin) {
      setIsAdmin(true);
    }
  }, [adminData]);

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
  
  // Submit initial question (either from prop or from session storage)
  useEffect(() => {
    // The initial question can come from either the prop or session storage
    const questionToSubmit = propInitialQuestion || sessionStorage.getItem("initialQuestion");
    
    if (questionToSubmit && messages.length === 1 && !isProcessing) {
      setInput(questionToSubmit);
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
  }, [messages.length, isProcessing, propInitialQuestion]);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    
    // Check if this is a command to add knowledge content (admin only)
    if (input.trim().startsWith("/add-source")) {
      // Only admins are allowed to use this command
      if (!isAdmin) {
        // Show error for non-admins
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          role: "user",
          content: input.trim(),
        };
        
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "This command is only available to administrators. Please log in as an admin to use this feature."
        };
        
        setMessages(prev => [...prev, userMessage, errorMessage]);
        setInput("");
        return;
      }
      
      // Process command for admins
      handleAddSource(input.trim());
      return;
    }
    
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
    
    // Track chat interaction in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'chat_interaction', {
        'event_category': 'AI_Chat',
        'event_label': userMessage.content.substring(0, 50), // First 50 chars of message for categorization
        'value': newQuestionCount // Track which question number this is
      });
    }

    try {
      const { response, tokensUsed, remainingTokens, citations } = await processAiChat(userMessage.content);
      
      // Track successful AI response in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ai_response_received', {
          'event_category': 'AI_Chat',
          'event_label': 'Success',
          'value': tokensUsed || 0 // Track token usage
        });
      }
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
        citations: citations // Store citation information with the message
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
  
  // Function to handle adding a source to the AI knowledge base
  const handleAddSource = async (input: string) => {
    try {
      setIsProcessing(true);
      
      // Parse the command format: /add-source title: Title | content: Content | source: URL (optional)
      const messageContent = input.replace("/add-source", "").trim();
      
      // Simple parsing logic - can be enhanced for better detection
      let title = "";
      let content = "";
      let source = "";
      
      // Simple parsing by splitting the message by pipes and looking for prefixes
      const parts = messageContent.split('|');
      
      for (const part of parts) {
        const trimmedPart = part.trim();
        
        if (trimmedPart.startsWith('title:')) {
          title = trimmedPart.substring('title:'.length).trim();
        } else if (trimmedPart.startsWith('content:')) {
          content = trimmedPart.substring('content:'.length).trim();
        } else if (trimmedPart.startsWith('source:')) {
          source = trimmedPart.substring('source:'.length).trim();
        }
      }
      
      // Validation
      if (!title || !content) {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Please provide both a title and content for your knowledge source. Format: /add-source title: Your Title | content: Your Content | source: URL (optional)"
        };
        setMessages(prev => [...prev, { 
          id: `user-${Date.now()}`, 
          role: "user", 
          content: input 
        }, errorMessage]);
        setInput("");
        return;
      }
      
      // Add to AI knowledge base via API
      const response = await fetch('/api/ai-knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          source: source || null,
          contentType: 'manual',
          status: 'active'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add knowledge content');
      }
      
      // Success message
      const successMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `✅ Source successfully added to the knowledge base!\n\n**Title:** ${title}\n\nYou can manage all sources in the AI Knowledge Management section of the admin dashboard.`
      };
      
      setMessages(prev => [...prev, { 
        id: `user-${Date.now()}`, 
        role: "user", 
        content: input 
      }, successMessage]);
      setInput("");
      
      toast({
        title: "Source Added",
        description: "Knowledge source has been added successfully.",
        duration: 3000,
      });
      
    } catch (error) {
      console.error("Error adding source:", error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Failed to add knowledge source. Please make sure you're logged in as an admin and try again."
      };
      
      setMessages(prev => [...prev, { 
        id: `user-${Date.now()}`, 
        role: "user", 
        content: input 
      }, errorMessage]);
      setInput("");
      
      toast({
        title: "Error",
        description: "Failed to add knowledge source.",
        variant: "destructive",
        duration: 3000,
      });
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
      content: "Hello! I'm BambooMade AI, your expert on bamboo architecture and sustainable design. How can I assist you today?",
    }]);
    setQuestionCount(0);
    setShowLoginPrompt(false);
    toast({
      title: "Chat cleared",
      description: "Your conversation history has been cleared.",
    });
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <Card className="flex-grow flex flex-col overflow-hidden border-zinc-800 bg-zinc-950">
        <div className="flex justify-between items-center p-2 sm:p-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-green-400" />
            <span className="text-zinc-100">AI Assistant</span>
          </div>
          
          <Badge variant="outline" className="ml-1 sm:ml-2 bg-green-900/40 text-green-400 hover:bg-green-900/40 border-green-700 text-[10px] sm:text-xs">
            BETA
          </Badge>
        </div>
        
        <div className="flex-grow flex flex-col overflow-hidden mt-0 p-0 border-none">
          <ScrollArea className="flex-grow p-2 sm:p-4 bg-gradient-to-b from-zinc-900 to-zinc-950">
            <div className="space-y-3 sm:space-y-4 relative">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-md group relative ${
                      message.role === "user"
                        ? "bg-green-700 text-zinc-100"
                        : "bg-zinc-800 border border-zinc-700 text-zinc-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                    
                    {/* Display citations if available */}
                    {message.role === "assistant" && message.citations && message.citations.length > 0 && (
                      <div className="mt-2 sm:mt-3 pt-2 border-t border-zinc-700/50 text-[10px] sm:text-xs text-zinc-400">
                        <p className="font-medium mb-1 flex items-center">
                          <Info size={10} className="mr-1" /> Sources:
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                          {message.citations.map((citation, index) => (
                            <li key={index}>
                              {citation.url ? (
                                <a 
                                  href={citation.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-green-400 hover:underline break-words"
                                  onClick={() => {
                                    // Track source clicks in Google Analytics
                                    if (typeof window !== 'undefined' && (window as any).gtag) {
                                      (window as any).gtag('event', 'citation_click', {
                                        'event_category': 'AI_Chat',
                                        'event_label': citation.source,
                                        'value': 1
                                      });
                                    }
                                  }}
                                >
                                  {citation.source}
                                </a>
                              ) : (
                                <span>{citation.source}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Copy button - only for assistant messages */}
                    {message.role === "assistant" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-700/70 hover:bg-zinc-700 text-green-400"
                        onClick={() => copyToClipboard(message.content, message.id)}
                      >
                        {copiedMessageId === message.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[80%] rounded-lg px-3 py-2 sm:px-4 sm:py-3 bg-zinc-800 border border-zinc-700 text-zinc-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-green-500" />
                      <span className="text-xs sm:text-sm text-zinc-400">Generating response...</span>
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
          
          <CardContent className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900">
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
                  placeholder="Ask about bamboo architecture..."
                  className="flex-grow resize-none min-h-[50px] sm:min-h-[60px] pr-10 sm:pr-12 bg-zinc-800 border-zinc-700 text-zinc-200 focus-visible:ring-green-500 placeholder:text-zinc-500 text-sm sm:text-base"
                  disabled={isProcessing}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-2 bottom-2 h-7 w-7 sm:h-8 sm:w-8 bg-green-600 hover:bg-green-700 text-zinc-100 rounded-full"
                  disabled={!input.trim() || isProcessing}
                >
                  <Send size={14} className="sm:h-4 sm:w-4" />
                </Button>
              </div>
            </form>
            
            {/* Login prompt alert - shown when user reaches question limit */}
            {showLoginPrompt && questionCount >= FREE_QUESTION_LIMIT && (
              <div className="mt-3 sm:mt-4">
                <Alert className="bg-zinc-800 border-zinc-700 p-3 sm:p-4">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  <AlertDescription className="text-xs sm:text-sm text-zinc-300">
                    <div className="flex flex-col space-y-1.5 sm:space-y-2">
                      <span className="font-semibold">You've used all {FREE_QUESTION_LIMIT} free questions!</span>
                      <p className="text-xs sm:text-sm">Create a free account to continue learning about bamboo architecture and access:</p>
                      <ul className="list-disc pl-4 sm:pl-5 text-[10px] sm:text-xs space-y-0.5 sm:space-y-1 text-zinc-400">
                        <li>Unlimited AI-guided bamboo architecture advice</li>
                        <li>Personal chat history saved for future reference</li>
                        <li>Advanced project guidance and design recommendations</li>
                        <li>Early access to workshop information</li>
                      </ul>
                      <div className="flex flex-col sm:flex-row gap-2 mt-1 sm:mt-2">
                        <Link href="/login" className="w-full">
                          <Button size="sm" variant="default" className="w-full bg-green-600 hover:bg-green-700 text-zinc-100 text-xs h-8">Login</Button>
                        </Link>
                        <Link href="/register" className="w-full">
                          <Button size="sm" variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs h-8">Register Free Account</Button>
                        </Link>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default ChatInterface;