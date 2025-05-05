import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import RazorpayPaymentForm from "@/components/RazorpayPaymentForm";
import { CreditCard } from 'lucide-react';

interface PaymentOptionsProps {
  amount: number;
  sessionId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
}

const PaymentOptions = ({
  amount,
  sessionId,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure
}: PaymentOptionsProps) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handleContinue = () => {
    setShowPaymentForm(true);
  };

  const handleBack = () => {
    setShowPaymentForm(false);
  };

  // Generate a unique order ID that incorporates the session ID
  const orderId = `ORDER_${Date.now()}_${sessionId || 0}`;

  return (
    <div className="w-full max-w-md mx-auto">
      {!showPaymentForm ? (
        <Card className="bg-gray-900 border-green-800/30 text-white">
          <CardHeader>
            <CardTitle className="text-xl text-green-400">Payment Information</CardTitle>
            <CardDescription className="text-gray-400">
              Proceed to pay securely with Razorpay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-md border border-green-500 bg-green-900/20">
              <div className="flex items-center gap-2">
                <div className="bg-blue-700 p-2 rounded">
                  <span className="font-bold text-white">Razorpay</span>
                </div>
                <span className="text-sm text-gray-300">Cards, UPI, Wallets, NetBanking</span>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              <p>• We accept all major credit/debit cards</p>
              <p>• UPI payments from all apps</p>
              <p>• Secure payment processing</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleContinue} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="mr-2 h-4 w-4" /> Proceed to Payment
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div>
          <Button 
            variant="outline" 
            onClick={handleBack} 
            className="mb-4 border-green-700 text-green-400 hover:bg-green-900/30"
          >
            ← Back to Payment Information
          </Button>
          
          <RazorpayPaymentForm
            amount={amount}
            orderId={orderId}
            sessionId={sessionId}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
            onSuccess={onSuccess}
            onFailure={onFailure}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentOptions;