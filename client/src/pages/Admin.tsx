import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { Shield, AlertTriangle } from "lucide-react";

const Admin: React.FC = () => {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Fetch current user data to check for admin status
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: true,
  });
  
  // Check if user is admin and redirect to the admin home page
  useEffect(() => {
    if (!isLoading) {
      if (userData && userData.isAdmin) {
        // Redirect to the new Admin Home page
        navigate("/admin-home");
      } else if (userData && !userData.isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin dashboard.",
          variant: "destructive",
        });
        navigate("/");
      }
    }
  }, [userData, isLoading, toast, navigate]);

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

  // This return section should rarely be shown as we redirect in the useEffect
  return (
    <>
      <Helmet>
        <title>Admin Redirecting | BambooMade</title>
        <meta name="description" content="Redirecting to admin dashboard" />
      </Helmet>
      
      <div className="bg-background min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg">Redirecting to admin dashboard...</p>
        </div>
      </div>
    </>
  );
};

export default Admin;
