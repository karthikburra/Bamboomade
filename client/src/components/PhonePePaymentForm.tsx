/**
 * DEPRECATED - PhonePe integration has been removed
 * 
 * This component is kept for reference only and is no longer used in the application.
 * All payment processing has been migrated to Razorpay.
 */

import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

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
  amount,
  customerName,
  // Other props are unused
}: PhonePePaymentFormProps) => {
  return (
    <Card className="bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center space-x-2 text-amber-600 dark:text-amber-400 mb-4">
          <AlertCircle size={24} />
          <h3 className="text-xl font-semibold">PhonePe Integration Deprecated</h3>
        </div>
        
        <div className="text-center">
          <p className="mb-4">
            PhonePe integration has been removed from this application. 
            All payments are now processed exclusively through Razorpay.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Customer: {customerName}<br />
            Amount: ₹{amount.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhonePePaymentForm;