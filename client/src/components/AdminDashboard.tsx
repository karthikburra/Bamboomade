import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  addAiTrainingData, 
  fetchAllUsers, 
  updateUserAdminStatus, 
  fetchAllSessions,
  TrainingData,
  User,
  ProjectGuidance
} from "@/lib/bamboo-ai";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, ShieldCheck, CheckCircle, XCircle, CalendarClock, Mail, Phone, FileEdit, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("training");
  
  // Training form state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  
  // Fetch training data
  const { data: trainingData, isLoading: isLoadingTraining } = useQuery<TrainingData[]>({
    queryKey: ["/api/admin/training-data"],
    enabled: activeTab === "training",
  });
  
  // Fetch users for user management
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: activeTab === "users",
  });
  
  // Fetch project guidance sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<ProjectGuidance[]>({
    queryKey: ["/api/project-guidance"],
    enabled: activeTab === "sessions",
  });
  
  // Add training data mutation
  const { mutate: addTrainingData, isPending: isAddingTraining } = useMutation({
    mutationFn: async (data: { question: string; answer: string; category: string }) => {
      await addAiTrainingData(data.question, data.answer, data.category);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training data added successfully",
      });
      setQuestion("");
      setAnswer("");
      setCategory("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/training-data"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add training data",
        variant: "destructive",
      });
      console.error("Add training data error:", error);
    },
  });
  
  // Update user admin status mutation
  const { mutate: updateUserAdmin, isPending: isUpdatingUser } = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number, isAdmin: boolean }) => {
      return await updateUserAdminStatus(userId, isAdmin);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User admin status updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user admin status",
        variant: "destructive"
      });
      console.error("Update user error:", error);
    }
  });
  
  const handleSubmitTraining = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answer || !category) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }
    
    addTrainingData({ question, answer, category });
  };
  
  const handleToggleAdminStatus = (user: User) => {
    // Confirmation before changing admin status
    if (window.confirm(`Are you sure you want to ${user.isAdmin ? 'remove' : 'grant'} admin access to ${user.email}?`)) {
      updateUserAdmin({ userId: user.id, isAdmin: !user.isAdmin });
    }
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>BambooMade Admin Dashboard</CardTitle>
          <CardDescription>
            Manage training data, users, and project guidance sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="training">AI Training</TabsTrigger>
              <TabsTrigger value="sessions">Project Guidance</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
            </TabsList>
            
            {/* AI Training Tab */}
            <TabsContent value="training" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Add Training Data Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Add Training Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitTraining} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="question">Question</Label>
                        <Input
                          id="question"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="What are the benefits of bamboo as a building material?"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="answer">Answer</Label>
                        <Textarea
                          id="answer"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Bamboo is sustainable, renewable, and has high tensile strength..."
                          rows={5}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="materials">Materials</SelectItem>
                            <SelectItem value="techniques">Techniques</SelectItem>
                            <SelectItem value="sustainability">Sustainability</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="workshops">Workshops</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isAddingTraining}
                      >
                        {isAddingTraining ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Training Data"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Existing Training Data */}
                <Card>
                  <CardHeader>
                    <CardTitle>Existing Training Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTraining ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {trainingData?.map((item) => (
                          <Card key={item.id} className="p-4 space-y-2 border-l-4 border-l-primary">
                            <div>
                              <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-1 rounded-full">
                                {item.category}
                              </span>
                              <p className="font-medium mt-2">{item.question}</p>
                              <p className="text-sm text-muted-foreground mt-1">{item.answer}</p>
                            </div>
                          </Card>
                        ))}
                        
                        {trainingData?.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            No training data available
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Project Guidance Sessions Tab */}
            <TabsContent value="sessions">
              <Card>
                <CardHeader>
                  <CardTitle>Project Guidance Sessions</CardTitle>
                  <CardDescription>
                    View and manage all project guidance sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSessions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableCaption>List of all project guidance sessions</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Session Date</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Topic</TableHead>
                            <TableHead>Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessions?.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell className="font-medium">{session.id}</TableCell>
                              <TableCell>{session.studentName}</TableCell>
                              <TableCell>
                                <div className="flex flex-col space-y-1 text-xs">
                                  <div className="flex items-center">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {session.email}
                                  </div>
                                  <div className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {session.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(session.date)}</TableCell>
                              <TableCell>{session.duration} mins</TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center">
                                        <span className="truncate max-w-[150px]">{session.topic}</span>
                                        {session.notes && <Info className="h-3 w-3 ml-1 text-muted-foreground" />}
                                      </div>
                                    </TooltipTrigger>
                                    {session.notes && (
                                      <TooltipContent>
                                        <p className="max-w-xs">{session.notes}</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                {session.paymentId ? (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Paid
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                    <CalendarClock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          {sessions?.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No project guidance sessions found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* User Management Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and admin privileges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableCaption>List of all registered users</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Tokens</TableHead>
                            <TableHead>Admin Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users?.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.id}</TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.role}</TableCell>
                              <TableCell>{user.tokens}</TableCell>
                              <TableCell>
                                {user.isAdmin ? (
                                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                    Admin
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    <Shield className="h-3 w-3 mr-1" />
                                    User
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant={user.isAdmin ? "destructive" : "outline"}
                                  size="sm"
                                  onClick={() => handleToggleAdminStatus(user)}
                                  disabled={isUpdatingUser}
                                >
                                  {isUpdatingUser ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : user.isAdmin ? (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Remove Admin
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="h-3 w-3 mr-1" />
                                      Make Admin
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          {users?.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No users found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
