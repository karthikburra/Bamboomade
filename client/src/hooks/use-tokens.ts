import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useTokens() {
  const queryClient = useQueryClient();

  // Get current user's token count
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: true,
  });

  // Purchase tokens mutation
  const { mutate: purchaseTokens, isPending: isPurchasePending } = useMutation({
    mutationFn: async ({ amount, paymentId }: { amount: number, paymentId: string }) => {
      return apiRequest("POST", "/api/tokens/purchase", { amount, paymentId });
    },
    onSuccess: () => {
      // Invalidate queries to refresh token count
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tokens/purchases"] });
    },
  });

  // Get token purchase history
  const { data: purchaseHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["/api/tokens/purchases"],
    enabled: !!userData,
  });

  return {
    tokens: userData?.tokens || 0,
    isLoading,
    purchaseTokens,
    isPurchasePending,
    purchaseHistory,
    isHistoryLoading
  };
}
