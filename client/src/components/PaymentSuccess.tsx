import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Copy, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface PaymentSuccessProps {
  paymentId: string;
  sessionId: number;
}

export default function PaymentSuccess({ paymentId, sessionId }: PaymentSuccessProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [meetLink, setMeetLink] = useState<string>('');
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(meetLink).then(() => {
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Meet link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive"
      });
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM do, yyyy');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  // Calculate end time
  const getEndTime = (dateString: string, durationMinutes: number) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return format(date, 'h:mm a');
  };

  if (loading) {
    return (
      <Card className="max-w-xl mx-auto bg-white dark:bg-gray-900 border-green-200/50 dark:border-green-800/30">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 dark:text-green-500 mb-4" />
            <p className="text-green-600 dark:text-green-400">Retrieving your session details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use the calendar link from the API response - it includes projects@bamboomade.in as the host
  const getCalendarLink = () => {
    if (!sessionDetails) return '#';
    return sessionDetails.calendarLink || '#';
  };

  return (
    <Card className="max-w-xl mx-auto bg-white dark:bg-gray-900 border-green-200/50 dark:border-green-800/30 text-gray-800 dark:text-white">
      <CardHeader className="bg-green-50 dark:bg-green-900/30 border-b border-green-100 dark:border-green-800/30">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
          <div>
            <CardTitle className="text-xl text-green-600 dark:text-green-400">Payment Successful!</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Google Meet link will be updated soon, please check your View My Session for updates
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        {sessionDetails && (
          <>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-green-600 dark:text-green-400">Session Details</h3>
              <div className="space-y-1 text-sm">
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                  <span className="font-medium text-gray-800 dark:text-white">{formatDate(sessionDetails.date)}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Time:</span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {formatTime(sessionDetails.date)} - {getEndTime(sessionDetails.date, sessionDetails.duration)}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="font-medium text-gray-800 dark:text-white">{sessionDetails.duration} minutes</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Topic:</span>
                  <span className="font-medium text-gray-800 dark:text-white">{sessionDetails.topic}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Payment ID:</span>
                  <span className="font-medium text-gray-600 dark:text-gray-300 text-xs">{paymentId}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-green-100 dark:border-green-800/30 mt-5">
              <h3 className="text-lg font-medium text-green-600 dark:text-green-400 mt-4">Contact Information</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                For any queries regarding your session, please contact us:
              </p>
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
  );
}