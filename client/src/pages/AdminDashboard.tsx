import { useState, useEffect, useRef, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { format, addMinutes, addDays, isAfter, isBefore, isToday, parseISO } from "date-fns";
import { formatInIST, formatSessionDate } from "../lib/date-utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import AdminTabs from "../components/AdminTabs";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import ManualQRPaymentDialog from "../components/ManualQRPaymentDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { 
  Loader2, LogOut, Link as LinkIcon, Check, AlertCircle, Calendar, 
  CalendarClock, Clock, User, Phone, Mail, Plus, Trash2, Edit, Save,
  X, AlertTriangle, CalendarRange, Video, Search, Ban, ExternalLink,
  SlidersHorizontal, Eye, ChevronDown, UserCheck, UserCog, CalendarIcon,
  Info, Database, Copy, BarChart3, Users, CheckCircle, XCircle,
  History, Activity, UserX, Globe, Timer, Laptop, Smartphone, 
  Clock8, ClockIcon, RefreshCw, Shield, ShieldOff, KeyRound, Lock,
  RefreshCcw, Image as ImageIcon, UserPlus
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { LoadingSpinner } from "../components/ui/loading-spinner";


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
  phoneNumber: string; // Updated from phone to phoneNumber for consistency
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
  orderId?: string; // Payment order ID from Razorpay
  paymentId?: string; // Payment ID from Razorpay once payment is complete
  
  // Razorpay enhanced fields
  razorpayStatus?: string; // Payment status from Razorpay API (captured, authorized, failed, etc.)
  razorpayAmount?: number; // Payment amount from Razorpay API in rupees
  razorpayMethod?: string; // Payment method (card, netbanking, upi, etc.)
  razorpayCreatedAt?: string; // When the payment was created in ISO format
  razorpayCapturedAt?: string; // When the payment was captured in ISO format, if captured
}

interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  profileCompleted: boolean;
  fullName?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  isReturningUser?: boolean;
  loginCount?: number;
}

export default function AdminDashboard() {
  // Get shared resources and utilities
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  
  // Parse URL query parameters for tab
  const searchParams = new URLSearchParams(search);
  const tabParam = searchParams.get("tab");

  // Session management state
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [meetLink, setMeetLink] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Active tab state - Dashboard Summary tab removed
  const [activeTab, setActiveTab] = useState(
    tabParam && ["sessions", "knowledge", "users", "deleted-users"].includes(tabParam) 
      ? tabParam 
      : "sessions"
  );
  
  // Filter state
  const [emailFilter, setEmailFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userSearchFilter, setUserSearchFilter] = useState("");
  
  // User management state will be defined later
  
  // Reschedule session state
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState<Date | undefined>(undefined);
  const [availableRescheduleTimeSlots, setAvailableRescheduleTimeSlots] = useState<string[]>([]);
  const [selectedRescheduleTimeSlot, setSelectedRescheduleTimeSlot] = useState<string>("");
  const [rescheduleDateAvailability, setRescheduleDateAvailability] = useState<{[key: string]: number}>({});
  const [rescheduleDuration, setRescheduleDuration] = useState<number>(0);
  
  // For backward compatibility and transition
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  
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
  
  // View Slots Dialog states
  const [viewSlotsDialogOpen, setViewSlotsDialogOpen] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null);
  const [isAddSlotDialogOpen, setIsAddSlotDialogOpen] = useState(false);
  
  // User login history states
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isUserHistoryDialogOpen, setIsUserHistoryDialogOpen] = useState(false);
  const [isEditSlotDialogOpen, setIsEditSlotDialogOpen] = useState(false);
  
  // User management states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [isManualPaymentDialogOpen, setIsManualPaymentDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
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

  // Check if user is authenticated and is admin
  const { data: userData, isLoading: isAuthLoading } = useQuery({
    queryKey: ["/api/auth/admin-check"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/admin-check");
      return response.json();
    },
    retry: false
  });
  
  // Fetch all users for the user management section
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return response.json();
    },
    // Only fetch users data when on the users tab
    enabled: activeTab === "users",
  });
  
  // Query for deleted users
  const { data: deletedUsersData, isLoading: isDeletedUsersLoading } = useQuery({
    queryKey: ["/api/admin/deleted-users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/deleted-users");
      return response.json();
    },
    // Only fetch deleted users data when on the deleted-users tab
    enabled: activeTab === "deleted-users",
  });
  
  // Fetch all login history
  const { data: loginHistoryData, isLoading: isLoginHistoryLoading } = useQuery({
    queryKey: ["/api/admin/login-history"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/login-history");
      return response.json();
    },
    enabled: activeTab === "users",
  });
  
  // Fetch active sessions
  const { data: activeSessionsData, isLoading: isActiveSessionsLoading } = useQuery({
    queryKey: ["/api/admin/active-sessions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/active-sessions");
      return response.json();
    },
    enabled: activeTab === "users",
    refetchInterval: 60000, // Refresh every 60 seconds
  });
  
  // Define interface for login history response
  interface LoginHistoryResponse {
    loginHistory: {
      id: number;
      userId: number;
      sessionId: string;
      loginTime: string;
      formattedLoginTime: string;
      logoutTime: string | null;
      formattedLogoutTime: string | null;
      lastActiveTime: string | null;
      formattedLastActiveTime: string | null;
      ipAddress: string;
      userAgent: string;
      browser: string;
      os: string;
      device: string;
      duration: number | null;
      isActive: boolean;
    }[];
    totalLogins: number;
  }

  // Fetch specific user login history
  const { data: userLoginHistoryData, isLoading: isUserLoginHistoryLoading } = useQuery<LoginHistoryResponse>({
    queryKey: ["/api/admin/login-history", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return { loginHistory: [], totalLogins: 0 };
      const response = await apiRequest("GET", `/api/admin/login-history/${selectedUserId}`);
      const data = await response.json();
      
      // All endpoints now return a standardized response format
      if (data && data.loginHistory) {
        return data;
      } else {
        console.log(`Unexpected response format from login history endpoint for user ${selectedUserId}`);
        return { loginHistory: [], totalLogins: 0 };
      }
    },
    enabled: !!selectedUserId && isUserHistoryDialogOpen,
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
      queryClient.invalidateQueries({ queryKey: ["/api/project-guidance", "include_razorpay"] });
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
    mutationFn: async () => {
      if (!selectedSession || !selectedRescheduleDate || !selectedRescheduleTimeSlot) {
        return Promise.reject("Please select a date and time for rescheduling");
      }
      
      const reschedulingDate = new Date(selectedRescheduleDate);
      const [hours, minutes] = selectedRescheduleTimeSlot.split(":").map(Number);
      reschedulingDate.setHours(hours, minutes);
      
      const response = await apiRequest("POST", `/api/reschedule-session`, {
        sessionId: selectedSession.id,
        newDate: reschedulingDate.toISOString(),
        duration: rescheduleDuration,
        rescheduledBy: "admin"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-guidance", "include_razorpay"] });
      toast({
        title: "Session rescheduled",
        description: "The session has been rescheduled and the student will be notified."
      });
      
      // Reset states
      setIsRescheduleDialogOpen(false);
      setSelectedRescheduleDate(undefined);
      setSelectedRescheduleTimeSlot("");
      setRescheduleDate("");
      setRescheduleTime("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reschedule session",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/project-guidance", "include_razorpay"] });
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
  
  // Add available dates mutation
  const addAvailableDatesMutation = useMutation({
    mutationFn: async (data: {
      dates: string[],
      timeSlots: string[]
    }) => {
      // Use the admin bulk endpoint to add multiple dates at once
      const response = await apiRequest("POST", "/api/admin/bulk-available-slots", {
        dates: data.dates,
        slots: data.timeSlots
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
      toast({
        title: "Dates added successfully",
        description: "The available dates have been added to the booking system."
      });
      setIsAddSlotDialogOpen(false);
      setBulkMode(false);
      setNewDate("");
      setDateRange({ start: "", end: "" });
      setSelectedSlots([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add dates",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Fetch all available slots for rescheduling
  const fetchAllAvailableSlotsForReschedule = async () => {
    try {
      const response = await apiRequest("GET", "/api/available-slots");
      const data = await response.json();
      
      if (!data || !data.slots || !Array.isArray(data.slots)) {
        return [];
      }
      
      // Track date availability for UI display
      const dateAvailabilityMap: {[key: string]: number} = {};
      const availableDatesList: Date[] = [];
      
      // Process each slot
      data.slots.forEach((slot: any) => {
        if (!slot.slotsWithStatus) return;
        
        // Count available slots for this date
        const availableCount = slot.slotsWithStatus.filter((s: any) => !s.isBooked).length;
        
        if (availableCount > 0) {
          // Add to availability tracking
          dateAvailabilityMap[slot.date] = availableCount;
          
          // Add to available dates list
          const slotDate = new Date(slot.date);
          availableDatesList.push(slotDate);
        }
      });
      
      // Update state
      setRescheduleDateAvailability(dateAvailabilityMap);
      
      // Sort dates chronologically
      availableDatesList.sort((a, b) => a.getTime() - b.getTime());
      
      return data.slots;
    } catch (error) {
      console.error("Failed to fetch available slots for reschedule:", error);
      setRescheduleDateAvailability({});
      return [];
    }
  };
  
  // Fetch available time slots for a specific date when rescheduling
  const fetchAvailableSlotsForReschedule = async (date: Date) => {
    try {
      const formattedDate = formatInIST(date, "yyyy-MM-dd");
      const allSlots = await fetchAllAvailableSlotsForReschedule();
      
      // Find the slot for the selected date
      const dateSlot = allSlots.find((slot: any) => slot.date === formattedDate);
      
      if (dateSlot) {
        // Get only non-booked time slots for this date
        let availableTimes = dateSlot.slotsWithStatus
          .filter((s: any) => !s.isBooked)
          .map((s: any) => s.time)
          // Ensure that we're only showing full-hour slots (remove any :30 time slots)
          .filter((time: string) => time.endsWith(":00"));
        
        // Sort times chronologically
        availableTimes.sort();
        
        setAvailableRescheduleTimeSlots(availableTimes);
        console.log(`Loaded ${availableTimes.length} available full-hour slots for ${formattedDate}`);
      } else {
        // No slots exist for this date
        setAvailableRescheduleTimeSlots([]);
        console.log(`No slots found for date ${formattedDate}`);
      }
    } catch (error) {
      console.error("Failed to fetch slots for reschedule date:", error);
      setAvailableRescheduleTimeSlots([]);
    }
  };
  
  // Update available slots when reschedule date changes
  useEffect(() => {
    if (selectedRescheduleDate) {
      fetchAvailableSlotsForReschedule(selectedRescheduleDate);
    }
  }, [selectedRescheduleDate]);

  // Initialize available slots for reschedule when dialog opens
  useEffect(() => {
    if (isRescheduleDialogOpen) {
      fetchAllAvailableSlotsForReschedule();
      
      // Reset previous selections
      setSelectedRescheduleDate(undefined);
      setSelectedRescheduleTimeSlot("");
      setAvailableRescheduleTimeSlots([]);
      
      // Set duration from selected session, enforcing 60-minute sessions only
      if (selectedSession) {
        // Force 60-minute session duration
        const sessionDuration = 60;
        setRescheduleDuration(sessionDuration);
        console.log(`Setting reschedule duration to ${sessionDuration}min for session ID ${selectedSession.id}`);
      }
    }
  }, [isRescheduleDialogOpen]);
  
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

  // Fetch real session data from the API with enhanced Razorpay payment details
  const { data: sessionsData, isLoading: isSessionsLoading } = useQuery({
    queryKey: ["/api/project-guidance", "include_razorpay"],
    queryFn: async () => {
      // Include Razorpay data to enhance sessions with payment details
      const response = await apiRequest("GET", "/api/project-guidance?include_razorpay=true");
      const data = await response.json();
      console.log("Fetched sessions data:", data);
      // Enhanced debugging
      if (data && data.length > 0) {
        console.log("PAYMENT DEBUG - First session data:", JSON.stringify(data[0], null, 2));
        console.log("PAYMENT DEBUG - Payment ID exists?", data.some(s => s.paymentId));
        console.log("PAYMENT DEBUG - Order ID exists?", data.some(s => s.orderId));
        console.log("PAYMENT DEBUG - Razorpay Status exists?", data.some(s => s.razorpayStatus));
        if (data.some(s => s.razorpayStatus)) {
          const statusTypes = [...new Set(data.filter(s => s.razorpayStatus).map(s => s.razorpayStatus))];
          console.log("PAYMENT DEBUG - Available Razorpay status types:", statusTypes);
        }
        console.log("PAYMENT DEBUG - Session data keys:", Object.keys(data[0]));
        
        // Count how many sessions have payment IDs and order IDs
        const sessionsWithPaymentId = data.filter(s => s.paymentId).length;
        const sessionsWithOrderId = data.filter(s => s.orderId).length;
        console.log(`PAYMENT DEBUG - Sessions with payment ID: ${sessionsWithPaymentId}/${data.length}`);
        console.log(`PAYMENT DEBUG - Sessions with order ID: ${sessionsWithOrderId}/${data.length}`);
        
        // Log all paymentIds to see if any exist
        const paymentIds = data.map(s => s.paymentId).filter(Boolean);
        console.log("PAYMENT DEBUG - All payment IDs:", paymentIds);
        const orderIds = data.map(s => s.orderId).filter(Boolean);
        console.log("PAYMENT DEBUG - All order IDs:", orderIds);
        
        // Log first 3 sessions with their payment details for debugging
        console.log("PAYMENT DEBUG - First 3 sessions:", data.slice(0, 3).map(s => ({
          id: s.id,
          studentName: s.studentName,
          paymentId: s.paymentId || "null", 
          orderId: s.orderId || "null",
          status: s.status,
          paymentConfirmed: s.paymentConfirmed
        })));
      }
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
      
      // Use our specialized session date formatter for accurate display
      const formattedDate = formatSessionDate(sessionDate, 'MMM d, yyyy');
      const formattedTime = formatSessionDate(sessionDate, 'HH:mm');
      
      // Also get direct format for comparison
      const directFormattedDate = format(sessionDate, 'MMM d, yyyy');
      const directFormattedTime = format(sessionDate, 'HH:mm');
      
      console.log(`Session ${session.id} date:
        - Database UTC time: ${session.date}
        - Direct format: ${directFormattedDate} ${directFormattedTime}
        - With IST conversion: ${formattedDate} ${formattedTime}
      `);
      
      return {
        id: session.id,
        formattedDate,
        formattedTime,
        date: session.date,
        email: session.email,
        phoneNumber: session.phone, // Note: field is 'phone' in database, not 'phoneNumber'
        topic: session.topic,
        notes: session.notes || "",
        duration: session.duration,
        paymentStatus: session.paymentConfirmed ? "Paid" : "Pending",
        studentName: session.studentName,
        status: session.status || "pending",
        googleMeetLink: session.googleMeetLink,
        isStudent: session.isStudent !== undefined ? session.isStudent : true,
        originalDate: session.originalDate,
        rescheduledBy: session.rescheduledBy,
        paymentId: session.paymentId || null,
        orderId: session.orderId || null
      };
    });
  }, [sessionsData]);

  // Split sessions into categories
  // New category: Failed/Unpaid Payment Sessions
  const failedPaymentSessions = applyFilters(sessions.filter((s: Session) => 
    s.status !== 'cancelled' && 
    s.status !== 'completed' && 
    s.paymentStatus === 'Pending' && 
    ((s.razorpayStatus === 'failed' || s.razorpayStatus === null) || 
     (s.razorpayStatus === 'created' && new Date(s.date) < new Date()))));
    
  const pendingSessions = applyFilters(sessions.filter((s: Session) => 
    s.status !== 'cancelled' && 
    s.status !== 'completed' && 
    !s.googleMeetLink && 
    !failedPaymentSessions.some(f => f.id === s.id)));
    
  const upcomingSessions = applyFilters(sessions.filter((s: Session) => 
    s.status !== 'cancelled' && 
    s.status !== 'completed' && 
    s.googleMeetLink));
    
  const completedSessions = applyFilters(sessions.filter((s: Session) => 
    s.status === 'completed'));
    
  const cancelledSessions = applyFilters(sessions.filter((s: Session) => 
    s.status === 'cancelled'));
    
  // User management functions
  const users = usersData || [];
  const currentUser = userData?.user || null;

  // Function to handle editing a user
  // This function is kept for historical reasons but no longer used in the UI
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserDialogOpen(true);
  };
  
  // Function to handle deleting a user (with confirmation dialog)
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteReason("");
    setIsDeleteUserDialogOpen(true);
  };

  // Function to handle toggling admin status
  const handleToggleAdminStatus = (user: User) => {
    if (confirm(`Are you sure you want to ${user.role === 'admin' ? 'remove' : 'grant'} admin privileges for ${user.email}?`)) {
      toggleAdminMutation.mutate({
        userId: user.id,
        makeAdmin: user.role !== 'admin'
      });
    }
  };

  // Function to handle resetting a user's password
  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setIsResetPasswordDialogOpen(true);
  };

  // Mutation for resetting a user's password
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number, newPassword: string }) => {
      const response = await apiRequest("POST", `/api/admin/reset-password/${userId}`, {
        newPassword
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: `Password has been reset for ${selectedUser?.email}`,
      });
      setIsResetPasswordDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reset password",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation for deleting a user (soft delete with 30-day retention)
  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number, reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/delete`, {
        reason
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: `User ${selectedUser?.email} has been moved to the deleted users list and will be permanently removed after 30 days.`,
      });
      setIsDeleteUserDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deleted-users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete user",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Restore deleted user mutation
  const restoreUserMutation = useMutation({
    mutationFn: async (deletedUserId: number) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/deleted-users/${deletedUserId}/restore`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to restore user");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate cache to refetch users
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deleted-users"] });
      
      toast({
        title: "User restored successfully",
        description: "The user has been restored and can now log in again.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error restoring user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Purge expired deleted users mutation
  const purgeExpiredUsersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/admin/deleted-users/purge-expired"
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to purge expired users");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate cache to refetch deleted users
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deleted-users"] });
      
      toast({
        title: "Expired users purged",
        description: `${data.purgedCount} expired users have been permanently deleted.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error purging expired users",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for toggling admin status
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: number, makeAdmin: boolean }) => {
      const response = await apiRequest("POST", `/api/admin/toggle-admin/${userId}`, {
        makeAdmin
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Admin Status Updated",
        description: "User permissions have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update admin status",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Function to refetch users data
  const refetchUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
  };

  // Loading states
  const isLoadingUsers = isUsersLoading;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Helmet>
        <title>Admin Dashboard | BambooMade</title>
        <meta name="description" content="Admin dashboard for session management" />
      </Helmet>
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Page header outside of tabs so it's visible on all tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        </div>
        
        {/* AdminTabs component now below the header */}
        <AdminTabs 
          value={activeTab}
          onTabChange={(value) => {
            // Update component state
            setActiveTab(value);
            
            // Update URL when tab changes without full page reload
            const newSearchParams = new URLSearchParams(search);
            newSearchParams.set("tab", value);
            setLocation(`/admin-dashboard?${newSearchParams.toString()}`, { replace: true });
          }}
        >
          {/* Sessions Tab - Contains session management */}
          <TabsContent value="sessions" className="space-y-4">
        
            {/* Stats summary only shown on Sessions tab */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-5 mb-6 sm:mb-8">
              <Card className="bg-gray-900/70 border-gray-800 shadow-md hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base text-gray-100">Total Sessions</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                  <p className="text-xl sm:text-3xl font-bold text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                    {sessions.length}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-950/60 border-orange-900/60 shadow-md hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base text-orange-100">Failed Payments</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                  <p className="text-xl sm:text-3xl font-bold text-orange-200 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-orange-400/70" />
                    {failedPaymentSessions.length}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-amber-900/30 border-amber-800/60 shadow-md hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base text-amber-100">Pending</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                  <p className="text-xl sm:text-3xl font-bold text-amber-200 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-amber-400/70" />
                    {pendingSessions.length}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-green-900/30 border-green-800/60 shadow-md hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base text-green-100">Upcoming</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                  <p className="text-xl sm:text-3xl font-bold text-green-200 flex items-center">
                    <CalendarClock className="w-5 h-5 mr-2 text-green-400/70" />
                    {upcomingSessions.length}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-red-900/30 border-red-800/60 shadow-md hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base text-red-100">Cancelled</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 py-1 sm:py-2">
                  <p className="text-xl sm:text-3xl font-bold text-red-200 flex items-center">
                    <XCircle className="w-5 h-5 mr-2 text-red-400/70" />
                    {cancelledSessions.length}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Tabs 
              defaultValue={tabParam && ["failed-payments", "pending", "upcoming", "completed", "cancelled", "all", "availability"].includes(tabParam) 
                ? tabParam 
                : "failed-payments"} 
              className="space-y-4"
              onValueChange={(value: string) => {
                // Update URL when inner tab changes without full page reload
                const newSearchParams = new URLSearchParams(search);
                newSearchParams.set("tab", value);
                setLocation(`/admin-dashboard?${newSearchParams.toString()}`, { replace: true });
              }}
            >
              <div className="relative overflow-x-auto pb-2">
                <TabsList className="bg-gray-800/80 border border-gray-700 rounded-md shadow-md w-full flex flex-wrap sm:flex-nowrap overflow-x-auto">
                  <TabsTrigger 
                    value="failed-payments" 
                    className="flex-1 data-[state=active]:bg-orange-700/90 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200"
                  >
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                    Failed Payments ({failedPaymentSessions.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pending" 
                    className="flex-1 data-[state=active]:bg-amber-600/90 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200"
                  >
                    <Clock className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                    Pending ({pendingSessions.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upcoming" 
                    className="flex-1 data-[state=active]:bg-cyan-600/90 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200"
                  >
                    <CalendarClock className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                    Upcoming ({upcomingSessions.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completed" 
                    className="flex-1 data-[state=active]:bg-green-600/90 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                    Completed ({completedSessions.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="cancelled" 
                    className="flex-1 data-[state=active]:bg-red-600/90 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                    Cancelled ({cancelledSessions.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="all" 
                    className="flex-1 data-[state=active]:bg-gray-700/90 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200"
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                    All Sessions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="availability" 
                    className="flex-1 data-[state=active]:bg-purple-600/90 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200"
                  >
                    <CalendarRange className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                    Availability
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Session management tabs */}
              {["failed-payments", "pending", "upcoming", "completed", "cancelled", "all"].map((tab) => {
                let displaySessions;
                let emptyMessage = "";
                
                switch (tab) {
                  case "failed-payments":
                    displaySessions = failedPaymentSessions;
                    emptyMessage = "No failed or unpaid payment sessions found.";
                    break;
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
                        {/* Debug info for payment IDs and order IDs */}
                        {tab === "all" && (
                          <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-md text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <Info className="h-4 w-4 text-blue-400" />
                              <span className="font-medium text-blue-300">Payment Data Debug</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <span className="text-gray-400">Sessions with Payment ID:</span>{" "}
                                <span className="font-mono text-green-400">
                                  {displaySessions.filter(s => s.paymentId).length}/{displaySessions.length}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Sessions with Order ID:</span>{" "}
                                <span className="font-mono text-amber-400">
                                  {displaySessions.filter(s => s.orderId).length}/{displaySessions.length}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Sessions with Razorpay Status:</span>{" "}
                                <span className="font-mono text-purple-400">
                                  {displaySessions.filter(s => s.razorpayStatus).length}/{displaySessions.length}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Sessions with Payment Method:</span>{" "}
                                <span className="font-mono text-blue-400">
                                  {displaySessions.filter(s => s.razorpayMethod).length}/{displaySessions.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
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
                                <TableHead className="text-gray-300">Payment ID</TableHead>
                                <TableHead className="text-gray-300">Order ID</TableHead>
                                <TableHead className="text-gray-300 hidden lg:table-cell">Razorpay Status</TableHead>
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
                                    <div className="flex flex-col space-y-1 mt-1 sm:hidden">
                                      <div className="flex items-center text-xs text-gray-300">
                                        <Mail className="w-3 h-3 mr-1" /> 
                                        <span className="max-w-[80px] truncate" title={session.email}>
                                          {session.email}
                                        </span>
                                        {/* Check if other sessions with same email have different names (mobile) */}
                                        {activeSessionsData && 
                                         activeSessionsData.some((s: any) => 
                                           s.email === session.email && 
                                           s.studentName !== session.studentName &&
                                           s.id !== session.id
                                         ) && (
                                          <Badge 
                                            variant="outline" 
                                            className="ml-1 text-[8px] h-3 px-1 bg-amber-950/50 text-amber-300 border-amber-800"
                                          >
                                            Shared
                                          </Badge>
                                        )}
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="ml-1 h-5 w-5 p-0 text-gray-400 hover:text-white"
                                          onClick={() => {
                                            navigator.clipboard.writeText(session.email);
                                            toast({
                                              title: "Copied!",
                                              description: "Email copied to clipboard",
                                              variant: "default",
                                            });
                                          }}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <div className="flex items-center text-xs text-gray-300">
                                        <Phone className="w-3 h-3 mr-1" /> {session.phoneNumber}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                    <div className="flex flex-col space-y-1">
                                      <div className="flex items-center text-xs text-gray-300">
                                        <Mail className="w-3 h-3 mr-1" /> 
                                        <span className="max-w-[120px] truncate" title={session.email}>
                                          {session.email}
                                        </span>
                                        {/* Check if other sessions with same email have different names */}
                                        {activeSessionsData && 
                                         activeSessionsData.some((s: any) => 
                                           s.email === session.email && 
                                           s.studentName !== session.studentName &&
                                           s.id !== session.id
                                         ) && (
                                          <Badge 
                                            variant="outline" 
                                            className="ml-2 text-[10px] h-4 px-1 bg-amber-950/50 text-amber-300 border-amber-800"
                                          >
                                            Shared Email
                                          </Badge>
                                        )}
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="ml-1 h-5 w-5 p-0 text-gray-400 hover:text-white"
                                          onClick={() => {
                                            navigator.clipboard.writeText(session.email);
                                            toast({
                                              title: "Copied!",
                                              description: "Email copied to clipboard",
                                              variant: "default",
                                            });
                                          }}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <div className="flex items-center text-xs text-gray-300">
                                        <Phone className="w-3 h-3 mr-1" /> {session.phoneNumber}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {/* Current session date/time (highlighted) */}
                                    <div className="flex flex-col gap-1 mb-1">
                                      <div className="flex items-center text-xs sm:text-sm font-medium text-white bg-gray-800 px-2 py-1 rounded-md">
                                        <Calendar className="w-3 h-3 mr-1 sm:w-3.5 sm:h-3.5 sm:mr-1.5 text-green-400" /> 
                                        <span className="truncate">
                                          {format(new Date(session.date), 'MMM d, yyyy')}
                                        </span>
                                      </div>
                                      <div className="flex items-center text-xs sm:text-sm font-medium text-white bg-gray-800 px-2 py-1 rounded-md">
                                        <Clock className="w-3 h-3 mr-1 sm:w-3.5 sm:h-3.5 sm:mr-1.5 text-green-400" /> {format(new Date(session.date), 'HH:mm')}
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
                                    {session.paymentStatus === 'paid' ? (
                                      <Badge className="bg-green-600/20 text-green-400 border-green-800 hover:bg-green-600/30">
                                        <CheckCircle className="w-3 h-3 mr-1.5" />
                                        Confirmed
                                      </Badge>
                                    ) : session.paymentStatus === 'pending' ? (
                                      <div className="flex flex-col gap-1">
                                        <Badge className="bg-amber-600/20 text-amber-400 border-amber-800 hover:bg-amber-600/30">
                                          <Clock className="w-3 h-3 mr-1.5" />
                                          Pending
                                        </Badge>
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          className="whitespace-nowrap h-7 text-xs px-2 border-green-700/50 text-green-400 hover:text-green-300 hover:bg-green-950/30 hover:border-green-700"
                                          onClick={() => {
                                            setSelectedSession(session);
                                            // Open manual payment verification dialog
                                            setIsManualPaymentDialogOpen(true);
                                          }}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" /> 
                                          <span>Verify Payment</span>
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-1">
                                        <Badge className="bg-red-600/20 text-red-400 border-red-800 hover:bg-red-600/30">
                                          <XCircle className="w-3 h-3 mr-1.5" />
                                          Not Paid
                                        </Badge>
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          className="whitespace-nowrap h-7 text-xs px-2 border-green-700/50 text-green-400 hover:text-green-300 hover:bg-green-950/30 hover:border-green-700"
                                          onClick={() => {
                                            setSelectedSession(session);
                                            // Open manual payment verification dialog
                                            setIsManualPaymentDialogOpen(true);
                                          }}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" /> 
                                          <span>Mark as Paid</span>
                                        </Button>
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-mono text-xs">
                                      {session.paymentId ? (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex items-center gap-2">
                                                <span className="text-green-400 max-w-[100px] truncate" title={session.paymentId}>
                                                  {session.paymentId}
                                                </span>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-5 w-5 p-0 text-gray-400 hover:text-white"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(session.paymentId || "");
                                                    toast({
                                                      title: "Copied!",
                                                      description: "Payment ID copied to clipboard",
                                                      variant: "default",
                                                    });
                                                  }}
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <div className="max-w-xs">
                                                <p className="font-semibold">Razorpay Payment ID</p>
                                                <p className="text-xs mt-1 break-all font-mono">{session.paymentId}</p>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ) : (
                                        <span className="text-gray-500">—</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-mono text-xs">
                                      {session.orderId ? (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex items-center gap-2">
                                                <span className="text-amber-400 max-w-[100px] truncate" title={session.orderId}>
                                                  {session.orderId}
                                                </span>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-5 w-5 p-0 text-gray-400 hover:text-white"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(session.orderId || "");
                                                    toast({
                                                      title: "Copied!",
                                                      description: "Order ID copied to clipboard",
                                                      variant: "default",
                                                    });
                                                  }}
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <div className="max-w-xs">
                                                <p className="font-semibold">Razorpay Order ID</p>
                                                <p className="text-xs mt-1 break-all font-mono">{session.orderId}</p>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ) : (
                                        <span className="text-gray-500">—</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell">
                                    {session.razorpayStatus ? (
                                      <div className="flex flex-col gap-1">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Badge
                                                className={`
                                                  ${session.razorpayStatus === 'captured' ? 'bg-green-900/50 text-green-300 border-green-800' : ''}
                                                  ${session.razorpayStatus === 'authorized' ? 'bg-blue-900/50 text-blue-300 border-blue-800' : ''}
                                                  ${session.razorpayStatus === 'created' ? 'bg-yellow-900/50 text-yellow-300 border-yellow-800' : ''}
                                                  ${session.razorpayStatus === 'failed' ? 'bg-red-900/50 text-red-300 border-red-800' : ''}
                                                  ${session.razorpayStatus === 'refunded' ? 'bg-purple-900/50 text-purple-300 border-purple-800' : ''}
                                                  cursor-help
                                                `}
                                              >
                                                {session.razorpayStatus}
                                              </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <div className="max-w-xs">
                                                <p className="font-semibold">Razorpay Payment Status</p>
                                                <p className="text-xs mt-1">
                                                  {session.razorpayStatus === 'captured' && 'Payment has been received and credited to your account.'}
                                                  {session.razorpayStatus === 'authorized' && 'Payment is authorized but not yet captured to your account.'}
                                                  {session.razorpayStatus === 'created' && 'Payment process has been initiated but not completed yet.'}
                                                  {session.razorpayStatus === 'failed' && 'Payment was attempted but did not complete successfully.'}
                                                  {session.razorpayStatus === 'refunded' && 'Payment was refunded back to the customer.'}
                                                </p>
                                                {session.razorpayCreatedAt && (
                                                  <div className="mt-2 text-xs">
                                                    <span className="opacity-80">Created:</span> {new Date(session.razorpayCreatedAt).toLocaleString('en-IN')}
                                                  </div>
                                                )}
                                                {session.razorpayCapturedAt && (
                                                  <div className="text-xs">
                                                    <span className="opacity-80">Captured:</span> {new Date(session.razorpayCapturedAt).toLocaleString('en-IN')}
                                                  </div>
                                                )}
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        
                                        {session.razorpayMethod && (
                                          <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <span className="text-amber-400 font-medium capitalize">{session.razorpayMethod}</span>
                                            {session.razorpayCapturedAt && (
                                              <span>
                                                • {new Date(session.razorpayCapturedAt).toLocaleDateString('en-IN')}
                                              </span>
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-500 text-xs">Not available</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-2">
                                      {session.googleMeetLink ? (
                                        <div className="flex gap-2">
                                          <Button 
                                            size="sm"
                                            className="whitespace-nowrap bg-green-600 hover:bg-green-700 h-8 text-xs px-2 sm:text-sm sm:px-3"
                                            onClick={() => {
                                              // Ensure URL has protocol prefix for proper browser opening
                                              let meetUrl = session.googleMeetLink;
                                              if (meetUrl && !meetUrl.startsWith('http')) {
                                                meetUrl = 'https://' + meetUrl;
                                              }
                                              window.open(meetUrl, '_blank', 'noopener,noreferrer');
                                            }}
                                          >
                                            <Video className="w-3.5 h-3.5 mr-1.5" /> 
                                            <span className="hidden sm:inline">Open Meet</span>
                                            <span className="sm:hidden">Meet</span>
                                          </Button>
                                          <Button 
                                            size="sm"
                                            className="whitespace-nowrap bg-gray-600 hover:bg-gray-700 h-8 text-xs px-2 sm:text-sm sm:px-3"
                                            onClick={() => {
                                              navigator.clipboard.writeText(session.googleMeetLink || "");
                                              toast({
                                                title: "Link copied",
                                                description: "Google Meet link copied to clipboard"
                                              });
                                            }}
                                          >
                                            <Copy className="w-3.5 h-3.5 mr-1.5" /> 
                                            <span className="hidden sm:inline">Copy Link</span>
                                            <span className="sm:hidden">Copy</span>
                                          </Button>
                                        </div>
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
          
          {/* User Management tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage user accounts and permissions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Loading state
                  if (isUsersLoading) {
                    return (
                      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
                        <Loader2 className="h-12 w-12 text-purple-500 mx-auto mb-4 animate-spin" />
                        <h3 className="text-lg font-medium mb-2">Loading Users</h3>
                        <p className="text-muted-foreground mb-6">
                          Please wait while we fetch the user data...
                        </p>
                      </div>
                    );
                  }
                  
                  // No users state
                  if (!usersData || usersData.length === 0) {
                    return (
                      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
                        <Users className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Users Found</h3>
                        <p className="text-muted-foreground mb-6">
                          No registered users were found in the system.
                        </p>
                        <Button
                          variant="outline"
                          className="border-purple-800 text-purple-400 hover:bg-purple-950/50"
                          onClick={() => setLocation("/admin")}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Go to Legacy Admin Page
                        </Button>
                      </div>
                    );
                  }
                  
                  // Users found - filter them
                  const filteredUsers = usersData.filter(user => {
                    if (!userSearchFilter) return true;
                    const searchTerm = userSearchFilter.toLowerCase();
                    return (
                      user.email?.toLowerCase().includes(searchTerm) ||
                      user.username?.toLowerCase().includes(searchTerm) ||
                      user.fullName?.toLowerCase().includes(searchTerm)
                    );
                  });
                  
                  // Display users table
                  return (
                    <div className="bg-gray-900/90 rounded-lg border border-gray-700 shadow-md">
                      <div className="p-5 border-b border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="text-lg font-medium mb-1 flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-400" />
                            Registered Users
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            <span className={userSearchFilter ? "text-purple-300" : "text-gray-400"}>
                              {userSearchFilter 
                                ? `Showing ${filteredUsers.length} of ${usersData.length} registered users` 
                                : `Showing all ${usersData.length} registered users`}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              type="search"
                              placeholder="Search by email or username..."
                              className="pl-10 bg-gray-800/90 border-gray-700 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors"
                              value={userSearchFilter}
                              onChange={(e) => setUserSearchFilter(e.target.value)}
                            />
                          </div>
                          <Badge variant="outline" className="bg-purple-900/30 text-purple-300 border-purple-700 shadow-sm">
                            {filteredUsers.length} / {usersData.length} Users
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <Table className="border-collapse border-spacing-0">
                          <TableHeader>
                            <TableRow className="border-b border-gray-800 bg-gray-900/50">
                              <TableHead className="text-purple-200 font-medium text-sm py-3">User ID</TableHead>
                              <TableHead className="text-purple-200 font-medium text-sm py-3">Email</TableHead>
                              <TableHead className="text-purple-200 font-medium text-sm py-3">Username</TableHead>
                              <TableHead className="text-purple-200 font-medium text-sm py-3">Full Name</TableHead>
                              <TableHead className="text-purple-200 font-medium text-sm py-3">Role</TableHead>
                              <TableHead className="text-purple-200 font-medium text-sm py-3">Verified</TableHead>
                              <TableHead className="text-purple-200 font-medium text-sm py-3 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((user) => (
                              <TableRow key={user.id} className="hover:bg-gray-800/40 border-b border-gray-800/50 transition-colors">
                                <TableCell className="font-mono text-sm text-gray-400">{user.id}</TableCell>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.fullName || <span className="text-gray-500 italic">Not provided</span>}</TableCell>
                                <TableCell>
                                  {user.isAdmin ? (
                                    <Badge className="bg-purple-900/50 text-purple-200 border-purple-800 shadow-sm">
                                      <UserCog className="w-3 h-3 mr-1.5" />
                                      Admin
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-blue-900/50 text-blue-200 border-blue-800 shadow-sm">
                                      <User className="w-3 h-3 mr-1.5" />
                                      {user.role || "User"}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {user.isVerified ? (
                                    <Badge className="bg-green-900/50 text-green-200 border-green-800 shadow-sm">
                                      <CheckCircle className="w-3 h-3 mr-1.5" />
                                      Verified
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-yellow-900/30 text-yellow-200 border-yellow-800 shadow-sm">
                                      <AlertCircle className="w-3 h-3 mr-1.5" /> 
                                      Pending
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-purple-900/30 text-purple-300"
                                    onClick={() => {
                                      setSelectedUserId(user.id);
                                      setIsUserHistoryDialogOpen(true);
                                    }}
                                  >
                                    <History className="w-4 h-4 mr-2" />
                                    Login History
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  );
                })()}
              </CardContent>
            </Card>
            
            {/* Active Sessions Card */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-400" />
                      Active User Sessions
                    </CardTitle>
                    <CardDescription>
                      Currently active user sessions across all deployments
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Loading state
                  if (isActiveSessionsLoading) {
                    return (
                      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
                        <Loader2 className="h-12 w-12 text-green-500 mx-auto mb-4 animate-spin" />
                        <h3 className="text-lg font-medium mb-2">Loading Active Sessions</h3>
                        <p className="text-muted-foreground mb-6">
                          Please wait while we fetch current session data...
                        </p>
                      </div>
                    );
                  }
                  
                  // No active sessions state
                  if (!activeSessionsData || activeSessionsData.length === 0) {
                    return (
                      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
                        <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Active Sessions</h3>
                        <p className="text-muted-foreground mb-6">
                          There are no active user sessions right now.
                        </p>
                      </div>
                    );
                  }
                  
                  // Display active sessions
                  return (
                    <div className="bg-gray-900/90 rounded-lg border border-gray-700 shadow-md">
                      <div className="p-5 border-b border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="text-lg font-medium mb-1 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-green-400" />
                            Live User Activity
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            <span className="text-green-300">{activeSessionsData.length} active users</span> currently using the system
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-900/30 text-green-200 border-green-800 shadow-sm">
                            <Activity className="w-3 h-3 mr-1.5" />
                            Auto-refreshing
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <Table className="border-collapse border-spacing-0">
                          <TableHeader>
                            <TableRow className="border-b border-gray-800 bg-gray-900/50">
                              <TableHead className="text-green-200 font-medium text-sm py-3">User</TableHead>
                              <TableHead className="text-green-200 font-medium text-sm py-3">Device Info</TableHead>
                              <TableHead className="text-green-200 font-medium text-sm py-3">Login Time</TableHead>
                              <TableHead className="text-green-200 font-medium text-sm py-3">Last Active</TableHead>
                              <TableHead className="text-green-200 font-medium text-sm py-3">Session Duration</TableHead>
                              <TableHead className="text-green-200 font-medium text-sm py-3">Idle Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeSessionsData.map((session) => (
                              <TableRow key={session.id} className="hover:bg-gray-800/40 border-b border-gray-800/50 transition-colors">
                                <TableCell>
                                  <div className="font-medium">{session.userEmail}</div>
                                  <div className="text-xs text-gray-400">User ID: {session.userId}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    {session.deviceType === 'mobile' ? (
                                      <Smartphone className="h-4 w-4 text-blue-400" />
                                    ) : (
                                      <Laptop className="h-4 w-4 text-purple-400" />
                                    )}
                                    <span className="text-sm">{session.browser || 'Unknown'} on {session.os || 'Unknown'}</span>
                                  </div>
                                  <div className="text-xs text-gray-400">IP: {session.ipAddress || 'Unknown'}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-mono text-sm">{session.formattedLoginTime}</div>
                                </TableCell>
                                <TableCell>
                                  {session.formattedLastActiveTime ? (
                                    <div className="font-mono text-sm">{session.formattedLastActiveTime}</div>
                                  ) : (
                                    <span className="text-gray-500 italic text-sm">No activity</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-blue-900/30 border-blue-800">
                                    <Clock className="w-3 h-3 mr-1.5" />
                                    {session.activeDuration} min
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {session.idleTime > 10 ? (
                                    <Badge className="bg-yellow-900/30 border-yellow-800">
                                      <Clock8 className="w-3 h-3 mr-1.5" />
                                      {session.idleTime} min
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-900/30 border-green-800">
                                      <Activity className="w-3 h-3 mr-1.5" />
                                      Active
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
          
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
                    onClick={() => setIsAddSlotDialogOpen(true)}
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
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="ml-auto"
                              onClick={() => {
                                // Open dialog to view slots for this date
                                setSelectedSlotDate(date);
                                setViewSlotsDialogOpen(true);
                              }}
                            >
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
          </TabsContent>
          
          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mr-2">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="w-3 h-3 text-primary-foreground"
                    >
                      <path d="M21 12.5c0 .3-.1.6-.2.9"></path>
                      <path d="M14 19.5c-.4 0-.8-.1-1.2-.3"></path>
                      <path d="M3 13l0-.3c0-3.3 2.7-6 6-6 1.6 0 3.1.6 4.2 1.8"></path>
                      <path d="M13 22H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"></path>
                      <path d="M18 22a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path>
                      <path d="m16.5 19 3-3"></path>
                      <path d="M7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
                    </svg>
                  </div>
                  <div>
                    <CardTitle>AI Knowledge Management</CardTitle>
                    <CardDescription>
                      Manage the AI knowledge base content for the chatbot
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Button 
                    onClick={() => setLocation("/ai-knowledge-management")}
                    className="bg-green-700 hover:bg-green-800"
                  >
                    <Database className="w-4 h-4 mr-2" /> Go to Knowledge Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-xl font-bold">User Management</CardTitle>
                  <CardDescription>
                    Manage users and their permissions
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetchUsers()}
                  className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-md border border-gray-800 overflow-hidden">
                      <Table className="w-full">
                        <TableHeader className="bg-gray-800">
                          <TableRow className="hover:bg-gray-800/50 border-gray-700">
                            <TableHead className="text-gray-300">User</TableHead>
                            <TableHead className="text-gray-300">Contact Info</TableHead>
                            <TableHead className="text-gray-300">Role</TableHead>
                            <TableHead className="text-gray-300">Status</TableHead>
                            <TableHead className="text-gray-300">User Type</TableHead>
                            <TableHead className="text-gray-300 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users?.map((user) => (
                            <TableRow key={user.id} className="hover:bg-gray-800/50 border-gray-700">
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white overflow-hidden border border-amber-500/40">
                                    {user.profileImageUrl ? (
                                      <img 
                                        src={user.profileImageUrl} 
                                        alt={`${user.username || 'User'}'s profile`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      user.username ? user.username.charAt(0).toUpperCase() : '?'
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    {user.fullName && (
                                      <span className="font-medium text-amber-400">
                                        {user.fullName}
                                      </span>
                                    )}
                                    <span>{user.username}</span>
                                    <span className="text-xs text-gray-500">ID: {user.id}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                    <span>{user.email}</span>
                                  </div>
                                  {user.phoneNumber && (
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                                      <span>{user.phoneNumber}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={user.role === 'admin' ? 'destructive' : 'outline'} 
                                  className={user.role === 'admin' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-300'}
                                >
                                  {user.role === 'admin' ? 'Admin' : 'User'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1.5">
                                  <Badge 
                                    variant={user.isVerified ? 'default' : 'outline'} 
                                    className={user.isVerified ? 'bg-green-800 text-white' : 'bg-gray-800 text-gray-300'}
                                  >
                                    {user.isVerified ? 'Verified' : 'Unverified'}
                                  </Badge>
                                  
                                  <Badge
                                    variant={user.profileCompleted ? 'default' : 'outline'}
                                    className={user.profileCompleted ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-300'}
                                  >
                                    {user.profileCompleted ? 'Complete' : 'Incomplete'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1.5">
                                  {user.isReturningUser ? (
                                    <Badge 
                                      variant="default"
                                      className="bg-amber-700 text-white flex items-center"
                                    >
                                      <History className="h-3 w-3 mr-1" />
                                      Returning User {user.loginCount && `(${user.loginCount})`}
                                    </Badge>
                                  ) : (
                                    <Badge 
                                      variant="outline"
                                      className="bg-gray-800 text-gray-300 flex items-center"
                                    >
                                      <UserPlus className="h-3 w-3 mr-1" />
                                      New User
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 border-gray-700 hover:bg-gray-800 text-blue-400"
                                    onClick={() => window.location.href = `/user-profile/${user.id}`}
                                  >
                                    <User className="h-3.5 w-3.5 mr-1" />
                                    View Profile
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 border-red-700 hover:bg-red-900/40 text-red-400"
                                    onClick={() => handleDeleteUser(user)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Delete
                                  </Button>
                                  {currentUser?.email === 'info@bamboomade.in' && user.email !== 'info@bamboomade.in' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className={`h-8 ${user.role === 'admin' ? 'border-red-700 text-red-400 hover:bg-red-900/30' : 'border-green-700 text-green-400 hover:bg-green-900/30'}`}
                                      onClick={() => handleToggleAdminStatus(user)}
                                    >
                                      {user.role === 'admin' ? (
                                        <>
                                          <ShieldOff className="h-3.5 w-3.5 mr-1" />
                                          Remove Admin
                                        </>
                                      ) : (
                                        <>
                                          <Shield className="h-3.5 w-3.5 mr-1" />
                                          Make Admin
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  {currentUser?.email === 'info@bamboomade.in' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 border-gray-700 hover:bg-gray-800 text-amber-400"
                                      onClick={() => handleResetPassword(user)}
                                    >
                                      <KeyRound className="h-3.5 w-3.5 mr-1" />
                                      Reset Password
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!users || users.length === 0) && (
                            <TableRow className="hover:bg-gray-800/50 border-gray-700">
                              <TableCell colSpan={5} className="text-center py-6 text-gray-400">
                                No users found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-md p-4 border border-gray-700">
                      <h3 className="text-lg font-semibold mb-3 text-white">Admin Permissions</h3>
                      <p className="text-gray-300 text-sm mb-2">
                        <span className="text-amber-400 font-medium">info@bamboomade.in</span> has super-admin privileges to:
                      </p>
                      <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2">
                        <li>Grant or remove admin rights to other users</li>
                        <li>Reset any user's password</li>
                        <li>Access all system features and data</li>
                      </ul>
                      <div className="mt-4 p-3 bg-gray-900 rounded-md border border-gray-700">
                        <p className="text-xs text-gray-400">
                          Note: Regular admin users can manage content and sessions, but only <span className="text-amber-400 font-medium">info@bamboomade.in</span> can manage other admins.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Summary Tab has been completely removed */}
        </AdminTabs>
        
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
                <div className="flex gap-2">
                  <Input
                    id="meet-link"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    value={meetLink}
                    onChange={(e) => setMeetLink(e.target.value)}
                    className="bg-gray-800 border-gray-700 flex-grow"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-gray-700 text-gray-300 whitespace-nowrap"
                    onClick={() => {
                      if (meetLink) {
                        navigator.clipboard.writeText(meetLink);
                        toast({
                          title: "Copied!",
                          description: "Link copied to clipboard",
                          variant: "default",
                        });
                      }
                    }}
                    disabled={!meetLink}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                  </Button>
                </div>
                {selectedSession?.googleMeetLink && (
                  <div className="mt-2 bg-gray-800/50 p-2 rounded-md border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Existing Google Meet Link:</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-green-400 bg-green-950/30 p-1 rounded flex-grow overflow-x-auto">
                          {selectedSession.googleMeetLink}
                        </code>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-gray-700 text-gray-300 h-7 px-2 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedSession.googleMeetLink || "");
                            toast({
                              title: "Copied!",
                              description: "Existing link copied to clipboard",
                              variant: "default",
                            });
                          }}
                        >
                          <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                        </Button>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 h-7 px-2"
                          onClick={() => {
                            // Ensure URL has protocol prefix for proper browser opening
                            let meetUrl = selectedSession.googleMeetLink;
                            if (meetUrl && !meetUrl.startsWith('http')) {
                              meetUrl = 'https://' + meetUrl;
                            }
                            window.open(meetUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <Video className="w-3.5 h-3.5 mr-1.5" /> Open in new tab
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
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
                    <p>{selectedSession?.date ? format(new Date(selectedSession.date), "MMM d, yyyy") : ""} at {selectedSession?.date ? format(new Date(selectedSession.date), "HH:mm") : ""}</p>
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
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle>Reschedule Session</DialogTitle>
              <DialogDescription>
                Reschedule the session with {selectedSession?.studentName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Current session details */}
              <div className="bg-gray-800 p-3 rounded-md space-y-2 mb-4">
                <h4 className="text-sm font-medium">Current Session Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Student:</p>
                    <p>{selectedSession?.studentName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Date & Time:</p>
                    <p>{selectedSession?.date ? format(new Date(selectedSession.date), "MMM d, yyyy") : ""} at {selectedSession?.date ? format(new Date(selectedSession.date), "HH:mm") : ""}</p>
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

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="rescheduleDate">Select New Date</Label>
                <p className="text-gray-400 text-xs mb-2">
                  Only dates with available time slots are selectable.
                </p>
                
                {/* Date dropdown selector */}
                <Select
                  value={selectedRescheduleDate ? format(selectedRescheduleDate, "yyyy-MM-dd") : ""}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedRescheduleDate(new Date(value));
                      // Reset time selection when date changes
                      setSelectedRescheduleTimeSlot("");
                    } else {
                      setSelectedRescheduleDate(undefined);
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                    <div className="flex items-center">
                      <SelectValue placeholder="Select a date" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {(() => {
                      // Generate available dates as options
                      const dateOptions = [];
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      // Get sorted keys (dates) from the availability map
                      const availableDates = Object.keys(rescheduleDateAvailability)
                        .filter(date => rescheduleDateAvailability[date] > 0)
                        .sort();
                      
                      for (const dateStr of availableDates) {
                        const date = new Date(dateStr);
                        
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
                              "flex items-center justify-between text-white data-[highlighted]:bg-gray-700",
                              isToday && "font-bold"
                            )}
                          >
                            <span className={isToday ? "text-green-500" : ""}>
                              {displayDate}{isToday ? " (Today)" : ""}
                            </span>
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-green-900/40 text-green-400">
                              {rescheduleDateAvailability[formattedDate] || 0} slots available
                            </span>
                          </SelectItem>
                        );
                      }
                      
                      return dateOptions.length > 0 ? dateOptions : (
                        <SelectItem disabled value="none" className="text-gray-500">
                          No available dates
                        </SelectItem>
                      );
                    })()}
                    
                    {/* Calendar view option */}
                    <div className="p-2 border-t border-gray-700 mt-2">
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
                            selected={selectedRescheduleDate}
                            onSelect={setSelectedRescheduleDate}
                            disabled={[
                              { before: new Date() },
                              { dayOfWeek: [0, 6] }, // Disable weekends
                              (date) => {
                                // Convert date to string format
                                const dateStr = format(date, "yyyy-MM-dd");
                                // Disable dates that have no available slots
                                return !rescheduleDateAvailability[dateStr];
                              }
                            ]}
                            modifiers={{
                              available: (date) => {
                                // Convert date to string format
                                const dateStr = format(date, "yyyy-MM-dd");
                                // Highlight dates that have available slots
                                return !!rescheduleDateAvailability[dateStr];
                              }
                            }}
                            modifiersClassNames={{
                              available: "bg-green-600 text-white hover:bg-green-700 focus:bg-green-700",
                              selected: "bg-green-600 text-white hover:bg-green-700 focus:bg-green-700"
                            }}
                            className="bg-gray-900 rounded-md text-white border-gray-700"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedRescheduleDate && (
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="rescheduleTime">Select New Time</Label>
                  
                  {/* Time dropdown selector */}
                  <Select
                    value={selectedRescheduleTimeSlot}
                    onValueChange={(time) => {
                      setSelectedRescheduleTimeSlot(time);
                    }}
                    disabled={!selectedRescheduleDate}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {availableRescheduleTimeSlots.length > 0 ? (
                        availableRescheduleTimeSlots.map((time) => (
                          <SelectItem 
                            key={time} 
                            value={time}
                            className="text-white data-[highlighted]:bg-gray-700 hover:bg-gray-700"
                          >
                            {time}
                            {selectedRescheduleTimeSlot === time && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                                Selected
                              </span>
                            )}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-slots" disabled className="text-gray-400">
                          No available time slots
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {availableRescheduleTimeSlots.length === 0 && selectedRescheduleDate && (
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
                    <p className="font-medium mb-1">Free Rescheduling for Students</p>
                    <p className="text-xs text-green-300/80">
                      Rescheduling is free for students if done more than 4 hours before the session starts.
                    </p>
                  </div>
                </div>
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
                onClick={() => rescheduleSessionMutation.mutate()}
                className="bg-green-600 hover:bg-green-700"
                disabled={!selectedRescheduleDate || !selectedRescheduleTimeSlot || rescheduleSessionMutation.isPending}
              >
                {rescheduleSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rescheduling...
                  </>
                ) : "Confirm Reschedule"}
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

        {/* Add Date Dialog with Multi-Date Selection */}
        <Dialog open={isAddSlotDialogOpen} onOpenChange={setIsAddSlotDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="sticky top-0 bg-gray-900 z-10 pb-2">
              <DialogTitle>Add Available Dates</DialogTitle>
              <DialogDescription>
                Select dates and time slots when you are available for project guidance sessions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4 overflow-y-auto pr-1 max-h-[calc(90vh-12rem)] custom-scrollbar">
              {/* Selection Mode Toggle */}
              <div className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                <div>
                  <h3 className="font-medium">Bulk Date Selection</h3>
                  <p className="text-sm text-gray-400">Select multiple dates at once</p>
                </div>
                <Switch
                  checked={bulkMode}
                  onCheckedChange={setBulkMode}
                />
              </div>

              {bulkMode ? (
                /* Bulk Date Selection */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <div ref={startDateRef} className="relative mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700"
                          onClick={() => setStartPickerOpen(true)}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.start ? format(new Date(dateRange.start), "PPP") : "Select start date"}
                        </Button>
                        {startPickerOpen && (
                          <div className="absolute z-10 top-full left-0 mt-1">
                            <div className="bg-gray-900 border border-gray-700 rounded-md p-3 shadow-lg">
                              <DayPicker
                                mode="single"
                                selected={dateRange.start ? new Date(dateRange.start) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    setDateRange({...dateRange, start: format(date, "yyyy-MM-dd")});
                                    setStartPickerOpen(false);
                                  }
                                }}
                                initialFocus
                                className="border-gray-700"
                                classNames={{
                                  months: "flex flex-col space-y-4",
                                  month: "space-y-4",
                                  caption: "flex justify-center pt-1 relative items-center",
                                  caption_label: "text-sm font-medium text-gray-300",
                                  nav: "space-x-1 flex items-center",
                                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-300",
                                  table: "w-full border-collapse space-y-1",
                                  head_row: "flex",
                                  head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                                  row: "flex w-full mt-2",
                                  cell: "h-9 w-9 text-center text-sm relative p-0 rounded-md focus-within:relative focus-within:z-20",
                                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md text-gray-300",
                                  day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                                  day_today: "bg-gray-800 text-white",
                                  day_outside: "text-gray-500 opacity-50",
                                  day_disabled: "text-gray-500 opacity-50 line-through",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* End Date */}
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <div ref={endDateRef} className="relative mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700"
                          onClick={() => setEndPickerOpen(true)}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.end ? format(new Date(dateRange.end), "PPP") : "Select end date"}
                        </Button>
                        {endPickerOpen && (
                          <div className="absolute z-10 top-full left-0 mt-1">
                            <div className="bg-gray-900 border border-gray-700 rounded-md p-3 shadow-lg">
                              <DayPicker
                                mode="single"
                                selected={dateRange.end ? new Date(dateRange.end) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    setDateRange({...dateRange, end: format(date, "yyyy-MM-dd")});
                                    setEndPickerOpen(false);
                                  }
                                }}
                                initialFocus
                                className="border-gray-700"
                                classNames={{
                                  months: "flex flex-col space-y-4",
                                  month: "space-y-4",
                                  caption: "flex justify-center pt-1 relative items-center",
                                  caption_label: "text-sm font-medium text-gray-300",
                                  nav: "space-x-1 flex items-center",
                                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-300",
                                  table: "w-full border-collapse space-y-1",
                                  head_row: "flex",
                                  head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                                  row: "flex w-full mt-2",
                                  cell: "h-9 w-9 text-center text-sm relative p-0 rounded-md focus-within:relative focus-within:z-20",
                                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md text-gray-300",
                                  day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                                  day_today: "bg-gray-800 text-white",
                                  day_outside: "text-gray-500 opacity-50",
                                  day_disabled: "text-gray-500 opacity-50 line-through",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Day of week selectors */}
                  <div>
                    <Label>Select Days of Week</Label>
                    <div className="grid grid-cols-7 gap-1 mt-2">
                      {Object.entries({
                        monday: "M",
                        tuesday: "T",
                        wednesday: "W",
                        thursday: "T",
                        friday: "F",
                        saturday: "S",
                        sunday: "S"
                      }).map(([day, label]) => (
                        <Button
                          key={day}
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-10 px-0",
                            selectedDays[day] 
                              ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600" 
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700 border-gray-700"
                          )}
                          onClick={() => setSelectedDays({
                            ...selectedDays,
                            [day]: !selectedDays[day]
                          })}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Single Date Selection */
                <div>
                  <Label htmlFor="single-date">Select Date</Label>
                  <div className="mt-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newDate ? format(new Date(newDate), "PPP") : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700">
                        <DayPicker
                          mode="single"
                          selected={newDate ? new Date(newDate) : undefined}
                          onSelect={(date) => date && setNewDate(format(date, "yyyy-MM-dd"))}
                          initialFocus
                          className="border-gray-700"
                          classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium text-gray-300",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-300",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "h-9 w-9 text-center text-sm relative p-0 rounded-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md text-gray-300",
                            day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                            day_today: "bg-gray-800 text-white",
                            day_outside: "text-gray-500 opacity-50",
                            day_disabled: "text-gray-500 opacity-50 line-through",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Time slot selection */}
              <div>
                <Label className="mb-2 block">Select Time Slots</Label>
                <div className="flex flex-wrap gap-2">
                  {timeSlotOptions.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-10",
                        selectedSlots.includes(slot)
                          ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"
                      )}
                      onClick={() => {
                        if (selectedSlots.includes(slot)) {
                          setSelectedSlots(selectedSlots.filter(s => s !== slot));
                        } else {
                          setSelectedSlots([...selectedSlots, slot]);
                        }
                      }}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selection summary */}
              <div className="bg-gray-800 p-3 rounded-md space-y-2">
                <h4 className="font-medium flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Selection Summary
                </h4>
                <div className="space-y-2 text-sm">
                  {bulkMode ? (
                    <>
                      <p>Date Range: {dateRange.start && dateRange.end ? (
                        <span className="text-blue-400">
                          {format(new Date(dateRange.start), "MMM d, yyyy")} to {format(new Date(dateRange.end), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span className="text-gray-400">No date range selected</span>
                      )}</p>
                      <p>Selected Days: {Object.entries(selectedDays)
                        .filter(([_, isSelected]) => isSelected)
                        .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
                        .join(", ") || <span className="text-gray-400">None</span>}
                      </p>
                    </>
                  ) : (
                    <p>Selected Date: {newDate ? (
                      <span className="text-blue-400">{format(new Date(newDate), "MMM d, yyyy")}</span>
                    ) : (
                      <span className="text-gray-400">No date selected</span>
                    )}</p>
                  )}
                  <p>Selected Time Slots: {selectedSlots.length > 0 ? (
                    <span className="text-blue-400">{selectedSlots.sort().join(", ")}</span>
                  ) : (
                    <span className="text-gray-400">No time slots selected</span>
                  )}</p>
                </div>
              </div>
            </div>
            <DialogFooter className="sticky bottom-0 bg-gray-900 pt-2 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddSlotDialogOpen(false);
                  setBulkMode(false);
                  setNewDate("");
                  setDateRange({ start: "", end: "" });
                  setSelectedSlots([]);
                }}
                className="border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                disabled={
                  selectedSlots.length === 0 || 
                  (bulkMode ? (!dateRange.start || !dateRange.end || Object.values(selectedDays).every(v => !v)) : !newDate) ||
                  addAvailableDatesMutation.isPending
                }
                onClick={() => {
                  // Calculate dates to add based on selection mode
                  let datesToAdd: string[] = [];
                  
                  if (bulkMode) {
                    // Generate dates in the range that match selected days of week
                    if (dateRange.start && dateRange.end) {
                      const start = new Date(dateRange.start);
                      const end = new Date(dateRange.end);
                      const current = new Date(start);
                      
                      // Map day names to JavaScript day numbers (0-6 where 0 is Sunday)
                      const dayMap: {[key: string]: number} = {
                        sunday: 0,
                        monday: 1,
                        tuesday: 2,
                        wednesday: 3,
                        thursday: 4,
                        friday: 5,
                        saturday: 6
                      };
                      
                      // Get selected day numbers
                      const selectedDayNumbers = Object.entries(selectedDays)
                        .filter(([_, isSelected]) => isSelected)
                        .map(([day]) => dayMap[day]);
                      
                      // Iterate through all dates in the range
                      while (current <= end) {
                        // Check if the current day of week is selected
                        if (selectedDayNumbers.includes(current.getDay())) {
                          datesToAdd.push(format(current, "yyyy-MM-dd"));
                        }
                        
                        // Move to the next day
                        current.setDate(current.getDate() + 1);
                      }
                    }
                  } else {
                    // Single date mode
                    if (newDate) {
                      datesToAdd = [newDate];
                    }
                  }
                  
                  if (datesToAdd.length === 0) {
                    toast({
                      title: "No dates selected",
                      description: "Please select at least one date.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Call the mutation with the dates and selected time slots
                  addAvailableDatesMutation.mutate({
                    dates: datesToAdd,
                    timeSlots: selectedSlots
                  });
                }}
              >
                {addAvailableDatesMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" /> Add Dates
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
              <DialogDescription>
                Set a new password for {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="flex">
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white flex-grow"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="ml-2 border-gray-700 hover:bg-gray-800 text-amber-400"
                    onClick={() => {
                      // Generate a strong random password
                      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                      let password = '';
                      for (let i = 0; i < 12; i++) {
                        password += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setNewPassword(password);
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </div>
                {newPassword && (
                  <div className="mt-2 bg-gray-800 p-2 rounded-md border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">New password:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-green-400 bg-green-950/30 p-1 rounded flex-grow">
                        {newPassword}
                      </code>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(newPassword);
                          toast({
                            title: "Copied!",
                            description: "Password copied to clipboard",
                          });
                        }}
                        className="h-7 px-2 border-gray-700 text-gray-300"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-amber-900/30 border border-amber-700 p-3 rounded-md">
                <div className="flex items-center text-amber-300 mb-2">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <h4 className="text-sm font-medium">Important Note</h4>
                </div>
                <p className="text-xs text-amber-200/80">
                  This will immediately change the user's password. Make sure to communicate the new password to the user securely.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsResetPasswordDialogOpen(false)}
                className="border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedUser) return;
                  resetPasswordMutation.mutate({
                    userId: selectedUser.id,
                    newPassword
                  });
                }}
                className="bg-amber-600 hover:bg-amber-700"
                disabled={!newPassword || resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete User Dialog */}
        <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Delete User Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the account for {selectedUser?.email}?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-reason">Reason for deletion (optional)</Label>
                <Textarea
                  id="delete-reason"
                  placeholder="Enter reason for deletion"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white resize-none h-24"
                />
              </div>
              
              <div className="bg-red-900/30 border border-red-700 p-3 rounded-md">
                <div className="flex items-center text-red-300 mb-2">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <h4 className="text-sm font-medium">Important Information</h4>
                </div>
                <p className="text-xs text-red-200/80">
                  This action will move the user account to a deleted users list where it will be stored for 30 days before being permanently deleted. During this period, an admin can restore the account if needed.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteUserDialogOpen(false)}
                className="border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedUser) return;
                  deleteUserMutation.mutate({
                    userId: selectedUser.id,
                    reason: deleteReason
                  });
                }}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <UserCog className="h-5 w-5 text-amber-500" />
                Edit User
              </DialogTitle>
              <DialogDescription>
                Update user information for {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-6">
              {/* User profile image and creation date */}
              <div className="flex flex-col items-center space-y-3 border-b border-gray-800 pb-5">
                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-4xl font-bold text-white border-2 border-amber-500/50 overflow-hidden">
                  {selectedUser?.profileImageUrl ? (
                    <img 
                      src={selectedUser.profileImageUrl} 
                      alt={`${selectedUser.username || 'User'}'s profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedUser?.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium">{selectedUser?.username || 'User'}</h3>
                  <p className="text-sm text-gray-400">{selectedUser?.email}</p>
                </div>
                {selectedUser?.createdAt && (
                  <p className="text-xs text-gray-500">
                    Joined on {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
                {selectedUser?.lastLoginAt && (
                  <p className="text-xs text-gray-500">
                    Last login: {new Date(selectedUser.lastLoginAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
              
              {/* User info form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="Username"
                    defaultValue={selectedUser?.username}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    <User className="h-3.5 w-3.5 inline-block mr-1.5" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Full name"
                    defaultValue={selectedUser?.fullName || ''}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    <Phone className="h-3.5 w-3.5 inline-block mr-1.5" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Phone number"
                    defaultValue={selectedUser?.phoneNumber || ''}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profileImageUrl" className="text-sm font-medium">
                    <ImageIcon className="h-3.5 w-3.5 inline-block mr-1.5" />
                    Profile Image URL
                  </Label>
                  <Input
                    id="profileImageUrl"
                    placeholder="https://example.com/avatar.jpg"
                    defaultValue={selectedUser?.profileImageUrl || ''}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-500 italic">Enter a URL to an image (JPG, PNG, etc.)</p>
                </div>
              </div>
              
              {/* Status badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge className={selectedUser?.isVerified ? "bg-green-700" : "bg-gray-700"}>
                  {selectedUser?.isVerified ? "Email Verified" : "Not Verified"}
                </Badge>
                
                <Badge className={selectedUser?.role === 'admin' ? "bg-amber-700" : "bg-gray-700"}>
                  {selectedUser?.role === 'admin' ? "Admin" : "User"}
                </Badge>
                
                <Badge className={selectedUser?.profileCompleted ? "bg-blue-700" : "bg-gray-700"}>
                  {selectedUser?.profileCompleted ? "Profile Complete" : "Profile Incomplete"}
                </Badge>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditUserDialogOpen(false)}
                className="border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  if (!selectedUser) return;
                  
                  const username = (document.getElementById('username') as HTMLInputElement)?.value;
                  const fullName = (document.getElementById('fullName') as HTMLInputElement)?.value;
                  const phoneNumber = (document.getElementById('phoneNumber') as HTMLInputElement)?.value;
                  const profileImageUrl = (document.getElementById('profileImageUrl') as HTMLInputElement)?.value;
                  
                  // Update user mutation
                  const updateUserMutation = {
                    mutationFn: async (userData: {
                      userId: number;
                      updates: {
                        username?: string;
                        fullName?: string;
                        phoneNumber?: string;
                        profileImageUrl?: string;
                      };
                    }) => {
                      const response = await apiRequest(
                        "PATCH",
                        `/api/admin/users/${userData.userId}`,
                        userData.updates
                      );
                      return response.json();
                    },
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
                      toast({
                        title: "User Updated",
                        description: `User ${selectedUser.email} has been updated successfully.`,
                      });
                      setIsEditUserDialogOpen(false);
                    },
                    onError: (error: any) => {
                      toast({
                        title: "Failed to update user",
                        description: error.message || "Something went wrong. Please try again.",
                        variant: "destructive"
                      });
                    }
                  };
                  
                  // Call the mutation
                  updateUserMutation.mutationFn({
                    userId: selectedUser.id,
                    updates: {
                      username,
                      fullName: fullName || undefined,
                      phoneNumber: phoneNumber || undefined,
                      profileImageUrl: profileImageUrl || undefined
                    }
                  })
                  .then(updateUserMutation.onSuccess)
                  .catch(updateUserMutation.onError);
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* View Slots Dialog */}
        <Dialog open={viewSlotsDialogOpen} onOpenChange={setViewSlotsDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-gray-900 z-10 pb-2 border-b border-gray-800">
              <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                Available Time Slots
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedSlotDate && (
                  <span>Time slots for {formatInIST(selectedSlotDate, 'EEEE, MMMM d, yyyy')}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4 overflow-y-auto custom-scrollbar">
              {selectedSlotDate && availableSlotsData ? (
                <>
                  {availableSlotsData
                    .filter((slot: AvailableTimeSlot) => formatInIST(selectedSlotDate, 'yyyy-MM-dd') === slot.date)
                    .map((slot: AvailableTimeSlot) => (
                      <div key={slot.id} className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium flex items-center gap-2">
                            <span>Time Slots</span>
                            {/* Availability summary */}
                            {slot.slotsWithStatus && (
                              <Badge variant="outline" className="bg-gray-800 ml-2 whitespace-nowrap">
                                <span className="text-green-400">{slot.slotsWithStatus.filter(s => !s.isBooked).length}</span>
                                <span className="mx-1 text-white">/</span>
                                <span className="text-white">{slot.slotsWithStatus.length}</span>
                                <span className="ml-1 text-white">Available</span>
                              </Badge>
                            )}
                          </h3>
                        </div>
                        
                        {/* Available and booked slots */}
                        {slot.slotsWithStatus && slot.slotsWithStatus.length > 0 ? (
                          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {slot.slotsWithStatus
                              // Sort time slots chronologically
                              .sort((a, b) => a.time.localeCompare(b.time))
                              .map((timeSlot, idx) => {
                                const isBooked = timeSlot.isBooked;
                                const session = sessions.find(s => 
                                  formatInIST(new Date(s.date), 'yyyy-MM-dd') === slot.date && 
                                  formatInIST(new Date(s.date), 'HH:mm') === timeSlot.time
                                );
                                
                                return (
                                  <div 
                                    key={idx} 
                                    className={`p-3 rounded-md flex flex-col ${
                                      isBooked 
                                        ? 'bg-red-900/30 border border-red-800 shadow-sm shadow-red-900/30' 
                                        : 'bg-green-900/30 border border-green-800 shadow-sm shadow-green-900/30'
                                    } transition-all hover:shadow-md hover:scale-[1.02] duration-200`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-lg font-medium">{timeSlot.time}</span>
                                      <Badge variant={isBooked ? "destructive" : "success"} className={`${
                                        isBooked 
                                          ? 'bg-red-900/80 hover:bg-red-800 text-white' 
                                          : ''
                                      }`}>
                                        {isBooked ? 'Booked' : 'Available'}
                                      </Badge>
                                    </div>
                                    
                                    {/* If booked, show session details */}
                                    {isBooked && session && (
                                      <div className="mt-3 text-sm border-t border-red-800/50 pt-2 space-y-1">
                                        <div className="flex items-start">
                                          <span className="text-gray-400 w-16 flex-shrink-0">Student:</span> 
                                          <span className="font-medium">{session.studentName}</span>
                                        </div>
                                        <div className="flex items-start">
                                          <span className="text-gray-400 w-16 flex-shrink-0">Topic:</span> 
                                          <span className="truncate" title={session.topic}>{session.topic}</span>
                                        </div>
                                        <div className="flex items-start">
                                          <span className="text-gray-400 w-16 flex-shrink-0">Duration:</span> 
                                          <span>{session.duration} min</span>
                                        </div>
                                        <div className="flex items-start">
                                          <span className="text-gray-400 w-16 flex-shrink-0">Status:</span> 
                                          <Badge variant="outline" className="capitalize bg-transparent border-gray-700">
                                            {session.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <div className="text-center py-8 border border-dashed border-gray-700 rounded-md">
                            <Clock className="w-12 h-12 mx-auto text-gray-600 mb-2" />
                            <p className="text-gray-400">No time slots available for this date.</p>
                          </div>
                        )}
                      </div>
                    ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-gray-400">Loading available time slots...</p>
                </div>
              )}
            </div>
            
            <DialogFooter className="sticky bottom-0 bg-gray-900 pt-2 border-t border-gray-800">
              <Button
                variant="secondary"
                onClick={() => setViewSlotsDialogOpen(false)}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* User Login History Dialog */}
        <Dialog open={isUserHistoryDialogOpen} onOpenChange={setIsUserHistoryDialogOpen}>
          <DialogContent className="sm:max-w-[700px] bg-gray-950 border-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <History className="h-5 w-5 text-purple-400" />
                User Login History
              </DialogTitle>
              <DialogDescription>
                View login sessions for this user across all deployments
              </DialogDescription>
            </DialogHeader>
            
            {isUserLoginHistoryLoading ? (
              <div className="p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-2" />
                <p className="text-gray-400">Loading login history...</p>
              </div>
            ) : (
              <>
                {!userLoginHistoryData || 
                  (!userLoginHistoryData.loginHistory || userLoginHistoryData.loginHistory.length === 0) ? (
                  <div className="p-6 text-center bg-gray-900/50 rounded-lg border border-gray-800">
                    <Info className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-gray-300 mb-2">No login history found</p>
                    <p className="text-gray-400 text-sm">This user hasn't logged in yet or their history is not available.</p>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[400px]">
                    <Table className="border-collapse border-spacing-0">
                      <TableHeader>
                        <TableRow className="border-b border-gray-800 bg-gray-900/50">
                          <TableHead className="text-purple-200 font-medium text-sm py-3">Login Time</TableHead>
                          <TableHead className="text-purple-200 font-medium text-sm py-3">Last Active</TableHead>
                          <TableHead className="text-purple-200 font-medium text-sm py-3">Logout Time</TableHead>
                          <TableHead className="text-purple-200 font-medium text-sm py-3">Duration</TableHead>
                          <TableHead className="text-purple-200 font-medium text-sm py-3">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userLoginHistoryData.loginHistory.map((session) => (
                          <TableRow key={session.id} className="hover:bg-gray-800/40 border-b border-gray-800/50 transition-colors">
                            <TableCell>
                              <div className="font-medium text-sm">{session.formattedLoginTime}</div>
                              <div className="text-xs text-gray-400">Session ID: {session.sessionId.substring(0, 8)}...</div>
                            </TableCell>
                            <TableCell>
                              {session.formattedLastActiveTime ? (
                                <div className="font-mono text-sm text-gray-200">{session.formattedLastActiveTime}</div>
                              ) : (
                                <span className="text-gray-500 italic text-sm">No activity</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {session.formattedLogoutTime ? (
                                <div className="font-mono text-sm text-gray-200">{session.formattedLogoutTime}</div>
                              ) : (
                                <span className="text-gray-500 italic text-sm">Still active</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {session.duration ? (
                                <Badge className="bg-purple-900/30 border-purple-800">
                                  <Clock className="w-3 h-3 mr-1.5" />
                                  {session.duration} min
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-900/30 border-blue-800">
                                  <Activity className="w-3 h-3 mr-1.5" />
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {session.isActive ? (
                                <Badge className="bg-green-900/30 text-green-200 border-green-800 shadow-sm">
                                  <Activity className="w-3 h-3 mr-1.5" />
                                  Active Now
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-900/30 text-gray-200 border-gray-700 shadow-sm">
                                  <UserX className="w-3 h-3 mr-1.5" />
                                  Logged Out
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                className="border-gray-700 hover:bg-gray-800"
                onClick={() => setIsUserHistoryDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Payment Verification Dialog */}
        {selectedSession && (
          <Dialog open={isManualPaymentDialogOpen} onOpenChange={setIsManualPaymentDialogOpen}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Manual Payment Verification</DialogTitle>
                <DialogDescription>
                  Verify payment for session with {selectedSession.studentName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <ManualQRPaymentDialog 
                    sessionId={selectedSession.id}
                    orderId={selectedSession.orderId}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  className="border-gray-700 hover:bg-gray-800"
                  onClick={() => setIsManualPaymentDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}