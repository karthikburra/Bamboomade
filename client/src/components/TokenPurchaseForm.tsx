import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CreditCard } from "lucide-react";

// Define the token package options
const TOKEN_PACKAGES = [
  { id: "basic", tokens: 50, price: 100, name: "Basic Package" },
  { id: "standard", tokens: 150, price: 250, name: "Standard Package" },
  { id: "premium", tokens: 500, price: 700, name: "Premium Package" },
];

// Form schema
const tokenPurchaseSchema = z.object({
  packageId: z.string().min(1, "Please select a token package"),
});

type TokenPurchaseFormValues = z.infer<typeof tokenPurchaseSchema>;

interface TokenPurchaseFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const TokenPurchaseForm: React.FC<TokenPurchaseFormProps> = ({ 
  onSuccess, 
  onClose 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState(TOKEN_PACKAGES[0]);

  // Initialize form
  const form = useForm<TokenPurchaseFormValues>({
    resolver: zodResolver(tokenPurchaseSchema),
    defaultValues: {
      packageId: "basic",
    },
  });

  // Handle token purchase
  const { mutate: purchaseTokens, isPending } = useMutation({
    mutationFn: async (data: TokenPurchaseFormValues) => {
      const packageDetails = TOKEN_PACKAGES.find(pkg => pkg.id === data.packageId);
      
      if (!packageDetails) {
        throw new Error("Invalid package selected");
      }
      
      return apiRequest("POST", "/api/tokens/purchase", {
        amount: packageDetails.price,
        tokens: packageDetails.tokens,
        paymentMethod: "stripe", // This can be expanded to support multiple payment methods
      });
    },
    onSuccess: () => {
      toast({
        title: "Tokens Purchased",
        description: `You have successfully purchased ${selectedPackage.tokens} tokens.`,
      });
      
      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to purchase tokens. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: TokenPurchaseFormValues) => {
    const selected = TOKEN_PACKAGES.find(pkg => pkg.id === values.packageId);
    if (selected) {
      setSelectedPackage(selected);
    }
    purchaseTokens(values);
  };

  // Handle package selection change
  const handlePackageChange = (value: string) => {
    const selected = TOKEN_PACKAGES.find(pkg => pkg.id === value);
    if (selected) {
      setSelectedPackage(selected);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Purchase Tokens</CardTitle>
        <CardDescription>
          Tokens are used to interact with BambooMade AI. Purchase more tokens to continue your conversations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Token Package</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handlePackageChange(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a token package" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TOKEN_PACKAGES.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} - {pkg.tokens} tokens (₹{pkg.price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {selectedPackage && (
                      <span>
                        {selectedPackage.tokens} tokens for ₹{selectedPackage.price}
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <h4 className="font-medium mb-2">Selected Package:</h4>
              <p><strong>{selectedPackage.name}</strong></p>
              <p>Tokens: {selectedPackage.tokens}</p>
              <p>Price: ₹{selectedPackage.price}</p>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Purchase Tokens
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TokenPurchaseForm;