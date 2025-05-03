import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import PhonePePaymentForm from "@/components/PhonePePaymentForm";
import RazorpayPaymentForm from "@/components/RazorpayPaymentForm";
import { Check, CreditCard } from 'lucide-react';

interface PaymentOptionsProps {
  amount: number;
  sessionId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
}

type PaymentGateway = 'phonepe' | 'razorpay';

const PaymentOptions = ({
  amount,
  sessionId,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure
}: PaymentOptionsProps) => {
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('phonepe');
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
            <CardTitle className="text-xl text-green-400">Choose Payment Method</CardTitle>
            <CardDescription className="text-gray-400">
              Select your preferred payment gateway to proceed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={selectedGateway} 
              onValueChange={(value) => setSelectedGateway(value as PaymentGateway)}
              className="space-y-4"
            >
              <div className={`flex items-center space-x-2 rounded-md border p-4 
                ${selectedGateway === 'phonepe' ? 'border-green-500 bg-green-900/20' : 'border-gray-700'}`}>
                <RadioGroupItem value="phonepe" id="phonepe" className="border-green-500" />
                <Label htmlFor="phonepe" className="flex flex-1 items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-700 p-2 rounded">
                      <span className="font-bold text-white">PhonePe</span>
                    </div>
                    <span className="text-sm text-gray-300">UPI, Cards, Netbanking</span>
                  </div>
                  {selectedGateway === 'phonepe' && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </Label>
              </div>

              <div className={`flex items-center space-x-2 rounded-md border p-4
                ${selectedGateway === 'razorpay' ? 'border-green-500 bg-green-900/20' : 'border-gray-700'}`}>
                <RadioGroupItem value="razorpay" id="razorpay" className="border-green-500" />
                <Label htmlFor="razorpay" className="flex flex-1 items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-700 p-2 rounded">
                      <span className="font-bold text-white">Razorpay</span>
                    </div>
                    <span className="text-sm text-gray-300">Cards, UPI, Wallets</span>
                  </div>
                  {selectedGateway === 'razorpay' && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleContinue} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="mr-2 h-4 w-4" /> Continue to Payment
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
            ← Back to Payment Options
          </Button>
          
          {selectedGateway === 'phonepe' ? (
            <PhonePePaymentForm
              amount={amount}
              sessionId={sessionId}
              customerName={customerName}
              customerEmail={customerEmail}
              customerPhone={customerPhone}
              onSuccess={onSuccess}
              onFailure={onFailure}
            />
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentOptions;