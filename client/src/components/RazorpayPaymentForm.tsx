import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentFormProps {
  amount: number;
  orderId: string;
  sessionId?: number | null;  // Added sessionId (optional for backward compatibility)
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
}

const RazorpayPaymentForm = ({
  amount,
  orderId,
  sessionId,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure
}: RazorpayPaymentFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Create order in Razorpay
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/razorpay/create-order', {
        amount,
        orderId,
        sessionId,  // Pass the sessionId to the server
        customerName,
        customerEmail,
        customerPhone
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        openRazorpayCheckout(data);
      } else {
        setIsLoading(false);
        onFailure(data.error || 'Failed to create payment order');
        toast({
          title: 'Payment Initialization Failed',
          description: data.error || 'Could not initialize payment. Please try again.',
          variant: 'destructive'
        });
      }
    },
    onError: (error: any) => {
      setIsLoading(false);
      const errorMessage = error.message || 'Could not initialize payment. Please try again.';
      onFailure(errorMessage);
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // Verify payment after completion
  const verifyPaymentMutation = useMutation({
    mutationFn: async (data: { 
      razorpay_order_id: string; 
      razorpay_payment_id: string; 
      razorpay_signature: string; 
    }) => {
      const response = await apiRequest('POST', '/api/razorpay/verify-payment', data);
      const responseData = await response.json();
      return responseData;
    },
    onSuccess: (data, variables) => {
      setIsLoading(false);
      if (data.success && data.verified) {
        // Call the onSuccess callback from parent component
        onSuccess(variables.razorpay_payment_id);
        
        // Display success message
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully.',
          variant: 'default'
        });
        
        // Redirect to payment success page if sessionId is available
        if (sessionId) {
          // Small delay to ensure toast is visible
          setTimeout(() => {
            window.location.href = `/payment-success?paymentId=${variables.razorpay_payment_id}&sessionId=${sessionId}`;
          }, 1000);
        }
      } else {
        onFailure('Payment verification failed');
        toast({
          title: 'Payment Verification Failed',
          description: 'Could not verify your payment. Please contact support.',
          variant: 'destructive'
        });
      }
    },
    onError: (error: any) => {
      setIsLoading(false);
      const errorMessage = error.message || 'Payment verification failed. Please contact support.';
      onFailure(errorMessage);
      toast({
        title: 'Verification Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  const openRazorpayCheckout = (orderData: any) => {
    if (!scriptLoaded || !window.Razorpay) {
      toast({
        title: 'Payment Gateway Not Ready',
        description: 'Payment gateway is still loading. Please try again in a moment.',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'BambooMade',
      description: 'Payment for Project Guidance',
      order_id: orderData.orderId,
      prefill: {
        name: orderData.prefill.name,
        email: orderData.prefill.email,
        contact: orderData.prefill.contact
      },
      theme: {
        color: '#10b981', // Green color to match site theme
      },
      handler: function (response: any) {
        // Verify payment signature
        verifyPaymentMutation.mutate({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        });
      },
      modal: {
        ondismiss: function() {
          setIsLoading(false);
          toast({
            title: 'Payment Cancelled',
            description: 'You have closed the payment window.',
            variant: 'default'
          });
        }
      }
    };

    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  };

  const handlePayment = () => {
    createOrderMutation.mutate();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md p-6 rounded-lg bg-gray-900 shadow-md border border-green-800/30">
        <Button 
          onClick={handlePayment} 
          disabled={isLoading || !scriptLoaded}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg py-6 rounded-lg shadow-lg border border-green-500/30 transition-all duration-300 hover:scale-[1.02]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" /> 
              Pay ₹{amount.toFixed(2)} Now
            </>
          )}
        </Button>
        <div className="mt-4 text-center text-xs text-gray-400">
          <p>By proceeding, you agree to our terms and payment policies.</p>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPaymentForm;