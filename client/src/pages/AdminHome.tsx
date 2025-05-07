import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Shield, AlertTriangle, Calendar, Database, BookOpen, Users, UserCog,
  BarChart3, Clock, CheckCircle, XCircle, FileText, MessageSquare, HelpCircle,
  PieChart
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { TabsContent } from "@/components/ui/tabs";
import AdminTabs from "@/components/AdminTabs";
import { format, isPast, isToday, addDays, differenceInDays } from "date-fns";

// Data fetching for dashboard summary
const useDashboardData = () => {
  const { data: sessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ["/api/project-guidance"],
  });

  const { data: aiKnowledgeData, isLoading: isAiKnowledgeLoading } = useQuery({
    queryKey: ["/api/ai-knowledge"],
  });

  // Note: This endpoint might not exist yet
  const { data: chatStats, isLoading: isChatStatsLoading } = useQuery({
    queryKey: ["/api/ai-chat-stats"],
    enabled: false, // Disable this query since the endpoint doesn't exist yet
  });

  return {
    sessions: sessions || [],
    aiKnowledgeData: aiKnowledgeData || [],
    chatStats: chatStats || { 
      totalQuestions: 0, 
      questionsLastWeek: 0,
      averageResponseTime: 0,
      topQuestions: []
    },
    isLoading: isSessionsLoading || isAiKnowledgeLoading
  };
};

const AdminHome: React.FC = () => {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("summary");
  
  // Fetch current user data to check for admin status
  const { data: adminData, isLoading: isUserLoading, isError } = useQuery({
    queryKey: ["/api/auth/admin-check"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/admin-check");
        return response.json();
      } catch (error) {
        console.error("Admin check error:", error);
        return { isAdmin: false };
      }
    },
    retry: false
  });
  
  // Fetch dashboard data
  const { sessions, aiKnowledgeData, chatStats, isLoading: isDataLoading } = useDashboardData();
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!isUserLoading && (!adminData || !adminData.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [adminData, isUserLoading, toast, navigate]);

  if (isUserLoading || isDataLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-48"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
      </div>
    );
  }
  
  // If not admin or not logged in, show access denied
  if (isError || !adminData || !adminData.isAdmin) {
    return (
      <div className="container py-12 max-w-md mx-auto">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4 bg-red-950/50 text-red-400 p-3 rounded-md">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <p className="text-sm">
                You don't have permission to access this page. 
                Please log in with an admin account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | BambooMade</title>
        <meta name="description" content="Admin dashboard for BambooMade platform" />
      </Helmet>
      
      <div className="bg-background min-h-screen py-8">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage BambooMade sessions, knowledge base, and user accounts from a central location.
            </p>
          </div>
          
          {/* Calculate session stats */}
          {(() => {
            // Session statistics
            const pendingSessions = sessions.filter((s: any) => s.status === 'pending' || !s.googleMeetLink);
            const upcomingSessions = sessions.filter((s: any) => {
              const sessionDate = new Date(s.date);
              return s.status !== 'cancelled' && s.status !== 'completed' && !isPast(sessionDate) && s.googleMeetLink;
            });
            const completedSessions = sessions.filter((s: any) => s.status === 'completed');
            const cancelledSessions = sessions.filter((s: any) => s.status === 'cancelled');
            
            // Sessions happening today
            const todaySessions = sessions.filter((s: any) => {
              const sessionDate = new Date(s.date);
              return isToday(sessionDate) && s.status !== 'cancelled';
            });
            
            // Sessions in next 7 days
            const upcoming7DaysSessions = sessions.filter((s: any) => {
              const sessionDate = new Date(s.date);
              const daysDiff = differenceInDays(sessionDate, new Date());
              return daysDiff > 0 && daysDiff <= 7 && s.status !== 'cancelled';
            });

            // Calculate AI Knowledge Base stats
            const totalContent = aiKnowledgeData.length;
            const activeContent = aiKnowledgeData.filter((item: any) => item.status === 'active').length;
            const draftContent = aiKnowledgeData.filter((item: any) => item.status === 'draft').length;
            
            // Calculate content types
            const contentTypeCount: Record<string, number> = {};
            aiKnowledgeData.forEach((item: any) => {
              const contentType = item.contentType || 'other';
              contentTypeCount[contentType] = (contentTypeCount[contentType] || 0) + 1;
            });
            
            return (
              <AdminTabs defaultTab="summary" onTabChange={setActiveTab}>
          
                {/* Dashboard Summary Tab */}
                <TabsContent value="summary" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Session Statistics Card */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-green-500" />
                          Session Statistics
                        </CardTitle>
                        <CardDescription>
                          Overview of project guidance sessions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-gray-400 text-sm">Pending</p>
                                <p className="text-2xl font-semibold text-white mt-1">{pendingSessions.length}</p>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-amber-600/20 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-amber-500" />
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-gray-400 text-sm">Upcoming</p>
                                <p className="text-2xl font-semibold text-white mt-1">{upcomingSessions.length}</p>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-green-600/20 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-green-500" />
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-gray-400 text-sm">Completed</p>
                                <p className="text-2xl font-semibold text-white mt-1">{completedSessions.length}</p>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-gray-400 text-sm">Cancelled</p>
                                <p className="text-2xl font-semibold text-white mt-1">{cancelledSessions.length}</p>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-red-600/20 flex items-center justify-center">
                                <XCircle className="h-4 w-4 text-red-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Today and Upcoming Sessions Summary */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-300 mb-2">Today's Sessions</h3>
                            {todaySessions.length === 0 ? (
                              <p className="text-sm text-gray-400 italic">No sessions scheduled for today</p>
                            ) : (
                              <div className="space-y-2">
                                {todaySessions.slice(0, 3).map((session: any) => (
                                  <div key={session.id} className="bg-gray-800/40 p-2 rounded border border-gray-800 flex justify-between items-center">
                                    <div>
                                      <p className="text-sm font-medium">{session.studentName}</p>
                                      <p className="text-xs text-gray-400">{format(new Date(session.date), "HH:mm")} • {session.duration} min</p>
                                    </div>
                                    <div className="flex items-center">
                                      {!session.googleMeetLink && (
                                        <div className="bg-amber-950/40 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                                          Needs link
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {todaySessions.length > 3 && (
                                  <p className="text-xs text-center text-gray-400">
                                    + {todaySessions.length - 3} more sessions today
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-300 mb-2">Next 7 Days</h3>
                            {upcoming7DaysSessions.length === 0 ? (
                              <p className="text-sm text-gray-400 italic">No upcoming sessions in the next 7 days</p>
                            ) : (
                              <div className="space-y-2">
                                {upcoming7DaysSessions.slice(0, 3).map((session: any) => (
                                  <div key={session.id} className="bg-gray-800/40 p-2 rounded border border-gray-800 flex justify-between items-center">
                                    <div>
                                      <p className="text-sm font-medium">{session.studentName}</p>
                                      <p className="text-xs text-gray-400">{format(new Date(session.date), "MMM d, HH:mm")} • {session.duration} min</p>
                                    </div>
                                    <div className="flex items-center">
                                      {!session.googleMeetLink && (
                                        <div className="bg-amber-950/40 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                                          Needs link
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {upcoming7DaysSessions.length > 3 && (
                                  <p className="text-xs text-center text-gray-400">
                                    + {upcoming7DaysSessions.length - 3} more upcoming sessions
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          onClick={() => navigate("/admin-dashboard?tab=pending")}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Go to Session Management
                        </Button>
                      </CardFooter>
                    </Card>
          
                    {/* AI Knowledge Base Statistics Card */}
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-blue-500" />
                          AI Knowledge Statistics
                        </CardTitle>
                        <CardDescription>
                          Overview of your AI knowledge base content
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-gray-400 text-sm">Total Content</p>
                                <p className="text-2xl font-semibold text-white mt-1">{totalContent}</p>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                                <Database className="h-4 w-4 text-blue-500" />
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-gray-400 text-sm">Active</p>
                                <p className="text-2xl font-semibold text-white mt-1">{activeContent}</p>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-green-600/20 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-gray-400 text-sm">Drafts</p>
                                <p className="text-2xl font-semibold text-white mt-1">{draftContent}</p>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-amber-600/20 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-amber-500" />
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-gray-400 text-sm">Chat Questions</p>
                                <p className="text-2xl font-semibold text-white mt-1">{chatStats.totalQuestions || "N/A"}</p>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-purple-600/20 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-purple-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Content Types */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-300 mb-2">Content Types</h3>
                            <div className="space-y-2">
                              {Object.entries(contentTypeCount).length > 0 ? (
                                Object.entries(contentTypeCount).map(([type, count]) => (
                                  <div key={type} className="bg-gray-800/40 p-2 rounded border border-gray-800 flex justify-between items-center">
                                    <div className="flex items-center">
                                      <div className={`h-2 w-2 rounded-full bg-blue-500 mr-2`}></div>
                                      <p className="text-sm capitalize">{type}</p>
                                    </div>
                                    <div className="flex items-center">
                                      <p className="text-sm font-medium">{count}</p>
                                      <p className="text-xs text-gray-400 ml-1">items</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-400 italic">No content types available</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Recent Chat Questions (if available) */}
                          {chatStats.topQuestions && chatStats.topQuestions.length > 0 && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-300 mb-2">Popular Questions</h3>
                              <div className="space-y-2">
                                {chatStats.topQuestions.slice(0, 3).map((question, idx) => (
                                  <div key={idx} className="bg-gray-800/40 p-2 rounded border border-gray-800">
                                    <p className="text-sm">"{question}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          onClick={() => navigate("/ai-knowledge-management")}
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Go to Knowledge Base
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Session Management Tab */}
                <TabsContent value="sessions" className="space-y-4">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>Session Management</CardTitle>
                      <CardDescription>
                        Manage project guidance sessions and availability
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Card className="bg-amber-900/20 border-amber-900">
                          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                            <CardTitle className="text-sm sm:text-lg text-amber-400">Pending</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                            <p className="text-xl sm:text-3xl font-bold text-amber-500">{pendingSessions.length}</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-green-900/20 border-green-900">
                          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                            <CardTitle className="text-sm sm:text-lg text-green-400">Upcoming</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                            <p className="text-xl sm:text-3xl font-bold text-green-500">{upcomingSessions.length}</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-blue-900/20 border-blue-900">
                          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                            <CardTitle className="text-sm sm:text-lg text-blue-400">Completed</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                            <p className="text-xl sm:text-3xl font-bold text-blue-500">{completedSessions.length}</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-red-900/20 border-red-900">
                          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                            <CardTitle className="text-sm sm:text-lg text-red-400">Cancelled</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                            <p className="text-xl sm:text-3xl font-bold text-red-500">{cancelledSessions.length}</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Recent Sessions</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-700"
                            onClick={() => navigate("/admin-dashboard?tab=all")}
                          >
                            View All Sessions
                          </Button>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          {sessions.slice(0, 5).map((session: any) => (
                            <div 
                              key={session.id}
                              className="bg-gray-800/40 p-3 rounded-lg border border-gray-700 flex flex-col sm:flex-row justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{session.studentName}</p>
                                  <div className={`px-2 py-0.5 text-xs rounded-full ${
                                    session.status === 'pending' ? 'bg-amber-900/30 text-amber-400' :
                                    session.status === 'completed' ? 'bg-blue-900/30 text-blue-400' :
                                    session.status === 'cancelled' ? 'bg-red-900/30 text-red-400' :
                                    'bg-green-900/30 text-green-400'
                                  }`}>
                                    {session.status || 'upcoming'}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-400">{format(new Date(session.date), "MMM d, yyyy 'at' HH:mm")} • {session.duration} min</p>
                                <p className="text-sm text-gray-400 truncate mt-1">{session.topic}</p>
                              </div>
                              <div className="mt-3 sm:mt-0 flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-700 text-gray-300 w-full sm:w-auto"
                                  onClick={() => navigate(`/admin-dashboard?tab=${session.status === 'pending' ? 'pending' : 'upcoming'}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Availability Management</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-700"
                            onClick={() => navigate("/admin-dashboard?tab=availability")}
                          >
                            Manage Availability
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        onClick={() => navigate("/admin-dashboard?tab=pending")}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Open Full Dashboard
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* AI Knowledge Base Tab */}
                <TabsContent value="knowledge" className="space-y-4">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>AI Knowledge Base</CardTitle>
                      <CardDescription>
                        Manage AI training content and knowledge base
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-blue-900/20 border-blue-900">
                          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                            <CardTitle className="text-sm sm:text-lg text-blue-400">Total Content</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                            <p className="text-xl sm:text-3xl font-bold text-blue-500">{totalContent}</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-green-900/20 border-green-900">
                          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                            <CardTitle className="text-sm sm:text-lg text-green-400">Active Content</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                            <p className="text-xl sm:text-3xl font-bold text-green-500">{activeContent}</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-amber-900/20 border-amber-900">
                          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                            <CardTitle className="text-sm sm:text-lg text-amber-400">Drafts</CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                            <p className="text-xl sm:text-3xl font-bold text-amber-500">{draftContent}</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Recent Content</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-700"
                            onClick={() => navigate("/ai-knowledge-management")}
                          >
                            View All Content
                          </Button>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          {aiKnowledgeData.slice(0, 5).map((content: any) => (
                            <div 
                              key={content.id}
                              className="bg-gray-800/40 p-3 rounded-lg border border-gray-700 flex flex-col sm:flex-row justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{content.title}</p>
                                  <div className={`px-2 py-0.5 text-xs rounded-full ${
                                    content.status === 'draft' ? 'bg-amber-900/30 text-amber-400' :
                                    'bg-green-900/30 text-green-400'
                                  }`}>
                                    {content.status}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-400 capitalize">{content.contentType || 'general'}</p>
                                <p className="text-sm text-gray-400 truncate mt-1">{content.content.slice(0, 60)}...</p>
                              </div>
                              <div className="mt-3 sm:mt-0 flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-700 text-gray-300 w-full sm:w-auto"
                                  onClick={() => navigate("/ai-knowledge-management")}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        onClick={() => navigate("/ai-knowledge-management")}
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Open Knowledge Base
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* User Management Tab */}
                <TabsContent value="users" className="space-y-4">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>
                        Manage user accounts and permissions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
                        <UserCog className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">User Management</h3>
                        <p className="text-muted-foreground mb-6">
                          The user management functionality is currently being developed. You'll be able to view and manage all user accounts in this section soon.
                        </p>
                        <Button
                          variant="outline"
                          className="border-purple-800 text-purple-400 hover:bg-purple-950/50"
                          onClick={() => navigate("/admin-dashboard?tab=users")}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Go to User Management
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </AdminTabs>
            );
          })()}
        </div>
      </div>
    </>
  );
};

export default AdminHome;