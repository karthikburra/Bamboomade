import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminTabs from "@/components/AdminTabs";
import AdminAIChat from "@/components/AdminAIChat";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft } from "lucide-react";

const AdminAIKnowledgeChat = () => {
  const [, navigate] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check admin status
  const { data: adminCheck, isLoading } = useQuery({
    queryKey: ["/api/auth/admin-check"],
    retry: false,
  });
  
  useEffect(() => {
    if (!isLoading) {
      if (adminCheck && (adminCheck as any).isAdmin) {
        setIsAdmin(true);
      } else {
        // Redirect if not admin
        navigate("/admin-login");
      }
    }
  }, [adminCheck, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-12 h-12 border-t-2 border-b-2 border-green-500 rounded-full"></div>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Admin access required. Please log in with admin credentials.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Knowledge Assistant | BambooMade Admin</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4 bg-gray-950 min-h-screen text-gray-100">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-amber-400">Knowledge Assistant</h1>
            <p className="text-gray-300 text-sm mb-4">
              Use AI to help analyze and add content to the knowledge base
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="mb-4 sm:mb-0 border-amber-700 text-amber-400 hover:border-amber-600 hover:bg-amber-950"
            onClick={() => navigate("/ai-knowledge-database")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Database
          </Button>
        </div>
        
        <AdminTabs value="database">
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              <AdminAIChat />
            </div>
          </div>
        </AdminTabs>
      </div>
    </>
  );
};

export default AdminAIKnowledgeChat;