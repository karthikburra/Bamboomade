import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const PaymentMapperDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentId.trim() || !orderId.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both Payment ID and Order ID",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/admin/map-payment", {
        paymentId: paymentId.trim(),
        orderId: orderId.trim(),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Payment mapped successfully",
          description: `Payment ${paymentId} mapped to session with Order ID ${orderId}`,
        });
        
        // Refresh the sessions data
        await queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions'] });
        setIsOpen(false);
        setPaymentId("");
        setOrderId("");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to map payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to map payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 text-xs"
        >
          Map Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Map Payment to Session</DialogTitle>
          <DialogDescription>
            Enter the payment ID and order ID to manually map a payment to a session.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="paymentId">Razorpay Payment ID</Label>
            <Input
              id="paymentId"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              placeholder="pay_xxxxxxxxxxxxxxxx"
              className="bg-gray-800 border-gray-700"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orderId">Session Order ID</Label>
            <Input
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="order_xxxxxxxxxxxxxxxx"
              className="bg-gray-800 border-gray-700"
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading || !paymentId.trim() || !orderId.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Map Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMapperDialog;