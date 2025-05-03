import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PhoneCall } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PhonePePaymentFormProps {
  sessionId: number | null;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
}

const PhonePePaymentForm = ({
  sessionId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure
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
        const errorMessage = data.message || data.error || 'Could not start the payment process. Please try again.';
        console.error("PhonePe payment initialization failed:", errorMessage);
        toast({
          title: 'Payment Initialization Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        setIsLoading(false);
        onFailure(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'There was an error processing your payment. Please try again.';
      console.error('PhonePe payment client-side error:', error);
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      onFailure(errorMessage);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-300 dark:from-purple-900/50 dark:to-purple-800/30 dark:border-purple-700">
      <CardContent className="pt-6">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-purple-100 p-3 rounded-full shadow-sm dark:bg-purple-800">
              <svg viewBox="0 0 512 512" width="28" height="28" className="text-purple-600 dark:text-purple-200">
                <path fill="currentColor" d="M385.35,264.2c-3.11-10.46-9.71-14.86-20.74-14.83-18.05.06-36.1,0-54.15.08-2,0-2.49-.61-2.46-2.5.1-6.88.05-13.76,0-20.64,0-1.48.35-2.13,2-2.12,18.43.08,36.86,0,55.29.08,10.49,0,17.11-4.29,20.21-14.33s.15-19.46-6.61-26.15a219,219,0,0,0-59.92-32.7A207.35,207.35,0,0,0,256,136.9a211.34,211.34,0,0,0-62.9,10.08c-22.8,7.21-43.08,18.23-60.53,33.92-7,6.29-9.93,13.8-7,24.07,2.79,9.76,9.6,14.23,19.75,14.24,18.43,0,36.86.11,55.29-.09,2.44,0,2.8.71,2.87,2.92.25,7.78.71,15.59-.21,23.32-1.09,9.26-8.75,17.74-18.76,15.86-12.58-2.38-25.06-5.22-37.5-8.26-5.39-1.31-10.66-3.1-16-4.59-10.44-2.93-17.92.29-22.78,9.79-5.19,10.16-4.84,20.46,1.42,30.06,6.6,10.13,15.67,17.11,25.54,23s20.42,10.62,31.13,15.27a210.59,210.59,0,0,0,65.56,16.06c5.08.45,10.21.59,15.31.94,2.11.14,2.71.71,2.66,2.82-.09,7.44-.08,14.88,0,22.32,0,1.86-.34,2.72-2.43,2.69-15.43-.16-30.86-.1-46.28-.11a36.45,36.45,0,0,0-23.56,8.45c-10.3,8.4-11.43,21.16-2.4,31.55,6.14,7.07,14.35,10.67,22.89,13.56a225.33,225.33,0,0,0,106,10.8,206.35,206.35,0,0,0,57.77-17.28,75.09,75.09,0,0,0,12.45-7.68c9.59-7.3,10.71-18.69,2.83-27.9-7.14-8.36-16.38-12.19-27.24-12.23-14.21,0-28.42-.24-42.63.14-4.21.11-6.95-1.15-6.38-5.66.69-5.5.25-11.13.31-16.7,0-2.28,1-2.66,2.91-2.65,17.75,0,35.51-.13,53.26.08,12.36.14,20.47-7.35,20.19-19.79a23.16,23.16,0,0,0-6.92-16.5c-7.19-7.32-15.78-12.69-24.78-17.58-12.83-7-26.13-12.68-40.07-16.92-19.92-6-40.23-9.4-60.94-9.89-1.92-.05-2.45-.5-2.4-2.43.1-4.55,0-9.1,0-13.65,0-3,.11-6-.06-9-.16-2.56.68-3.18,3.19-3.15,16.75.18,33.5.08,50.25.08a105.41,105.41,0,0,0,10.73-.35c6.86-.81,12.07-6.17,13.37-13a28.77,28.77,0,0,0,.38-5C386,267.44,386,265.83,385.35,264.2Z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold ml-3 text-purple-700 dark:text-purple-300">PhonePe Payment</h3>
          </div>
          <div className="bg-purple-100 py-3 px-4 rounded-lg shadow-sm dark:bg-purple-800/50">
            <p className="font-semibold text-purple-800 dark:text-purple-200 text-lg">Total Amount: ₹{amount.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-purple-700 dark:text-purple-300">Name</Label>
              <Input
                id="customerName"
                value={customerName}
                disabled
                readOnly
                className="bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="text-purple-700 dark:text-purple-300">Phone</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                disabled
                readOnly
                className="bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerEmail" className="text-purple-700 dark:text-purple-300">Email</Label>
              <Input
                id="customerEmail"
                value={customerEmail}
                disabled
                readOnly
                className="bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700"
              />
            </div>
          </div>
          
          <Button
            onClick={initiatePhonePePayment}
            className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white shadow-md dark:bg-purple-700 dark:hover:bg-purple-600" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                <span className="text-lg">Processing Payment...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 512 512" width="24" height="24" className="mr-3">
                  <path fill="currentColor" d="M385.35,264.2c-3.11-10.46-9.71-14.86-20.74-14.83-18.05.06-36.1,0-54.15.08-2,0-2.49-.61-2.46-2.5.1-6.88.05-13.76,0-20.64,0-1.48.35-2.13,2-2.12,18.43.08,36.86,0,55.29.08,10.49,0,17.11-4.29,20.21-14.33s.15-19.46-6.61-26.15a219,219,0,0,0-59.92-32.7A207.35,207.35,0,0,0,256,136.9a211.34,211.34,0,0,0-62.9,10.08c-22.8,7.21-43.08,18.23-60.53,33.92-7,6.29-9.93,13.8-7,24.07,2.79,9.76,9.6,14.23,19.75,14.24,18.43,0,36.86.11,55.29-.09,2.44,0,2.8.71,2.87,2.92.25,7.78.71,15.59-.21,23.32-1.09,9.26-8.75,17.74-18.76,15.86-12.58-2.38-25.06-5.22-37.5-8.26-5.39-1.31-10.66-3.1-16-4.59-10.44-2.93-17.92.29-22.78,9.79-5.19,10.16-4.84,20.46,1.42,30.06,6.6,10.13,15.67,17.11,25.54,23s20.42,10.62,31.13,15.27a210.59,210.59,0,0,0,65.56,16.06c5.08.45,10.21.59,15.31.94,2.11.14,2.71.71,2.66,2.82-.09,7.44-.08,14.88,0,22.32,0,1.86-.34,2.72-2.43,2.69-15.43-.16-30.86-.1-46.28-.11a36.45,36.45,0,0,0-23.56,8.45c-10.3,8.4-11.43,21.16-2.4,31.55,6.14,7.07,14.35,10.67,22.89,13.56a225.33,225.33,0,0,0,106,10.8,206.35,206.35,0,0,0,57.77-17.28,75.09,75.09,0,0,0,12.45-7.68c9.59-7.3,10.71-18.69,2.83-27.9-7.14-8.36-16.38-12.19-27.24-12.23-14.21,0-28.42-.24-42.63.14-4.21.11-6.95-1.15-6.38-5.66.69-5.5.25-11.13.31-16.7,0-2.28,1-2.66,2.91-2.65,17.75,0,35.51-.13,53.26.08,12.36.14,20.47-7.35,20.19-19.79a23.16,23.16,0,0,0-6.92-16.5c-7.19-7.32-15.78-12.69-24.78-17.58-12.83-7-26.13-12.68-40.07-16.92-19.92-6-40.23-9.4-60.94-9.89-1.92-.05-2.45-.5-2.4-2.43.1-4.55,0-9.1,0-13.65,0-3,.11-6-.06-9-.16-2.56.68-3.18,3.19-3.15,16.75.18,33.5.08,50.25.08a105.41,105.41,0,0,0,10.73-.35c6.86-.81,12.07-6.17,13.37-13a28.77,28.77,0,0,0,.38-5C386,267.44,386,265.83,385.35,264.2Z"/>
                </svg>
                <span className="text-lg">Pay with PhonePe ₹{amount.toLocaleString()}</span>
              </>
            )}
          </Button>
          
          <div className="mt-4 flex items-center justify-center space-x-2 bg-purple-50 p-2 rounded-md dark:bg-purple-900/20">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-500">
              <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11V7C7 5.93913 7.42143 4.92172 8.17157 4.17157C8.92172 3.42143 9.93913 3 11 3C12.0609 3 13.0783 3.42143 13.8284 4.17157C14.5786 4.92172 15 5.93913 15 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Secure payment powered by PhonePe
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhonePePaymentForm;