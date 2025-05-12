import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface UserLoginFormProps {
  onSuccess?: () => void;
}

const UserLoginForm: React.FC<UserLoginFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const { loginWithCode, isLoginPending } = useAuth();
  const [step, setStep] = useState<"email" | "verification">("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const onSubmitEmail = async (values: EmailFormValues) => {
    try {
      setIsSendingCode(true);
      setEmail(values.email);
      
      console.log("Requesting verification code for:", values.email);
      
      // Request verification code
      const response = await apiRequest("POST", "/api/auth/request-login-code", { email: values.email });
      const data = await response.json();
      
      console.log("Response from request-login-code:", data);
      
      if (data.success) {
        setStep("verification");
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the verification code.",
        });
        
        // In development, use the code logged in the server console
        // Look for logs like: "Attempting to send verification email to X with code ABCDEF"
        console.log("Check server logs for the verification code in development mode");
      } else {
        toast({
          title: "Failed to Send Code",
          description: data.message || "Could not send verification code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };
  
  const handleVerifyCode = async () => {
    try {
      setIsVerifying(true);
      
      console.log("Verifying code:", verificationCode, "for email:", email);
      
      // Direct API request to the verify-login endpoint
      const response = await apiRequest("POST", "/api/auth/verify-login", { 
        email, 
        code: verificationCode 
      });
      
      console.log("Verification response status:", response.status);
      const data = await response.json();
      console.log("Verification response data:", data);
      
      if (data.success) {
        toast({
          title: "Login Successful",
          description: "Welcome to BambooMade!",
        });
        
        // Wait for toast to show before redirecting
        setTimeout(() => {
          // Reload the page to ensure everything is fresh
          window.location.href = '/';
          
          // If we reach here, login was successful
          if (onSuccess) {
            onSuccess();
          }
        }, 1500);
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Could not verify code. Please try again.",
          variant: "destructive",
        });
        setIsVerifying(false);
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Could not verify code. Please try again.",
        variant: "destructive",
      });
      setIsVerifying(false);
    }
  };
  
  const handleResendCode = async () => {
    try {
      setIsSendingCode(true);
      
      // Request verification code again
      const response = await apiRequest("POST", "/api/auth/request-login-code", { email });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Verification Code Resent",
          description: "Please check your email for the new verification code.",
        });
      } else {
        toast({
          title: "Failed to Resend Code",
          description: data.message || "Could not resend verification code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === "email" ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitEmail)} className="space-y-4">
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
            
            <Button type="submit" className="w-full" disabled={isSendingCode}>
              {isSendingCode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                "Continue with Email"
              )}
            </Button>
          </form>
        </Form>
      ) : (
        // Verification code step
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium">Verify Your Email</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We've sent a verification code to <span className="font-medium">{email}</span>
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="verification-code" className="text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="verification-code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center tracking-widest text-lg"
              />
            </div>
            
            <Button 
              onClick={handleVerifyCode} 
              className="w-full" 
              disabled={isVerifying || !verificationCode}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Login"
              )}
            </Button>
            
            <div className="text-xs text-center text-muted-foreground mt-4">
              Didn't receive the code? 
              <Button 
                variant="link" 
                className="h-auto p-0 text-xs" 
                onClick={handleResendCode}
                disabled={isSendingCode}
              >
                {isSendingCode ? 'Resending...' : 'Resend Code'}
              </Button>
            </div>
            
            <div className="text-xs text-center">
              <Button 
                variant="link" 
                className="h-auto p-0 text-xs" 
                onClick={() => setStep("email")}
              >
                Use a different email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLoginForm;
