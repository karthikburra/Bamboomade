import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
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
  const [step, setStep] = useState(1); // 1: Schedule, 2: Details, 3: Payment, 4: Confirmation
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default 60 minutes
  const [sessionId, setSessionId] = useState<number | null>(null);
  
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
                            <p className="text-gray-500 dark:text-gray-400">Topic:</p>
                            <p className="font-medium">{form.getValues().topic}</p>
                          </div>
                        </div>
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