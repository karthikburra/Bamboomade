import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, MessageCircle, Info, LayoutDashboard } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import BambooFact from "@/components/BambooFact";
import RecentArticles from "@/components/RecentArticles";
import SocialMediaCarousel from "@/components/SocialMediaCarousel";
import TodaysEnthusiast from "@/components/TodaysEnthusiast";
import UpcomingEventsList from "@/components/UpcomingEventsList";
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
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  // Simple no-op handler since we're not tracking tokens anymore
  const handleTokensUsed = (usedTokens: number) => {
    // No-op, we don't track tokens anymore
  };

  // Load dashboard data when component mounts
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch the latest dashboard data
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: "Couldn't load dashboard data",
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
    
    // Switch to chat tab instead of scrolling
    setActiveTab("chat");
  };

  return (
    <>
      <Helmet>
        <title>BambooMade AI | Bamboo Architecture Assistant</title>
        <meta name="description" content="Chat with our specialized bamboo architecture AI assistant to get expert guidance on sustainable bamboo construction and design." />
      </Helmet>
      
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 py-6 sm:py-8 md:py-12">
        <div className="container max-w-screen-xl px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="mb-3 sm:mb-4 md:mb-6 text-left">
            {/* Top Row - Title, Chip and Tabs */}
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                  BambooMade AI
                </h1>
                
                <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-green-900/40 text-green-400 border border-green-800">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-500" />
                  <span className="text-xs sm:text-sm font-medium">AI-Powered Assistant</span>
                </div>
              </div>
              
              {/* Tab Selection in Header */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-md px-1 py-1 flex space-x-1">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-sm ${
                    activeTab === "dashboard" 
                      ? "bg-green-800/80 text-zinc-100" 
                      : "bg-transparent text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-sm ${
                    activeTab === "chat" 
                      ? "bg-green-800/80 text-zinc-100" 
                      : "bg-transparent text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300"
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                  <span>Bamboo One</span>
                </button>
              </div>
            </div>
            
            {/* Second Row - Description text and date filter */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-zinc-400">
                <span className="text-green-400 font-medium">All Bamboo Data in one place.</span>
              </p>
              
              {/* Date filter removed as requested */}
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="min-h-[600px]">
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <>
                {isLoading ? (
                  <div className="flex justify-center items-center py-6 sm:py-8 md:py-10">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-green-500" />
                    <span className="ml-2 sm:ml-3 text-sm sm:text-base text-zinc-400">Loading information dashboard...</span>
                  </div>
                ) : (
                  <>
                    {/* Top Row - Facts and Events */}
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-6 md:grid-cols-2">
                      {/* Bamboo Facts Card */}
                      <div>
                        <BambooFact 
                          factData={dashboardData?.fact || null}
                          factsData={dashboardData?.facts || []}
                          onFactClick={handleTopicClick}
                        />
                      </div>
                      
                      {/* Upcoming Events List */}
                      <div>
                        <UpcomingEventsList 
                          events={dashboardData?.upcomingEvents || []}
                          onEventClick={handleTopicClick}
                        />
                      </div>
                    </div>
                    
                    {/* Second Row - Today's Enthusiast and Recent Articles */}
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8 md:grid-cols-2">
                      {/* Today's Bamboo Enthusiast */}
                      <div>
                        <TodaysEnthusiast />
                      </div>
                      
                      {/* Recent Articles */}
                      <div>
                        <RecentArticles 
                          articles={dashboardData?.updates || []} 
                          onArticleClick={handleTopicClick}
                        />
                      </div>
                    </div>

                    {/* Third Row - Social Media Carousel */}
                    <div className="mb-6 sm:mb-8 md:mb-12">
                      <SocialMediaCarousel />
                    </div>
                  </>
                )}
              </>
            )}
            
            {/* Chat Tab */}
            {activeTab === "chat" && (
              <div id="chat-interface" className="grid grid-cols-1">
                <div>
                  <ChatInterface onTokensUsed={handleTokensUsed} initialQuestion={chatQuestion} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChat;
