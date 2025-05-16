import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, User, Lock, Mail, Edit, LogOut, Calendar, MessageSquare, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  tokens: number;
  isAdmin: boolean;
  role: string;
}

interface UserSession {
  id: number;
  studentName: string;
  email: string;
  date: string;
  duration: number;
  topic: string;
  notes: string | null;
  status: string;
  googleMeetLink: string | null;
  paymentConfirmed: boolean;
}

const Profile: React.FC = () => {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch current user data
  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: ["/api/auth/me"],
    enabled: true,
  });

  // Fetch user's sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery<UserSession[]>({
    queryKey: ["/api/project-guidance/my-sessions"],
    enabled: !!user,
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      navigate("/");
    } catch (error) {
      console.error("Failed to logout:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login");
    }
  }, [user, userLoading, navigate]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }
  
  // Create a strongly typed user variable
  const userData: UserProfile = user;

  // Calculate token usage
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
      <Helmet>
        <title>My Profile | BambooMade</title>
        <meta name="description" content="Manage your profile and view your bamboo project guidance sessions" />
      </Helmet>

      <div className="bg-gray-950 min-h-screen pt-8 pb-16">
        <div className="container px-4 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Profile sidebar */}
            <div className="lg:col-span-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-4">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4 border-2 border-green-600">
                      <AvatarFallback className="bg-green-800 text-green-100 text-xl">
                        {getInitials(userData.username)}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-xl text-center text-green-300">{userData.username}</CardTitle>
                    <CardDescription className="text-green-500 text-center mt-1">
                      {userData.isAdmin ? "Administrator" : "Member"}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-300">
                      <Mail className="h-4 w-4 mr-2 text-green-400" />
                      {userData.email}
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Sparkles className="h-4 w-4 mr-2 text-amber-400" />
                      {userData.tokens} AI tokens remaining
                    </div>
                  </div>

                  <Separator className="my-5 bg-gray-800" />

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-green-700 text-green-400 hover:bg-green-900 hover:text-green-300"
                      onClick={() => navigate("/view-my-sessions")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      My Sessions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-amber-700 text-amber-400 hover:bg-amber-900 hover:text-amber-300"
                      onClick={() => navigate("/ai-chat")}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Bamboo One
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-red-800 text-red-400 hover:bg-red-900 hover:text-red-300"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content */}
            <div className="lg:col-span-8">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-green-300">My Dashboard</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your account and view your recent activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    defaultValue="profile"
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 mb-6">
                      <TabsTrigger value="profile">Profile</TabsTrigger>
                      <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-green-400">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm text-gray-400">Username</p>
                            <p className="text-gray-200">{userData.username}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-400">Email</p>
                            <p className="text-gray-200">{userData.email}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-400">Role</p>
                            <p className="text-gray-200">
                              {userData.isAdmin ? "Administrator" : "Member"}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-400">AI Tokens</p>
                            <p className="text-gray-200">{userData.tokens}</p>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-6 bg-gray-800" />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-green-400">Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-green-700 text-green-300 hover:bg-green-900"
                            onClick={() => navigate("/project-guidance")}
                          >
                            Book New Session
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-amber-700 text-amber-300 hover:bg-amber-900"
                            onClick={() => navigate("/ai-chat")}
                          >
                            Bamboo One
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Sessions Tab */}
                    <TabsContent value="sessions">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-green-400">Your Recent Sessions</h3>
                        
                        {sessionsLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                          </div>
                        ) : sessions && sessions.length > 0 ? (
                          <ScrollArea className="h-[450px] rounded-md border border-gray-800">
                            <div className="space-y-4 p-4">
                              {sessions.map((session: UserSession) => (
                                <Card key={session.id} className="bg-gray-800 border-gray-700">
                                  <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <CardTitle className="text-md text-green-300">{session.topic}</CardTitle>
                                        <CardDescription className="text-gray-400">
                                          {format(new Date(session.date), "PPP")} at{" "}
                                          {format(new Date(session.date), "p")}
                                        </CardDescription>
                                      </div>
                                      <Badge
                                        className={`
                                          ${session.status === "confirmed" ? "bg-green-600" : ""}
                                          ${session.status === "pending" ? "bg-amber-600" : ""}
                                          ${session.status === "cancelled" ? "bg-red-600" : ""}
                                          ${session.status === "completed" ? "bg-blue-600" : ""}
                                          ${session.status === "rescheduled" ? "bg-purple-600" : ""}
                                        `}
                                      >
                                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pb-2">
                                    <div className="text-gray-300 text-sm">
                                      {session.notes || "No additional notes"}
                                    </div>
                                  </CardContent>
                                  <CardFooter className="pt-0">
                                    <div className="w-full flex justify-between items-center">
                                      <div className="text-sm text-gray-400">
                                        {session.duration} minutes
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs border-green-700 text-green-300 hover:bg-green-900"
                                        onClick={() => navigate(`/view-session/${session.id}`)}
                                      >
                                        View Details
                                      </Button>
                                    </div>
                                  </CardFooter>
                                </Card>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                            <p>You haven't booked any sessions yet.</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4 border-green-700 text-green-300 hover:bg-green-900"
                              onClick={() => navigate("/project-guidance")}
                            >
                              Book Your First Session
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;