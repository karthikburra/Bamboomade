import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { Check, Calendar, Clock } from "lucide-react";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // Extract query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionIdParam = params.get("sessionId");
    const txnIdParam = params.get("txnId");
    
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    }
    
    if (txnIdParam) {
      setTransactionId(txnIdParam);
    }
    
    // Show toast notification
    toast({
      title: "Payment Successful",
      description: "Your project guidance session has been booked successfully.",
      variant: "default",
    });
    
    // Clean up any pending payment data from localStorage
    localStorage.removeItem('pendingPaymentTxnId');
  }, [toast]);

  return (
    <>
      <Helmet>
        <title>Payment Successful | BambooMade</title>
        <meta name="description" content="Your payment has been processed successfully and your project guidance session has been booked." />
      </Helmet>
      
      <div className="bg-background py-16">
        <div className="container max-w-5xl px-4 mx-auto">
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/30">
              <CardTitle className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                  <Check className="text-white h-10 w-10" />
                </div>
                <span className="text-2xl font-bold">Payment Successful</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-8 px-6">
              <div className="text-center mb-6">
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  Thank you for booking a project guidance session with BambooMade.
                  Your payment has been successfully processed.
                </p>
                {sessionId && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Session ID: {sessionId}
                  </p>
                )}
                {transactionId && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Transaction ID: {transactionId}
                  </p>
                )}
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-lg mb-2 flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Next Steps
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    You will receive a confirmation email with the session details.
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    The email will include a Google Meet link for your scheduled session.
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Please be prepared to join the session 5 minutes before the scheduled time.
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Have your project-related questions and materials ready for a productive discussion.
                  </li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
                <Button 
                  variant="outline" 
                  className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                  onClick={() => navigate("/project-guidance")}
                >
                  Book Another Session
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => navigate("/")}
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}