import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { processAiChat } from "@/lib/bamboo-ai";
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
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
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

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    
    // No login prompt anymore
    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      const { response, tokensUsed, remainingTokens } = await processAiChat(userMessage.content);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onTokensUsed(tokensUsed);
      
      // If we're running low on tokens, add a notification
      if (remainingTokens !== undefined && remainingTokens < 5) {
        const tokenWarning: Message = {
          id: `token-warning-${Date.now()}`,
          role: "assistant",
          content: `⚠️ You have ${remainingTokens} tokens remaining. When you run out, you'll need to purchase more to continue using BambooMade AI.`,
        };
        setMessages((prev) => [...prev, tokenWarning]);
      }
      
      // No login reminder anymore
    } catch (error) {
      console.error("Error processing message:", error);
      
      // Create a user-friendly error message
      let errorContent = "I'm sorry, I encountered an error processing your request. Please try again later.";
      
      // Check for specific error messages
      if (error instanceof Error) {
        if (error.message.includes("Insufficient tokens")) {
          errorContent = "You've used all your available tokens. Please purchase more tokens to continue using BambooMade AI.";
        } else if (error.message.includes("Not authenticated") || error.message.includes("login")) {
          errorContent = "Please log in to use BambooMade AI.";
        }
      }
      
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

  // Check if the data contains user information
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: true,
  });

  return (
    <div className="flex flex-col h-[70vh]">
      <Card className="flex-grow flex flex-col overflow-hidden">
        <ScrollArea className="flex-grow p-4">
          <div className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;
