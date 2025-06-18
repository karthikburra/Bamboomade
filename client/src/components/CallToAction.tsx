import React from "react";
import ScrollLink from "@/components/ScrollLink";
import { Button } from "@/components/ui/button";
import { Phone, Calendar, MessageSquare } from "lucide-react";

const CallToAction: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-black to-green-950">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-green-300 mb-4">
          Ready to Collaborate on Your Next Bamboo Project?
        </h2>
        <p className="text-xl text-green-400 max-w-2xl mx-auto mb-8">
          Whether you're an architecture student, a professor, or representing an institution,
          we're here to help you bring your sustainable bamboo vision to life.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <ScrollLink href="/contact" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-green-700 hover:bg-green-600 text-white"
            >
              <Phone className="mr-2 h-4 w-4" />
              Contact Us
            </Button>
          </ScrollLink>
          
          <ScrollLink href="/project-guidance" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white"
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Book Project Guidance</span>
              <span className="inline sm:hidden">Project Guidance</span>
            </Button>
          </ScrollLink>
          
          <ScrollLink href="/ai-chat" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-green-700 text-green-400 hover:bg-green-950/30"
            >
              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center mr-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-2.5 h-2.5 text-green-100"
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
              Try BambooMade AI
            </Button>
          </ScrollLink>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;