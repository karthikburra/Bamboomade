import { Helmet } from "react-helmet";
import { useState } from "react";
import { format } from "date-fns";
import { BookText, CalendarCheck, Calendar, CheckCircle, GraduationCap, Briefcase, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import PaymentForm from "@/components/PaymentForm";
import PhonePePaymentForm from "@/components/PhonePePaymentForm";

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
  const [step, setStep] = useState(1); // 1: Schedule, 2: Details, 3: Payment, 4: Confirmation
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default 60 minutes
  const [sessionId, setSessionId] = useState<number | null>(null);
  
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
  
  // Function to directly initiate PhonePe payment
  const initiatePayment = async (sessionId: number, values: ProjectGuidanceFormValues) => {
    try {
      toast({
        title: "Processing",
        description: "Setting up your payment...",
      });
      
      console.log("Initiating direct payment with sessionId:", sessionId);
      
      // Add more debugging to see what's happening
      console.log("Making PhonePe payment API request with data:", {
        amount: getCost(),
        sessionId,
        customerName: values.studentName,
        phone: values.phone,
        email: values.email
      });
      
      const response = await apiRequest('POST', '/api/payments/phonepe/initiate', {
        amount: getCost(),
        sessionId, // Ensure sessionId is explicitly set
        customerName: values.studentName,
        customerPhone: values.phone,
        customerEmail: values.email
      });
      
      // Log all raw response details
      console.log("Raw API response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: response.headers
      });
      
      const data = await response.json();
      
      // Log parsed data with specifics to help debug
      console.log("Parsed response data:", {
        success: data.success,
        hasPaymentLink: !!data.paymentLink,
        hasTransactionId: !!data.transactionId,
        message: data.message,
        error: data.error,
        fullData: data
      });
      
      if (data.success && data.paymentLink) {
        // Store the transaction ID in local storage for reference
        localStorage.setItem('pendingPaymentTxnId', data.transactionId);
        
        toast({
          title: 'Redirecting to PhonePe',
          description: 'You will be redirected to the PhonePe payment page.',
        });
        
        // Small delay to ensure the toast is shown before redirecting
        setTimeout(() => {
          // Redirect to PhonePe payment page
          window.location.href = data.paymentLink;
        }, 1500);
      } else {
        console.error("PhonePe payment initialization failed:", data.message || data.error);
        toast({
          title: 'Payment Initialization Failed',
          description: data.message || data.error || 'Could not start the payment process. Please try again.',
          variant: 'destructive',
        });
        
        // Fall back to the payment selection page
        setStep(3);
      }
    } catch (error) {
      console.error('PhonePe payment client-side error:', error);
      toast({
        title: 'Payment Error',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive',
      });
      
      // If we have a valid session ID, show the payment selection page
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
  
  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: "Your project guidance session has been confirmed. Check your email for details.",
    });
    setStep(4); // Move to success step
  };
  
  return (
    <>
      <Helmet>
        <title>Project Guidance | BambooMade</title>
        <meta name="description" content="Book a project guidance session with bamboo architecture experts to get personalized guidance for your academic or professional bamboo projects." />
      </Helmet>
      
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
                          <Calendar size={16} />
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
                      <h3 className="text-lg font-medium mb-4">Your Information</h3>
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
                            <h4 className="text-base font-medium">Pay with PhonePe</h4>
                            <PhonePePaymentForm 
                              amount={getCost()}
                              sessionId={sessionId}
                              customerName={form.getValues().studentName}
                              customerEmail={form.getValues().email}
                              customerPhone={form.getValues().phone}
                              onSuccess={handlePaymentSuccess}
                            />
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
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-green-600 mb-2">Booking Confirmed</h3>
                      <p className="text-muted-foreground mb-6">
                        Thank you for booking a project guidance session with BambooMade. You will receive a confirmation email with a Google Meet link for your session.
                      </p>
                      <Button 
                        onClick={() => window.location.href = "/"} 
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Return Home
                      </Button>
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
                      <Calendar className="w-4 h-4 text-green-600" />
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
                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>
                      All sessions include pre-session review of your materials and post-session notes.
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