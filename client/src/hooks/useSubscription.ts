import { useQuery } from "@tanstack/react-query";

// Subscription status interface
interface SubscriptionStatus {
  isActive: boolean;
  expiryDate: string | null;
  daysLeft: number | null;
  subscriptionType: 'free' | 'paid' | 'expired';
}

export function useSubscription() {
  const { 
    data: subscriptionData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: 3600000, // Refetch every hour
  });

  return {
    isActive: subscriptionData?.isActive || false,
    expiryDate: subscriptionData?.expiryDate,
    daysLeft: subscriptionData?.daysLeft,
    subscriptionType: subscriptionData?.subscriptionType || 'expired',
    isLoading,
    error,
    refetch
  };
}