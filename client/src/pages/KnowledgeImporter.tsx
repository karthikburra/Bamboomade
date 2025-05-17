import React, { useEffect, useState } from 'react';
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "wouter";
import { Loader2, AlertCircle, Database, Globe } from "lucide-react";
import UrlImporter from "@/components/admin/UrlImporter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const KnowledgeImporter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("url-import");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if the user is authenticated as admin
  const { data: adminUser, isLoading, error } = useQuery({
    queryKey: ["/api/admin/check"],
    retry: false,
  });
  
  useEffect(() => {
    // If we get a 401/403 error, redirect to login
    if (error) {
      toast({
        title: "Authorization Required",
        description: "You need to be logged in as an admin to access this page.",
        variant: "destructive",
      });
      navigate("/admin-login");
    }
  }, [error, navigate, toast]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!adminUser) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need admin privileges to access this page. Please log in as an admin.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate("/admin-login")}>
            Go to Admin Login
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Knowledge Base Importer | BambooMade Admin</title>
      </Helmet>
      
      <div className="container max-w-6xl py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Database className="h-7 w-7" /> Knowledge Management
            </h1>
            <p className="text-muted-foreground">
              Import, manage, and organize content for your Bamboo One knowledge base
            </p>
          </div>
          
          <Tabs defaultValue="url-import" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-2">
              <TabsTrigger value="url-import" className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> URL Import
              </TabsTrigger>
              <TabsTrigger value="content-manager" className="flex items-center gap-1.5">
                <Database className="h-4 w-4" /> Content Manager
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="url-import" className="mt-4">
              <UrlImporter />
              
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Import Instructions</CardTitle>
                    <CardDescription>
                      How to efficiently import content into your knowledge base
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Quick Tips</h3>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                          <li>Enter any URL - website, social media post, article, etc.</li>
                          <li>The system will automatically extract the content and suggest a content type</li>
                          <li>You can edit the title and content before saving</li>
                          <li>Select the appropriate content type to help categorize the information</li>
                          <li>For social media, select the specific platform for better organization</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium">Supported Content Types</h3>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                          <li><strong>Social Media</strong> - Instagram, LinkedIn, Facebook posts about bamboo</li>
                          <li><strong>Articles</strong> - Blog posts and news about bamboo architecture</li>
                          <li><strong>Events</strong> - Upcoming workshops, exhibitions, or conferences</li>
                          <li><strong>Facts</strong> - Interesting facts about bamboo properties or uses</li>
                          <li><strong>Enthusiasts</strong> - Profiles of bamboo architecture experts</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="content-manager" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Base Content</CardTitle>
                  <CardDescription>
                    View, edit, and manage all your knowledge base content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This feature is coming soon. For now, use the URL Import tab to add new content.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default KnowledgeImporter;