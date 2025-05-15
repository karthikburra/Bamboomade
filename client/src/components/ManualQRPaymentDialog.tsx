import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt, CreditCard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ManualQRPaymentDialogProps {
  sessionId?: number;
  orderId?: string;
}

const ManualQRPaymentDialog: React.FC<ManualQRPaymentDialogProps> = ({ 
  sessionId,
  orderId: defaultOrderId
}) => {
  const [open, setOpen] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [customOrderId, setCustomOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: verifyPayment, isPending } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/verify-qr-payment", {
        sessionId,
        orderId: customOrderId || defaultOrderId,
        paymentId: paymentId || `manual_${Date.now()}`,
        manualVerificationNotes: notes
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to verify payment");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Verified",
        description: "The payment has been manually verified successfully",
      });
      setOpen(false);
      // Reset form
      setPaymentId("");
      setCustomOrderId("");
      setNotes("");
      // Refresh session data
      queryClient.invalidateQueries({ queryKey: ["/api/project-guidance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify payment",
        variant: "destructive"
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Receipt className="h-3 w-3" />
          Verify QR Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle>Manual QR Payment Verification</DialogTitle>
          <DialogDescription>
            Verify a QR code payment that wasn't automatically detected by Razorpay.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="payment-id">Razorpay Payment ID</Label>
            <Input 
              id="payment-id"
              placeholder="e.g., pay_H3fg45kYz9tP8L (optional)"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to generate an auto ID if you don't have the actual Razorpay ID
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="order-id">Razorpay Order ID</Label>
            <Input 
              id="order-id"
              placeholder="e.g., order_H3fg45kYz9tP8L (optional)"
              value={customOrderId}
              onChange={(e) => setCustomOrderId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if you don't have the order ID or if it's already associated with the session
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="verification-notes">Verification Notes</Label>
            <Textarea 
              id="verification-notes"
              placeholder="e.g., Payment verified via bank statement screenshot"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/30">
            <div className="flex">
              <div className="flex-shrink-0">
                <CreditCard className="h-5 w-5 text-amber-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-400">Verification Info</h3>
                <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>This will mark the session as paid</li>
                    <li>Only use this when you've confirmed payment outside of Razorpay</li>
                    <li>All manual verifications are logged for audit purposes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => verifyPayment()} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualQRPaymentDialog;