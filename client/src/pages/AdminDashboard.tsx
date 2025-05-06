import { useState, useEffect, useRef, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { format, addMinutes, addDays, isAfter, isBefore, isToday, parseISO } from "date-fns";
import { formatInIST } from "../lib/date-utils";
import { cn } from "../lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Loader2, LogOut, Link as LinkIcon, Check, AlertCircle, Calendar, 
  CalendarClock, Clock, User, Phone, Mail, Plus, Trash2, Edit, Save,
  X, AlertTriangle, CalendarRange, Video, Search, Ban, ExternalLink,
  SlidersHorizontal, Eye, ChevronDown, UserCheck, UserCog, CalendarIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


interface TimeSlotWithStatus {
  time: string;
  isBooked: boolean;
}

interface AvailableTimeSlot {
  id: number;
  date: string; // ISO format date string like "2023-05-15"
  slots: string[]; // Array of time slots like ["09:00", "10:00", "11:00"]
  slotsWithStatus?: TimeSlotWithStatus[]; // Array of time slots with booking status
  allSlotsBooked?: boolean; // Whether all slots for this date are booked
  createdAt: Date;
  createdBy: number;
  updatedAt: Date;
}

interface Session {
  id: number;
  formattedDate: string;
  formattedTime: string;
  date: string;
  email: string; // Used for web search functionality
  phone: string;
  topic: string;
  notes: string;
  duration: number;
  paymentStatus: string;
  studentName: string;
  status: string;
  googleMeetLink?: string;
  isStudent?: boolean;
  rescheduledBy?: 'user' | 'admin';
  originalDate?: string;
}

export default function AdminDashboard() {
  // Session management state
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [meetLink, setMeetLink] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter state
  const [emailFilter, setEmailFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Reschedule session state
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleDuration, setRescheduleDuration] = useState<number>(0);
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState<Date | undefined>(undefined);
  
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlotWithStatus[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  
  // Cancel session state
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  
  // Availability management state
  const [newDate, setNewDate] = useState("");
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isAddSlotDialogOpen, setIsAddSlotDialogOpen] = useState(false);
  const [isEditSlotDialogOpen, setIsEditSlotDialogOpen] = useState(false);
  
  // Bulk date selection state
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: "", end: ""});
  const [bulkMode, setBulkMode] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<{[key: string]: boolean}>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });
  
  // Calendar state
  const [startDateMonth, setStartDateMonth] = useState<Date>(new Date());
  const [endDateMonth, setEndDateMonth] = useState<Date>(new Date());
  const [startPickerOpen, setStartPickerOpen] = useState<boolean>(false);
  const [endPickerOpen, setEndPickerOpen] = useState<boolean>(false);
  
  // Fixed time slots for chips - including early morning and late night options
  const timeSlotOptions = useMemo(() => [
    // Early morning
    "06:00", "07:00", "08:00", 
    // Standard business hours
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
    // Late evening/night
    "21:00", "22:00", "23:00", "00:00"
  ], []);
  
  // References for calendar popups
  const startDateRef = useRef<HTMLDivElement>(null);
  const endDateRef = useRef<HTMLDivElement>(null);
  
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
  
  // Add Google Meet link mutation
  const addMeetLinkMutation = useMutation({
    mutationFn: async ({ sessionId, meetLink }: { sessionId: number, meetLink: string }) => {
      const response = await apiRequest("PATCH", `/api/project-guidance/${sessionId}/meet-link`, {
        googleMeetLink: meetLink
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-guidance"] });
      toast({
        title: "Google Meet link added",
        description: "The link has been saved and the student will be notified."
      });
      setIsDialogOpen(false);
      setMeetLink("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add Google Meet link",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Reschedule session mutation
  const rescheduleSessionMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      date, 
      time,
      duration
    }: { 
      sessionId: number, 
      date: string, 
      time: string,
      duration: number
    }) => {
      // Combine date and time for the new date
      const newDateStr = `${date}T${time}:00`;
      
      const response = await apiRequest("POST", `/api/reschedule-session`, {
        sessionId,
        newDate: newDateStr,
        duration,
        rescheduledBy: "admin"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-guidance"] });
      toast({
        title: "Session rescheduled",
        description: "The session has been rescheduled and the student will be notified."
      });
      setIsRescheduleDialogOpen(false);
      setRescheduleDate("");
      setRescheduleTime("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reschedule session",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Cancel session mutation
  const cancelSessionMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      reason
    }: { 
      sessionId: number, 
      reason: string 
    }) => {
      const response = await apiRequest("POST", `/api/cancel-session`, {
        sessionId,
        cancellationReason: reason,
        cancelledBy: "admin"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-guidance"] });
      toast({
        title: "Session cancelled",
        description: "The session has been cancelled and the student will be notified."
      });
      setIsCancelDialogOpen(false);
      setCancellationReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel session",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Filter function for sessions
  const applyFilters = (sessionsToFilter: Session[]) => {
    return sessionsToFilter.filter(session => {
      const matchesEmail = !emailFilter || session.email.toLowerCase().includes(emailFilter.toLowerCase());
      const matchesDate = !dateFilter || 
        formatInIST(new Date(session.date), 'yyyy-MM-dd').includes(dateFilter) ||
        session.formattedDate?.toLowerCase().includes(dateFilter.toLowerCase());
      const matchesStatus = statusFilter === "all" || !statusFilter || session.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesEmail && matchesDate && matchesStatus;
    });
  };

  // Fetch real session data from the API
  const { data: sessionsData, isLoading: isSessionsLoading } = useQuery({
    queryKey: ["/api/project-guidance"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/project-guidance");
      const data = await response.json();
      console.log("Fetched sessions data:", data);
      return data;
    }
  });
  
  // Fetch available slots
  const { data: availableSlotsData, isLoading: isAvailableSlotsLoading } = useQuery({
    queryKey: ["/api/available-slots"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/available-slots");
      const data = await response.json();
      console.log("Fetched available slots data:", data);
      return data.slots;
    }
  });
  
  // Format the session data for display
  const sessions: Session[] = useMemo(() => {
    if (!sessionsData || !Array.isArray(sessionsData)) return [];
    
    return sessionsData.map((session: any) => {
      const sessionDate = new Date(session.date);
      return {
        id: session.id,
        formattedDate: formatInIST(sessionDate, 'MMM d, yyyy'),
        formattedTime: formatInIST(sessionDate, 'HH:mm'),
        date: session.date,
        email: session.email,
        phone: session.phone,
        topic: session.topic,
        notes: session.notes || "",
        duration: session.duration,
        paymentStatus: session.paymentConfirmed ? "Paid" : "Pending",
        studentName: session.studentName,
        status: session.status || "pending",
        googleMeetLink: session.googleMeetLink,
        isStudent: session.isStudent !== undefined ? session.isStudent : true,
        originalDate: session.originalDate,
        rescheduledBy: session.rescheduledBy
      };
    });
  }, [sessionsData]);

  // Split sessions into categories
  const pendingSessions = applyFilters(sessions.filter((s: Session) => 
    s.status !== 'cancelled' && s.status !== 'completed' && !s.googleMeetLink));
    
  const upcomingSessions = applyFilters(sessions.filter((s: Session) => 
    s.status !== 'cancelled' && s.status !== 'completed' && s.googleMeetLink));
    
  const completedSessions = applyFilters(sessions.filter((s: Session) => 
    s.status === 'completed'));
    
  const cancelledSessions = applyFilters(sessions.filter((s: Session) => 
    s.status === 'cancelled'));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Helmet>
        <title>Admin Dashboard | BambooMade</title>
        <meta name="description" content="Admin dashboard for session management" />
      </Helmet>
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="ghost" className="flex items-center gap-2 self-end sm:self-auto">
            <LogOut size={18} />
            <span>Logout</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-lg">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
              <p className="text-xl sm:text-3xl font-bold">{sessions.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-900/20 border-amber-900">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-lg text-amber-400">Pending</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
              <p className="text-xl sm:text-3xl font-bold text-amber-500">{pendingSessions.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-900/20 border-green-900">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-lg text-green-400">Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
              <p className="text-xl sm:text-3xl font-bold text-green-500">{upcomingSessions.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-red-900/20 border-red-900">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-lg text-red-400">Cancelled</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
              <p className="text-xl sm:text-3xl font-bold text-red-500">{cancelledSessions.length}</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="pending" className="space-y-4">
          <div className="relative overflow-x-auto pb-1">
            <TabsList className="bg-gray-800 border border-gray-700 w-max min-w-full sm:min-w-0 flex flex-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              <TabsTrigger value="pending" className="data-[state=active]:bg-green-700 text-xs sm:text-sm whitespace-nowrap">
                Pending ({pendingSessions.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-green-700 text-xs sm:text-sm whitespace-nowrap">
                Upcoming ({upcomingSessions.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-green-700 text-xs sm:text-sm whitespace-nowrap">
                Completed ({completedSessions.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="data-[state=active]:bg-green-700 text-xs sm:text-sm whitespace-nowrap">
                Cancelled ({cancelledSessions.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-green-700 text-xs sm:text-sm whitespace-nowrap">
                All Sessions
              </TabsTrigger>
              <TabsTrigger value="availability" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm whitespace-nowrap">
                Availability
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Session management tabs */}
          {["pending", "upcoming", "completed", "cancelled", "all"].map((tab) => {
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
                       `All ${tab} sessions`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isSessionsLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
                      </div>
                    ) : displaySessions.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>{emptyMessage}</p>
                      </div>
                    ) : (
                      <>
                        {/* Filter options */}
                        <div className="mb-4 flex flex-wrap gap-2">
                          <div className="w-full sm:w-auto">
                            <Input
                              placeholder="Filter by Email"
                              value={emailFilter}
                              onChange={(e) => setEmailFilter(e.target.value)}
                              className="bg-gray-800 border-gray-700 text-sm"
                            />
                          </div>
                          <div className="w-full sm:w-auto">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-sm",
                                    !dateFilter && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateFilter ? dateFilter : "Filter by Date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700">
                                <DayPicker
                                  mode="single"
                                  selected={dateFilter ? new Date(dateFilter) : undefined}
                                  onSelect={(date) => setDateFilter(date ? format(date, "yyyy-MM-dd") : "")}
                                  initialFocus
                                  className="border-gray-700"
                                  classNames={{
                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                    month: "space-y-4",
                                    caption: "flex justify-center pt-1 relative items-center",
                                    caption_label: "text-sm font-medium text-gray-300",
                                    nav: "space-x-1 flex items-center",
                                    nav_button: cn(
                                      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-300"
                                    ),
                                    nav_button_previous: "absolute left-1",
                                    nav_button_next: "absolute right-1",
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "flex",
                                    head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                                    row: "flex w-full mt-2",
                                    cell: "h-9 w-9 text-center text-sm relative p-0 rounded-md focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-800",
                                    day: cn(
                                      "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md text-gray-300"
                                    ),
                                    day_selected:
                                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                    day_today: "bg-gray-800 text-accent-foreground",
                                    day_outside: "text-gray-500 opacity-50",
                                    day_disabled: "text-gray-500 opacity-50 line-through",
                                    day_range_middle:
                                      "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                    day_hidden: "invisible",
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="w-full sm:w-auto">
                            <Select
                              value={statusFilter}
                              onValueChange={setStatusFilter}
                            >
                              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-sm">
                                <SelectValue placeholder="Filter by Status" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-gray-700">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {(emailFilter || dateFilter || (statusFilter && statusFilter !== "all")) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEmailFilter("");
                                setDateFilter("");
                                setStatusFilter("all");
                              }}
                              className="text-gray-400 border-gray-700"
                            >
                              <X className="w-4 h-4 mr-1" /> Clear Filters
                            </Button>
                          )}
                        </div>
                        
                        <div className="rounded-md border border-gray-800 overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-gray-800">
                              <TableRow className="hover:bg-gray-800/80">
                                <TableHead className="text-gray-300">Student</TableHead>
                                <TableHead className="text-gray-300 hidden sm:table-cell">Contact</TableHead>
                                <TableHead className="text-gray-300">Date & Time</TableHead>
                                <TableHead className="text-gray-300 hidden lg:table-cell">Topic</TableHead>
                                <TableHead className="text-gray-300 hidden md:table-cell">Duration</TableHead>
                                <TableHead className="text-gray-300">Payment</TableHead>
                                <TableHead className="text-gray-300">Google Meet</TableHead>
                                <TableHead className="text-gray-300 hidden sm:table-cell">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-800">
                              {displaySessions.map((session) => (
                                <TableRow 
                                  key={session.id} 
                                  className="hover:bg-gray-800/50 bg-gray-900"
                                >
                                  <TableCell>
                                    <div className="font-medium text-sm sm:text-base">{session.studentName}</div>
                                    <div className="text-xs text-gray-400">{session.isStudent ? "Student" : "Professional"}</div>
                                    
                                    {/* Show contact info on mobile */}
                                    <div className="flex items-center text-xs text-gray-300 mt-1 sm:hidden">
                                      <Mail className="w-3 h-3 mr-1" /> 
                                      <span className="max-w-[80px] truncate" title={session.email}>
                                        {session.email}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                    <div className="flex items-center text-xs text-gray-300 mb-1">
                                      <Mail className="w-3 h-3 mr-1" /> 
                                      <span className="max-w-[120px] truncate" title={session.email}>
                                        {session.email}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-300">
                                      <Phone className="w-3 h-3 mr-1" /> {session.phone}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {/* Current session date/time (highlighted) */}
                                    <div className="flex flex-col gap-1 mb-1">
                                      <div className="flex items-center text-xs sm:text-sm font-medium text-white bg-gray-800 px-2 py-1 rounded-md">
                                        <Calendar className="w-3 h-3 mr-1 sm:w-3.5 sm:h-3.5 sm:mr-1.5 text-green-400" /> 
                                        <span className="truncate">
                                          {formatInIST(new Date(session.date), 'MMM d')}
                                        </span>
                                      </div>
                                      <div className="flex items-center text-xs sm:text-sm font-medium text-white bg-gray-800 px-2 py-1 rounded-md">
                                        <Clock className="w-3 h-3 mr-1 sm:w-3.5 sm:h-3.5 sm:mr-1.5 text-green-400" /> {session.formattedTime}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell">
                                    <div className="max-w-[200px] truncate" title={session.topic}>
                                      {session.topic}
                                    </div>
                                    {session.notes && (
                                      <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate" title={session.notes}>
                                        {session.notes}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">{session.duration} min</TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={session.paymentStatus === "Paid" ? "default" : "outline"}
                                      className={`text-xs ${session.paymentStatus === "Paid" ? "bg-green-700 hover:bg-green-600" : ""}`}
                                    >
                                      {session.paymentStatus}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-2">
                                      {session.googleMeetLink ? (
                                        <Button 
                                          size="sm"
                                          className="whitespace-nowrap bg-green-600 hover:bg-green-700 h-8 text-xs px-2 sm:text-sm sm:px-3"
                                          onClick={() => window.open(session.googleMeetLink, '_blank')}
                                        >
                                          <Video className="w-3.5 h-3.5 mr-1.5" /> 
                                          <span className="hidden sm:inline">Open Meet</span>
                                          <span className="sm:hidden">Meet</span>
                                        </Button>
                                      ) : (
                                        <Button 
                                          size="sm"
                                          className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 h-8 text-xs px-2 sm:text-sm sm:px-3"
                                          onClick={() => {
                                            setSelectedSession(session);
                                            setIsDialogOpen(true);
                                          }}
                                        >
                                          <Plus className="w-3.5 h-3.5 mr-1.5" /> 
                                          <span className="hidden sm:inline">Add Meet Link</span>
                                          <span className="sm:hidden">Add</span>
                                        </Button>
                                      )}
                                      
                                      <div className="flex gap-1 mt-1">
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          className="whitespace-nowrap h-7 text-xs px-2 border-amber-700/50 text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 hover:border-amber-700"
                                          onClick={() => {
                                            setSelectedSession(session);
                                            setIsRescheduleDialogOpen(true);
                                          }}
                                        >
                                          <Calendar className="w-3 h-3 mr-1" /> 
                                          <span>Reschedule</span>
                                        </Button>
                                        
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          className="whitespace-nowrap h-7 text-xs px-2 border-red-700/50 text-red-400 hover:text-red-300 hover:bg-red-950/30 hover:border-red-700"
                                          onClick={() => {
                                            setSelectedSession(session);
                                            setIsCancelDialogOpen(true);
                                          }}
                                        >
                                          <X className="w-3 h-3 mr-1" /> 
                                          <span>Cancel</span>
                                        </Button>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                    <Badge 
                                      variant="outline"
                                      className="capitalize text-xs"
                                    >
                                      {session.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
          
          {/* Availability management tab */}
          <TabsContent value="availability" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Available Time Slots</CardTitle>
                    <CardDescription>
                      Manage available dates and times for project guidance bookings
                    </CardDescription>
                  </div>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700" 
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Date
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isAvailableSlotsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : !availableSlotsData || availableSlotsData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No available time slots have been added yet.</p>
                    <p className="mt-2">Click "Add Date" to create your first available booking date.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="bg-gray-800 rounded-md px-3 py-1 text-sm text-gray-300">
                        <span className="font-semibold">{availableSlotsData.length}</span> available dates
                      </div>
                      
                      <div className="flex items-center gap-1 ml-auto">
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          <span className="text-xs text-gray-400">All slots available</span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                          <span className="text-xs text-gray-400">Some slots booked</span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <div className="h-3 w-3 rounded-full bg-red-500"></div>
                          <span className="text-xs text-gray-400">All slots booked</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.isArray(availableSlotsData) && availableSlotsData.map((slot: AvailableTimeSlot) => {
                        const date = new Date(slot.date);
                        const availableSlotsCount = slot.slots?.length || 0;
                        const allSlotsBooked = slot.allSlotsBooked || false;
                        const someSlotsBooked = slot.slotsWithStatus?.some(s => s.isBooked) || false;
                        
                        let statusColor = 'bg-green-500';
                        if (allSlotsBooked) {
                          statusColor = 'bg-red-500';
                        } else if (someSlotsBooked) {
                          statusColor = 'bg-amber-500';
                        }
                        
                        return (
                          <div 
                            key={slot.id} 
                            className="bg-gray-800 border border-gray-700 rounded-md p-3 hover:bg-gray-750 transition-colors flex items-center"
                          >
                            <div className={`h-3 w-3 rounded-full ${statusColor} mr-3`}></div>
                            <div className="flex-grow">
                              <p className="font-medium">{formatInIST(date, 'EEE, MMM d, yyyy')}</p>
                              <p className="text-sm text-gray-400">
                                {allSlotsBooked 
                                  ? 'All slots booked' 
                                  : `${availableSlotsCount - (slot.slotsWithStatus?.filter(s => s.isBooked).length || 0)}/${availableSlotsCount} slots available`}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" className="ml-auto">
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Meet Link Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Add Google Meet Link</DialogTitle>
              <DialogDescription>
                Add a Google Meet link for the session with {selectedSession?.studentName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="meet-link">Google Meet Link</Label>
                <Input
                  id="meet-link"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="bg-gray-800 p-3 rounded-md space-y-2">
                <h4 className="text-sm font-medium">Session Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Student:</p>
                    <p>{selectedSession?.studentName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Date & Time:</p>
                    <p>{selectedSession?.formattedDate} at {selectedSession?.formattedTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Topic:</p>
                    <p className="truncate" title={selectedSession?.topic}>{selectedSession?.topic}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration:</p>
                    <p>{selectedSession?.duration} min</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedSession) return;
                  
                  addMeetLinkMutation.mutate({
                    sessionId: selectedSession.id,
                    meetLink: meetLink
                  });
                }}
                className="bg-green-700 hover:bg-green-800"
                disabled={!meetLink || !meetLink.includes('meet.google.com') || addMeetLinkMutation.isPending}
              >
                {addMeetLinkMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" /> Save Link
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Dialog */}
        <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Reschedule Session</DialogTitle>
              <DialogDescription>
                Reschedule the session with {selectedSession?.studentName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-gray-800 p-3 rounded-md space-y-2 mb-4">
                <h4 className="text-sm font-medium">Current Session Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Student:</p>
                    <p>{selectedSession?.studentName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Date & Time:</p>
                    <p>{selectedSession?.formattedDate} at {selectedSession?.formattedTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Topic:</p>
                    <p className="truncate" title={selectedSession?.topic}>{selectedSession?.topic}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration:</p>
                    <p>{selectedSession?.duration} min</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reschedule-date">New Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-800 border-gray-700",
                        !rescheduleDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {rescheduleDate ? format(new Date(rescheduleDate), "PPP") : "Select new date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700">
                    <DayPicker
                      mode="single"
                      selected={rescheduleDate ? new Date(rescheduleDate) : undefined}
                      onSelect={(date) => date && setRescheduleDate(format(date, "yyyy-MM-dd"))}
                      initialFocus
                      className="border-gray-700"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium text-gray-300",
                        nav: "space-x-1 flex items-center",
                        nav_button: cn(
                          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-300"
                        ),
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm relative p-0 rounded-md focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-800",
                        day: cn(
                          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md text-gray-300"
                        ),
                        day_selected:
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-gray-800 text-accent-foreground",
                        day_outside: "text-gray-500 opacity-50",
                        day_disabled: "text-gray-500 opacity-50 line-through",
                        day_range_middle:
                          "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reschedule-time">New Time</Label>
                <Select
                  value={rescheduleTime}
                  onValueChange={setRescheduleTime}
                >
                  <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {timeSlotOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRescheduleDialogOpen(false)}
                className="border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedSession || !rescheduleDate || !rescheduleTime) return;
                  
                  rescheduleSessionMutation.mutate({
                    sessionId: selectedSession.id,
                    date: rescheduleDate,
                    time: rescheduleTime,
                    duration: selectedSession.duration
                  });
                }}
                className="bg-amber-700 hover:bg-amber-800"
                disabled={!rescheduleDate || !rescheduleTime || rescheduleSessionMutation.isPending}
              >
                {rescheduleSessionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rescheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" /> Reschedule
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Session Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Cancel Session</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this session? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-gray-800 p-3 rounded-md space-y-2">
                <h4 className="text-sm font-medium">Session Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Student:</p>
                    <p>{selectedSession?.studentName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Date & Time:</p>
                    <p>{selectedSession?.formattedDate} at {selectedSession?.formattedTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Topic:</p>
                    <p className="truncate" title={selectedSession?.topic}>{selectedSession?.topic}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration:</p>
                    <p>{selectedSession?.duration} min</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cancellation-reason">Cancellation Reason</Label>
                <Textarea
                  id="cancellation-reason"
                  placeholder="Enter reason for cancellation"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="bg-gray-800 border-gray-700 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCancelDialogOpen(false)}
                className="border-gray-700 text-gray-300"
              >
                Keep Session
              </Button>
              <Button
                onClick={() => {
                  if (!selectedSession) return;
                  
                  cancelSessionMutation.mutate({
                    sessionId: selectedSession.id,
                    reason: cancellationReason
                  });
                }}
                variant="destructive"
                className="bg-red-700 hover:bg-red-800"
                disabled={!cancellationReason || cancelSessionMutation.isPending}
              >
                {cancelSessionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelling...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" /> Cancel Session
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}