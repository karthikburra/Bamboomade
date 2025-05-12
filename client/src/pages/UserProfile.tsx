import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  User, Phone, Mail, CalendarClock, Clock, 
  Video, Calendar, FileText, CheckCircle, XCircle,
  ArrowLeftRight, Ban, Timer, AlertTriangle, Laptop, 
  Smartphone, ExternalLink, MapPin, Shield, LogIn, History
} from "lucide-react";
import { LoadingSpinner } from "../components/ui/loading-spinner";

// Interface for sessions
interface Session {
  id: number;
  studentName: string;
  email: string;
  phone: string;
  date: string;
  topic: string;
  notes: string;
  duration: number;
  status: string;
  formattedDate?: string;
  formattedTime?: string;
  paymentConfirmed: boolean;
  googleMeetLink?: string;
  isStudent: boolean;
  paymentId?: string;
  amount?: number;
  rescheduledDate?: string;
  rescheduledBy?: string;
  cancellationReason?: string;
}

// Interface for login history
interface LoginHistory {
  id: number;
  userId: number;
  sessionId: string;
  email: string;
  username: string;
  ipAddress?: string;
  userAgent?: string;
  loginTime: string;
  lastActiveTime: string;
  logoutTime?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  };
  loginStatus: string;
  isAdmin: boolean;
}

// Interface for user data
interface UserData {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;
  isVerified: boolean;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  profileCompleted?: boolean;
}

export default function UserProfile() {
  const { id } = useParams();
  const userId = parseInt(id as string);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("info");

  // Fetch user data
  const { 
    data: userData, 
    isLoading: isLoadingUser,
    error: userError
  } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !isNaN(userId),
  });

  // Fetch user sessions
  const { 
    data: sessionsData, 
    isLoading: isLoadingSessions,
    error: sessionsError
  } = useQuery({
    queryKey: [`/api/users/${userId}/sessions`],
    enabled: !isNaN(userId),
  });
  
  // Fetch user login history
  const {
    data: loginHistoryData,
    isLoading: isLoadingLoginHistory,
    error: loginHistoryError
  } = useQuery({
    queryKey: [`/api/users/${userId}/login-history`],
    enabled: !isNaN(userId),
  });

  // Get user's full name
  const getFullName = (user: UserData) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    }
    return user.username;
  };

  // Format session date and time for display
  const formatSessionDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, "PPP"), // e.g., "Apr 29, 2023"
      time: format(date, "HH:mm"), // e.g., "14:30"
      fullDateTime: format(date, "PPP 'at' HH:mm") // e.g., "Apr 29, 2023 at 14:30"
    };
  };

  // Get status badge color based on session status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-700">Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-700">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-700">Cancelled</Badge>;
      case "rescheduled":
        return <Badge className="bg-blue-700">Rescheduled</Badge>;
      default:
        return <Badge className="bg-gray-700">{status}</Badge>;
    }
  };

  // Show loading state
  if (isLoadingUser || isLoadingSessions || isLoadingLoginHistory) {
    return (
      <div className="container mx-auto p-6 bg-gray-950 text-gray-100">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400">Loading user profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (userError || !userData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-gray-400 mb-6">
            The user you're looking for doesn't exist or you don't have permission to view this profile.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const user: UserData = userData.user || userData;
  const sessions: Session[] = sessionsData?.sessions || [];

  return (
    <div className="container mx-auto p-6">
      <Helmet>
        <title>{getFullName(user)} • User Profile • BambooMade</title>
      </Helmet>

      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-gray-700 text-gray-300"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold">User Profile</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Profile Sidebar */}
        <div className="lg:col-span-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="relative pb-0">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-3xl font-bold text-white border-2 border-amber-500/50 overflow-hidden">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt={`${user.username}'s profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <CardTitle className="mt-4 text-xl text-center">
                  {getFullName(user)}
                </CardTitle>
                <CardDescription className="text-center">
                  {user.username}
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  <Badge className={user.isVerified ? "bg-green-700" : "bg-gray-700"}>
                    {user.isVerified ? "Verified" : "Not Verified"}
                  </Badge>
                  <Badge className={user.role === 'admin' ? "bg-amber-700" : "bg-gray-700"}>
                    {user.role === 'admin' ? "Admin" : "User"}
                  </Badge>
                  {user.profileCompleted !== undefined && (
                    <Badge className={user.profileCompleted ? "bg-blue-700" : "bg-gray-700"}>
                      {user.profileCompleted ? "Profile Complete" : "Profile Incomplete"}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-md p-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-md p-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Account Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-col">
                        <span>Account Created</span>
                        <span className="text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    {user.lastLoginAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-col">
                          <span>Last Login</span>
                          <span className="text-gray-400">
                            {new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-col">
                        <span>User ID</span>
                        <span className="text-gray-400">{user.id}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {sessions.length > 0 && (
                  <div className="bg-gray-800/50 rounded-md p-4 space-y-3">
                    <h3 className="text-sm font-medium text-gray-300">Sessions Summary</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800 rounded-md p-3 text-center">
                        <div className="text-2xl font-bold text-white">{sessions.length}</div>
                        <div className="text-xs text-gray-400">Total Sessions</div>
                      </div>
                      <div className="bg-gray-800 rounded-md p-3 text-center">
                        <div className="text-2xl font-bold text-green-500">
                          {sessions.filter(s => s.status === 'completed').length}
                        </div>
                        <div className="text-xs text-gray-400">Completed</div>
                      </div>
                      <div className="bg-gray-800 rounded-md p-3 text-center">
                        <div className="text-2xl font-bold text-amber-500">
                          {sessions.filter(s => s.status === 'pending').length}
                        </div>
                        <div className="text-xs text-gray-400">Pending</div>
                      </div>
                      <div className="bg-gray-800 rounded-md p-3 text-center">
                        <div className="text-2xl font-bold text-red-500">
                          {sessions.filter(s => s.status === 'cancelled').length}
                        </div>
                        <div className="text-xs text-gray-400">Cancelled</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs for different sections */}
          <Tabs defaultValue="sessions" className="w-full">
            <TabsList className="bg-gray-800 border-gray-700 p-1">
              <TabsTrigger 
                value="sessions" 
                className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
              >
                <CalendarClock className="h-4 w-4 mr-2" />
                Booked Sessions
              </TabsTrigger>
              {user.role === 'admin' && (
                <TabsTrigger 
                  value="admin" 
                  className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  Admin Access
                </TabsTrigger>
              )}
            </TabsList>

            {/* Sessions Tab Content */}
            <TabsContent value="sessions" className="space-y-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Session History</CardTitle>
                  <CardDescription>
                    View all sessions booked by this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-lg font-medium mb-2">No Sessions Found</p>
                      <p>This user hasn't booked any guidance sessions yet.</p>
                    </div>
                  ) : (
                    <div className="rounded-md border border-gray-800 overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-800">
                          <TableRow className="hover:bg-gray-800/50 border-gray-700">
                            <TableHead className="text-gray-300">#</TableHead>
                            <TableHead className="text-gray-300">Date/Time</TableHead>
                            <TableHead className="text-gray-300">Topic</TableHead>
                            <TableHead className="text-gray-300">Duration</TableHead>
                            <TableHead className="text-gray-300">Status</TableHead>
                            <TableHead className="text-gray-300">Meet Link</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessions.map((session, index) => {
                            const dateTime = formatSessionDateTime(session.date);
                            return (
                              <TableRow key={session.id} className="hover:bg-gray-800/50 border-gray-700">
                                <TableCell className="font-medium">{session.id}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span>{dateTime.date}</span>
                                    <span className="text-sm text-gray-400">{dateTime.time}</span>
                                    {session.rescheduledDate && (
                                      <div className="flex items-center mt-1 text-xs text-blue-400">
                                        <ArrowLeftRight className="h-3 w-3 mr-1" />
                                        <span>Rescheduled {session.rescheduledBy === 'user' ? 'by user' : 'by admin'}</span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="truncate max-w-[200px]" title={session.topic}>
                                      {session.topic}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      {session.isStudent ? (
                                        <>
                                          <Laptop className="h-3 w-3" />
                                          <span>Student</span>
                                        </>
                                      ) : (
                                        <>
                                          <Smartphone className="h-3 w-3" />
                                          <span>Professional</span>
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Timer className="h-4 w-4 mr-1.5 text-gray-400" />
                                    <span>{session.duration} min</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(session.status)}
                                  <div className="mt-1">
                                    {session.paymentConfirmed ? (
                                      <span className="text-xs text-green-500 flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Payment Confirmed
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400 flex items-center">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Payment Pending
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {session.googleMeetLink ? (
                                    <a
                                      href={session.googleMeetLink.startsWith('http') ? session.googleMeetLink : `https://${session.googleMeetLink}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:text-blue-400 flex items-center text-sm"
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Open Link
                                    </a>
                                  ) : (
                                    <span className="text-xs text-gray-500">Not Available</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin Tab Content */}
            {user.role === 'admin' && (
              <TabsContent value="admin" className="space-y-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Admin Access</CardTitle>
                    <CardDescription>
                      Administrative permissions and access information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-gray-800/50 rounded-md p-4">
                        <h3 className="text-lg font-semibold mb-3 text-white">Admin Status</h3>
                        <div className="flex items-center gap-3 mb-4">
                          <Badge className="bg-amber-700 text-white px-3 py-1 text-sm">
                            {user.email === 'info@bamboomade.in' ? 'Super Admin' : 'Admin'}
                          </Badge>
                          {user.email === 'info@bamboomade.in' && (
                            <p className="text-amber-400 text-sm font-medium">
                              This is the primary administrator account
                            </p>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-300 space-y-2">
                          <p className="mb-2">This user has access to:</p>
                          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2">
                            <li>Manage sessions and bookings</li>
                            <li>Access the admin dashboard and reports</li>
                            <li>View and manage content in the AI Knowledge Database</li>
                            <li>Configure system settings</li>
                            {user.email === 'info@bamboomade.in' && (
                              <>
                                <li>Grant or remove admin rights to other users</li>
                                <li>Reset any user's password</li>
                                <li>Access all system features and data</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}