import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTokens } from "@/hooks/use-tokens";
import { useToast } from "@/hooks/use-toast";
import { Coins, Plus } from "lucide-react";

interface TokenCounterProps {
  tokens: number;
  className?: string;
}

const TokenCounter: React.FC<TokenCounterProps> = ({ tokens, className }) => {
  const { purchaseTokens, isPurchasePending } = useTokens();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  const handlePurchase = (amount: number) => {
    // For demonstration purposes, simulate a successful payment
    const paymentId = `pay_${Math.random().toString(36).substring(2, 10)}`;
    
    purchaseTokens(
      { amount, paymentId },
      {
        onSuccess: () => {
          toast({
            title: "Tokens Purchased",
            description: `Successfully added ${amount} tokens to your account.`,
          });
          setIsDialogOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Purchase Failed",
            description: "Failed to purchase tokens. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };
  
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Coins className="h-5 w-5 text-primary-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available Tokens</p>
              <p className="text-xl font-bold">{tokens}</p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Buy Tokens
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Purchase Tokens</DialogTitle>
                <DialogDescription>
                  Choose a token package below to continue chatting with BambooMade AI.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <Button 
                  variant="outline" 
                  className="flex justify-between items-center px-4 py-6" 
                  onClick={() => handlePurchase(20)}
                  disabled={isPurchasePending}
                >
                  <span className="flex items-center">
                    <Coins className="h-5 w-5 mr-2 text-primary-600" />
                    20 Tokens
                  </span>
                  <span className="font-semibold">₹199</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex justify-between items-center px-4 py-6"
                  onClick={() => handlePurchase(50)}
                  disabled={isPurchasePending}
                >
                  <span className="flex items-center">
                    <Coins className="h-5 w-5 mr-2 text-primary-600" />
                    50 Tokens
                  </span>
                  <span className="font-semibold">₹399</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex justify-between items-center px-4 py-6 border-primary-200 bg-primary-50"
                  onClick={() => handlePurchase(100)}
                  disabled={isPurchasePending}
                >
                  <span className="flex items-center">
                    <Coins className="h-5 w-5 mr-2 text-primary-600" />
                    100 Tokens
                    <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded-full">
                      Best Value
                    </span>
                  </span>
                  <span className="font-semibold">₹699</span>
                </Button>
              </div>
              
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenCounter;
