import { useState } from "react";
import { Helmet } from "react-helmet";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription, 
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const queryParams = new URLSearchParams(search);
  const activeTab = queryParams.get("tab") || "pending";

  // Get sessions based on tab
  const { data: sessions = [], isLoading: isSessionsLoading } = useQuery({
    queryKey: ['/api/admin/sessions', activeTab],
    enabled: activeTab !== "users" && activeTab !== "deleted-users" && activeTab !== "payments"
  });

  // Update URL with tab value
  const handleTabChange = (value: string) => {
    setLocation(`/admin-dashboard?tab=${value}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Helmet>
        <title>Admin Dashboard | BambooMade</title>
      </Helmet>
      
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        
        <Tabs 
          defaultValue={activeTab} 
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <div className="overflow-x-auto pb-2">
            <TabsList className="bg-gray-900/50 border border-gray-800">
              <TabsTrigger value="pending" className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-300">
                Pending
              </TabsTrigger>
              
              <TabsTrigger value="confirmed" className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-300">
                Confirmed
              </TabsTrigger>
              
              <TabsTrigger value="completed" className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300">
                Completed
              </TabsTrigger>
              
              <TabsTrigger value="cancelled" className="data-[state=active]:bg-red-900/30 data-[state=active]:text-red-300">
                Cancelled
              </TabsTrigger>
              
              <TabsTrigger value="all" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
                All Sessions
              </TabsTrigger>
              
              <TabsTrigger value="payments" className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-300">
                Payment Analytics
              </TabsTrigger>
              
              <TabsTrigger value="users" className="data-[state=active]:bg-indigo-900/30 data-[state=active]:text-indigo-300">
                Users
              </TabsTrigger>
              
              <TabsTrigger value="deleted-users" className="data-[state=active]:bg-pink-900/30 data-[state=active]:text-pink-300">
                Deleted Users
              </TabsTrigger>
              
              <TabsTrigger value="database" className="data-[state=active]:bg-orange-900/30 data-[state=active]:text-orange-300">
                Knowledge DB
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Simple placeholder tab content */}
          {["pending", "confirmed", "completed", "cancelled", "all"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {tabValue.charAt(0).toUpperCase() + tabValue.slice(1)} Sessions
                  </CardTitle>
                  <CardDescription>
                    View {tabValue} project guidance sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSessionsLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {sessions.length} {tabValue} session(s) loaded
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          {/* Other tab content */}
          <TabsContent value="payments" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
                <CardDescription>View payment statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  Payment analytics will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  User list will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deleted-users" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Deleted Users</CardTitle>
                <CardDescription>View and restore deleted accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  Deleted user list will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Knowledge Database</CardTitle>
                <CardDescription>Manage AI training data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  Please navigate to the AI Knowledge Database page
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}