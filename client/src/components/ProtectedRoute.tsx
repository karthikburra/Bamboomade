import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  component: React.ComponentType;
  requiresSubscription?: boolean;
}

/**
 * A protected route component that redirects to login if user is not authenticated
 * and optionally checks for active subscription
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  component: Component, 
  requiresSubscription = false 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isActive: hasActiveSubscription, isLoading: isLoadingSubscription, expiryDate } = 
    requiresSubscription ? useSubscription() : { isActive: true, isLoading: false, expiryDate: null };
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // If still loading auth or subscription status, show loading indicator
  if (isLoading || (requiresSubscription && isLoadingSubscription)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If subscription is required but not active, show subscription expired message
  if (requiresSubscription && !hasActiveSubscription && isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 text-zinc-100">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4 bg-red-950/50 border-red-900">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertTitle>Subscription Required</AlertTitle>
            <AlertDescription>
              Your free AI access period has expired. Please contact us to continue using this feature.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-3 mt-6">
            <Button onClick={() => navigate('/contact')} variant="default">
              Contact Us
            </Button>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated and subscription check passes, render the protected component
  return isAuthenticated ? <Component /> : null;
};

export default ProtectedRoute;