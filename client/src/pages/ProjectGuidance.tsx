import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  BookText, 
  CalendarCheck, 
  Calendar as CalendarIcon, 
  CalendarClock, 
  CheckCircle, 
  GraduationCap, 
  Briefcase, 
  User, 
  AlertCircle, 
  X,
  BanIcon,
  Calendar as CalendarIconLucide
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import BookingCalendar from "@/components/BookingCalendar";
import PaymentOptions from "@/components/PaymentOptions";

import * as ToggleGroup from "@radix-ui/react-toggle-group";

const projectGuidanceFormSchema = z.object({
  studentName: z.string().min(2, { message: "Please enter your full name" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  topic: z.string().min(5, { message: "Please enter a topic for discussion" }),
  notes: z.string().optional(),
  isStudent: z.boolean().default(true),
});

type ProjectGuidanceFormValues = z.infer<typeof projectGuidanceFormSchema>;

function ProjectGuidance() {
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Details, 2: Schedule, 3: Payment, 4: Confirmation, 5: Reschedule, 6: Cancel
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default 60 minutes
  const [sessionId, setSessionId] = useState<number | null>(null);
  
  // Rescheduling state
  const [verificationEmail, setVerificationEmail] = useState<string>("");
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [userEnteredCode, setUserEnteredCode] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [userSessions, setUserSessions] = useState<any[] | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  
  // Cancellation state
  const [isCancellationDialogOpen, setIsCancellationDialogOpen] = useState<boolean>(false);
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [sessionToCancelId, setSessionToCancelId] = useState<number | null>(null);
  const [cancellationSuccess, setCancellationSuccess] = useState<boolean>(false);
  const [cancellationDetails, setCancellationDetails] = useState<{
    refundPercentage: number;
    refundAmount: number;
  } | null>(null);
  
  // Check if returning from payment flow
  useEffect(() => {
    // Check URL parameters for payment callback
    const params = new URLSearchParams(window.location.search);
    const sessionIdParam = params.get("sessionId");
    
    if (sessionIdParam) {
      // User is returning from payment page
      setSessionId(parseInt(sessionIdParam));
      
      // Check for successful payment from any of the payment gateways
      const paymentId = params.get("txnId") || params.get("paymentId") || params.get("razorpay_payment_id");
      
      if (paymentId) {
        toast({
          title: "Payment Successful",
          description: "We will send your Google Meet link within 4 hours.",
        });
        setStep(4); // Move to confirmation step
        
        // Clear the URL parameters to avoid confusion if page is refreshed
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
      }
    }
    
    // Check if there was a pending transaction in localStorage
    const pendingTxnId = localStorage.getItem('pendingPaymentTxnId');
    if (pendingTxnId) {
      console.log("Found pending transaction:", pendingTxnId);
      
      // Clear the pending transaction
      localStorage.removeItem('pendingPaymentTxnId');
    }
  }, [toast]);
  
  const form = useForm<ProjectGuidanceFormValues>({
    resolver: zodResolver(projectGuidanceFormSchema),
    defaultValues: {
      studentName: "",
      email: "",
      phone: "",
      topic: "",
      notes: "",
      isStudent: true, // Default to student
    },
  });
  
  const getCost = () => {
    // Return cost based on selected duration
    switch (selectedDuration) {
      case 5:
        return 5;
      case 30:
        return 1505;
      case 35:
        return 1755;
      case 60:
        return 2505;
      case 90:
        return 3505;
      default:
        // Fallback calculation (should not happen)
        return (selectedDuration / 60) * 2505 + 5;
    }
  };
  
  const { mutate: bookSession, isPending } = useMutation({
    mutationFn: async (values: ProjectGuidanceFormValues) => {
      if (!selectedDate || !selectedTime) return Promise.reject("Please select a date and time");
      
      const sessionDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      sessionDate.setHours(hours, minutes);
      
      const sessionData = {
        studentName: values.studentName,
        email: values.email,
        phone: values.phone,
        topic: values.topic,
        notes: values.notes || "",
        date: sessionDate.toISOString(),
        duration: selectedDuration,
        isStudent: values.isStudent,
      };
      
      console.log("Submitting project guidance session:", sessionData);
      
      const response = await apiRequest("POST", "/api/project-guidance", sessionData);
      const data = await response.json();
      return data;
    },
    onSuccess: (data: any) => {
      // Make sure we have a valid session ID
      console.log("Full server response for session booking:", data);
      
      if (!data || !data.id) {
        console.error("Missing session ID in server response:", data);
        toast({
          title: "Session Booking Error",
          description: "Could not process your booking. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      const bookedSessionId = data.id;
      console.log("Session booked successfully with ID:", bookedSessionId);
      
      // Update state with the session ID
      setSessionId(bookedSessionId);
      
      // Directly proceed to payment instead of showing payment selection
      initiatePayment(bookedSessionId, form.getValues());
      
      // If payment initiation fails, the initiatePayment function will 
      // fall back to the regular payment screen (setStep(3))
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });
  
  // Function to proceed to payment page after session booking
  const initiatePayment = async (sessionId: number, values: ProjectGuidanceFormValues) => {
    try {
      toast({
        title: "Session Booked",
        description: "Please complete the payment to confirm your session.",
      });
      
      console.log("Proceeding to payment page with sessionId:", sessionId);
      
      // Directly go to payment options page
      setStep(3);
      
    } catch (error: any) {
      console.error('Error while preparing payment page:', error);
      console.error({
        message: error.message,
        stack: error.stack
      });
      
      toast({
        title: 'Error',
        description: 'There was an error preparing the payment page. Please try again.',
        variant: 'destructive',
      });
      
      // If we have a valid session ID, still try to show the payment page
      if (sessionId) {
        setStep(3);
      }
    }
  };

  const onSubmit = (values: ProjectGuidanceFormValues) => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your session",
        variant: "destructive",
      });
      return;
    }
    
    // When the user submits the form with date and time, book the session
    // and then immediately redirect to payment
    bookSession(values);
  };
  
  const handlePaymentSuccess = (paymentId: string) => {
    toast({
      title: "Payment Successful",
      description: "We will send your Google Meet link within 4 hours.",
    });
    setStep(4); // Move to success step
  };
  
  const handlePaymentFailure = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error || "There was an issue processing your payment. Please try again.",
      variant: "destructive",
    });
  };
  
  // Verification Code Functions
  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  const { mutate: sendVerificationCode, isPending: isSendingCode } = useMutation({
    mutationFn: async (email: string) => {
      setIsVerifying(true);
      const code = generateRandomCode();
      setVerificationCode(code);
      
      const response = await apiRequest("POST", "/api/send-verification-code", {
        email,
        code,
        purpose: "reschedule"
      });
      
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the verification code.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Code",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      setIsVerifying(false);
    }
  });
  
  const verifyCode = () => {
    if (userEnteredCode === verificationCode) {
      setIsEmailVerified(true);
      
      // Fetch user sessions by email (for existing bookings display)
      const fetchUserSessions = async () => {
        try {
          const response = await apiRequest("GET", `/api/sessions-by-email?email=${verificationEmail}`);
          const data = await response.json();
          
          if (data.sessions && data.sessions.length > 0) {
            setUserSessions(data.sessions);
            setSelectedSessionId(data.sessions[0].id);
          } else {
            setUserSessions([]);
          }
        } catch (error) {
          console.error("Error fetching user sessions:", error);
          setUserSessions([]);
        }
      };
      
      fetchUserSessions();
      
      toast({
        title: "Email Verified",
        description: "You can now view, reschedule, or cancel your sessions.",
      });
    } else {
      toast({
        title: "Invalid Code",
        description: "The verification code you entered is incorrect. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const { mutate: rescheduleSession, isPending: isReschedulingSession } = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime || !sessionId) {
        return Promise.reject("Missing required information for rescheduling");
      }
      
      const sessionDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      sessionDate.setHours(hours, minutes);
      
      const reschedulingData = {
        sessionId,
        email: verificationEmail,
        newDate: sessionDate.toISOString(),
        newDuration: selectedDuration
      };
      
      const response = await apiRequest("POST", "/api/reschedule-session", reschedulingData);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Session Rescheduled",
        description: "Your session has been successfully rescheduled. We'll send you an updated Google Meet link.",
      });
      
      // Return to confirmation page
      setStep(4);
      setIsRescheduling(false);
      setIsEmailVerified(false);
      setVerificationEmail("");
      setUserEnteredCode("");
      setVerificationCode("");
    },
    onError: (error) => {
      toast({
        title: "Rescheduling Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  });
  
  const { mutate: cancelSession, isPending: isCancellingSession } = useMutation({
    mutationFn: async () => {
      if (!sessionToCancelId || !cancellationReason) {
        return Promise.reject("Missing required information for cancellation");
      }
      
      const cancellationData = {
        sessionId: sessionToCancelId,
        email: verificationEmail,
        reason: cancellationReason
      };
      
      const response = await apiRequest("POST", "/api/cancel-session", cancellationData);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Record the refund details
      setCancellationDetails({
        refundPercentage: data.refundDetails.percentage,
        refundAmount: data.refundDetails.amount
      });
      
      setCancellationSuccess(true);
      setIsCancellationDialogOpen(false);
      
      toast({
        title: "Session Cancelled",
        description: "Your session has been cancelled. You will receive a confirmation email with refund details.",
      });
      
      // Refresh the sessions list
      const fetchUserSessions = async () => {
        try {
          const response = await apiRequest("GET", `/api/sessions-by-email?email=${verificationEmail}`);
          const data = await response.json();
          
          if (data.sessions && data.sessions.length > 0) {
            setUserSessions(data.sessions);
          } else {
            setUserSessions([]);
          }
        } catch (error) {
          console.error("Error fetching user sessions:", error);
          setUserSessions([]);
        }
      };
      
      fetchUserSessions();
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  });
  
  return (
    <>
      <Helmet>
        <title>Project Guidance | BambooMade</title>
        <meta name="description" content="Book a project guidance session with bamboo architecture experts to get personalized guidance for your academic or professional bamboo projects." />
      </Helmet>
      
      {/* Cancellation Dialog */}
      <Dialog 
        open={isCancellationDialogOpen} 
        onOpenChange={setIsCancellationDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this session? Your refund will be processed according to our cancellation policy.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-md p-3 my-3">
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">Cancellation Policy</h4>
            <ul className="mt-2 text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <li>• 100% refund: more than 7 days before session</li>
              <li>• 75% refund: 3-7 days before session</li>
              <li>• 50% refund: 1-3 days before session</li>
              <li>• 25% refund: less than 24 hours before session</li>
              <li>• No refund: after scheduled start time</li>
            </ul>
          </div>
          
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium">Reason for Cancellation</label>
            <Textarea 
              placeholder="Please provide a reason for cancellation..."
              className="w-full h-24"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>
          
          <DialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-end sm:space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCancellationDialogOpen(false);
                setCancellationReason("");
              }}
            >
              Keep My Session
            </Button>
            <Button
              variant="destructive"
              disabled={!cancellationReason || isCancellingSession}
              onClick={() => cancelSession()}
            >
              {isCancellingSession ? "Cancelling..." : "Cancel Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancellation Success View */}
      {cancellationSuccess && cancellationDetails && (
        <Dialog 
          open={cancellationSuccess} 
          onOpenChange={setCancellationSuccess}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Session Cancelled Successfully</DialogTitle>
              <DialogDescription>
                Your session has been cancelled, and your refund has been processed.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md p-4 my-4">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-400">Refund Details</h4>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p><strong>Refund Percentage:</strong> {cancellationDetails.refundPercentage}%</p>
                <p><strong>Refund Amount:</strong> ₹{cancellationDetails.refundAmount}</p>
                <p className="text-xs mt-2">Your refund will be processed to your original payment method within 7-10 business days.</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={() => {
                  setCancellationSuccess(false);
                  setCancellationDetails(null);
                }}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <div className="bg-background py-12">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Project Guidance Sessions
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Get personalized guidance from our bamboo architecture experts to help with your academic or professional bamboo projects.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Book Your Project Guidance Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex justify-between mb-4">
                      <div className={`flex items-center ${step >= 1 ? "text-primary-600" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 1 ? "bg-primary-100 text-primary-600" : "bg-muted text-muted-foreground"}`}>
                          <GraduationCap size={16} />
                        </div>
                        <span>Details</span>
                      </div>
                      <Separator className="w-10 my-4 mx-2" />
                      <div className={`flex items-center ${step >= 2 ? "text-primary-600" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 2 ? "bg-primary-100 text-primary-600" : "bg-muted text-muted-foreground"}`}>
                          <CalendarCheck size={16} />
                        </div>
                        <span>Schedule</span>
                      </div>
                      <Separator className="w-10 my-4 mx-2" />
                      <div className={`flex items-center ${step >= 3 ? "text-primary-600" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 3 ? "bg-primary-100 text-primary-600" : "bg-muted text-muted-foreground"}`}>
                          <CalendarIconLucide size={16} />
                        </div>
                        <span>Payment</span>
                      </div>
                      <Separator className="w-10 my-4 mx-2" />
                      <div className={`flex items-center ${step >= 4 ? "text-primary-600" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 4 ? "bg-primary-100 text-primary-600" : "bg-muted text-muted-foreground"}`}>
                          <CheckCircle size={16} />
                        </div>
                        <span>Confirmed</span>
                      </div>
                    </div>
                  </div>
                  
                  {step === 1 && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Your Information</h3>
                        <Button
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={() => setStep(5)}
                        >
                          <CalendarIconLucide className="mr-2 h-4 w-4" />
                          Access My Sessions
                        </Button>
                      </div>
                      <Form {...form}>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          // Just validate and go to step 2, don't submit yet
                          const validFields = form.trigger(["studentName", "email", "phone", "topic"]);
                          validFields.then(valid => {
                            if (valid) setStep(2);
                          });
                        }} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="isStudent"
                            render={({ field }) => (
                              <FormItem className="mb-6">
                                <FormLabel>I am a:</FormLabel>
                                <FormControl>
                                  <div className="flex rounded-md overflow-hidden border border-input mt-1">
                                    <ToggleGroup.Root
                                      className="inline-flex w-full rounded-md"
                                      type="single"
                                      value={field.value ? "student" : "professional"}
                                      onValueChange={(value) => {
                                        if (value) { // Prevent deselection
                                          field.onChange(value === "student");
                                        }
                                      }}
                                      aria-label="User type"
                                    >
                                      <ToggleGroup.Item
                                        className={`flex items-center justify-center gap-2 flex-1 p-2 h-10 data-[state=on]:bg-green-600 data-[state=on]:text-white transition-colors ${field.value ? 'bg-green-600 text-white' : 'hover:bg-muted'}`}
                                        value="student"
                                        aria-label="Student"
                                      >
                                        <User size={18} />
                                        <span>Student</span>
                                      </ToggleGroup.Item>
                                      <ToggleGroup.Item
                                        className={`flex items-center justify-center gap-2 flex-1 p-2 h-10 data-[state=on]:bg-green-600 data-[state=on]:text-white transition-colors ${!field.value ? 'bg-green-600 text-white' : 'hover:bg-muted'}`}
                                        value="professional"
                                        aria-label="Professional"
                                      >
                                        <Briefcase size={18} />
                                        <span>Professional</span>
                                      </ToggleGroup.Item>
                                    </ToggleGroup.Root>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="studentName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="your.email@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="+91 9876543210" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="topic"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Topic of Discussion</FormLabel>
                                <FormControl>
                                  <Input placeholder="What would you like guidance on?" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Additional Notes (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Any specific questions or details you'd like to mention"
                                    className="min-h-[100px]" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end gap-2">
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                              Continue to Schedule
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}
                  
                  {step === 2 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Select Date & Time</h3>
                      <BookingCalendar
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedTime={selectedTime}
                        setSelectedTime={setSelectedTime}
                        selectedDuration={selectedDuration}
                        setSelectedDuration={setSelectedDuration}
                      />
                      
                      <div className="flex justify-between mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => onSubmit(form.getValues())}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={!selectedDate || !selectedTime || isPending}
                        >
                          {isPending ? "Processing..." : "Book and Continue to Payment"}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {step === 3 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Payment</h3>
                      
                      {sessionId ? (
                        <div className="space-y-6">
                          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <h4 className="text-base font-medium text-green-800 mb-2">
                              Session Details
                            </h4>
                            <div className="text-sm text-green-700">
                              <p><span className="font-medium">Name:</span> {form.getValues().studentName}</p>
                              <p><span className="font-medium">Date:</span> {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}</p>
                              <p><span className="font-medium">Time:</span> {selectedTime} IST</p>
                              <p><span className="font-medium">Duration:</span> {selectedDuration} minutes</p>
                              <p><span className="font-medium">Total:</span> ₹{getCost()}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="text-base font-medium">Select Payment Method</h4>
                            <PaymentOptions 
                              amount={getCost()}
                              sessionId={sessionId ?? 0}
                              customerName={form.getValues().studentName}
                              customerEmail={form.getValues().email}
                              customerPhone={form.getValues().phone}
                              onSuccess={handlePaymentSuccess}
                              onFailure={handlePaymentFailure}
                            />
                            
                            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md border border-muted mt-4">
                              <p>
                                By proceeding with payment, you agree to our{' '}
                                <a 
                                  href="/pricing-and-refund-policy" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-green-500 hover:text-green-400 underline"
                                >
                                  refund policy
                                </a>. 
                                Cancellations made more than 48 hours before the session receive a full refund (minus 5% processing fee).
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between mt-6">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setStep(2)}
                            >
                              Back
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <p className="text-muted-foreground">
                            Session information is missing. Please go back and try again.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(1)}
                            className="mt-4"
                          >
                            Start Over
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {step === 4 && (
                    <div className="py-6">
                      <div className="flex flex-col items-center justify-center mb-6">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Payment Successful!</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
                          We will send you a Google Meet link within 4 hours
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg p-4 mb-6">
                        <h4 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">
                          Session Details
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Date:</p>
                            <p className="font-medium">{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Time:</p>
                            <p className="font-medium">{selectedTime} IST</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Duration:</p>
                            <p className="font-medium">{selectedDuration} minutes</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Session Type:</p>
                            <p className="font-medium">{form.getValues().isStudent ? "Student" : "Professional"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Topic:</p>
                            <p className="font-medium">{form.getValues().topic}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Amount Paid:</p>
                            <p className="font-medium">₹{getCost().toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg p-4 mb-6">
                        <h4 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">
                          Your Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Name:</p>
                            <p className="font-medium">{form.getValues().studentName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Email:</p>
                            <p className="font-medium">{form.getValues().email}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Phone:</p>
                            <p className="font-medium">{form.getValues().phone}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg p-4 mb-6">
                        <h4 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">
                          Need to Reschedule?
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                          If you need to change your session date or time, please use the button below. You'll need to verify your email address.
                        </p>
                        <Button 
                          onClick={() => setStep(5)}
                          className="w-full bg-amber-600 hover:bg-amber-700"
                        >
                          <CalendarClock className="mr-2 h-4 w-4" />
                          Reschedule My Session
                        </Button>
                      </div>
                      
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-5 mt-4">
                        <h4 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">
                          Contact Information
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          For any queries regarding your session, please contact us:
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500 dark:text-gray-400">Email:</span>
                            <a href="mailto:projects@bamboomade.in" className="text-green-600 dark:text-green-400 hover:underline">
                              projects@bamboomade.in
                            </a>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                            <a href="tel:+918971690163" className="text-green-600 dark:text-green-400 hover:underline">
                              +91 8971690163
                            </a>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500 dark:text-gray-400">WhatsApp:</span>
                            <a href="https://wa.me/918971690163" className="text-green-600 dark:text-green-400 hover:underline">
                              +91 8971690163
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center mt-8">
                        <Button 
                          onClick={() => window.location.href = "/"} 
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Return Home
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {step === 5 && (
                    <div className="py-6">
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-4">Manage Your Sessions</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                          To view, reschedule, or cancel your sessions, we need to verify your email address first.
                        </p>
                        
                        {!isVerifying && !isEmailVerified && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Email Address</label>
                                <Input 
                                  type="email" 
                                  placeholder="Enter the email you used for booking" 
                                  value={verificationEmail}
                                  onChange={(e) => setVerificationEmail(e.target.value)}
                                  className="w-full"
                                />
                              </div>
                            </div>
                            <Button 
                              onClick={() => {
                                if (!verificationEmail) {
                                  toast({
                                    title: "Email Required",
                                    description: "Please enter your email address",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                sendVerificationCode(verificationEmail);
                              }}
                              className="w-full bg-green-600 hover:bg-green-700"
                              disabled={isSendingCode}
                            >
                              {isSendingCode ? "Sending Code..." : "Send Verification Code"}
                            </Button>
                            <Button 
                              onClick={() => setStep(4)}
                              variant="outline" 
                              className="w-full mt-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        
                        {isVerifying && !isEmailVerified && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Verification Code</label>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                We've sent a 6-digit code to {verificationEmail}
                              </p>
                              <Input 
                                type="text" 
                                placeholder="Enter the 6-digit code" 
                                value={userEnteredCode}
                                onChange={(e) => setUserEnteredCode(e.target.value)}
                                className="w-full"
                                maxLength={6}
                              />
                            </div>
                            <Button 
                              onClick={verifyCode}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              Verify Code
                            </Button>
                            <div className="text-center mt-4">
                              <button 
                                type="button"
                                className="text-sm text-green-600 dark:text-green-400 hover:underline"
                                onClick={() => sendVerificationCode(verificationEmail)}
                                disabled={isSendingCode}
                              >
                                {isSendingCode ? "Sending..." : "Resend Code"}
                              </button>
                              <span className="mx-2 text-gray-400">|</span>
                              <button 
                                type="button"
                                className="text-sm text-green-600 dark:text-green-400 hover:underline"
                                onClick={() => {
                                  setIsVerifying(false);
                                  setVerificationEmail("");
                                  setUserEnteredCode("");
                                }}
                              >
                                Change Email
                              </button>
                            </div>
                            <Button 
                              onClick={() => setStep(4)}
                              variant="outline" 
                              className="w-full mt-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        
                        {isEmailVerified && !userSessions && (
                          <div className="space-y-4">
                            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md p-4">
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                                <p className="text-sm text-green-600 dark:text-green-400">Email verified successfully</p>
                              </div>
                            </div>
                            
                            <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-md p-4">
                              <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5" />
                                <div>
                                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">No sessions found</p>
                                  <p className="text-xs text-amber-500 dark:text-amber-300 mt-1">
                                    We couldn't find any existing sessions for this email. Would you like to book a new session instead?
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-4">
                              <Button 
                                onClick={() => {
                                  setStep(1);
                                  form.setValue("email", verificationEmail);
                                  setIsEmailVerified(false);
                                  setVerificationEmail("");
                                  setUserEnteredCode("");
                                  setUserSessions(null);
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                Book New Session
                              </Button>
                              <Button 
                                onClick={() => setStep(4)}
                                variant="outline" 
                                className="flex-1 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {isEmailVerified && userSessions && (
                          <div>
                            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md p-4">
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                                <p className="text-sm text-green-600 dark:text-green-400">Email verified successfully</p>
                              </div>
                            </div>
                            
                            {userSessions.length > 0 ? (
                              <div className="mb-6">
                                <h4 className="text-base font-medium mb-4">Your Existing Sessions</h4>
                                <div className="space-y-3">
                                  {userSessions.map((session, index) => (
                                    <div 
                                      key={session.id}
                                      className={`p-4 border rounded-md ${
                                        selectedSessionId === session.id 
                                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                          : 'border-gray-200 dark:border-gray-700'
                                      }`}
                                      onClick={() => {
                                        setSelectedSessionId(session.id);
                                        setSessionId(session.id);
                                      }}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-medium text-sm">{session.topic}</h5>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          session.paymentStatus === 'Paid' 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                                        }`}>
                                          {session.paymentStatus}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        <p><span className="font-medium">Date:</span> {session.date}</p>
                                        <p><span className="font-medium">Time:</span> {session.time}</p>
                                        <p><span className="font-medium">Duration:</span> {session.duration} minutes</p>
                                      </div>
                                      <div className="mt-2 flex justify-end gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                          onClick={(e) => {
                                            e.stopPropagation(); // Prevent parent onClick from firing
                                            setSessionToCancelId(session.id);
                                            setIsCancellationDialogOpen(true);
                                          }}
                                        >
                                          <BanIcon className="w-3 h-3 mr-1" />
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className={`text-xs ${
                                            selectedSessionId === session.id
                                              ? 'border-green-500 text-green-600'
                                              : 'border-gray-300 text-gray-600'
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation(); // Prevent parent onClick from firing
                                            setSelectedSessionId(session.id);
                                            setSessionId(session.id);
                                          }}
                                        >
                                          {selectedSessionId === session.id ? 'Selected' : 'Select'}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="mt-6 mb-2">
                                  <div className="flex justify-between items-center">
                                    <h4 className="text-base font-medium">Reschedule Selected Session</h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                                      onClick={() => {
                                        setStep(1);
                                        form.setValue("email", verificationEmail);
                                        setIsEmailVerified(false);
                                        setVerificationEmail("");
                                        setUserEnteredCode("");
                                        setSelectedSessionId(null);
                                      }}
                                    >
                                      <span className="underline">Book New Session Instead</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-md p-4">
                                <div className="flex items-start">
                                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5" />
                                  <div>
                                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">No sessions found</p>
                                    <p className="text-xs text-amber-500 dark:text-amber-300 mt-1">
                                      We couldn't find any existing sessions for this email. Would you like to book a new session instead?
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <Button 
                                    onClick={() => {
                                      setStep(1);
                                      form.setValue("email", verificationEmail);
                                      setIsEmailVerified(false);
                                      setVerificationEmail("");
                                      setUserEnteredCode("");
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                  >
                                    Book New Session
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            <h4 className="text-base font-medium mb-4">Select New Date & Time</h4>
                            <div className="mb-6">
                              <label className="block text-sm font-medium mb-2">Select Session Duration</label>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDuration(30)}
                                  className={`text-center py-2 px-3 text-sm rounded-md ${
                                    selectedDuration === 30 
                                      ? "bg-green-600 text-white"
                                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                  }`}
                                >
                                  30 min
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDuration(60)}
                                  className={`text-center py-2 px-3 text-sm rounded-md ${
                                    selectedDuration === 60 
                                      ? "bg-green-600 text-white"
                                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                  }`}
                                >
                                  60 min
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDuration(90)}
                                  className={`text-center py-2 px-3 text-sm rounded-md ${
                                    selectedDuration === 90
                                      ? "bg-green-600 text-white"
                                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                  }`}
                                >
                                  90 min
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                              <div>
                                <div className="space-y-6">
                                  <div className="space-y-2">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !selectedDate && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={selectedDate}
                                          onSelect={setSelectedDate}
                                          initialFocus
                                          className="rounded-md border"
                                          disabled={(date) => {
                                            // Disable dates in the past and weekends
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const day = date.getDay();
                                            return date < today || day === 0 || day === 6;
                                          }}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-base font-medium mb-4">Available Time Slots</h4>
                                {selectedDate ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    {["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((time) => (
                                      <button
                                        key={time}
                                        type="button"
                                        onClick={() => setSelectedTime(time)}
                                        className={`py-2 px-4 text-center text-sm rounded-md ${
                                          selectedTime === time
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                        }`}
                                      >
                                        {time}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-center">
                                    <p className="text-gray-500 dark:text-gray-400">
                                      Please select a date first
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex space-x-4">
                              <Button 
                                onClick={() => {
                                  if (!selectedDate || !selectedTime) {
                                    toast({
                                      title: "Missing Information",
                                      description: "Please select a date and time for your rescheduled session",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  // Submit the rescheduling request
                                  rescheduleSession();
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                disabled={isReschedulingSession}
                              >
                                {isReschedulingSession ? "Updating..." : "Confirm Reschedule"}
                              </Button>
                              <Button 
                                onClick={() => setStep(4)}
                                variant="outline" 
                                className="flex-1 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <BookText className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium">1. Book a Session</h3>
                      <p className="text-sm text-muted-foreground">
                        Select a date and time that works for you and provide details about your bamboo project.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CalendarIconLucide className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium">2. Receive Confirmation</h3>
                      <p className="text-sm text-muted-foreground">
                        After payment, you'll receive a confirmation email with a Google Meet link for your session.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium">3. Join Your Session</h3>
                      <p className="text-sm text-muted-foreground">
                        Meet with our bamboo expert online at your scheduled time to discuss your project and get personalized guidance.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Session Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span>30-minute Quick Review</span>
                    <span className="font-medium">₹1,505</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span>1-hour Detailed Guidance</span>
                    <span className="font-medium">₹2,505</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>90-minute Comprehensive Review</span>
                    <span className="font-medium">₹3,505</span>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground space-y-2">
                    <p>
                      All sessions include pre-session review of your materials and post-session notes.
                    </p>
                    <p>
                      <a 
                        href="/pricing-and-refund-policy" 
                        className="text-green-500 hover:text-green-400 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View our detailed pricing & refund policy
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProjectGuidance;