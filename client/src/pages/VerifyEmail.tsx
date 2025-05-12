import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// This page handles the email verification using Supabase magic links
const VerifyEmail: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Get the token and type from the URL query parameters
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const type = params.get('type');
        
        if (!token || !type) {
          setError('Invalid verification link. Please request a new one.');
          setVerifying(false);
          return;
        }
        
        // Make a request to the server to verify the token
        const response = await apiRequest('POST', '/api/auth/verify-token', { token, type });
        const data = await response.json();
        
        if (!data.success) {
          setError(data.message || 'Verification failed. Please try again.');
          setVerifying(false);
          return;
        }
        
        // Show success message
        toast({
          title: 'Verification Successful',
          description: 'Your email has been verified. You\'ll be redirected to the login page.',
        });
        
        // Give time for the toast to be read
        setTimeout(() => {
          setVerifying(false);
          setLocation('/');
        }, 2000);
      } catch (err) {
        console.error('Error verifying token:', err);
        setError('An error occurred during verification. Please try again.');
        setVerifying(false);
      }
    };
    
    verifyToken();
  }, [setLocation, toast]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg space-y-4">
        <h1 className="text-2xl font-bold text-center">Email Verification</h1>
        
        {verifying ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center">Verifying your email...</p>
          </div>
        ) : error ? (
          <div className="space-y-4 py-4">
            <p className="text-destructive text-center">{error}</p>
            <div className="flex justify-center">
              <button
                onClick={() => setLocation('/login')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Return to Login
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VerifyEmail;