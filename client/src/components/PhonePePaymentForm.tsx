import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PhoneCall } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PhonePePaymentFormProps {
  sessionId: number;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: () => void;
}

const PhonePePaymentForm = ({
  sessionId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess
}: PhonePePaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const initiatePhonePePayment = async () => {
    try {
      setIsLoading(true);
      
      console.log("Initiating PhonePe payment with details:", {
        hasAmount: !!amount,
        hasSessionId: !!sessionId,
        hasCustomerInfo: !!(customerName && customerPhone && customerEmail)
      });
      
      const response = await apiRequest('POST', '/api/payments/phonepe/initiate', {
        amount,
        sessionId,
        customerName,
        customerPhone,
        customerEmail
      });
      
      console.log("PhonePe payment API response received:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      const data = await response.json();
      console.log("PhonePe payment data:", {
        success: data.success,
        hasPaymentLink: !!data.paymentLink,
        hasTransactionId: !!data.transactionId,
        message: data.message,
        error: data.error
      });
      
      if (data.success && data.paymentLink) {
        // Store the transaction ID in local storage for reference
        localStorage.setItem('pendingPaymentTxnId', data.transactionId);
        toast({
          title: 'Redirecting to PhonePe',
          description: 'You will be redirected to the PhonePe payment page.',
        });
        
        // Small delay to ensure the toast is shown
        setTimeout(() => {
          // Redirect to PhonePe payment page
          window.location.href = data.paymentLink;
        }, 1500);
        
        // onSuccess will be called after the user returns to our site 
        // via the callback URL and the payment is verified
      } else {
        console.error("PhonePe payment initialization failed:", data.message || data.error);
        toast({
          title: 'Payment Initialization Failed',
          description: data.message || data.error || 'Could not start the payment process. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('PhonePe payment client-side error:', error);
      toast({
        title: 'Payment Error',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-primary-50 p-2 rounded-full">
              <PhoneCall className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium ml-2">PhonePe Payment</h3>
          </div>
          <div className="bg-primary-50 py-2 px-4 rounded-lg">
            <p className="font-medium text-primary-700">Total Amount: ₹{amount.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Name</Label>
            <Input
              id="customerName"
              value={customerName}
              disabled
              readOnly
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone</Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              disabled
              readOnly
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              value={customerEmail}
              disabled
              readOnly
            />
          </div>
          
          <Button
            onClick={initiatePhonePePayment}
            className="w-full bg-primary-600 hover:bg-primary-700" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <PhoneCall className="mr-2 h-4 w-4" />
                Pay with PhonePe ₹{amount.toLocaleString()}
              </>
            )}
          </Button>
          
          <div className="mt-3 flex items-center justify-center space-x-2">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11V7C7 5.93913 7.42143 4.92172 8.17157 4.17157C8.92172 3.42143 9.93913 3 11 3C12.0609 3 13.0783 3.42143 13.8284 4.17157C14.5786 4.92172 15 5.93913 15 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-xs text-muted-foreground">
              Secure payment powered by PhonePe
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhonePePaymentForm;