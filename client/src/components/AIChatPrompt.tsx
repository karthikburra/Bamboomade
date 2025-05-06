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
      <div className="relative bg-zinc-900/95 border-2 border-primary/30 rounded-xl shadow-xl py-3 px-4 max-w-7xl mx-auto backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/90 via-zinc-800/90 to-primary/30 animate-gradient-x"></div>
        <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          <div className="flex items-center mb-2 md:mb-0 md:w-auto">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mr-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-3 h-3 text-primary-foreground"
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
            <h3 className="text-sm font-medium text-white">Ask BambooMade AI</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2 flex-grow">
            <div className="relative flex-grow">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about bamboo architecture or sustainability..."
                className="flex-grow pr-10 rounded-full bg-zinc-800/80 border-2 border-primary/30 h-9 text-sm text-white placeholder:text-zinc-400 focus-visible:ring-primary/40 focus-visible:border-primary/60 shadow-md"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!question.trim()} 
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-7 w-7 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md border border-primary/50"
              >
                <Send size={14} className="text-primary-foreground" />
              </Button>
            </div>
          </form>
        </div>
        
        <div className="mt-2 text-xs">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="px-2 py-0.5 text-[10px] rounded-full border border-primary/40 bg-gradient-to-r from-zinc-800 to-primary/10 text-zinc-100 hover:from-zinc-700 hover:to-primary/20 hover:text-white hover:border-primary/50 transition-all hover:shadow-md hover:shadow-primary/10 animate-pulse animation-delay-100 opacity-80 hover:opacity-100"
              onClick={() => setQuestion("Tell me about the National Bamboo Mission")}
            >
              National Bamboo Mission
            </button>
            <button
              type="button"
              className="px-2 py-0.5 text-[10px] rounded-full border border-primary/40 bg-gradient-to-r from-zinc-800 to-primary/10 text-zinc-100 hover:from-zinc-700 hover:to-primary/20 hover:text-white hover:border-primary/50 transition-all hover:shadow-md hover:shadow-primary/10 animate-pulse animation-delay-300 opacity-80 hover:opacity-100"
              onClick={() => setQuestion("What are the popular bamboo species for construction?")}
            >
              Bamboo Species
            </button>
            <button
              type="button"
              className="px-2 py-0.5 text-[10px] rounded-full border border-primary/40 bg-gradient-to-r from-zinc-800 to-primary/10 text-zinc-100 hover:from-zinc-700 hover:to-primary/20 hover:text-white hover:border-primary/50 transition-all hover:shadow-md hover:shadow-primary/10 animate-pulse animation-delay-500 opacity-80 hover:opacity-100"
              onClick={() => setQuestion("Are there any upcoming bamboo events or workshops?")}
            >
              Future Bamboo Events
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPrompt;