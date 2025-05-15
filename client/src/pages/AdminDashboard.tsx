import { useState, useEffect, useRef, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DayPicker, SelectSingleEventHandler } from "react-day-picker";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Loader2, LogOut, Link as LinkIcon, Check, AlertCircle, Calendar, 
  CalendarClock, Clock, User, Phone, Mail, Plus, Trash2, Edit, Save,
  X, AlertTriangle, CalendarRange, Video, Search, Ban, ExternalLink,
  SlidersHorizontal, Eye, ChevronDown, UserCheck, UserCog
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, format, isAfter, isBefore, isToday, parse, parseISO, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { formatInIST, getCurrentISTDate } from "@/lib/date-utils";
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

  // Rest of your functions and state management code would go here
  // ...

  // Filter function for sessions
  const applyFilters = (sessionsToFilter: Session[]) => {
    return sessionsToFilter.filter(session => {
      const matchesEmail = !emailFilter || session.email.toLowerCase().includes(emailFilter.toLowerCase());
      const matchesDate = !dateFilter || 
        formatInIST(new Date(session.date), 'yyyy-MM-dd').includes(dateFilter) ||
        session.formattedDate?.toLowerCase().includes(dateFilter.toLowerCase());
      const matchesStatus = !statusFilter || session.status.toLowerCase().includes(statusFilter.toLowerCase());
      return matchesEmail && matchesDate && matchesStatus;
    });
  };

  // Mock data for sessions (in a real app, this would come from backend)
  const sessions: Session[] = [
    // Example session data
    {
      id: 1,
      formattedDate: "May 15, 2025",
      formattedTime: "10:00",
      date: "2025-05-15T04:30:00.000Z",
      email: "student@example.com",
      phone: "9876543210",
      topic: "Bamboo furniture design",
      notes: "",
      duration: 60,
      paymentStatus: "Paid",
      studentName: "John Student",
      status: "pending",
      isStudent: true
    },
    {
      id: 2,
      formattedDate: "May 16, 2025",
      formattedTime: "14:00",
      date: "2025-05-16T08:30:00.000Z",
      email: "pro@example.com",
      phone: "9876543211",
      topic: "Bamboo structural design",
      notes: "",
      duration: 30,
      paymentStatus: "Paid",
      studentName: "Jane Professional",
      status: "upcoming",
      googleMeetLink: "https://meet.google.com/123-abc-xyz",
      isStudent: false
    }
  ];

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
                    {displaySessions.length === 0 ? (
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
                            <Input
                              placeholder="Filter by Date"
                              value={dateFilter}
                              onChange={(e) => setDateFilter(e.target.value)}
                              className="bg-gray-800 border-gray-700 text-sm"
                            />
                          </div>
                          <div className="w-full sm:w-auto">
                            <Input
                              placeholder="Filter by Status"
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                              className="bg-gray-800 border-gray-700 text-sm"
                            />
                          </div>
                          {(emailFilter || dateFilter || statusFilter) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEmailFilter("");
                                setDateFilter("");
                                setStatusFilter("");
                              }}
                              className="text-gray-400 border-gray-700"
                            >
                              <X className="w-4 h-4 mr-1" /> Clear Filters
                            </Button>
                          )}
                        </div>
                        
                        <div className="rounded-md border border-gray-800 overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-gray-800 sticky top-0 z-10">
                              <TableRow className="hover:bg-gray-800/80">
                                <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-xs sm:text-sm">Student</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 hidden sm:table-cell py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-xs sm:text-sm">Contact</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-xs sm:text-sm">Date & Time</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 hidden lg:table-cell py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-xs sm:text-sm">Topic</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 hidden md:table-cell py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-xs sm:text-sm">Duration</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-xs sm:text-sm">Payment</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-xs sm:text-sm">Google Meet</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 hidden sm:table-cell py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-xs sm:text-sm">Status</span>
                                  </div>
                                </TableHead>
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
                                        >
                                          <Video className="w-3.5 h-3.5 mr-1.5" /> 
                                          <span className="hidden sm:inline">Open Meet</span>
                                          <span className="sm:hidden">Meet</span>
                                        </Button>
                                      ) : (
                                        <Button 
                                          size="sm"
                                          className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 h-8 text-xs px-2 sm:text-sm sm:px-3"
                                        >
                                          <Plus className="w-3.5 h-3.5 mr-1.5" /> 
                                          <span className="hidden sm:inline">Add Meet Link</span>
                                          <span className="sm:hidden">Add</span>
                                        </Button>
                                      )}
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
                <div className="text-center py-8 text-gray-400">
                  <p>No available time slots have been added yet.</p>
                  <p className="mt-2">Click "Add Date" to create your first available booking date.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}