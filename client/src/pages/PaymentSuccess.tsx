import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const PaymentSuccess = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Parse the query parameters to get the session ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sessionId');
    setSessionId(id);
    
    // Clean up any stored transaction ID from local storage
    localStorage.removeItem('pendingPaymentTxnId');
    
    // Show success toast
    toast({
      title: 'Payment Successful',
      description: 'Your project guidance session has been booked successfully.',
      variant: 'default',
    });
  }, [toast]);

  return (
    <div className="container max-w-md mx-auto py-12">
      <Card className="border-green-500">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you for booking a project guidance session with BambooMade. Your payment has been processed successfully.
          </p>
          {sessionId && (
            <p className="text-sm mb-4">
              Session Reference: <span className="font-mono">{sessionId}</span>
            </p>
          )}
          <p className="text-sm text-green-600 mb-2">
            We'll contact you shortly with more details about your session.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => setLocation('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentSuccess;