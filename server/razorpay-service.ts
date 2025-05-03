import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

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

    const order = await razorpay.orders.create(orderOptions);

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

    // Fetch payment from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);

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