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
  // Generate a unique order ID that incorporates the session ID
  const orderId = `ORDER_${Date.now()}_${sessionId || 0}`;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-green-800/30 text-white mb-4 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <CreditCard className="h-5 w-5 text-green-400 mr-2" />
            <CardTitle className="text-xl text-green-400">Payment Summary</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            Review your order details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-800/60 rounded-md p-4 mb-4 border border-gray-700 shadow-inner">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-300">Amount:</span>
              <span className="font-bold text-green-400 text-xl">₹ {amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-300">Order ID:</span>
              <span className="font-medium text-gray-300 text-sm bg-gray-700/50 py-1 px-2 rounded">{orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Customer:</span>
              <span className="font-medium text-gray-300 text-sm">{customerName}</span>
            </div>
          </div>

          <div className="flex items-center p-3 rounded-md border border-blue-600 bg-blue-900/20 mb-3">
            <div className="bg-blue-700 p-1.5 rounded mr-2">
              <span className="font-bold text-white text-sm">Razorpay</span>
            </div>
            <span className="text-sm text-gray-300">Cards, UPI, Wallets, NetBanking accepted</span>
          </div>
        </CardContent>
      </Card>
      
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
  );
};

export default PaymentOptions;