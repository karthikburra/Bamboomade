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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatHistory } = useQuery({
    queryKey: ["/api/chat/history"],
    enabled: true,
    onSuccess: (data) => {
      if (data && data.length > 0) {
        // Convert chat history to messages format, only if we don't have messages yet
        if (messages.length <= 1) {
          const historyMessages = data.map((msg) => ([
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
    },
  });

  // Scroll to bottom whenever messages change
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
      const { response, tokensUsed } = await processAiChat(userMessage.content);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onTokensUsed(tokensUsed);
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
