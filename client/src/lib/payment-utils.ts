import { apiRequest } from "./queryClient";

/**
 * Checks the status of a PhonePe payment
 * @param transactionId The transaction ID to check
 * @returns Payment status information
 */
export async function checkPaymentStatus(transactionId: string) {
  try {
    const response = await apiRequest(
      "GET", 
      `/api/payments/phonepe/status/${transactionId}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment status check failed');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error("Payment status check error:", error);
    return {
      success: false,
      error: error.message || 'Failed to check payment status'
    };
  }
}

/**
 * Parses URL parameters to detect payment status redirects
 * Call this when a component mounts to handle payment redirects
 * @param handleSuccess Function to call on success
 * @param handleFailure Function to call on failure
 */
export function handlePaymentRedirect(
  handleSuccess: (sessionId: string, transactionId?: string) => void,
  handleFailure: (reason: string) => void
) {
  const params = new URLSearchParams(window.location.search);
  
  // Check for success parameters
  const sessionId = params.get('sessionId');
  const txnId = params.get('txnId');
  
  if (sessionId) {
    handleSuccess(sessionId, txnId || undefined);
    return true;
  }
  
  // Check for failure parameters
  const reason = params.get('reason');
  
  if (reason) {
    handleFailure(decodeURIComponent(reason));
    return true;
  }
  
  return false;
}