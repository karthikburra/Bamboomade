import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
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
  sessionId?: string;
  userEmail?: string; // from database
  email?: string; // for code compatibility
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  loginTime: string;
  lastActiveTime?: string;
  logoutTime?: string;
  // Individual device fields from database
  browser?: string;
  os?: string;
  deviceType?: string;
  // Combined device info from our schema
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  };
  loginStatus?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

// Interface for user data
interface UserData {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  isVerified: boolean;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  profileCompleted?: boolean;
}

// Interface for API responses
interface UserProfileResponse {
  user: UserData;
}

interface SessionsResponse {
  sessions: Session[];
}

interface LoginHistoryResponse {
  loginHistory: LoginHistory[];
  totalLogins: number;
}

export default function UserProfile() {
  const { id } = useParams();
  const userId = parseInt(id as string);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("info");

  // Fetch user data
  const { 
    data: userData, 
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUserData
  } = useQuery<UserProfileResponse>({
    queryKey: [`/api/users/${userId}`],
    enabled: !isNaN(userId),
    refetchInterval: 10000, // Refetch every 10 seconds to ensure we have latest data
  });

  // Fetch user sessions
  const { 
    data: sessionsData, 
    isLoading: isLoadingSessions,
    error: sessionsError
  } = useQuery<SessionsResponse>({
    queryKey: [`/api/users/${userId}/sessions`],
    enabled: !isNaN(userId),
  });
  
  // Fetch user login history
  const {
    data: loginHistoryData,
    isLoading: isLoadingLoginHistory,
    error: loginHistoryError
  } = useQuery<LoginHistoryResponse>({
    queryKey: [`/api/users/${userId}/login-history`],
    enabled: !isNaN(userId),
  });
  
  // Manually trigger refresh of user data
  const refreshUserData = () => {
    refetchUserData();
  };

  // Get user's full name
  const getFullName = (user: UserData) => {
    if (!user) return 'User';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    }
    return user.username || 'User';
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
      <div className="container mx-auto p-6 bg-gray-950 text-gray-100">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-gray-400 mb-6">
            The user you're looking for doesn't exist or you don't have permission to view this profile.
          </p>
          <Button onClick={() => setLocation('/admin-dashboard')} variant="outline" className="border-gray-700 hover:bg-gray-800">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const user = userData?.user || {} as UserData;
  const sessions: Session[] = sessionsData?.sessions || [];

  const loginHistory: LoginHistory[] = loginHistoryData?.loginHistory || [];
  const totalLogins = loginHistoryData?.totalLogins || 0;

  return (
    <div className="container mx-auto p-6 bg-zinc-950 text-zinc-100 min-h-screen">
      <Helmet>
        <title>{user ? `${getFullName(user)} • User Profile • BambooMade` : 'User Profile • BambooMade'}</title>
      </Helmet>

      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => setLocation('/admin-dashboard')}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold">User Profile</h1>
          <button 
            onClick={refreshUserData} 
            className="ml-3 p-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-primary"
            title="Refresh user data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Profile Sidebar */}
        <div className="lg:col-span-4">
          <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
            <CardHeader className="relative pb-0">
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-zinc-800 flex items-center justify-center text-4xl font-bold text-white border-2 border-primary/70 overflow-hidden shadow-md">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt={`${user.username || 'User'}'s profile`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails to load, show the fallback
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <span className="animate-pulse">{(user?.username || 'U').charAt(0).toUpperCase()}</span>
                  )}
                  <span className={`hidden ${!user?.profileImageUrl ? 'flex' : ''} text-4xl font-bold items-center justify-center`}>
                    {(user?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <CardTitle className="mt-4 text-xl text-center text-white">
                  {user?.fullName ? user.fullName : (user?.username || 'User')}
                </CardTitle>
                <CardDescription className="text-center text-zinc-400">
                  {user?.username ? `@${user.username}` : ''}
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  <Badge className={user?.isVerified ? "bg-green-600/80 text-white" : "bg-zinc-700 text-white"}>
                    {user?.isVerified ? "Verified" : "Not Verified"}
                  </Badge>
                  <Badge className={user?.role === 'admin' ? "bg-amber-600/80 text-white" : "bg-zinc-700 text-white"}>
                    {user?.role === 'admin' ? "Admin" : "User"}
                  </Badge>
                  {user?.profileCompleted !== undefined && (
                    <Badge className={user.profileCompleted ? "bg-blue-600/80 text-white" : "bg-zinc-700 text-white"}>
                      {user.profileCompleted ? "Profile Complete" : "Profile Incomplete"}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-zinc-800/60 rounded-md p-4 space-y-3 hover:bg-zinc-800/80 transition-colors duration-200 shadow-sm">
                  <h3 className="text-sm font-medium text-white/80">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="bg-zinc-700/70 p-1.5 rounded-full">
                        <Mail className="h-3.5 w-3.5 text-primary/80" />
                      </div>
                      <span className="text-zinc-200 font-medium">{user?.email || 'No email address'}</span>
                    </div>
                    {user?.phone ? (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="bg-zinc-700/70 p-1.5 rounded-full">
                          <Phone className="h-3.5 w-3.5 text-primary/80" />
                        </div>
                        <span className="text-zinc-200 font-medium">{user.phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm opacity-60">
                        <div className="bg-zinc-700/70 p-1.5 rounded-full">
                          <Phone className="h-3.5 w-3.5 text-zinc-400/80" />
                        </div>
                        <span className="text-zinc-400 italic">No phone number added</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-800/60 rounded-md p-4 space-y-3 hover:bg-zinc-800/80 transition-colors duration-200 shadow-sm">
                  <h3 className="text-sm font-medium text-white/80">Account Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="bg-zinc-700/70 p-1.5 rounded-full">
                        <Calendar className="h-3.5 w-3.5 text-primary/80" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-zinc-200 font-medium">Account Created</span>
                        <span className="text-zinc-400">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Not available'}
                        </span>
                      </div>
                    </div>
                    {user?.lastLoginAt && (
                      <div className="flex items-center gap-2">
                        <div className="bg-zinc-700/70 p-1.5 rounded-full">
                          <Clock className="h-3.5 w-3.5 text-primary/80" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-200 font-medium">Last Login</span>
                          <span className="text-zinc-400">
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
                      <div className="bg-zinc-700/70 p-1.5 rounded-full">
                        <LogIn className="h-3.5 w-3.5 text-primary/80" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-zinc-200 font-medium">Login Count</span>
                        <span className="text-zinc-400">
                          {totalLogins || 0} logins
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-zinc-700/70 p-1.5 rounded-full">
                        <User className="h-3.5 w-3.5 text-primary/80" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-zinc-200 font-medium">User ID</span>
                        <span className="text-zinc-400">{user?.id || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {Array.isArray(sessions) && sessions.length > 0 && (
                  <div className="bg-zinc-800/60 rounded-md p-4 space-y-3 hover:bg-zinc-800/80 transition-colors duration-200 shadow-sm">
                    <h3 className="text-sm font-medium text-white/80 flex items-center">
                      <CalendarClock className="h-4 w-4 mr-2 text-primary/70" />
                      Sessions Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-800/80 border border-zinc-700/30 rounded-md p-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-white">{sessions.length}</div>
                        <div className="text-xs text-zinc-400">Total Sessions</div>
                      </div>
                      <div className="bg-zinc-800/80 border border-zinc-700/30 rounded-md p-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-green-500/90">
                          {sessions.filter(s => s?.status === 'completed').length}
                        </div>
                        <div className="text-xs text-zinc-400">Completed</div>
                      </div>
                      <div className="bg-zinc-800/80 border border-zinc-700/30 rounded-md p-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-amber-500/90">
                          {sessions.filter(s => s?.status === 'pending').length}
                        </div>
                        <div className="text-xs text-zinc-400">Pending</div>
                      </div>
                      <div className="bg-zinc-800/80 border border-zinc-700/30 rounded-md p-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-red-500/90">
                          {sessions.filter(s => s?.status === 'cancelled').length}
                        </div>
                        <div className="text-xs text-zinc-400">Cancelled</div>
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
            <TabsList className="bg-zinc-800/70 border border-zinc-700/50 p-1 rounded-lg shadow-sm">
              <TabsTrigger 
                value="sessions" 
                className="data-[state=active]:bg-primary/20 text-zinc-300 data-[state=active]:text-white hover:bg-zinc-700/50 transition-colors rounded-md"
              >
                <CalendarClock className="h-4 w-4 mr-2" />
                Booked Sessions
              </TabsTrigger>
              <TabsTrigger 
                value="login-history" 
                className="data-[state=active]:bg-primary/20 text-zinc-300 data-[state=active]:text-white hover:bg-zinc-700/50 transition-colors rounded-md"
              >
                <History className="h-4 w-4 mr-2" />
                Login History
              </TabsTrigger>
              {user.role === 'admin' && (
                <TabsTrigger 
                  value="admin" 
                  className="data-[state=active]:bg-primary/20 text-zinc-300 data-[state=active]:text-white hover:bg-zinc-700/50 transition-colors rounded-md"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Access
                </TabsTrigger>
              )}
            </TabsList>

            {/* Sessions Tab Content */}
            <TabsContent value="sessions" className="space-y-4">
              <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CalendarClock className="h-5 w-5 mr-2 text-primary/80" />
                    Session History
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    View all project guidance sessions booked by this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
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

            {/* Login History Tab Content */}
            <TabsContent value="login-history" className="space-y-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Login History</CardTitle>
                  <CardDescription>
                    View all login sessions for this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loginHistoryError ? (
                    <div className="p-4 rounded-md bg-gray-800/50 text-red-400 text-sm">
                      <p>Error loading login history. {(loginHistoryError as Error).message}</p>
                    </div>
                  ) : loginHistory.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <History className="h-10 w-10 mx-auto mb-3 text-gray-500" />
                      <p className="mb-2">No login history found for this user</p>
                      <p className="text-sm">Login data will be displayed here once the user has signed in.</p>
                    </div>
                  ) : (
                    <div className="border rounded-md border-gray-800">
                      <Table>
                        <TableHeader className="bg-gray-800/50">
                          <TableRow>
                            <TableHead className="text-gray-400">Date & Time</TableHead>
                            <TableHead className="text-gray-400">Device</TableHead>
                            <TableHead className="text-gray-400">Browser</TableHead>
                            <TableHead className="text-gray-400 text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loginHistory.map((login) => (
                            <TableRow key={login.id} className="border-gray-800">
                              <TableCell className="font-medium text-gray-300">
                                {new Date(login.loginTime).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell className="text-gray-400">
                                {/* Use either deviceType from DB or device from deviceInfo */}
                                {login.deviceType || login.deviceInfo?.device || 'Desktop'}{' '}
                                {/* Use either os from DB or from deviceInfo */}
                                {(login.os || login.deviceInfo?.os) && 
                                  `(${login.os || login.deviceInfo?.os})`
                                }
                                {/* Show mobile icon if it's a mobile device */}
                                {(login.deviceType === 'Mobile' || login.deviceInfo?.isMobile) ? (
                                  <Smartphone className="h-4 w-4 inline-block ml-1 text-gray-500" />
                                ) : (
                                  <Laptop className="h-4 w-4 inline-block ml-1 text-gray-500" />
                                )}
                              </TableCell>
                              <TableCell className="text-gray-400">
                                {/* Use either browser from DB or from deviceInfo */}
                                {login.browser || login.deviceInfo?.browser || 'Unknown'}
                              </TableCell>
                              <TableCell className="text-right">
                                {/* Default to success if not specified */}
                                {(!login.loginStatus || login.loginStatus === 'success') ? (
                                  <Badge className="bg-green-800/30 text-green-400 border-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Success
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-800/30 text-red-400 border-red-800">
                                    <XCircle className="h-3 w-3 mr-1" /> Failed
                                  </Badge>
                                )}
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