import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
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
      
      const response = await apiRequest('POST', '/api/payments/phonepe/initiate', {
        amount,
        sessionId,
        customerName,
        customerPhone,
        customerEmail
      });
      
      const data = await response.json();
      
      if (data.success && data.paymentLink) {
        // Store the transaction ID in local storage for reference (optional)
        localStorage.setItem('pendingPaymentTxnId', data.transactionId);
        
        // Redirect to PhonePe payment page
        window.location.href = data.paymentLink;
        
        // onSuccess will be called after the user returns to our site 
        // via the callback URL and the payment is verified
      } else {
        toast({
          title: 'Payment Initialization Failed',
          description: data.message || 'Could not start the payment process. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('PhonePe payment error:', error);
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
          <h3 className="text-lg font-medium">PhonePe Payment</h3>
          <p className="text-muted-foreground">Total Amount: ₹{amount.toLocaleString()}</p>
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
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay with PhonePe ₹{amount.toLocaleString()}
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by PhonePe
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhonePePaymentForm;