import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import ChatInterface from "@/components/ChatInterface";
import useScrollTop from "@/hooks/use-scroll-top";

const AIChat: React.FC = () => {
  // Ensure page scrolls to top when component mounts
  useScrollTop();
  
  // Simple no-op handler since we're not tracking tokens anymore
  const handleTokensUsed = (usedTokens: number) => {
    // No-op, we don't track tokens anymore
  };

  return (
    <>
      <Helmet>
        <title>BambooMade AI | Bamboo Architecture Assistant</title>
        <meta name="description" content="Chat with our specialized bamboo architecture AI assistant to get expert guidance on sustainable bamboo construction and design." />
      </Helmet>
      
      <div className="bg-background py-12">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              BambooMade AI
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Chat with our specialized bamboo architecture AI assistant to get expert guidance on sustainable bamboo construction and design.
            </p>
            <p className="mt-2 text-base text-primary-600 font-medium">
              Try it now - first 5 questions free, then login to continue!
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <ChatInterface onTokensUsed={handleTokensUsed} />
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-2">Ask About:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Bamboo species for construction</li>
                    <li>• Sustainable design techniques</li>
                    <li>• Joinery and connection methods</li>
                    <li>• Treatment and preservation</li>
                    <li>• Project-specific advice</li>
                    <li>• Workshop techniques</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChat;
