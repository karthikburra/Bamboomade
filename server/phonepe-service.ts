/**
 * DEPRECATED - PhonePe integration has been removed
 * 
 * This file is kept for reference only and is no longer used in the application.
 * All payment processing has been migrated to Razorpay.
 */

/**
 * Initialize a PhonePe payment (stub for backward compatibility)
 * @returns A failure response indicating that PhonePe is no longer supported
 */
export async function initiatePhonePePayment(
  amount: number,
  orderId: string,
  customerName: string,
  customerPhone: string,
  customerEmail: string
) {
  console.warn("PhonePe integration has been removed. Using Razorpay instead.");
  
  return {
    success: false,
    error: "PhonePe integration has been removed from this application. Please use Razorpay instead."
  };
}

/**
 * Check the status of a PhonePe payment (stub for backward compatibility)
 * @returns A failure response indicating that PhonePe is no longer supported
 */
export async function checkPhonePePaymentStatus(merchantTransactionId: string) {
  console.warn("PhonePe integration has been removed. Using Razorpay instead.");
  
  return {
    success: false,
    error: "PhonePe integration has been removed from this application. Please use Razorpay instead."
  };
}