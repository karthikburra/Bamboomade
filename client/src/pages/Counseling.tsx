import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Helmet } from "react-helmet";
import BookingCalendar from "@/components/BookingCalendar";
import PaymentForm from "@/components/PaymentForm";
import { CalendarCheck, GraduationCap, Clock, Calendar, CheckCircle } from "lucide-react";

// Form schema based on the counseling session model
const counselingFormSchema = z.object({
  studentName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  topic: z.string().min(5, "Topic must be at least 5 characters"),
  notes: z.string().optional(),
});

type CounselingFormValues = z.infer<typeof counselingFormSchema>;

const Counseling: React.FC = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState<number | null>(null);
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  
  // Calculate cost based on duration
  const getCost = () => {
    switch (selectedDuration) {
      case 30: return 1500;
      case 90: return 3500;
      default: return 2500; // 60 minutes
    }
  };
  
  // Form setup
  const form = useForm<CounselingFormValues>({
    resolver: zodResolver(counselingFormSchema),
    defaultValues: {
      studentName: "",
      email: "",
      phone: "",
      topic: "",
      notes: "",
    },
  });
  
  // Session booking mutation
  const { mutate: bookSession, isPending } = useMutation({
    mutationFn: async (data: CounselingFormValues) => {
      // Combine form data with selected date/time/duration
      if (!selectedDate || !selectedTime) {
        throw new Error("Please select a date and time");
      }
      
      // Parse the time and create a proper date object
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const sessionDate = new Date(selectedDate);
      sessionDate.setHours(hours, minutes, 0, 0);
      
      const sessionData = {
        ...data,
        date: sessionDate.toISOString(),
        duration: selectedDuration,
      };
      
      return apiRequest("POST", "/api/counseling", sessionData);
    },
    onSuccess: (data) => {
      toast({
        title: "Session Booked",
        description: "Please complete the payment to confirm your session.",
      });
      setSessionId(data.id);
      setStep(3); // Move to payment step
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: CounselingFormValues) => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your session",
        variant: "destructive",
      });
      return;
    }
    
    bookSession(values);
  };
  
  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: "Your counseling session has been confirmed. Check your email for details.",
    });
    setStep(4); // Move to success step
  };
  
  return (
    <>
      <Helmet>
        <title>Student Counseling | BambooMade</title>
        <meta name="description" content="Book a counseling session with bamboo architecture experts to get personalized guidance for your academic and career goals." />
      </Helmet>
      
      <div className="bg-background py-12">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Student Counseling Sessions
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Get personalized guidance from our bamboo architecture experts to help with your academic projects and career goals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Book Your Counseling Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex justify-between mb-4">
                      <div className={`flex items-center ${step >= 1 ? "text-primary-600" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 1 ? "bg-primary-100 text-primary-600" : "bg-muted text-muted-foreground"}`}>
                          <CalendarCheck size={16} />
                        </div>
                        <span>Schedule</span>
                      </div>
                      <Separator className="w-10 my-4 mx-2" />
                      <div className={`flex items-center ${step >= 2 ? "text-primary-600" : "text-muted-foreground"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 2 ? "bg-primary-100 text-primary-600" : "bg-muted text-muted-foreground"}`}>
                          <GraduationCap size={16} />
                        </div>
                        <span>Details</span>
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
                      <h3 className="text-lg font-medium mb-4">Select Date & Time</h3>
                      <BookingCalendar
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedTime={selectedTime}
                        setSelectedTime={setSelectedTime}
                        selectedDuration={selectedDuration}
                        setSelectedDuration={setSelectedDuration}
                      />
                      <div className="mt-6 flex justify-end">
                        <Button 
                          onClick={() => setStep(2)} 
                          disabled={!selectedDate || !selectedTime || !selectedDuration}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {step === 2 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Your Information</h3>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          
                          <div className="flex justify-between mt-6">
                            <Button type="button" variant="outline" onClick={() => setStep(1)}>
                              Back
                            </Button>
                            <Button type="submit" disabled={isPending}>
                              {isPending ? "Processing..." : "Continue to Payment"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}
                  
                  {step === 3 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Complete Payment</h3>
                      {sessionId && (
                        <PaymentForm 
                          sessionId={sessionId} 
                          amount={getCost()}
                          onSuccess={handlePaymentSuccess}
                        />
                      )}
                      <div className="mt-6">
                        <Button variant="ghost" onClick={() => setStep(2)} className="text-sm">
                          Back to details
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
                        Your counseling session has been scheduled for:
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
                  <CardTitle>Counseling Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-primary-600 mt-1 mr-3" />
                      <div>
                        <p className="font-medium">Session Duration</p>
                        <p className="text-muted-foreground">{selectedDuration} minutes</p>
                      </div>
                    </div>
                    
                    {selectedDate && (
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-primary-600 mt-1 mr-3" />
                        <div>
                          <p className="font-medium">Selected Date</p>
                          <p className="text-muted-foreground">
                            {format(selectedDate, "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedTime && (
                      <div className="flex items-start">
                        <Clock className="h-5 w-5 text-primary-600 mt-1 mr-3" />
                        <div>
                          <p className="font-medium">Selected Time</p>
                          <p className="text-muted-foreground">{selectedTime}</p>
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div>
                      <p className="font-medium">Cost</p>
                      <p className="text-2xl font-bold">₹{getCost().toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Fees include personalized guidance, project review, and follow-up communication.
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h3 className="font-medium mb-2">What to Expect</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• One-on-one guidance from bamboo architecture experts</li>
                      <li>• Project feedback and improvement suggestions</li>
                      <li>• Material recommendations and technical advice</li>
                      <li>• Career guidance in sustainable architecture</li>
                      <li>• Post-session resource sharing</li>
                    </ul>
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

export default Counseling;
