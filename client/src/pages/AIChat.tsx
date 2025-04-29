import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Lock, AlertTriangle } from "lucide-react";
import { Helmet } from "react-helmet";
import ChatInterface from "@/components/ChatInterface";
import TokenCounter from "@/components/TokenCounter";
import UserLoginForm from "@/components/UserLoginForm";
import UserRegisterForm from "@/components/UserRegisterForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const AIChat: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Fetch current user data
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: true,
  });
  
  // Handle tokens used in chat
  const handleTokensUsed = (usedTokens: number) => {
    if (!userData) return;
    
    if (usedTokens > userData.tokens) {
      toast({
        title: "Insufficient Tokens",
        description: "You don't have enough tokens to process this request.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Tokens Used",
      description: `Used ${usedTokens} token${usedTokens !== 1 ? 's' : ''}. Remaining: ${userData.tokens - usedTokens}.`,
    });
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
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-48"></div>
                <div className="h-4 bg-muted rounded w-64"></div>
              </div>
            </div>
          ) : userData ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              <div className="lg:col-span-3">
                <ChatInterface onTokensUsed={handleTokensUsed} />
              </div>
              
              <div className="space-y-6">
                <TokenCounter tokens={userData.tokens} />
                
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
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Each message will use tokens based on its length. Your current balance: {userData.tokens} tokens.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Sign in to use BambooMade AI</CardTitle>
                  <CardDescription>
                    New users get 10 free tokens to start chatting with our AI assistant.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Login</TabsTrigger>
                      <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                      <UserLoginForm onSuccess={() => window.location.reload()} />
                    </TabsContent>
                    <TabsContent value="register">
                      <UserRegisterForm onSuccess={() => setActiveTab("login")} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AIChat;
