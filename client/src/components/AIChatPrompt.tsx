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
    <div className="fixed bottom-4 left-0 right-0 mx-auto w-full z-50 px-4">
      <div className="bg-card border-2 border-primary/20 rounded-xl shadow-lg p-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          <div className="flex items-center mb-2 md:mb-0 md:w-auto">
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
          
          <form onSubmit={handleSubmit} className="flex gap-2 flex-grow">
            <div className="relative flex-grow">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about bamboo architecture or sustainability..."
                className="flex-grow pr-12 rounded-full bg-background border-2 h-11 focus-visible:ring-primary/30 focus-visible:border-primary/50"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!question.trim()} 
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 bg-primary hover:bg-primary/90"
              >
                <Send size={16} className="text-primary-foreground" />
              </Button>
            </div>
          </form>
        </div>
        
        <div className="mt-3 text-xs">
          <p className="text-muted-foreground">Try asking:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              className="px-3 py-1 text-xs rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              onClick={() => setQuestion("What are sustainable bamboo construction techniques?")}
            >
              Bamboo construction techniques
            </button>
            <button
              type="button"
              className="px-3 py-1 text-xs rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              onClick={() => setQuestion("Tell me about bamboo joinery methods")}
            >
              Bamboo joinery methods
            </button>
            <button
              type="button"
              className="px-3 py-1 text-xs rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              onClick={() => setQuestion("What workshops do you offer?")}
            >
              BambooMade workshops
            </button>
            <button
              type="button"
              className="px-3 py-1 text-xs rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              onClick={() => setQuestion("How can I incorporate bamboo in my interior design?")}
            >
              Bamboo interior design
            </button>
            <button
              type="button"
              className="px-3 py-1 text-xs rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              onClick={() => setQuestion("What are the environmental benefits of bamboo?")}
            >
              Environmental benefits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPrompt;