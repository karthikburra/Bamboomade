import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, RefreshCw, Filter, Download, Eye, Trash } from "lucide-react";

// Import the AdminDashboard component for re-use
import AdminDashboardComponent from "@/components/AdminDashboard";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [, navigate] = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sessions");

  // Check if admin is authenticated
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/admin-check"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/admin-check");
        return response.json();
      } catch (error) {
        // If not authenticated, redirect to admin login
        navigate("/admin-login");
        throw error;
      }
    }
  });

  // Get project guidance sessions
  const { 
    data: sessions, 
    isLoading: sessionsLoading,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ["/api/admin/project-guidance"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/project-guidance");
      return response.json();
    },
    enabled: !authLoading && !!authData?.isAdmin,
  });

  // Get AI training data
  const { 
    data: trainingData, 
    isLoading: trainingDataLoading,
    refetch: refetchTrainingData
  } = useQuery({
    queryKey: ["/api/admin/ai-training"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/ai-training");
      return response.json();
    },
    enabled: !authLoading && !!authData?.isAdmin,
  });

  // Get user data
  const { 
    data: users, 
    isLoading: usersLoading,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return response.json();
    },
    enabled: !authLoading && !!authData?.isAdmin,
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/admin-logout");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      navigate("/admin-login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };

  // Handle refresh data
  const handleRefresh = () => {
    if (activeTab === "sessions") {
      refetchSessions();
    } else if (activeTab === "training") {
      refetchTrainingData();
    } else if (activeTab === "users") {
      refetchUsers();
    }
    
    toast({
      title: "Data Refreshed",
      description: "The data has been refreshed.",
    });
  };

  // Export data as CSV
  const exportData = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "Export Failed",
        description: "No data to export.",
        variant: "destructive",
      });
      return;
    }

    // Convert data to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          let cell = row[header];
          // Handle different data types and escape commas, quotes
          if (typeof cell === "string") {
            // Replace " with "" to escape quotes and wrap in quotes if contains comma
            cell = cell.replace(/"/g, '""');
            if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
              cell = `"${cell}"`;
            }
          } else if (cell instanceof Date) {
            cell = cell.toISOString();
          } else if (cell === null || cell === undefined) {
            cell = "";
          }
          return cell;
        }).join(",")
      )
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | BambooMade</title>
        <meta name="description" content="Admin dashboard for BambooMade" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="bg-background min-h-screen">
        <div className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="destructive"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          <Tabs 
            defaultValue="sessions" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
              <TabsTrigger value="sessions">Project Sessions</TabsTrigger>
              <TabsTrigger value="training">AI Training Data</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Project Guidance Sessions</CardTitle>
                      <CardDescription>
                        Manage all project guidance sessions
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => exportData(sessions || [], "project_sessions")}
                      disabled={!sessions || sessions.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <div className="h-40 flex items-center justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : !sessions || sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No project guidance sessions found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Topic</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>User Type</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessions.map((session: any) => (
                            <TableRow key={session.id}>
                              <TableCell>{session.id}</TableCell>
                              <TableCell>{session.studentName}</TableCell>
                              <TableCell>{session.email}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {session.topic}
                              </TableCell>
                              <TableCell>
                                {new Date(session.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{session.duration} min</TableCell>
                              <TableCell>
                                {session.isStudent ? "Student" : "Professional"}
                              </TableCell>
                              <TableCell>
                                {session.paymentId ? (
                                  <span className="text-green-600 font-medium">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-red-600 font-medium">
                                    No
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="training">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>AI Training Data</CardTitle>
                      <CardDescription>
                        Manage training data for the AI system
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => exportData(trainingData || [], "ai_training_data")}
                      disabled={!trainingData || trainingData.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {trainingDataLoading ? (
                    <div className="h-40 flex items-center justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : !trainingData || trainingData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No AI training data found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Question</TableHead>
                            <TableHead>Answer</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trainingData.map((data: any) => (
                            <TableRow key={data.id}>
                              <TableCell>{data.id}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {data.question}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {data.answer}
                              </TableCell>
                              <TableCell>{data.category}</TableCell>
                              <TableCell>
                                {new Date(data.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <Trash className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Users</CardTitle>
                      <CardDescription>
                        Manage registered users
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => exportData(users || [], "users")}
                      disabled={!users || users.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="h-40 flex items-center justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : !users || users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Tokens</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user: any) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.id}</TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.tokens}</TableCell>
                              <TableCell>
                                {new Date(user.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;