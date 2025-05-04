import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut, Link as LinkIcon, Check, AlertCircle, Calendar, Clock, User, Phone, Mail } from "lucide-react";

interface Session {
  id: number;
  formattedDate: string;
  formattedTime: string;
  date: string;
  email: string;
  phone: string;
  topic: string;
  notes: string;
  duration: number;
  paymentStatus: string;
  studentName: string;
  status: string;
  googleMeetLink?: string;
  isStudent?: boolean;
}

export default function AdminDashboard() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [meetLink, setMeetLink] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Check if user is authenticated and is admin
  const { data: userData, isLoading: isAuthLoading } = useQuery({
    queryKey: ["/api/auth/admin-check"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/admin-check");
      return response.json();
    },
    retry: false
  });

  // Redirect to login if not admin
  useEffect(() => {
    if (!isAuthLoading && (!userData || !userData.isAdmin)) {
      setLocation("/admin-login");
    }
  }, [userData, isAuthLoading, setLocation]);

  // Fetch all sessions (only available to admin)
  const { data: sessionsData, isLoading: isSessionsLoading } = useQuery({
    queryKey: ["/api/admin/sessions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/sessions");
      return response.json();
    },
    enabled: Boolean(userData?.isAdmin),
  });

  // Update Google Meet link for a session
  const { mutate: updateMeetLink, isPending: isUpdating } = useMutation({
    mutationFn: async ({ sessionId, googleMeetLink }: { sessionId: number; googleMeetLink: string }) => {
      const response = await apiRequest("POST", "/api/admin/update-meet-link", {
        sessionId,
        googleMeetLink,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Google Meet link updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update Google Meet link.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateMeetLink = () => {
    if (!selectedSession) return;
    
    updateMeetLink({
      sessionId: selectedSession.id,
      googleMeetLink: meetLink,
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/admin-logout");
      setLocation("/admin-login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const openMeetLinkDialog = (session: Session) => {
    setSelectedSession(session);
    setMeetLink(session.googleMeetLink || "");
    setIsDialogOpen(true);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  const sessions = sessionsData?.sessions || [];
  
  // Split sessions into categories
  const pendingSessions = sessions.filter((s: Session) => 
    s.status !== 'cancelled' && s.status !== 'completed' && !s.googleMeetLink);
    
  const upcomingSessions = sessions.filter((s: Session) => 
    s.status !== 'cancelled' && s.status !== 'completed' && s.googleMeetLink);
  
  // Add rescheduled sessions category - detect by special flag or by comparing original date with current date  
  const rescheduledSessions = sessions.filter((s: Session) => 
    s.status === 'rescheduled' || 
    (s.notes && s.notes.toLowerCase().includes('rescheduled')));
    
  const completedSessions = sessions.filter((s: Session) => 
    s.status === 'completed');
    
  const cancelledSessions = sessions.filter((s: Session) => 
    s.status === 'cancelled');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Helmet>
        <title>Admin Dashboard | BambooMade</title>
        <meta name="description" content="Admin dashboard for session management" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="ghost" className="flex items-center gap-2" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{sessions.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-900/20 border-amber-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-amber-400">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-500">{pendingSessions.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-900/20 border-green-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-green-400">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{upcomingSessions.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-900/20 border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-400">Rescheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-500">{rescheduledSessions.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-red-900/20 border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-400">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{cancelledSessions.length}</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="pending" className="data-[state=active]:bg-green-700">
              Pending ({pendingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-green-700">
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="rescheduled" className="data-[state=active]:bg-blue-700">
              Rescheduled ({rescheduledSessions.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-green-700">
              Completed ({completedSessions.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="data-[state=active]:bg-green-700">
              Cancelled ({cancelledSessions.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-green-700">
              All Sessions
            </TabsTrigger>
          </TabsList>
          
          {["pending", "upcoming", "rescheduled", "completed", "cancelled", "all"].map((tab) => {
            let displaySessions;
            let emptyMessage = "";
            
            switch (tab) {
              case "pending":
                displaySessions = pendingSessions;
                emptyMessage = "No pending sessions requiring Google Meet links.";
                break;
              case "upcoming":
                displaySessions = upcomingSessions;
                emptyMessage = "No upcoming sessions with Google Meet links set.";
                break;
              case "rescheduled":
                displaySessions = rescheduledSessions;
                emptyMessage = "No rescheduled sessions found.";
                break;
              case "completed":
                displaySessions = completedSessions;
                emptyMessage = "No completed sessions.";
                break;
              case "cancelled":
                displaySessions = cancelledSessions;
                emptyMessage = "No cancelled sessions.";
                break;
              default:
                displaySessions = sessions;
                emptyMessage = "No sessions found.";
            }
            
            return (
              <TabsContent key={tab} value={tab} className="space-y-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="capitalize">{tab} Sessions</CardTitle>
                    <CardDescription>
                      {tab === "pending" ? "Sessions requiring Google Meet links" : 
                       tab === "upcoming" ? "Sessions with Google Meet links set" :
                       tab === "rescheduled" ? "Sessions that have been rescheduled by users" :
                       `All ${tab} sessions`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isSessionsLoading ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                      </div>
                    ) : displaySessions.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>{emptyMessage}</p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-gray-800 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-800">
                            <TableRow className="hover:bg-gray-800/80">
                              <TableHead className="text-gray-300">ID</TableHead>
                              <TableHead className="text-gray-300">Student</TableHead>
                              <TableHead className="text-gray-300">Contact</TableHead>
                              <TableHead className="text-gray-300">Date & Time</TableHead>
                              <TableHead className="text-gray-300">Topic</TableHead>
                              <TableHead className="text-gray-300">Duration</TableHead>
                              <TableHead className="text-gray-300">Payment</TableHead>
                              <TableHead className="text-gray-300">Google Meet</TableHead>
                              <TableHead className="text-gray-300">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-800">
                            {displaySessions.map((session: Session) => (
                              <TableRow 
                                key={session.id} 
                                className="hover:bg-gray-800/50 bg-gray-900"
                              >
                                <TableCell className="font-mono">{session.id}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{session.studentName}</div>
                                  <div className="text-xs text-gray-400">{session.isStudent ? "Student" : "Professional"}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center text-xs text-gray-300 mb-1">
                                    <Mail className="w-3 h-3 mr-1" /> {session.email}
                                  </div>
                                  <div className="flex items-center text-xs text-gray-300">
                                    <Phone className="w-3 h-3 mr-1" /> {session.phone}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center text-xs text-gray-300 mb-1">
                                    <Calendar className="w-3 h-3 mr-1" /> {session.formattedDate}
                                  </div>
                                  <div className="flex items-center text-xs text-gray-300">
                                    <Clock className="w-3 h-3 mr-1" /> {session.formattedTime}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-[200px] truncate" title={session.topic}>
                                    {session.topic}
                                  </div>
                                  {session.notes && (
                                    <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate" title={session.notes}>
                                      {session.notes}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>{session.duration} min</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={session.paymentStatus === "Paid" ? "default" : "outline"}
                                    className={session.paymentStatus === "Paid" ? "bg-green-700 hover:bg-green-600" : ""}
                                  >
                                    {session.paymentStatus}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {session.googleMeetLink ? (
                                    <div className="flex flex-col gap-2">
                                      <a 
                                        href={session.googleMeetLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 flex items-center text-xs"
                                      >
                                        <LinkIcon className="w-3 h-3 mr-1" />
                                        Open Link
                                      </a>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 text-xs"
                                        onClick={() => openMeetLinkDialog(session)}
                                      >
                                        Edit
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="border-green-700 text-green-400 hover:bg-green-900/30 text-xs"
                                      onClick={() => openMeetLinkDialog(session)}
                                    >
                                      Add Link
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      session.status === 'cancelled' 
                                        ? "destructive" 
                                        : session.status === 'completed' 
                                          ? "secondary"
                                          : session.status === 'rescheduled' || 
                                            (session.notes && session.notes.toLowerCase().includes('rescheduled'))
                                            ? "outline"
                                          : "default"
                                    }
                                    className={`capitalize ${
                                      session.status === 'rescheduled' || 
                                      (session.notes && session.notes.toLowerCase().includes('rescheduled'))
                                        ? "border-blue-500 text-blue-400"
                                        : ""
                                    }`}
                                  >
                                    {session.status === 'rescheduled' || 
                                     (session.notes && session.notes.toLowerCase().includes('rescheduled'))
                                      ? "Rescheduled" 
                                      : session.status}
                                  </Badge>
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
            );
          })}
        </Tabs>
      </div>
      
      {/* Meet Link Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {selectedSession?.googleMeetLink ? "Update" : "Add"} Google Meet Link
            </DialogTitle>
            <DialogDescription>
              {selectedSession ? (
                <div className="mt-2 space-y-1 text-gray-300">
                  <p><span className="font-medium">Session:</span> #{selectedSession.id}</p>
                  <p><span className="font-medium">Student:</span> {selectedSession.studentName}</p>
                  <p><span className="font-medium">Date:</span> {selectedSession.formattedDate} at {selectedSession.formattedTime}</p>
                </div>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meetLink">Google Meet Link</Label>
              <Input
                id="meetLink"
                placeholder="https://meet.google.com/..."
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMeetLink}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}