import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, AlertTriangle, ChevronDown } from "lucide-react";
import { processAiChat } from "@/lib/bamboo-ai";
import { Link } from "wouter";
import TokenCounter from "./TokenCounter";

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
          // Set shouldAutoScroll to true for initial question too
          setShouldAutoScroll(true);
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
    // Only auto-scroll when user sends a message
    setShouldAutoScroll(true);

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

  return (
    <div className="flex flex-col h-[70vh]">
      <Card className="flex-grow flex flex-col overflow-hidden">
        <ScrollArea className="flex-grow p-4">
          <div className="space-y-4 relative">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary-600 text-primary-50"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted text-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
            {/* Manual scroll button */}
            {messages.length > 3 && (
              <Button
                size="icon"
                variant="outline"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full shadow-md opacity-70 hover:opacity-100"
                onClick={() => {
                  setShouldAutoScroll(true);
                }}
              >
                <ChevronDown size={16} />
              </Button>
            )}
            {/* Login prompt removed */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <CardContent className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about bamboo architecture, sustainability, or our workshops..."
              className="flex-grow resize-none min-h-[60px]"
              disabled={isProcessing}
            />
            <Button
              type="submit"
              size="icon"
              className="self-end"
              disabled={!input.trim() || isProcessing}
            >
              <Send size={18} />
            </Button>
          </form>
          
          {/* Login prompt alert - shown when user reaches question limit */}
          {showLoginPrompt && questionCount >= FREE_QUESTION_LIMIT && (
            <div className="mt-4">
              <Alert className="bg-primary-50 border-primary-200">
                <AlertTriangle className="h-4 w-4 text-primary-600" />
                <AlertDescription className="text-sm text-primary-900">
                  <div className="flex flex-col space-y-2">
                    <span className="font-semibold">You've used all {FREE_QUESTION_LIMIT} free questions!</span>
                    <p className="text-sm">Create a free account to continue learning about bamboo architecture and access:</p>
                    <ul className="list-disc pl-5 text-xs space-y-1">
                      <li>Unlimited AI-guided bamboo architecture advice</li>
                      <li>Personal chat history saved for future reference</li>
                      <li>Advanced project guidance and design recommendations</li>
                      <li>Early access to workshop information</li>
                    </ul>
                    <div className="flex gap-2 mt-2">
                      <Link href="/login">
                        <Button size="sm" variant="default" className="w-full">Login</Button>
                      </Link>
                      <Link href="/register">
                        <Button size="sm" variant="outline" className="w-full">Register Free Account</Button>
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
