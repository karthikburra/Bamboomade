import Razorpay from 'razorpay';
import crypto from 'crypto';

// Razorpay instance holder
let razorpay: Razorpay | null = null;

// Initialize Razorpay if keys are available
function getRazorpayInstance(): Razorpay | null {
  if (razorpay) return razorpay;
  
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      
      console.log("Razorpay service initialized with:", {
        keyIdExists: !!process.env.RAZORPAY_KEY_ID,
        keySecretExists: !!process.env.RAZORPAY_KEY_SECRET,
        environment: process.env.NODE_ENV || 'development',
      });
      
      return razorpay;
    } catch (error) {
      console.error("Failed to initialize Razorpay:", error);
      return null;
    }
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.log("========== RAZORPAY DEVELOPMENT MODE ==========");
    console.log("The Razorpay integration is running in development mode.");
    console.log("- No credentials provided, simulated mode is active");
    console.log("- Payments will be simulated for testing purposes");
    console.log("- No actual charges will be made");
    console.log("===============================================");
  } else {
    console.error("Razorpay credentials missing in production environment");
  }
  
  return null;
}

/**
 * Initialize a Razorpay payment
 * @param amount Amount in rupees
 * @param orderId Unique order identifier
 * @param customerName Name of the customer
 * @param customerPhone Phone number of the customer
 * @param customerEmail Email of the customer
 * @returns Payment details and order ID
 */
export async function initiateRazorpayPayment(
  amount: number,
  orderId: string,
  customerName: string,
  customerPhone: string,
  customerEmail: string
) {
  try {
    // Validate input
    if (!amount || amount <= 0) {
      return {
        success: false,
        error: 'Invalid amount',
      };
    }

    // Amount in paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Check if keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys not configured');
      
      // For development: simulate a successful order when keys aren't available
      if (process.env.NODE_ENV !== 'production') {
        console.log('DEV MODE: Simulating Razorpay order creation');
        return {
          success: true,
          orderId: `dev_${orderId}`,
          amount: amountInPaise,
          currency: 'INR',
          keyId: 'rzp_test_simulated',
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone
          },
          warning: 'Using development mode with simulated payment'
        };
      }
      
      return {
        success: false,
        error: 'RAZORPAY_NOT_CONFIGURED',
      };
    }

    // Get Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      return {
        success: false,
        error: 'Razorpay service not initialized',
      };
    }
    
    // Create order in Razorpay
    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderId,
      notes: {
        customerName,
        customerEmail,
        customerPhone
      }
    };

    const order = await razorpayInstance.orders.create(orderOptions);

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone
      }
    };
  } catch (error: any) {
    console.error('Razorpay payment initialization error:', error);
    return {
      success: false,
      error: error.message || 'Failed to initialize payment',
    };
  }
}

/**
 * Verify Razorpay payment signature
 * @param orderId Order ID received from Razorpay
 * @param paymentId Payment ID received from Razorpay
 * @param signature Signature received from Razorpay
 * @returns Whether the signature is valid
 */
export function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
) {
  try {
    // Check if keys are configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
      // For development: simulate success when keys aren't available
      if (process.env.NODE_ENV !== 'production') {
        console.log('DEV MODE: Simulating Razorpay signature verification');
        return { success: true, verified: true };
      }
      
      return { success: false, error: 'RAZORPAY_NOT_CONFIGURED' };
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    const isSignatureValid = generated_signature === signature;

    return {
      success: true,
      verified: isSignatureValid
    };
  } catch (error: any) {
    console.error('Razorpay signature verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify payment',
    };
  }
}

/**
 * Fetch payment details from Razorpay
 * @param paymentId Payment ID from Razorpay
 * @returns Payment details
 */
export async function getRazorpayPaymentDetails(paymentId: string) {
  try {
    // Check if keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      // For development: simulate success when keys aren't available
      if (process.env.NODE_ENV !== 'production') {
        console.log('DEV MODE: Simulating Razorpay payment fetch');
        return {
          success: true,
          status: 'captured',
          paymentId: paymentId,
          amount: 1000,
          method: 'card',
          email: 'dev@example.com',
          contact: '9999999999'
        };
      }
      
      return { success: false, error: 'RAZORPAY_NOT_CONFIGURED' };
    }

    // Get Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      return {
        success: false,
        error: 'Razorpay service not initialized',
      };
    }
    
    // Fetch payment from Razorpay
    const payment = await razorpayInstance.payments.fetch(paymentId);

    return {
      success: true,
      status: payment.status,
      paymentId: payment.id,
      amount: typeof payment.amount === 'number' ? payment.amount / 100 : 0, // Convert from paise to rupees
      method: payment.method,
      email: payment.email,
      contact: payment.contact
    };
  } catch (error: any) {
    console.error('Razorpay payment details fetch error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch payment details',
    };
  }
}

/**
 * Get all payments from Razorpay with pagination support
 * This function fetches all payments from the Razorpay API and can be used to display payment history
 * @param options Optional parameters: from, to, count, skip (for pagination)
 * @returns List of payments with their details
 */
export async function getAllRazorpayPayments(options: {
  from?: number;  // Timestamp in seconds
  to?: number;    // Timestamp in seconds
  count?: number; // Number of payments to fetch (default: 10, max: 100)
  skip?: number;  // Number of payments to skip (for pagination)
} = {}) {
  try {
    // Get Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      console.error('Razorpay service not initialized - cannot fetch payments');
      return { success: false, error: 'Razorpay service not initialized' };
    }

    // Set defaults for pagination
    const count = options.count || 10;
    const skip = options.skip || 0;
    
    // Prepare query parameters
    const queryParams: any = {
      count,
      skip
    };
    
    // Add optional date range if provided
    if (options.from) queryParams.from = options.from;
    if (options.to) queryParams.to = options.to;
    
    // Fetch payments from Razorpay
    const payments = await razorpayInstance.payments.all(queryParams);
    
    // Transform the response into a simpler format
    const formattedPayments = payments.items.map((payment: any) => ({
      id: payment.id,
      orderId: payment.order_id,
      amount: payment.amount / 100, // Convert from paise to rupees
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      createdAt: new Date(payment.created_at * 1000).toISOString(),
      capturedAt: payment.captured_at ? new Date(payment.captured_at * 1000).toISOString() : null
    }));
    
    return {
      success: true,
      payments: formattedPayments,
      count: payments.count,
      hasMore: payments.count > (skip + count)
    };
  } catch (error: any) {
    console.error('Razorpay payments fetch error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch payments'
    };
  }
}

/**
 * Get a summary of payment statuses from Razorpay
 * This function provides counts for each payment status (created, authorized, captured, refunded, failed)
 * @returns Summary of payment statuses with counts
 */
export async function getRazorpayPaymentStatusSummary() {
  try {
    // Get Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      console.error('Razorpay service not initialized - cannot fetch payment summary');
      return { success: false, error: 'Razorpay service not initialized' };
    }
    
    // We need to fetch all payments and then count by status
    // Note: This is a simplified approach, for large datasets you'd want to implement proper pagination
    const payments = await razorpayInstance.payments.all({ count: 100 });
    
    // Initialize counters for each status
    const statusSummary = {
      created: 0,
      authorized: 0,
      captured: 0,
      refunded: 0,
      failed: 0,
      total: payments.count
    };
    
    // Count payments by status
    payments.items.forEach((payment: any) => {
      const status = payment.status.toLowerCase();
      if (statusSummary.hasOwnProperty(status)) {
        statusSummary[status as keyof typeof statusSummary]++;
      }
    });
    
    return {
      success: true,
      summary: statusSummary
    };
  } catch (error: any) {
    console.error('Razorpay payment status summary error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch payment status summary'
    };
  }
}

/**
 * Check for payments that have been made but not updated in our system.
 * This function fetches pending sessions and checks with Razorpay if they have been paid.
 * @param storage The storage interface for database operations
 * @returns An array of session IDs that were found to be paid
 */
export async function verifyPendingPayments(storage: any) {
  try {
    // Get Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      console.error('Razorpay service not initialized - cannot verify pending payments');
      return { success: false, error: 'Razorpay service not initialized' };
    }

    // 1. Get all pending sessions
    const pendingSessions = await storage.getProjectGuidancesByStatus('pending');
    if (!pendingSessions || pendingSessions.length === 0) {
      console.log('No pending sessions found to verify payments');
      return { success: true, updatedCount: 0, sessions: [] };
    }

    console.log(`Found ${pendingSessions.length} pending sessions to check for payments`);
    const updatedSessions = [];

    // 2. For each pending session, check if it has a payment_id
    for (const session of pendingSessions) {
      // Skip sessions that already have payment confirmation
      if (session.paymentConfirmed) {
        console.log(`Session ${session.id} already has payment confirmed, skipping`);
        continue;
      }

      // If we have a payment ID, verify it with Razorpay
      if (session.paymentId) {
        try {
          const paymentDetails = await razorpayInstance.payments.fetch(session.paymentId);
          
          console.log(`Razorpay payment check for session ${session.id}:`, {
            paymentId: session.paymentId,
            status: paymentDetails.status,
            authorized: ['authorized', 'captured'].includes(paymentDetails.status)
          });
          
          // If payment is authorized or captured, mark the session as confirmed
          if (['authorized', 'captured'].includes(paymentDetails.status)) {
            const updatedSession = await storage.updateProjectGuidancePayment(
              session.id, 
              session.paymentId,
              typeof paymentDetails.amount === 'number' ? paymentDetails.amount / 100 : undefined
            );
            
            if (updatedSession) {
              console.log(`✅ Updated session ${session.id} as payment confirmed`);
              updatedSessions.push({
                id: session.id,
                email: session.email,
                status: updatedSession.status,
                paymentConfirmed: updatedSession.paymentConfirmed
              });
            }
          }
        } catch (error) {
          console.error(`Failed to verify payment for session ${session.id}:`, error);
        }
      } else {
        console.log(`Session ${session.id} has no payment ID to verify`);
      }
    }

    return { 
      success: true, 
      updatedCount: updatedSessions.length,
      sessions: updatedSessions
    };
  } catch (error: any) {
    console.error('Error verifying pending payments:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to verify pending payments' 
    };
  }
}