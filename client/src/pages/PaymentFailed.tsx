import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PaymentFailed() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [reason, setReason] = useState<string>("An error occurred during the payment process");
  
  // Extract error reason from query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorReason = params.get("reason");
    
    if (errorReason) {
      setReason(decodeURIComponent(errorReason));
    }
    
    // Show toast notification
    toast({
      title: "Payment Failed",
      description: "We encountered an issue processing your payment. Please try again.",
      variant: "destructive",
    });
  }, [toast]);

  return (
    <>
      <Helmet>
        <title>Payment Failed | BambooMade</title>
        <meta name="description" content="We encountered an issue processing your payment. Please try again or contact support for assistance." />
      </Helmet>
      
      <div className="bg-background py-16">
        <div className="container max-w-5xl px-4 mx-auto">
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
              <CardTitle className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="text-white h-10 w-10" />
                </div>
                <span className="text-2xl font-bold">Payment Failed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-8 px-6">
              <div className="text-center mb-6">
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  We encountered an issue while processing your payment.
                </p>
                <p className="text-red-600 dark:text-red-400 font-medium mt-2">
                  Error: {reason}
                </p>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-lg mb-2">What happened?</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    Your payment could not be processed successfully.
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    This might be due to insufficient funds, network issues, or other payment gateway errors.
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    Your session has not been booked and no payment has been taken from your account.
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    You can try again with a different payment method or contact us for assistance.
                  </li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
                <Button 
                  variant="outline" 
                  className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Home
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => navigate("/project-guidance")}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}