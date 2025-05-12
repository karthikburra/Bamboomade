import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ token: string }>("/verify-email/:token");
  const token = params?.token;
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { toast } = useToast();
  
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No verification token found in URL");
        setIsVerifying(false);
        return;
      }
      
      try {
        setIsVerifying(true);
        console.log("Verifying token:", token);
        
        const response = await apiRequest("POST", "/api/auth/verify-token", {
          token,
          type: "email"
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log("Token verification successful");
          setSuccess(true);
          
          // Refresh user data in react-query cache
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          
          toast({
            title: "Verification successful!",
            description: "Your email has been verified. You can now log in.",
            variant: "success",
          });
          
          // Redirect to home after 2 seconds
          setTimeout(() => {
            setLocation("/");
          }, 2000);
        } else {
          console.error("Token verification failed:", data.message);
          setError(data.message || "Failed to verify your email. Please try again.");
        }
      } catch (err) {
        console.error("Token verification error:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyToken();
  }, [token, setLocation, toast]);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {isVerifying ? "Verifying your email..." : 
              success ? "Your email has been verified!" : 
              "There was a problem verifying your email"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center py-6">
          {isVerifying ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-sm text-muted-foreground">
                Please wait while we verify your email...
              </p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-center text-muted-foreground">
                Your email has been successfully verified. You will be redirected to the homepage.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-center text-red-600 dark:text-red-400">
                {error || "Verification failed"}
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          {!isVerifying && (
            <Button 
              variant={success ? "default" : "outline"}
              onClick={() => setLocation("/")}
            >
              Back to Home
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}