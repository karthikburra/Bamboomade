import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Sparkles, Info, Calendar, Book, Users, PanelRight, Lightbulb, Award, Brain, Loader2 } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import BambooEvents from "@/components/BambooEvents";
import BambooFact from "@/components/BambooFact";
import RecentUpdates from "@/components/RecentUpdates";
import useScrollTop from "@/hooks/use-scroll-top";
import { Link } from "wouter";
import { fetchDashboardData, DashboardData } from "@/lib/bamboo-ai";
import { useToast } from "@/hooks/use-toast";

const AIChat: React.FC = () => {
  // Ensure page scrolls to top when component mounts
  useScrollTop();
  
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chatQuestion, setChatQuestion] = useState<string | null>(null);
  
  // Simple no-op handler since we're not tracking tokens anymore
  const handleTokensUsed = (usedTokens: number) => {
    // No-op, we don't track tokens anymore
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: "Couldn't load all dashboard data",
          description: "Some sections may not display correctly. You can still use the chat normally.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  // Handle clicks on dashboard items to set AI chat questions
  const handleTopicClick = (topic: string) => {
    setChatQuestion(topic);
    
    // Track in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'dashboard_topic_click', {
        'event_category': 'AI_Chat',
        'event_label': topic
      });
    }
    
    // Scroll to chat interface
    const chatElement = document.getElementById('chat-interface');
    if (chatElement) {
      chatElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Helmet>
        <title>BambooMade AI | Bamboo Architecture Assistant</title>
        <meta name="description" content="Chat with our specialized bamboo architecture AI assistant to get expert guidance on sustainable bamboo construction and design." />
      </Helmet>
      
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 py-12">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-900/40 text-green-400 border border-green-800">
                <Sparkles className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm font-medium">AI-Powered Assistant</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl md:text-5xl">
              BambooMade AI
            </h1>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
              <span className="text-green-400 font-medium">All Bamboo Data in one place.</span>
            </p>
            <p className="mt-2 text-base text-green-500 font-medium">
              Try it now - first 5 questions free, then login to continue!
            </p>
          </div>
          
          {/* Dashboard Information Section */}
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              <span className="ml-3 text-zinc-400">Loading information dashboard...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 mb-12 md:grid-cols-2 lg:grid-cols-3">
              {/* Bamboo Facts Card */}
              <div className="md:col-span-1">
                <BambooFact 
                  factData={dashboardData?.fact || null} 
                  onFactClick={handleTopicClick}
                />
              </div>
              
              {/* Upcoming Events Card */}
              <div className="md:col-span-1">
                <BambooEvents 
                  events={dashboardData?.events || null} 
                  onEventClick={handleTopicClick}
                />
              </div>
              
              {/* Recent Updates Card */}
              <div className="md:col-span-2 lg:col-span-1">
                <RecentUpdates 
                  updates={dashboardData?.updates || []} 
                  onUpdateClick={handleTopicClick}
                />
              </div>
            </div>
          )}
          
          {/* Chat Interface Section */}
          <div id="chat-interface" className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <ChatInterface onTokensUsed={handleTokensUsed} initialQuestion={chatQuestion} />
            </div>
            
            <div className="space-y-6">
              <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
                <CardHeader className="bg-zinc-900 border-b border-zinc-800 pb-4">
                  <CardTitle className="text-zinc-200 flex items-center">
                    <Info className="h-5 w-5 mr-2 text-green-500" />
                    How Can I Help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3 text-sm text-zinc-300">
                    <li className="flex">
                      <Book className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                      <span>Get information about bamboo species, properties, and applications</span>
                    </li>
                    <li className="flex">
                      <Lightbulb className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                      <span>Learn sustainable design techniques with bamboo</span>
                    </li>
                    <li className="flex">
                      <PanelRight className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                      <span>Understand joinery and connection methods</span>
                    </li>
                    <li className="flex">
                      <Brain className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                      <span>Get project-specific advice and recommendations</span>
                    </li>
                    <li className="flex">
                      <Calendar className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                      <span>Find out about upcoming workshops and events</span>
                    </li>
                    <li className="flex">
                      <Award className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                      <span>Learn about BambooMade's previous projects</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="bg-zinc-900/70 border-t border-zinc-800 flex flex-col items-stretch pt-4">
                  <p className="text-xs text-zinc-500 mb-3">
                    Need more personalized guidance for your bamboo architecture project?
                  </p>
                  <Link href="/project-guidance">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-zinc-100" variant="default">
                      <Users className="h-4 w-4 mr-2" />
                      Book Project Guidance
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-zinc-200">
                    <span className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-green-500" />
                      How Our AI Works
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs space-y-1 text-zinc-400">
                    <p>Our AI is trained on bamboo architecture knowledge and is constantly updated with:</p>
                    <ul className="list-disc list-inside pl-2 space-y-1">
                      <li>Expert knowledge from bamboo architects</li>
                      <li>Latest bamboo construction techniques</li>
                      <li>Sustainable design principles</li>
                      <li>Real-time workshop and event information</li>
                    </ul>
                  </CardDescription>
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
