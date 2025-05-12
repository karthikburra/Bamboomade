import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const registerFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

interface UserRegisterFormProps {
  onSuccess?: () => void;
}

const UserRegisterForm: React.FC<UserRegisterFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });
  
  const { mutate: register, isPending } = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      return apiRequest("POST", "/api/auth/register", {
        ...data,
        role: "user", // Default role for new users
      });
    },
    onSuccess: (response) => {
      // Save the email for verification
      const email = form.getValues().email;
      setRegisteredEmail(email);
      setVerificationSent(true);
      
      toast({
        title: "Registration Started",
        description: "A verification code has been sent to your email. Please check your inbox and enter the code below.",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not create account. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const { mutate: verifyEmail, isPending: isVerifyingEmail } = useMutation({
    mutationFn: async (data: { email: string, code: string }) => {
      return apiRequest("POST", "/api/auth/verify-email", data);
    },
    onSuccess: () => {
      toast({
        title: "Verification Successful",
        description: "Your email has been verified. Your account is now active.",
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: RegisterFormValues) => {
    register(values);
  };
  
  const handleVerifyEmail = () => {
    if (!verificationCode) {
      toast({
        title: "Verification Code Required",
        description: "Please enter the verification code sent to your email.",
        variant: "destructive",
      });
      return;
    }
    
    verifyEmail({
      email: registeredEmail,
      code: verificationCode
    });
  };

  return (
    <div className="space-y-6">
      {!verificationSent ? (
        // Step 1: Show registration form
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="text-xs text-muted-foreground">
              By registering, you'll receive 10 free tokens to use with BambooMade AI.
            </div>
            
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Register with Email"
              )}
            </Button>
          </form>
        </Form>
      ) : (
        // Step 2: Show verification form
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium">Verify Your Email</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We've sent a verification code to <span className="font-medium">{registeredEmail}</span>
            </p>
          </div>
          
          <div className="space-y-4">
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center tracking-widest text-lg"
                />
              </FormControl>
            </FormItem>
            
            <Button 
              onClick={handleVerifyEmail} 
              className="w-full" 
              disabled={isVerifyingEmail || !verificationCode}
            >
              {isVerifyingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
            
            <div className="text-xs text-center text-muted-foreground mt-4">
              Didn't receive the code? <Button variant="link" className="h-auto p-0 text-xs" onClick={() => register(form.getValues())}>Resend Code</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRegisterForm;
