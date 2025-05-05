import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, Loader2, Calendar, Clock, User, Tag, ChevronLeft, Video, 
  ExternalLink, RotateCcw, Copy, Check, Info
} from "lucide-react";
import { Link } from "wouter";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Session {
  id: number;
  formattedDate: string;
  formattedTime: string;
  formattedEndTime: string;
  email: string;
  topic: string;
  duration: number;
  paymentStatus: string;
  studentName: string;
  status: string;
  googleMeetLink?: string | null;
  calendarLink?: string | null;
  isRescheduled?: boolean;
  originalDate?: string | null;
}

export default function AllSessions() {
  const [emailFilter, setEmailFilter] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [copiedLinks, setCopiedLinks] = useState<{ [key: number]: boolean }>({});
  const { toast } = useToast();
  
  // Check if email was passed as URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    
    if (email) {
      setEmailFilter(email);
      setIsFiltering(true);
    }
  }, []);
  
  // Copy to clipboard function
  const copyToClipboard = (text: string | null | undefined, sessionId: number) => {
    if (!text) {
      toast({
        title: "Copy Failed",
        description: "No valid link available to copy.",
        variant: "destructive",
      });
      return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLinks({ ...copiedLinks, [sessionId]: true });
      toast({
        title: "Link Copied!",
        description: "Google Meet link copied to clipboard.",
        variant: "default",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedLinks((prev) => ({ ...prev, [sessionId]: false }));
      }, 2000);
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    });
  };

  // Fetch all sessions
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/all-sessions"],
    queryFn: async () => {
      // Direct fetch without any email verification
      const response = await apiRequest("GET", "/api/all-sessions");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen dark bg-gray-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 dark bg-gray-950 text-white min-h-screen">
        <Card className="p-6 bg-red-900/30 border-red-800">
          <CardHeader>
            <CardTitle>Error Loading Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error instanceof Error ? error.message : "Failed to load sessions"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allSessions = data?.sessions || [];
  
  // Only show sessions if a user has entered their email
  // Don't display any sessions by default
  const sessions = emailFilter && isFiltering
    ? allSessions.filter((session: Session) => 
        session.email.toLowerCase() === emailFilter.toLowerCase())
    : [];

  return (
    <div className="min-h-screen dark bg-gray-950 text-white pt-8 pb-12">
      <Helmet>
        <title>Your Sessions | BambooMade</title>
        <meta name="description" content="View your project guidance sessions" />
      </Helmet>

      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link href="/project-guidance">
            <Button variant="ghost" className="mr-4 p-2" aria-label="Back to Project Guidance">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Your Project Guidance Sessions</h1>
        </div>
        
        {/* Email filter form */}
        <Card className="mb-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">Find Your Sessions</CardTitle>
            <CardDescription>
              Enter your email address to see your booked sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setIsFiltering(!!emailFilter)}
                disabled={!emailFilter}
              >
                Find My Sessions
              </Button>
              <Link href="/project-guidance">
                <Button variant="outline" className="border-green-600 text-green-500">
                  Book a New Session
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Display when user has filtered by email */}
        {emailFilter && isFiltering && (
          <div className="mb-6 bg-green-900/20 border border-green-800 rounded-md p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm text-green-400">
                Showing sessions for <span className="font-medium">{emailFilter}</span>
                <Button 
                  variant="link" 
                  className="text-xs text-green-400 p-0 h-auto ml-2"
                  onClick={() => {
                    setEmailFilter("");
                    setIsFiltering(false);
                  }}
                >
                  Clear filter
                </Button>
              </p>
            </div>
          </div>
        )}

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>
                {emailFilter && isFiltering ? "No Sessions Found" : "Enter Your Email"}
              </CardTitle>
              <CardDescription>
                {emailFilter && isFiltering 
                  ? `No project guidance sessions found for ${emailFilter}`
                  : "Please enter your email address above to see your booked sessions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-gray-400 mb-4">Would you like to book a new session?</p>
              <div className="flex justify-center space-x-3">
                <Link href="/">
                  <Button variant="secondary" className="border-gray-700">
                    Back to Home
                  </Button>
                </Link>
                <Link href="/project-guidance">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Book a Session
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-2">
                Your Booked Sessions ({sessions.length})
              </h2>
              <div className="bg-gray-800/50 rounded-md p-4 border border-gray-700">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>
                      Below you'll find all sessions booked with your email address. 
                      For paid sessions, Google Meet links become available approximately 4 hours before the session starts.
                    </p>
                    <p>
                      <span className="text-green-400 font-medium">Important:</span> Make sure to join the Google Meet link on time for your scheduled session. 
                      Sessions typically last either 30 minutes or 1 hour as specified during booking.
                    </p>
                    <p className="text-xs text-gray-400">
                      If you need to reschedule or have questions about your session, please use the "Manage Session" button.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {sessions.map((session: Session) => (
                <Card key={session.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{session.topic}</CardTitle>
                      <Badge 
                        variant={
                          session.status === 'cancelled' 
                            ? "destructive" 
                            : session.status === 'completed' 
                              ? "secondary"
                              : "default"
                        }
                        className="capitalize"
                      >
                        {session.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Session #{session.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-green-500" />
                      <span>{session.formattedDate}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-green-500" />
                      <span>{session.formattedTime} - {session.formattedEndTime} ({session.duration} minutes)</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <User className="mr-2 h-4 w-4 text-green-500" />
                      <span>{session.studentName}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Tag className="mr-2 h-4 w-4 text-green-500" />
                      <Badge 
                        variant={session.paymentStatus === 'Paid' ? "default" : "outline"}
                        className={session.paymentStatus === 'Paid' ? "bg-green-700 hover:bg-green-600" : ""}
                      >
                        {session.paymentStatus}
                      </Badge>
                    </div>
                    
                    {session.isRescheduled && session.originalDate && (
                      <div className="flex items-center text-sm text-amber-400">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        <span>Rescheduled from {session.originalDate}</span>
                      </div>
                    )}
                    
                    {session.googleMeetLink && (
                      <div className="mt-2 pt-2 border-t border-gray-800">
                        <div className="flex items-center justify-between text-sm text-green-400 mb-2">
                          <div className="flex items-center">
                            <Video className="mr-2 h-4 w-4" />
                            <span className="font-medium">Google Meet Link Available</span>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                  onClick={() => copyToClipboard(session.googleMeetLink, session.id)}
                                >
                                  {copiedLinks[session.id] ? 
                                    <Check className="h-3.5 w-3.5" /> : 
                                    <Copy className="h-3.5 w-3.5" />
                                  }
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">Copy link to clipboard</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded p-2 mb-2 overflow-hidden text-xs text-gray-400 flex items-center">
                          <span className="truncate">{session.googleMeetLink}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <a 
                            href={session.googleMeetLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-xs bg-green-700/30 text-green-400 p-1.5 px-2 rounded hover:bg-green-700/50 transition-colors"
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Join Meeting
                          </a>
                          {session.calendarLink && (
                            <a 
                              href={session.calendarLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-xs bg-blue-700/30 text-blue-400 p-1.5 px-2 rounded hover:bg-blue-700/50 transition-colors"
                            >
                              <Calendar className="mr-1 h-3 w-3" />
                              Add to Calendar
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-800/50 pt-3 flex flex-wrap gap-2 justify-end">
                    {session.paymentStatus === 'Paid' && !session.googleMeetLink && (
                      <div className="text-xs text-gray-400 mr-auto">
                        The Google Meet link will be available 4 hours before the session
                      </div>
                    )}
                    <Link href={`/project-guidance?session=${session.id}`}>
                      <Button 
                        variant="outline" 
                        className="border-green-700 text-green-500 hover:bg-green-900/30"
                        disabled={session.status === 'cancelled'}
                      >
                        Manage Session
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <div className="flex justify-center space-x-3">
                <Link href="/">
                  <Button variant="secondary" className="border-gray-700">
                    Back to Home
                  </Button>
                </Link>
                <Link href="/project-guidance">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Book a New Session
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}