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
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-500 mb-4" />
        <p className="text-green-600 dark:text-green-400">Retrieving your session details...</p>
      </div>
    );
  }

  // Create calendar event link
  const createCalendarLink = () => {
    if (!sessionDetails) return '#';
    
    const startDate = new Date(sessionDetails.date);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + sessionDetails.duration);
    
    const startTime = format(startDate, "yyyyMMdd'T'HHmmss");
    const endTime = format(endDate, "yyyyMMdd'T'HHmmss");
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=BambooMade%20Project%20Guidance%20Session&dates=${startTime}/${endTime}&details=Join%20this%20Google%20Meet%20link:%20${encodeURIComponent(meetLink)}%0A%0ATopic:%20${encodeURIComponent(sessionDetails.topic)}&location=${encodeURIComponent(meetLink)}`;
  };

  return (
    <Card className="max-w-xl mx-auto bg-gray-900 border-green-800/30 text-white">
      <CardHeader className="bg-green-900/30 border-b border-green-800/30">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div>
            <CardTitle className="text-xl text-green-400">Payment Successful!</CardTitle>
            <CardDescription className="text-gray-400">
              Your BambooMade project guidance session is confirmed
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        {sessionDetails && (
          <>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-green-400">Session Details</h3>
              <div className="space-y-1 text-sm">
                <p className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="font-medium text-white">{formatDate(sessionDetails.date)}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Time:</span>
                  <span className="font-medium text-white">
                    {formatTime(sessionDetails.date)} - {getEndTime(sessionDetails.date, sessionDetails.duration)}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-medium text-white">{sessionDetails.duration} minutes</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Topic:</span>
                  <span className="font-medium text-white">{sessionDetails.topic}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Payment ID:</span>
                  <span className="font-medium text-gray-300 text-xs">{paymentId}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <h3 className="text-lg font-medium text-green-400">Your Google Meet Link</h3>
              <div className="bg-gray-800 p-3 rounded flex items-center justify-between">
                <div className="truncate mr-2 text-gray-300 text-sm">
                  {meetLink}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy}
                  className="border-green-700 hover:bg-green-900 hover:text-green-400"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Join this link at the scheduled time. The session will be hosted by projects@bamboomade.in
              </p>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex-col space-y-3">
        <Button 
          className="w-full flex items-center bg-green-700 hover:bg-green-600 text-white"
          onClick={() => window.open(meetLink, '_blank')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Google Meet
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full flex items-center border-green-700 text-green-400 hover:bg-green-900/30"
          onClick={() => window.open(createCalendarLink(), '_blank')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Add to Google Calendar
        </Button>
      </CardFooter>
    </Card>
  );
}