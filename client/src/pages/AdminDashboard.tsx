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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Loader2, LogOut, Link as LinkIcon, Check, AlertCircle, Calendar, 
  CalendarClock, Clock, User, Phone, Mail, Plus, Trash2, Edit, Save,
  X, AlertTriangle, CalendarRange, Video
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO, addDays, addMonths, startOfMonth, endOfMonth, isSameMonth, getDay } from "date-fns";

interface AvailableTimeSlot {
  id: number;
  date: string; // ISO format date string like "2023-05-15"
  slots: string[]; // Array of time slots like ["09:00", "10:00", "11:00"]
  createdAt: Date;
  createdBy: number;
  updatedAt: Date;
}

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
  rescheduledBy?: 'user' | 'admin';
  originalDate?: string;
}

export default function AdminDashboard() {
  // Session management state
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [meetLink, setMeetLink] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Reschedule session state
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleDuration, setRescheduleDuration] = useState<number>(0);
  
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
  
  // Fixed time slots for chips
  const timeSlotOptions = useMemo(() => [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
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
  
  // Fetch available time slots
  const { data: availableSlotsData, isLoading: isAvailableSlotsLoading } = useQuery({
    queryKey: ["/api/available-slots"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/available-slots");
      return response.json();
    },
    enabled: Boolean(userData?.isAdmin),
  });
  
  // Add a new available time slot
  const { mutate: addTimeSlot, isPending: isAddingSlot } = useMutation({
    mutationFn: async ({ date, slots }: { date: string; slots: string[] }) => {
      const response = await apiRequest("POST", "/api/admin/available-slots", {
        date,
        slots,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Available time slot added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
      setIsAddSlotDialogOpen(false);
      setNewDate("");
      setSelectedSlots([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add available time slot.",
        variant: "destructive",
      });
    },
  });
  
  // Update an existing available time slot
  const { mutate: updateTimeSlot, isPending: isUpdatingSlot } = useMutation({
    mutationFn: async ({ id, slots }: { id: number; slots: string[] }) => {
      const response = await apiRequest("PUT", `/api/admin/available-slots/${id}`, {
        slots,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Available time slot updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
      setIsEditSlotDialogOpen(false);
      setEditingSlotId(null);
      setSelectedSlots([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update available time slot.",
        variant: "destructive",
      });
    },
  });
  
  // Delete an available time slot
  const { mutate: deleteTimeSlot, isPending: isDeletingSlot } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/available-slots/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Available time slot deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete available time slot.",
        variant: "destructive",
      });
    },
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
  
  // Reschedule a session (admin only)
  const { mutate: rescheduleSession, isPending: isRescheduling } = useMutation({
    mutationFn: async ({ sessionId, newDate, newDuration }: { sessionId: number; newDate: string; newDuration: number }) => {
      const response = await apiRequest("POST", "/api/admin/reschedule-session", {
        sessionId,
        newDate,
        newDuration,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Session rescheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      setIsRescheduleDialogOpen(false);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleDuration(0);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule session.",
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
  
  const openRescheduleDialog = (session: Session) => {
    setSelectedSession(session);
    // Default to current date and time if available
    const sessionDate = new Date(session.date);
    setRescheduleDate(sessionDate.toISOString().split('T')[0]); // YYYY-MM-DD
    setRescheduleTime(sessionDate.toTimeString().substring(0, 5)); // HH:MM
    setRescheduleDuration(session.duration);
    setIsRescheduleDialogOpen(true);
  };
  
  const handleRescheduleSession = () => {
    if (!selectedSession) return;
    
    if (!rescheduleDate || !rescheduleTime) {
      toast({
        title: "Error",
        description: "Please select both date and time for rescheduling.",
        variant: "destructive",
      });
      return;
    }
    
    if (!rescheduleDuration || rescheduleDuration <= 0) {
      toast({
        title: "Error",
        description: "Please select a valid duration for the session.",
        variant: "destructive",
      });
      return;
    }
    
    // Combine date and time into a single ISO string
    const newDateTime = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
    
    rescheduleSession({
      sessionId: selectedSession.id,
      newDate: newDateTime.toISOString(),
      newDuration: rescheduleDuration
    });
  };
  
  // Availability management functions
  const handleAddTimeSlot = () => {
    if (!newDate) {
      toast({
        title: "Error",
        description: "Please select a date.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedSlots.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one time slot.",
        variant: "destructive",
      });
      return;
    }
    
    addTimeSlot({
      date: newDate,
      slots: selectedSlots,
    });
  };
  
  const handleUpdateTimeSlot = () => {
    if (!editingSlotId) return;
    
    if (selectedSlots.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one time slot.",
        variant: "destructive",
      });
      return;
    }
    
    updateTimeSlot({
      id: editingSlotId,
      slots: selectedSlots,
    });
  };
  
  const openEditSlotDialog = (slot: AvailableTimeSlot) => {
    setEditingSlotId(slot.id);
    setSelectedSlots([...slot.slots]);
    setIsEditSlotDialogOpen(true);
  };
  
  const addTimeToSelectedSlots = () => {
    if (!newTimeSlot) return;
    
    // Check if this time slot already exists
    if (selectedSlots.includes(newTimeSlot)) {
      toast({
        title: "Error",
        description: "This time slot is already added.",
        variant: "destructive",
      });
      return;
    }
    
    // Add new time slot
    setSelectedSlots([...selectedSlots, newTimeSlot].sort());
    setNewTimeSlot("");
  };
  
  const removeTimeFromSelectedSlots = (time: string) => {
    setSelectedSlots(selectedSlots.filter(t => t !== time));
  };
  
  // Helper function to generate dates between start and end dates
  const generateDatesInRange = () => {
    if (!dateRange.start || !dateRange.end) return [];
    
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const dateList: string[] = [];
    
    // Map day index to day name
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Loop through each day in the range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayName = dayNames[currentDate.getDay()];
      
      // Only add dates for selected days of week
      if (selectedDays[dayName]) {
        dateList.push(currentDate.toISOString().split('T')[0]);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateList;
  };
  
  // Handle date selection in calendar
  const handleStartDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateStr = date.toISOString().split('T')[0];
    setDateRange(prev => ({ ...prev, start: dateStr }));
    setStartPickerOpen(false);
    
    // If end date is before start date, update end date to match start date
    if (dateRange.end && new Date(dateRange.end) < date) {
      setDateRange(prev => ({ ...prev, end: dateStr }));
    }
  };
  
  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateStr = date.toISOString().split('T')[0];
    setDateRange(prev => ({ ...prev, end: dateStr }));
    setEndPickerOpen(false);
  };
  
  // Handle time slot selection by toggling
  const toggleTimeSlot = (time: string) => {
    if (selectedSlots.includes(time)) {
      removeTimeFromSelectedSlots(time);
    } else {
      const uniqueSlots = Array.from(new Set([...selectedSlots, time]));
      setSelectedSlots(uniqueSlots.sort());
    }
  };
  
  // Click outside handler for date pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startDateRef.current && !startDateRef.current.contains(event.target as Node)) {
        setStartPickerOpen(false);
      }
      if (endDateRef.current && !endDateRef.current.contains(event.target as Node)) {
        setEndPickerOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle bulk time slot creation
  const handleBulkTimeSlotCreation = async () => {
    if (selectedSlots.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one time slot.",
        variant: "destructive",
      });
      return;
    }
    
    // Generate list of dates based on range and selected days
    const dates = bulkMode ? generateDatesInRange() : [newDate];
    
    if (dates.length === 0) {
      toast({
        title: "Error",
        description: "No dates selected. Please select at least one date.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create a promise for each date to add
      const promises = dates.map(date => 
        addTimeSlot({
          date,
          slots: selectedSlots,
        })
      );
      
      // Wait for all slots to be added
      await Promise.all(promises);
      
      toast({
        title: "Success",
        description: `Added time slots for ${dates.length} dates successfully.`,
      });
      
      // Reset state
      setIsAddSlotDialogOpen(false);
      setNewDate("");
      setSelectedSlots([]);
      setDateRange({start: "", end: ""});
      setBulkMode(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add some time slots. Please try again.",
        variant: "destructive",
      });
    }
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
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="ghost" className="flex items-center gap-2 self-end sm:self-auto" onClick={handleLogout}>
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
                    onClick={() => {
                      setNewDate("");
                      setSelectedSlots([]);
                      setIsAddSlotDialogOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700" 
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Date
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isAvailableSlotsLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : availableSlotsData?.slots?.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No available time slots have been added yet.</p>
                    <p className="mt-2">Click "Add Date" to create your first available booking date.</p>
                  </div>
                ) : (
                  <div className="rounded-md border border-gray-800 overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-800">
                        <TableRow className="hover:bg-gray-800/80">
                          <TableHead className="text-gray-300 hidden md:table-cell">ID</TableHead>
                          <TableHead className="text-gray-300">Date</TableHead>
                          <TableHead className="text-gray-300">Available Times</TableHead>
                          <TableHead className="text-gray-300 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-800">
                        {availableSlotsData?.slots?.map((slot: AvailableTimeSlot) => (
                          <TableRow key={slot.id} className="hover:bg-gray-800/50 bg-gray-900">
                            <TableCell className="font-mono hidden md:table-cell">{slot.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                                <span className="font-medium text-sm sm:text-base">
                                  {format(parseISO(slot.date), 'MMM d, yyyy')}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {format(parseISO(slot.date), 'EEEE')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 sm:gap-1.5 max-w-md">
                                {slot.slots.sort().map((time) => (
                                  <Badge 
                                    key={time} 
                                    variant="secondary"
                                    className="bg-blue-900/30 text-blue-300 border-blue-800 text-xs sm:text-sm"
                                  >
                                    <Clock className="w-3 h-3 mr-1 hidden sm:inline" /> {time}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-blue-700 text-blue-400 hover:bg-blue-900/30 px-2 sm:px-3 h-8 text-xs sm:text-sm"
                                  onClick={() => openEditSlotDialog(slot)}
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1" /> 
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-red-700 text-red-400 hover:bg-red-900/30 px-2 sm:px-3 h-8 text-xs sm:text-sm"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete this date and all its time slots? This action cannot be undone.`)) {
                                      deleteTimeSlot(slot.id);
                                    }
                                  }}
                                  disabled={isDeletingSlot}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" /> 
                                  <span className="hidden sm:inline">Delete</span>
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
                      <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                      </div>
                    ) : displaySessions.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>{emptyMessage}</p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-gray-800 overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-gray-800">
                            <TableRow className="hover:bg-gray-800/80">
                              <TableHead className="text-gray-300 hidden md:table-cell">ID</TableHead>
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
                            {displaySessions.map((session: Session) => (
                              <TableRow 
                                key={session.id} 
                                className="hover:bg-gray-800/50 bg-gray-900"
                              >
                                <TableCell className="font-mono text-xs hidden md:table-cell">{session.id}</TableCell>
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
                                        {format(new Date(session.date), 'MMM d')}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-xs sm:text-sm font-medium text-white bg-gray-800 px-2 py-1 rounded-md">
                                      <Clock className="w-3 h-3 mr-1 sm:w-3.5 sm:h-3.5 sm:mr-1.5 text-green-400" /> {session.formattedTime}
                                    </div>
                                  </div>
                                  
                                  {/* Show history if rescheduled */}
                                  {(session.status === 'rescheduled' || 
                                    (session.notes && session.notes.toLowerCase().includes('rescheduled'))) && (
                                    <div className="mt-1 border-t border-gray-700 pt-1">
                                      <div className="text-xs text-blue-400 flex items-center mb-0.5">
                                        <CalendarClock className="w-3 h-3 mr-1" /> Rescheduled
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        Originally: {(() => {
                                          if (!session.notes) return "Unknown";
                                          const dateMatch = session.notes.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
                                          return dateMatch ? dateMatch[0] : "Unknown date";
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Show status badge only on mobile */}
                                  <div className="mt-1 sm:hidden">
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
                                      className={`capitalize text-xs ${
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
                                      <>
                                        <Button 
                                          size="sm"
                                          className="whitespace-nowrap bg-green-600 hover:bg-green-700 h-8 text-xs px-2 sm:text-sm sm:px-3"
                                          onClick={() => window.open(session.googleMeetLink, '_blank')}
                                        >
                                          <Video className="w-3.5 h-3.5 mr-1.5" /> 
                                          <span className="hidden sm:inline">Open Meet</span>
                                          <span className="sm:hidden">Meet</span>
                                        </Button>
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          className="whitespace-nowrap border-blue-700 text-blue-400 hover:bg-blue-900/30 h-8 text-xs px-2 sm:text-sm sm:px-3"
                                          onClick={() => openMeetLinkDialog(session)}
                                        >
                                          <Edit className="w-3.5 h-3.5 mr-1.5" /> 
                                          <span className="hidden sm:inline">Edit Link</span>
                                          <span className="sm:hidden">Edit</span>
                                        </Button>
                                      </>
                                    ) : (
                                      <Button 
                                        size="sm"
                                        className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 h-8 text-xs px-2 sm:text-sm sm:px-3"
                                        onClick={() => openMeetLinkDialog(session)}
                                      >
                                        <Plus className="w-3.5 h-3.5 mr-1.5" /> 
                                        <span className="hidden sm:inline">Add Meet Link</span>
                                        <span className="sm:hidden">Add</span>
                                      </Button>
                                    )}
                                    
                                    {/* Always show reschedule button for upcoming sessions */}
                                    {session.status !== 'cancelled' && session.status !== 'completed' && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="whitespace-nowrap border-blue-700 text-blue-400 hover:bg-blue-900/30 h-8 text-xs px-2 sm:text-sm sm:px-3 mt-1"
                                        onClick={() => openRescheduleDialog(session)}
                                      >
                                        <CalendarRange className="w-3 h-3 mr-1" />
                                        <span className="hidden sm:inline">Reschedule</span>
                                        <span className="sm:hidden">Move</span>
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
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
        <DialogContent className="bg-gray-900 border-gray-800 text-white w-[95%] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedSession?.googleMeetLink ? "Update" : "Add"} Google Meet Link
            </DialogTitle>
            <DialogDescription>
              {selectedSession ? (
                <div className="mt-2 space-y-1 text-gray-300 text-sm">
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

      {/* Reschedule Session Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white w-[95%] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Reschedule Session</DialogTitle>
            <DialogDescription>
              {selectedSession ? (
                <div className="mt-2 space-y-1 text-gray-300 text-sm">
                  <p><span className="font-medium">Session:</span> #{selectedSession.id}</p>
                  <p><span className="font-medium">Student:</span> {selectedSession.studentName}</p>
                  <p><span className="font-medium">Current Date:</span> {selectedSession.formattedDate} at {selectedSession.formattedTime}</p>
                  <p><span className="font-medium">Current Duration:</span> {selectedSession.duration} minutes</p>
                </div>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rescheduleDate">New Date</Label>
              <Input
                id="rescheduleDate"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rescheduleTime">New Time</Label>
              <Input
                id="rescheduleTime"
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rescheduleDuration">Duration (minutes)</Label>
              <Select 
                value={rescheduleDuration.toString()} 
                onValueChange={(value) => setRescheduleDuration(parseInt(value))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRescheduleDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleSession}
              disabled={isRescheduling}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <CalendarRange className="mr-2 h-4 w-4" />
                  Reschedule Session
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Available Slot Dialog */}
      <Dialog open={isAddSlotDialogOpen} onOpenChange={setIsAddSlotDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 w-[95%] max-w-[550px] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add Available Booking Dates</DialogTitle>
            <DialogDescription className="text-sm">
              Add dates with available time slots for project guidance bookings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Date selection mode toggle */}
            <div className="flex justify-center mb-4">
              <div className="border border-gray-700 rounded-lg p-1 flex">
                <Button
                  type="button"
                  variant={bulkMode ? "ghost" : "secondary"}
                  size="sm"
                  onClick={() => setBulkMode(false)}
                  className={!bulkMode ? "bg-blue-600" : "hover:bg-gray-800"}
                >
                  <Calendar className="w-4 h-4 mr-2" /> Single Date
                </Button>
                <Button
                  type="button"
                  variant={bulkMode ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setBulkMode(true)}
                  className={bulkMode ? "bg-blue-600" : "hover:bg-gray-800"}
                >
                  <CalendarRange className="w-4 h-4 mr-2" /> Multiple Dates
                </Button>
              </div>
            </div>
            
            {/* Date selection section */}
            {bulkMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <div className="relative">
                      <Input
                        id="startDate"
                        type="text"
                        value={dateRange.start ? format(new Date(dateRange.start), 'MMM d, yyyy') : ''}
                        onClick={() => setStartPickerOpen(true)}
                        className="bg-gray-800 border-gray-700 text-white cursor-pointer"
                        readOnly
                      />
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost" 
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setStartPickerOpen(true)}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      
                      {startPickerOpen && (
                        <div 
                          ref={startDateRef} 
                          className="absolute left-0 top-full z-50 mt-1"
                        >
                          <DayPicker
                            mode="single"
                            selected={dateRange.start ? new Date(dateRange.start) : undefined}
                            onSelect={handleStartDateSelect}
                            month={startDateMonth}
                            onMonthChange={setStartDateMonth}
                            fromDate={new Date()}
                            footer={
                              <div className="p-2 text-center text-sm text-gray-400">
                                Click to select start date
                              </div>
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <div className="relative">
                      <Input
                        id="endDate"
                        type="text"
                        value={dateRange.end ? format(new Date(dateRange.end), 'MMM d, yyyy') : ''}
                        onClick={() => setEndPickerOpen(true)}
                        className="bg-gray-800 border-gray-700 text-white cursor-pointer"
                        readOnly
                      />
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost" 
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setEndPickerOpen(true)}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      
                      {endPickerOpen && (
                        <div 
                          ref={endDateRef} 
                          className="absolute left-0 top-full z-50 mt-1"
                        >
                          <DayPicker
                            mode="single"
                            selected={dateRange.end ? new Date(dateRange.end) : undefined}
                            onSelect={handleEndDateSelect}
                            month={endDateMonth}
                            onMonthChange={setEndDateMonth}
                            footer={
                              <div className="p-2 text-center text-sm text-gray-400">
                                Click to select end date
                              </div>
                            }
                            fromDate={dateRange.start ? new Date(dateRange.start) : new Date()}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Days of week checkboxes */}
                <div className="space-y-2">
                  <Label>Days of the Week</Label>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day} className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => setSelectedDays({...selectedDays, [day]: !selectedDays[day]})}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                            selectedDays[day] ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {day.charAt(0).toUpperCase()}
                        </button>
                        <span className="text-[10px] sm:text-xs mt-1 text-gray-400">{day.substring(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Preview of selected dates */}
                {dateRange.start && dateRange.end && (
                  <div className="mt-2">
                    <Label>Selected Dates ({generateDatesInRange().length})</Label>
                    <div className="mt-1 p-2 bg-gray-800 rounded-md max-h-24 overflow-y-auto">
                      <div className="grid grid-cols-3 gap-1">
                        {generateDatesInRange().map((date) => (
                          <Badge key={date} variant="secondary" className="justify-center text-xs">
                            {new Date(date).toLocaleDateString()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="text"
                    value={newDate ? format(new Date(newDate), 'MMM d, yyyy') : ''}
                    onClick={() => setStartPickerOpen(true)}
                    className="bg-gray-800 border-gray-700 text-white cursor-pointer"
                    readOnly
                  />
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setStartPickerOpen(true)}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  
                  {startPickerOpen && (
                    <div 
                      ref={startDateRef} 
                      className="absolute left-0 top-full z-50 mt-1"
                    >
                      <DayPicker
                        mode="single"
                        selected={newDate ? new Date(newDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setNewDate(date.toISOString().split('T')[0]);
                            setStartPickerOpen(false);
                          }
                        }}
                        month={startDateMonth}
                        onMonthChange={setStartDateMonth}
                        fromDate={new Date()}
                        footer={
                          <div className="p-2 text-center text-sm text-gray-400">
                            Click to select date
                          </div>
                        }
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400">Select a date in the future</p>
              </div>
            )}
            
            <div className="space-y-2 border-t border-gray-800 pt-4">
              <Label htmlFor="time">Time Slots</Label>
              
              <div className="flex flex-wrap gap-2 mt-1 mb-4">
                {timeSlotOptions.map((time) => (
                  <Badge 
                    key={time} 
                    variant={selectedSlots.includes(time) ? "default" : "outline"}
                    className={`cursor-pointer px-2 sm:px-3 py-1.5 ${
                      selectedSlots.includes(time) 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-transparent hover:bg-blue-900/20 border-blue-800 text-blue-300"
                    } flex items-center justify-center gap-1 text-xs sm:text-sm`}
                    onClick={() => toggleTimeSlot(time)}
                  >
                    {selectedSlots.includes(time) ? (
                      <Check className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <Clock className="w-3 h-3 flex-shrink-0" />
                    )}
                    {time}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  id="time"
                  type="time"
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white flex-1"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={addTimeToSelectedSlots}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Quick time slot buttons */}
              <div className="flex flex-wrap gap-2 my-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs border-blue-800 text-blue-400 hover:bg-blue-900/30"
                  onClick={() => {
                    const times = ["09:00", "10:00", "11:00", "12:00"];
                    const uniqueSlots = Array.from(new Set([...selectedSlots, ...times]));
                    setSelectedSlots(uniqueSlots.sort());
                  }}
                >
                  + Morning Hours
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs border-blue-800 text-blue-400 hover:bg-blue-900/30"
                  onClick={() => {
                    const times = ["13:00", "14:00", "15:00", "16:00"];
                    const uniqueSlots = Array.from(new Set([...selectedSlots, ...times]));
                    setSelectedSlots(uniqueSlots.sort());
                  }}
                >
                  + Afternoon Hours
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs border-blue-800 text-blue-400 hover:bg-blue-900/30"
                  onClick={() => {
                    const times = ["17:00", "18:00", "19:00"];
                    const uniqueSlots = Array.from(new Set([...selectedSlots, ...times]));
                    setSelectedSlots(uniqueSlots.sort());
                  }}
                >
                  + Evening Hours
                </Button>
              </div>
              
              {selectedSlots.length > 0 ? (
                <div className="mt-3 border border-gray-800 rounded-md p-3 bg-gray-800/50">
                  <div className="flex flex-wrap gap-2 max-w-md">
                    {selectedSlots.map((time) => (
                      <Badge 
                        key={time} 
                        variant="secondary"
                        className="bg-blue-900/30 text-blue-300 border-blue-800 flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" /> 
                        {time}
                        <button 
                          onClick={() => removeTimeFromSelectedSlots(time)}
                          className="ml-1 text-blue-300 hover:text-blue-100 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-sm text-gray-500 bg-gray-800/30 border border-gray-800 rounded-md">
                  <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                  <p>No time slots added yet</p>
                  <p className="text-xs mt-1">Add at least one time slot using the time picker above</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="border-t border-gray-800 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddSlotDialogOpen(false);
                setBulkMode(false);
                setDateRange({start: "", end: ""});
                setSelectedSlots([]);
              }}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={bulkMode ? handleBulkTimeSlotCreation : handleAddTimeSlot}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isAddingSlot || 
                         (!newDate && !bulkMode) || 
                         (bulkMode && (!dateRange.start || !dateRange.end)) || 
                         selectedSlots.length === 0}
            >
              {isAddingSlot ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                  Adding...
                </>
              ) : bulkMode ? (
                <>
                  <CalendarRange className="w-4 h-4 mr-2" /> 
                  Add Multiple Dates
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" /> 
                  Add Date
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Available Slot Dialog */}
      <Dialog open={isEditSlotDialogOpen} onOpenChange={setIsEditSlotDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 w-[95%] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Available Time Slots</DialogTitle>
            <DialogDescription className="text-sm">
              Modify the available time slots for this date.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTime">Time Slots</Label>
              
              <div className="flex flex-wrap gap-2 mt-1 mb-4">
                {timeSlotOptions.map((time) => (
                  <Badge 
                    key={time} 
                    variant={selectedSlots.includes(time) ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 ${
                      selectedSlots.includes(time) 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "bg-transparent hover:bg-blue-900/20 border-blue-800 text-blue-300"
                    } flex items-center gap-1`}
                    onClick={() => toggleTimeSlot(time)}
                  >
                    {selectedSlots.includes(time) ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {time}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  id="editTime"
                  type="time"
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white flex-1"
                />
                <Button 
                  type="button" 
                  onClick={addTimeToSelectedSlots}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="text-xs border-blue-800 text-blue-400 hover:bg-blue-900/30"
                  onClick={() => {
                    const times = ["09:00", "10:00", "11:00", "12:00"];
                    const uniqueSlots = Array.from(new Set([...selectedSlots, ...times]));
                    setSelectedSlots(uniqueSlots.sort());
                  }}
                >
                  + Morning Hours
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="text-xs border-blue-800 text-blue-400 hover:bg-blue-900/30"
                  onClick={() => {
                    const times = ["13:00", "14:00", "15:00", "16:00"];
                    const uniqueSlots = Array.from(new Set([...selectedSlots, ...times]));
                    setSelectedSlots(uniqueSlots.sort());
                  }}
                >
                  + Afternoon Hours
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="text-xs border-blue-800 text-blue-400 hover:bg-blue-900/30"
                  onClick={() => {
                    const times = ["17:00", "18:00", "19:00"];
                    const uniqueSlots = Array.from(new Set([...selectedSlots, ...times]));
                    setSelectedSlots(uniqueSlots.sort());
                  }}
                >
                  + Evening Hours
                </Button>
              </div>
              
              {selectedSlots.length > 0 ? (
                <div className="mt-3 border border-gray-800 rounded-md p-3 bg-gray-800/50">
                  <div className="flex flex-wrap gap-2 max-w-md">
                    {selectedSlots.map((time) => (
                      <Badge 
                        key={time} 
                        variant="secondary"
                        className="bg-blue-900/30 text-blue-300 border-blue-800 flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" /> 
                        {time}
                        <button 
                          onClick={() => removeTimeFromSelectedSlots(time)}
                          className="ml-1 text-blue-300 hover:text-blue-100 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-sm text-gray-500 bg-gray-800/30 border border-gray-800 rounded-md">
                  <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                  <p>No time slots added yet</p>
                  <p className="text-xs mt-1">Add at least one time slot using the time picker above</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="border-t border-gray-800 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditSlotDialogOpen(false);
                setEditingSlotId(null);
                setSelectedSlots([]);
              }}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTimeSlot} 
              disabled={isUpdatingSlot || selectedSlots.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdatingSlot ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> 
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}