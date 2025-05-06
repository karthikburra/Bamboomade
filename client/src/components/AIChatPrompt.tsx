import React, { useState } from "react";
import { useLocation } from "wouter";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AIChatPrompt: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      // Store the question in sessionStorage to pre-fill it in the chat interface
      sessionStorage.setItem("initialQuestion", question.trim());
      // Redirect to AI chat page
      setLocation("/ai-chat");
    }
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 mx-auto w-full max-w-lg z-50 px-4">
      <div className="bg-card border rounded-xl shadow-lg p-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-4 h-4 text-primary-foreground"
            >
              <path d="M21 12.5c0 .3-.1.6-.2.9"></path>
              <path d="M14 19.5c-.4 0-.8-.1-1.2-.3"></path>
              <path d="M3 13l0-.3c0-3.3 2.7-6 6-6 1.6 0 3.1.6 4.2 1.8"></path>
              <path d="M13 22H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"></path>
              <path d="M18 22a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path>
              <path d="m16.5 19 3-3"></path>
              <path d="M7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium">Ask BambooMade AI</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about bamboo architecture or sustainability..."
            className="flex-grow"
          />
          <Button type="submit" size="icon" disabled={!question.trim()}>
            <Send size={18} />
          </Button>
        </form>
        
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Try asking:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-primary cursor-pointer hover:underline" 
              onClick={() => setQuestion("What are sustainable bamboo construction techniques?")}>
              Bamboo construction techniques
            </span>
            <span className="text-primary cursor-pointer hover:underline" 
              onClick={() => setQuestion("Tell me about bamboo joinery methods")}>
              Bamboo joinery methods
            </span>
            <span className="text-primary cursor-pointer hover:underline" 
              onClick={() => setQuestion("What workshops do you offer?")}>
              BambooMade workshops
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPrompt;