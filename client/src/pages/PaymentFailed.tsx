import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const PaymentFailed = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [errorReason, setErrorReason] = useState<string>('');
  
  // Parse the query parameters to get the error reason
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason') || 'Unknown error occurred';
    setErrorReason(decodeURIComponent(reason));
    
    // Clean up any stored transaction ID from local storage
    localStorage.removeItem('pendingPaymentTxnId');
    
    // Show error toast
    toast({
      title: 'Payment Failed',
      description: 'There was an issue processing your payment.',
      variant: 'destructive',
    });
  }, [toast]);

  return (
    <div className="container max-w-md mx-auto py-12">
      <Card className="border-red-500">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
          <p className="text-muted-foreground mb-4">
            We couldn't process your payment for the project guidance session.
          </p>
          <div className="bg-red-50 p-3 rounded-md mb-4">
            <p className="text-sm text-red-600">
              {errorReason}
            </p>
          </div>
          <p className="text-sm mb-2">
            Please try again or contact our support team if the issue persists.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setLocation('/')}>
            Return to Home
          </Button>
          <Button onClick={() => setLocation('/project-guidance')}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentFailed;