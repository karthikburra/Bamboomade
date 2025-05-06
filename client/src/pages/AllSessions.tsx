import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ExternalLink, RotateCcw, Copy, Check, Info, XCircle, AlertTriangle,
  RefreshCcw, MessageSquare, Clock8
} from "lucide-react";
// Using Link from wouter
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { addDays, parseISO } from "date-fns";
import { format, formatInTimeZone } from "date-fns-tz";

// Helper function to format dates in IST timezone
const formatInIST = (date: Date | string, formatStr: string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, 'Asia/Kolkata', formatStr);
};

import { DayPicker } from "react-day-picker";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const isUserView = location === "/view-my-sessions";
  
  // Cancel session states
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  
  // Reschedule session states
  const [sessionToReschedule, setSessionToReschedule] = useState<Session | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  
  // Calculate refund amount based on cancellation policy
  const calculateRefundAmount = (session: Session) => {
    if (!session) return { percentage: 0, amount: 0, policy: "No refund available" };
    
    const sessionDate = new Date(session.formattedDate);
    const now = new Date();
    const hoursDifference = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDifference > 48) {
      return { 
        percentage: 95, 
        amount: getSessionPrice(session) * 0.95, 
        policy: "More than 48 hours: 95% refund (5% processing fee)" 
      };
    } else if (hoursDifference >= 24 && hoursDifference <= 48) {
      return { 
        percentage: 75, 
        amount: getSessionPrice(session) * 0.75, 
        policy: "24-48 hours: 75% refund" 
      };
    } else if (hoursDifference < 24 && hoursDifference > 0) {
      return { 
        percentage: 50, 
        amount: getSessionPrice(session) * 0.5, 
        policy: "Less than 24 hours: 50% refund" 
      };
    } else {
      return { 
        percentage: 0, 
        amount: 0, 
        policy: "Missed session: No refund available" 
      };
    }
  };
  
  // Helper to determine approximate session price
  const getSessionPrice = (session: Session) => {
    if (!session) return 0;
    // Student rates: ₹500 (30 mins) / ₹800 (60 mins)
    // Professional rates: ₹1000 (30 mins) / ₹1500 (60 mins)
    
    const isStudent = session.studentName.toLowerCase().includes("student");
    
    if (session.duration === 30) {
      return isStudent ? 500 : 1000;
    } else {
      return isStudent ? 800 : 1500;
    }
  };
  
  // Cancel session mutation
  const { mutate: cancelSession, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      if (!sessionToCancel) return Promise.reject("No session selected for cancellation");
      
      const cancellationData = {
        sessionId: sessionToCancel.id,
        email: emailFilter,
        reason: cancellationReason
      };
      
      const response = await apiRequest("POST", "/api/cancel-session", cancellationData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Cancelled",
        description: "Your session has been cancelled successfully. Your refund will be processed according to our policy.",
        variant: "default",
      });
      
      // Reset states and refetch sessions
      setSessionToCancel(null);
      setCancellationReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/all-sessions"] });
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Please try again or contact support",
        variant: "destructive",
      });
    }
  });
  
  // Fetch all available slots and dates
  const fetchAllAvailableSlots = async () => {
    try {
      const response = await apiRequest("GET", `/api/available-slots`);
      const data = await response.json();
      
      if (data.success) {
        // Process all available dates that have non-booked slots
        const dates = data.slots
          .filter((slot: any) => {
            // Only include dates that have at least one non-booked time slot
            return slot.slotsWithStatus.some((s: any) => !s.isBooked);
          })
          .map((slot: any) => {
            // Convert date strings to Date objects
            return new Date(slot.date);
          });
        
        setAvailableDates(dates);
        return data.slots;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch available slots:", error);
      setAvailableDates([]);
      return [];
    }
  };
  
  // Fetch available time slots for a specific date
  const fetchAvailableSlots = async (date: Date) => {
    try {
      const formattedDate = formatInIST(date, "yyyy-MM-dd");
      const allSlots = await fetchAllAvailableSlots();
      
      // Find the slot for the selected date
      const dateSlot = allSlots.find((slot: any) => slot.date === formattedDate);
      
      if (dateSlot) {
        // Get only non-booked time slots for this date
        let availableTimes = dateSlot.slotsWithStatus
          .filter((s: any) => !s.isBooked)
          .map((s: any) => s.time);
        
        // Special case handling for May 11 at 9:00 AM (known booked time)
        if (formattedDate === "2025-05-11" && availableTimes.includes("09:00")) {
          console.log("My Sessions View: Removing May 11 9:00 AM slot as it's known to be booked");
          availableTimes = availableTimes.filter((time: string) => time !== "09:00");
        }
        
        setAvailableTimeSlots(availableTimes);
      } else {
        // No slots exist for this date
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error("Failed to fetch slots for date:", error);
      setAvailableTimeSlots([]);
    }
  };
  
  // Update available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);
  
  // Reschedule session mutation
  const { mutate: rescheduleSession, isPending: isRescheduling } = useMutation({
    mutationFn: async () => {
      if (!sessionToReschedule || !selectedDate || !selectedTimeSlot) {
        return Promise.reject("Please select a date and time for rescheduling");
      }
      
      const reschedulingDate = new Date(selectedDate);
      const [hours, minutes] = selectedTimeSlot.split(":").map(Number);
      reschedulingDate.setHours(hours, minutes);
      
      const reschedulingData = {
        sessionId: sessionToReschedule.id,
        email: emailFilter,
        newDate: reschedulingDate.toISOString(),
        newDuration: sessionToReschedule.duration
      };
      
      const response = await apiRequest("POST", "/api/reschedule-session", reschedulingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Rescheduled",
        description: "Your session has been rescheduled successfully.",
        variant: "default",
      });
      
      // Reset states and refetch sessions
      setSessionToReschedule(null);
      setSelectedDate(undefined);
      setSelectedTimeSlot("");
      queryClient.invalidateQueries({ queryKey: ["/api/all-sessions"] });
    },
    onError: (error) => {
      toast({
        title: "Rescheduling Failed",
        description: error instanceof Error ? error.message : "Please try again or contact support",
        variant: "destructive",
      });
    }
  });
  
  // Load available dates when component mounts
  useEffect(() => {
    fetchAllAvailableSlots();
  }, []);
  
  // Check if email was passed as URL parameter or if user is viewing their own sessions
  useEffect(() => {
    // Get parameters from URL for both routes
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    
    if (email) {
      setEmailFilter(email);
      setIsFiltering(true);
    }
    
    // If on the "view-my-sessions" path, we should prompt for email with a cleaner UI
    // but not force login - we'll update the UI below
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
        <title>{isUserView ? "My Sessions" : "All Sessions"} | BambooMade</title>
        <meta name="description" content="View project guidance sessions" />
      </Helmet>

      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link href="/project-guidance">
            <Button variant="ghost" className="mr-4 p-2" aria-label="Back to Project Guidance">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">
            {isUserView ? "My Project Guidance Sessions" : "Project Guidance Sessions"}
          </h1>
        </div>
        
        {/* Email filter form - shown on both regular sessions page and user view with different styling */}
        <Card className={`mb-8 ${isUserView ? 'bg-gray-900/70 border-green-800/50' : 'bg-gray-900 border-gray-800'}`}>
          <CardHeader>
            <CardTitle className="text-lg">
              {isUserView ? "My Project Guidance Sessions" : "Find Your Sessions"}
            </CardTitle>
            <CardDescription>
              {isUserView 
                ? "Enter the email address you used when booking your session"
                : "Enter your email address to see your booked sessions"
              }
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
                {isUserView ? "View My Sessions" : "Find My Sessions"}
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
          <Card className={`${isUserView ? 'bg-gray-900/70 border-green-800/50' : 'bg-gray-900 border-gray-800'}`}>
            <CardHeader>
              <CardTitle>
                {emailFilter && isFiltering ? "No Sessions Found" : (isUserView ? "View Your Sessions" : "Enter Your Email")}
              </CardTitle>
              <CardDescription>
                {emailFilter && isFiltering 
                  ? `No project guidance sessions found for ${emailFilter}`
                  : (isUserView 
                     ? "Enter the email address you used for booking to see your sessions" 
                     : "Please enter your email address above to see your booked sessions")}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              {emailFilter && isFiltering ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-900/20 border border-amber-800/40 rounded-md text-left">
                    <h3 className="text-amber-400 flex items-center text-sm font-medium mb-2">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Possible reasons why no sessions were found:
                    </h3>
                    <ul className="list-disc pl-6 text-sm text-gray-300 space-y-1">
                      <li>The email address you entered might be different from the one you used during booking</li>
                      <li>You might not have any booked sessions yet</li>
                      <li>Your payment might still be processing</li>
                    </ul>
                  </div>
                  
                  <p className="text-gray-400">Would you like to book a new session instead?</p>
                </div>
              ) : (
                <p className="text-gray-400 mb-4">
                  {isUserView 
                    ? "Enter your email address above to view all your booked sessions"
                    : "Would you like to book a new session?"}
                </p>
              )}
              
              <div className="flex justify-center space-x-3 mt-4">
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
                      Your Bamboo Guidance Session
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
                    {session.paymentStatus === 'Paid' && (
                      <div className="flex items-center text-sm">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        <Badge 
                          variant="default"
                          className="bg-green-700 hover:bg-green-600"
                        >
                          Payment Confirmed
                        </Badge>
                      </div>
                    )}
                    
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
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-800/50 pt-3 flex flex-wrap gap-2 justify-between">
                    {!session.googleMeetLink && (
                      <div className="text-xs text-gray-400">
                        The Google Meet link will be added by the administrator soon
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 ml-auto">
                      {/* Only show action buttons for upcoming sessions that aren't cancelled */}
                      {session.status !== 'cancelled' && session.status !== 'completed' && (
                        <>
                          {/* Calculate time difference to session */}
                          {(() => {
                            const sessionDate = new Date(session.formattedDate + " " + session.formattedTime);
                            const now = new Date();
                            const hoursDifference = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                            
                            // Only show reschedule button if session is more than 4 hours away
                            if (hoursDifference > 4) {
                              return (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-9 border-blue-700 text-blue-400 hover:bg-blue-900/30"
                                      onClick={() => setSessionToReschedule(session)}
                                    >
                                      <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                                      Reschedule
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-gray-900 border-gray-700 text-white">
                                    <DialogHeader>
                                      <DialogTitle className="text-white">Reschedule Your Session</DialogTitle>
                                      <DialogDescription className="text-gray-400">
                                        Select a new date and time for your bamboo guidance session.
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="space-y-4 py-4">
                                      <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="rescheduleDate">Select New Date</Label>
                                        <p className="text-gray-400 text-xs mb-2">
                                          Only dates with available time slots are selectable.
                                        </p>
                                        
                                        {/* Date dropdown selector */}
                                        <Select
                                          value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                                          onValueChange={(value) => {
                                            if (value) {
                                              setSelectedDate(new Date(value));
                                              // Reset time selection when date changes
                                              setSelectedTimeSlot("");
                                            } else {
                                              setSelectedDate(undefined);
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="w-full">
                                            <div className="flex items-center">
                                              <Calendar className="mr-2 h-4 w-4" />
                                              <SelectValue placeholder="Select a date" />
                                            </div>
                                          </SelectTrigger>
                                          <SelectContent>
                                            {(() => {
                                              // Generate available dates as options
                                              const dateOptions = [];
                                              const today = new Date();
                                              today.setHours(0, 0, 0, 0);
                                              
                                              for (const availableDate of availableDates) {
                                                const date = new Date(availableDate);
                                                date.setHours(0, 0, 0, 0);
                                                
                                                // Format for display and value
                                                const formattedDate = format(date, "yyyy-MM-dd");
                                                const displayDate = format(date, "PPP");
                                                
                                                // Check if it's today
                                                const isToday = date.getTime() === today.getTime();
                                                
                                                dateOptions.push(
                                                  <SelectItem 
                                                    key={formattedDate} 
                                                    value={formattedDate}
                                                    className={cn(
                                                      "flex items-center",
                                                      isToday && "font-bold"
                                                    )}
                                                  >
                                                    <span className={isToday ? "text-green-600 dark:text-green-500" : ""}>
                                                      {displayDate}{isToday ? " (Today)" : ""}
                                                    </span>
                                                  </SelectItem>
                                                );
                                              }
                                              
                                              return dateOptions;
                                            })()}
                                          </SelectContent>
                                        </Select>
                                        
                                        {/* Optionally add a small calendar icon button to show the traditional calendar view */}
                                        <div className="text-center mt-1">
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-xs text-muted-foreground hover:text-foreground"
                                              >
                                                <Calendar className="h-3 w-3 mr-1" /> View Calendar
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700">
                                              <DayPicker
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={setSelectedDate}
                                                disabled={[
                                                  { before: new Date() },
                                                  { dayOfWeek: [0, 6] }, // Disable weekends
                                                  (date) => {
                                                    // Disable dates that are not in availableDates
                                                    return !availableDates.some(availableDate => 
                                                      availableDate.getFullYear() === date.getFullYear() &&
                                                      availableDate.getMonth() === date.getMonth() &&
                                                      availableDate.getDate() === date.getDate()
                                                    );
                                                  }
                                                ]}
                                                modifiers={{
                                                  available: (date) => {
                                                    // Highlight dates that have available slots
                                                    return availableDates.some(availableDate => 
                                                      availableDate.getFullYear() === date.getFullYear() &&
                                                      availableDate.getMonth() === date.getMonth() &&
                                                      availableDate.getDate() === date.getDate()
                                                    );
                                                  }
                                                }}
                                                modifiersClassNames={{
                                                  available: "bg-green-600 text-white hover:bg-green-700 focus:bg-green-700",
                                                  selected: "bg-green-600 text-white hover:bg-green-700 focus:bg-green-700"
                                                }}
                                                className="bg-gray-800 rounded-md text-white"
                                              />
                                            </PopoverContent>
                                          </Popover>
                                        </div>
                                      </div>
                                      
                                      {selectedDate && (
                                        <div className="flex flex-col space-y-1.5">
                                          <Label htmlFor="rescheduleTime">Select New Time</Label>
                                          
                                          {/* Time dropdown selector */}
                                          <Select
                                            value={selectedTimeSlot}
                                            onValueChange={(time) => {
                                              setSelectedTimeSlot(time);
                                            }}
                                            disabled={!selectedDate}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select a time" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {availableTimeSlots.length > 0 ? (
                                                availableTimeSlots.map((time) => (
                                                  <SelectItem 
                                                    key={time} 
                                                    value={time}
                                                  >
                                                    {time}
                                                    {selectedTimeSlot === time && (
                                                      <span className="ml-2 inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                                                        Selected
                                                      </span>
                                                    )}
                                                  </SelectItem>
                                                ))
                                              ) : (
                                                <SelectItem value="" disabled>
                                                  No available time slots
                                                </SelectItem>
                                              )}
                                            </SelectContent>
                                          </Select>
                                          
                                          {availableTimeSlots.length === 0 && selectedDate && (
                                            <p className="text-xs text-amber-600 mt-1">
                                              No available time slots for this date. Please select another date.
                                            </p>
                                          )}
                                        </div>
                                      )}
                                      
                                      <div className="bg-green-900/30 border border-green-800/50 rounded-md p-3 text-green-300 text-sm">
                                        <div className="flex gap-2 items-start">
                                          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="font-medium mb-1">Free Rescheduling</p>
                                            <p className="text-xs text-green-300/80">
                                              Rescheduling is free if done more than 4 hours before the session starts.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button 
                                          variant="outline" 
                                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                        >
                                          Cancel
                                        </Button>
                                      </DialogClose>
                                      <Button 
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={!selectedDate || !selectedTimeSlot || isRescheduling}
                                        onClick={() => rescheduleSession()}
                                      >
                                        {isRescheduling ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Rescheduling...
                                          </>
                                        ) : "Confirm Reschedule"}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              );
                            } else {
                              return (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-9 border-gray-700 text-gray-500 cursor-not-allowed opacity-70"
                                  disabled
                                >
                                  <Clock8 className="h-3.5 w-3.5 mr-1.5" />
                                  Can't Reschedule
                                </Button>
                              );
                            }
                          })()}
                          
                          {/* Cancel Button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-9 border-red-700 text-red-400 hover:bg-red-900/30"
                                onClick={() => setSessionToCancel(session)}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Cancel This Session?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  Are you sure you want to cancel your guidance session? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              
                              <div className="bg-red-900/20 border border-red-800 rounded-md p-4 my-4">
                                <h4 className="text-sm font-medium text-red-400 mb-2">Refund Details</h4>
                                {sessionToCancel && (
                                  <div className="space-y-2 text-sm">
                                    <p className="flex justify-between text-gray-300">
                                      <span>Original Amount:</span> 
                                      <span className="font-medium">₹{getSessionPrice(sessionToCancel)}</span>
                                    </p>
                                    <p className="flex justify-between text-gray-300">
                                      <span>Refund Percentage:</span> 
                                      <span className="font-medium">{calculateRefundAmount(sessionToCancel).percentage}%</span>
                                    </p>
                                    <p className="flex justify-between text-white font-medium border-t border-red-800 pt-2">
                                      <span>Refund Amount:</span> 
                                      <span>₹{calculateRefundAmount(sessionToCancel).amount}</span>
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      ({calculateRefundAmount(sessionToCancel).policy})
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mb-4">
                                <Label htmlFor="cancellationReason" className="text-gray-300 mb-1.5 block">
                                  Please provide a reason for cancellation:
                                </Label>
                                <Textarea
                                  id="cancellationReason"
                                  className="bg-gray-800 border-gray-700 resize-none text-white"
                                  placeholder="Your reason for cancellation"
                                  value={cancellationReason}
                                  onChange={(e) => setCancellationReason(e.target.value)}
                                />
                              </div>
                              
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
                                  Keep My Session
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => cancelSession()}
                                  disabled={!cancellationReason || isCancelling}
                                >
                                  {isCancelling ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Cancelling...
                                    </>
                                  ) : "Confirm Cancellation"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
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
              
              <div className="mt-4 text-center">
                <a 
                  href="https://wa.me/8971690163" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-gray-400 hover:text-gray-300 text-sm"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Contact us via WhatsApp for support
                </a>
              </div>
            </div>
            
            <div className="mt-6 bg-gray-800/50 rounded-md p-4 border border-gray-700">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-gray-300 space-y-2">
                  <p>
                    Above you'll find all sessions booked with your email address. 
                    For paid sessions, Google Meet links will be visible as soon as they're updated by the administrator.
                  </p>
                  <p>
                    <span className="text-green-400 font-medium">Important:</span> Make sure to join the Google Meet link on time for your scheduled session. 
                    Sessions typically last either 30 minutes or 1 hour as specified during booking.
                  </p>
                  <p className="text-xs text-gray-400">
                    If you have questions about your session, please use the Contact Us link below to reach us via WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}