import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface PaymentFormProps {
  sessionId: number;
  amount: number;
  onSuccess: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ sessionId, amount, onSuccess }) => {
  const { toast } = useToast();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");

  const { mutate: processPayment, isPending } = useMutation({
    mutationFn: async () => {
      // For demonstration purposes, we'll simulate a payment
      // In a production app, you would integrate with a real payment gateway
      
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Generate a fake payment ID
      const paymentId = `pay_${Math.random().toString(36).substring(2, 10)}`;
      
      // Update the project guidance session with the payment ID
      return apiRequest("PATCH", `/api/project-guidance/${sessionId}/payment`, { paymentId });
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Your project guidance session has been confirmed.",
        variant: "default",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      console.error("Payment error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!cardNumber || !expiry || !cvv || !name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all payment details.",
        variant: "destructive",
      });
      return;
    }
    
    processPayment();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-gray-100 p-2 rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-medium ml-2">Credit Card</h3>
          </div>
          <div className="bg-gray-50 py-2 px-4 rounded-lg">
            <p className="font-medium text-gray-700">Total Amount: ₹{amount.toLocaleString()}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name on Card</label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="cardNumber" className="text-sm font-medium">Card Number</label>
            <Input
              id="cardNumber"
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="expiry" className="text-sm font-medium">Expiry Date</label>
              <Input
                id="expiry"
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cvv" className="text-sm font-medium">CVV</label>
              <Input
                id="cvv"
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123"
                maxLength={3}
                required
              />
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ₹${amount.toLocaleString()}`
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            This is a demo payment form. No actual charges will be processed.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
