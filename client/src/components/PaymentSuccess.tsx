import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet';

interface PaymentSuccessProps {
  paymentId: string;
  sessionId: number;
}

export default function PaymentSuccess({ paymentId, sessionId }: PaymentSuccessProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [meetLink, setMeetLink] = useState<string>('');

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        // Fetch the session details including the generated Google Meet link
        const response = await apiRequest('GET', `/api/session-details/${sessionId}?paymentId=${paymentId}`);
        const data = await response.json();
        
        if (data.success) {
          setSessionDetails(data.session);
          setMeetLink(data.meetLink);
        } else {
          toast({
            title: "Error retrieving session details",
            description: data.message || "Could not fetch your session details",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, paymentId, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM do, yyyy');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  // Calculate end time
  const getEndTime = (dateString: string, durationMinutes: number) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return format(date, 'HH:mm');
  };

  if (loading) {
    return (
      <Card className="max-w-xl mx-auto bg-white dark:bg-gray-900 border-green-200/50 dark:border-green-800/30">
        <CardHeader className="bg-green-50 dark:bg-green-900/30 border-b border-green-100 dark:border-green-800/30">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
            <div>
              <CardTitle className="text-xl text-green-600 dark:text-green-400">Payment Successful!</CardTitle>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                We're preparing your session details...
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 dark:text-green-500 mb-4" />
            <div className="text-green-600 dark:text-green-400">Your payment has been confirmed</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
              Payment ID: {paymentId}<br/>
              Session ID: {sessionId}<br/><br/>
              Loading complete details and Google Meet link...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Helmet>
        <title>Payment Successful - Bamboo Made Project Guidance</title>
        <meta name="description" content="Your payment for BambooMade project guidance has been successfully processed. View your session details and contact information." />
      </Helmet>
      
      <Card className="max-w-xl mx-auto bg-white dark:bg-gray-900 border-green-200/50 dark:border-green-800/30 text-gray-800 dark:text-white">
        <CardHeader className="bg-green-50 dark:bg-green-900/30 border-b border-green-100 dark:border-green-800/30">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
            <div>
              <CardTitle className="text-xl text-green-600 dark:text-green-400">Payment Successful!</CardTitle>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Google Meet link will be updated soon, please check your View My Session for updates
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          {sessionDetails && (
            <>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-green-600 dark:text-green-400">Session Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{formatDate(sessionDetails.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time:</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {formatTime(sessionDetails.date)} - {getEndTime(sessionDetails.date, sessionDetails.duration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{sessionDetails.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Topic:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{sessionDetails.topic}</span>
                  </div>
                  {sessionDetails.notes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Notes:</span>
                      <span className="font-medium text-gray-800 dark:text-white text-right">{sessionDetails.notes}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Payment ID:</span>
                    <span className="font-medium text-gray-600 dark:text-gray-300 text-xs">{paymentId}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t border-green-100 dark:border-green-800/30 mt-5">
                <h3 className="text-lg font-medium text-green-600 dark:text-green-400 mt-4">Your Information</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{sessionDetails.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{sessionDetails.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{sessionDetails.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Student/Professional:</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {sessionDetails.isStudent ? 'Student' : 'Professional'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      ₹{sessionDetails.isStudent ? 
                        (sessionDetails.duration === 30 ? '500' : '800') : 
                        (sessionDetails.duration === 30 ? '1,000' : '1,500')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-green-100 dark:border-green-800/30 mt-5">
                <h3 className="text-lg font-medium text-green-600 dark:text-green-400 mt-4">Contact Information</h3>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  For any queries regarding your session, please contact us:
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <a href="mailto:projects@bamboomade.in" className="text-green-600 dark:text-green-400 hover:underline">
                      projects@bamboomade.in
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <a href="tel:+918971690163" className="text-green-600 dark:text-green-400 hover:underline">
                      +91 8971690163
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">WhatsApp:</span>
                    <a href="https://wa.me/918971690163" className="text-green-600 dark:text-green-400 hover:underline">
                      +91 8971690163
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between space-x-3">
          <Button 
            variant="default" 
            className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
            onClick={() => window.location.href = "/view-my-sessions"}
          >
            View My Sessions
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 border-green-500 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
            onClick={() => window.location.href = "/"}
          >
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}