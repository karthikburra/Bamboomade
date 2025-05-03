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

const ProjectGuidance = () => {
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
      
      return apiRequest("POST", "/api/project-guidance", sessionData);
    },
    onSuccess: (data: any) => {
      setSessionId(data.id);
      
      // Directly proceed to payment instead of showing payment selection
      initiatePayment(data.id, form.getValues());
      
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
  
  // Function to initiate PhonePe payment directly
  const initiatePayment = async (sessionId: number, values: ProjectGuidanceFormValues) => {
    try {
      toast({
        title: "Processing",
        description: "Setting up your payment...",
      });
      
      const response = await apiRequest('POST', '/api/payments/phonepe/initiate', {
        amount: getCost(),
        sessionId,
        customerName: values.studentName,
        customerPhone: values.phone,
        customerEmail: values.email
      });
      
      const data = await response.json();
      
      if (data.success && data.paymentLink) {
        // Store the transaction ID in local storage for reference
        localStorage.setItem('pendingPaymentTxnId', data.transactionId);
        
        toast({
          title: 'Redirecting to PhonePe',
          description: 'You will be redirected to the PhonePe payment page.',
        });
        
        // Redirect to PhonePe payment page
        window.location.href = data.paymentLink;
      } else {
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
      
      // Fall back to the payment selection page
      setStep(3);
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
                          
                          <div className="flex justify-end mt-6">
                            <Button type="submit">
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
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>
                          Back to Details
                        </Button>
                        <Button 
                          onClick={() => form.handleSubmit(onSubmit)()}
                          disabled={!selectedDate || !selectedTime || !selectedDuration || isPending}
                        >
                          {isPending ? "Processing..." : "Continue to Payment"}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {step === 3 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Complete Payment</h3>
                      {sessionId && (
                        <>
                          <div className="mb-6">
                            <h4 className="text-md font-medium mb-4 text-center">Choose a Payment Method</h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="bg-gradient-to-br from-purple-900/90 to-purple-800/80 p-5 rounded-lg shadow-lg border border-purple-600">
                                <div className="text-center mb-3">
                                  <span className="inline-block bg-purple-700/80 text-white px-4 py-1 rounded-full text-sm font-medium">
                                    RECOMMENDED PAYMENT METHOD
                                  </span>
                                </div>
                                <div className="bg-white/10 p-1 rounded-lg">
                                  <PhonePePaymentForm 
                                    sessionId={sessionId} 
                                    amount={getCost()}
                                    customerName={form.getValues().studentName}
                                    customerEmail={form.getValues().email}
                                    customerPhone={form.getValues().phone}
                                    onSuccess={handlePaymentSuccess}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="text-center mb-2">
                                  <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                                    ALTERNATIVE
                                  </span>
                                </div>
                                <PaymentForm 
                                  sessionId={sessionId} 
                                  amount={getCost()}
                                  onSuccess={handlePaymentSuccess}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="mt-6">
                        <Button variant="ghost" onClick={() => setStep(2)} className="text-sm">
                          Back to schedule
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {step === 4 && (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                        <CheckCircle size={32} />
                      </div>
                      <h3 className="text-xl font-medium mb-2">Booking Confirmed!</h3>
                      <p className="text-muted-foreground mb-6">
                        Your project guidance session has been scheduled for:
                        {selectedDate && selectedTime && (
                          <span className="block font-medium text-foreground mt-2">
                            {format(selectedDate, "MMMM d, yyyy")} at {selectedTime}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        We've sent a confirmation email with all the details. Our expert will contact you before the session.
                      </p>
                      <Button onClick={() => window.location.href = "/"}>
                        Return to Home
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Session Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="font-medium text-lg mb-2">What to Expect</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Our project guidance sessions provide personalized support for students working on bamboo architecture projects.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <BookText className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                        <span>Expert guidance on bamboo material selection and techniques</span>
                      </li>
                      <li className="flex items-start">
                        <BookText className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                        <span>Project-specific design and structural advice</span>
                      </li>
                      <li className="flex items-start">
                        <BookText className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                        <span>Portfolio review and career guidance</span>
                      </li>
                      <li className="flex items-start">
                        <BookText className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                        <span>Resource recommendations and networking opportunities</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="font-medium text-lg mb-2">Session Details</h3>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Duration:</span>
                        <span className="text-sm font-medium">{selectedDuration} minutes</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Cost:</span>
                        <span className="text-sm font-medium">₹{getCost().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Format:</span>
                        <span className="text-sm font-medium">Online Video Call</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Materials:</span>
                        <span className="text-sm font-medium">Included</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2">Cancellation Policy</h3>
                    <p className="text-muted-foreground text-sm">
                      Free cancellation up to 24 hours before your session. After that, a 50% fee applies. Contact us directly for rescheduling.
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
};

export default ProjectGuidance;