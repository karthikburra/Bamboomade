import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import AdminDashboard from "@/components/AdminDashboard";
import { Shield, AlertTriangle } from "lucide-react";

const Admin: React.FC = () => {
  const { toast } = useToast();
  
  // Fetch current user data to check for admin status
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: true,
  });
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!isLoading && userData && !userData.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      window.location.href = "/";
    }
  }, [userData, isLoading, toast]);

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
  if (!userData || !userData.isAdmin) {
    return (
      <div className="container py-12 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4 bg-destructive/10 text-destructive p-3 rounded-md">
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
      
      <div className="bg-background py-12">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage BambooMade AI training data, counseling sessions, and user accounts.
            </p>
          </div>
          
          <AdminDashboard />
        </div>
      </div>
    </>
  );
};

export default Admin;
