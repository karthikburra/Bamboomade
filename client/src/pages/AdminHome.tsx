import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Calendar, Database, BookOpen, Users, UserCog } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const AdminHome: React.FC = () => {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Fetch current user data to check for admin status
  const { data: adminData, isLoading, isError } = useQuery({
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
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!isLoading && (!adminData || !adminData.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [adminData, isLoading, toast, navigate]);

  if (isLoading) {
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
      
      <div className="bg-background min-h-screen py-12">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage BambooMade sessions, knowledge base, and user accounts from a central location.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Session Management Card */}
            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800/80 transition-colors overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full -mt-10 -mr-10"></div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="h-6 w-6 text-green-500" />
                  Session Management
                </CardTitle>
                <CardDescription>
                  Manage project guidance sessions, appointments, and availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-6">
                  Access the full session dashboard to handle pending, upcoming, and past sessions. Manage Google Meet links, reschedule appointments, and set available time slots.
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">Pending Sessions</div>
                  <div className="bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">Google Meet Links</div>
                  <div className="bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">Time Slots</div>
                  <div className="bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">Rescheduling</div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  size="lg"
                  onClick={() => navigate("/admin-dashboard")}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Open Session Dashboard
                </Button>
              </CardFooter>
            </Card>

            {/* AI Knowledge Management Card */}
            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800/80 transition-colors overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full -mt-10 -mr-10"></div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Database className="h-6 w-6 text-blue-500" />
                  Knowledge Base
                </CardTitle>
                <CardDescription>
                  Manage AI knowledge database and training materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-6">
                  Access the knowledge management system to add, edit, or remove content from the AI knowledge base. Categorize content and manage the training data that powers the AI chatbot.
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">Content Management</div>
                  <div className="bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">AI Training</div>
                  <div className="bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">Categories</div>
                  <div className="bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">Content Analysis</div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                  onClick={() => navigate("/ai-knowledge-management")}
                >
                  <Database className="h-5 w-5 mr-2" />
                  Open Knowledge Base
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* User Management Card */}
          <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800/80 transition-colors mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and privileges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Access user management to view, edit, and manage user account information. Grant or revoke admin privileges and monitor user activity.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="border-purple-800 text-purple-400 hover:bg-purple-950/50"
                onClick={() => window.open("/admin-dashboard?tab=users", "_blank")}
              >
                <UserCog className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminHome;