import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Subscription status interface
interface SubscriptionStatus {
  isActive: boolean;
  expiryDate: string | null;
  daysLeft: number | null;
  subscriptionStatus: string | null;
}

export function useSubscription() {
  const queryClient = useQueryClient();
  
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

  // Determine subscription type from status
  const subscriptionType = subscriptionData?.isActive 
    ? (subscriptionData?.daysLeft && subscriptionData?.daysLeft <= 30 ? 'free' : 'active') 
    : 'expired';

  // Mutation to check and update subscription
  const { mutate: checkSubscription, isPending: isChecking } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/check");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    }
  });

  return {
    isActive: subscriptionData?.isActive || false,
    expiryDate: subscriptionData?.expiryDate,
    daysLeft: subscriptionData?.daysLeft,
    subscriptionType,
    subscriptionStatus: subscriptionData?.subscriptionStatus,
    isLoading,
    isChecking,
    error,
    refetch,
    checkSubscription
  };
}