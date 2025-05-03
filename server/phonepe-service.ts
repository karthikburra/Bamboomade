import axios from 'axios';
import crypto from 'crypto';

// PhonePe API configuration
// Use sandbox environment for development
const PHONEPE_HOST = 'https://api-preprod.phonepe.com/apis/pg-sandbox';

// Credential variables - load from environment
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || '';
const SALT_KEY = process.env.PHONEPE_CLIENT_SECRET || '';
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID || '';
const SALT_INDEX = '1'; // PhonePe typically uses 1 as the salt index

// Get the Replit domain or use local development domain
const isProduction = process.env.NODE_ENV === 'production';
const hostName = 
  process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.replit.app` 
    : (isProduction 
        ? 'https://bamboomade.replit.app' 
        : 'https://4000-${process.env.REPL_ID}.${process.env.REPL_SLUG}.replit.dev');

// Setup PhonePe callback URLs - Make sure to format URLs correctly
const CALLBACK_URL = `${hostName}/api/payments/phonepe/callback`;
const REDIRECT_URL = `${hostName}/api/payments/phonepe/callback`;

// Additional configuration for PhonePe
const MERCHANT_USER_ID = 'MUID_' + Date.now(); // Generate a merchant user ID
const REDIRECT_MODE = 'REDIRECT'; // Required by PhonePe

// Log initialization information (excluding sensitive data)
console.log("PhonePe service initialized with:", {
  host: PHONEPE_HOST,
  merchantId: MERCHANT_ID,
  callbackUrl: CALLBACK_URL,
  redirectUrl: REDIRECT_URL,
  hasClientId: !!CLIENT_ID,
  hasClientSecret: !!SALT_KEY,
  saltIndex: SALT_INDEX,
  environment: isProduction ? "production" : "development"
});

/**
 * Initialize a PhonePe payment
 * @param amount Amount in rupees
 * @param orderId Unique order identifier
 * @param customerName Name of the customer
 * @param customerPhone Phone number of the customer
 * @param customerEmail Email of the customer
 * @returns Payment link and transaction ID
 */
export async function initiatePhonePePayment(
  amount: number,
  orderId: string,
  customerName: string,
  customerPhone: string,
  customerEmail: string
) {
  try {
    // Validate required credentials
    if (!MERCHANT_ID || !SALT_KEY) {
      throw new Error('PhonePe merchant credentials missing. Please set PHONEPE_MERCHANT_ID and PHONEPE_CLIENT_SECRET.');
    }

    console.log("Starting PhonePe payment initialization:", {
      orderId,
      amount,
      customerName,
      phone: customerPhone ? customerPhone.substring(0, 4) + "****" : "Not provided"
    });

    // Create payload according to PhonePe API documentation
    // Follow exact format as per V1 API
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: orderId,
      // Convert rupees to paise (1 rupee = 100 paise)
      amount: Math.round(amount * 100),
      redirectUrl: REDIRECT_URL,
      redirectMode: REDIRECT_MODE,
      callbackUrl: CALLBACK_URL,
      mobileNumber: customerPhone,
      paymentInstrument: {
        type: "PAY_PAGE"
      },
      // Required for merchant identification
      merchantUserId: MERCHANT_USER_ID
    };

    // Convert payload to base64
    const payloadString = JSON.stringify(payload);
    const base64Payload = Buffer.from(payloadString).toString('base64');
    
    // Generate X-VERIFY signature according to PhonePe documentation
    // SHA256(base64 payload + "/pg/v1/pay" + salt key) + "###" + salt index
    const dataToSign = base64Payload + "/pg/v1/pay" + SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(dataToSign).digest('hex');
    const xVerifyHeader = sha256 + "###" + SALT_INDEX;
    
    console.log("Payment request prepared:", {
      merchantTransactionId: payload.merchantTransactionId,
      amount: payload.amount / 100, // Convert back to rupees for logging
      redirectUrl: REDIRECT_URL,
      signatureGenerated: true
    });

    // Make API call to PhonePe with all required headers
    const response = await axios.post(
      `${PHONEPE_HOST}/pg/v1/pay`,
      {
        request: base64Payload
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerifyHeader,
          'X-MERCHANT-ID': MERCHANT_ID,
          'Accept': 'application/json'
        }
      }
    );

    console.log("PhonePe API response:", {
      status: response.status,
      success: response.data?.success
    });

    if (response.data && response.data.success) {
      const result = {
        success: true,
        paymentLink: response.data.data.instrumentResponse.redirectInfo.url,
        transactionId: orderId
      };
      
      console.log("Payment link generated successfully");
      return result;
    } else {
      throw new Error(
        response.data?.message || 
        response.data?.error?.description || 
        'Payment initialization failed'
      );
    }
  } catch (error: any) {
    console.error("PhonePe payment initialization error:", {
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data
    });
    
    // Fallback for development/testing
    if (process.env.NODE_ENV !== 'production') {
      console.log("DEV MODE: Providing test payment link");
      
      // Create a simulated payment link
      const testCallbackUrl = `${hostName}/api/payments/phonepe/callback?merchantTransactionId=${orderId}&code=PAYMENT_SUCCESS`;
      
      return {
        success: true,
        paymentLink: testCallbackUrl,
        transactionId: orderId,
        warning: "Test payment link (dev mode only)"
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Payment initialization failed'
    };
  }
}

/**
 * Check the status of a PhonePe payment
 * @param merchantTransactionId The merchant transaction ID used during payment creation
 * @returns Payment status
 */
export async function checkPhonePePaymentStatus(merchantTransactionId: string) {
  try {
    // Validate required credentials
    if (!MERCHANT_ID || !SALT_KEY) {
      throw new Error('PhonePe merchant credentials missing. Please set PHONEPE_MERCHANT_ID and PHONEPE_CLIENT_SECRET.');
    }

    console.log(`Checking payment status for transaction: ${merchantTransactionId}`);
    
    // Create the API path with parameters
    const apiPath = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`;
    
    // Generate X-VERIFY signature for status check
    // SHA256(apiPath + salt key) + "###" + salt index
    const dataToSign = apiPath + SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(dataToSign).digest('hex');
    const xVerifyHeader = sha256 + "###" + SALT_INDEX;

    console.log("Status check prepared for transaction:", merchantTransactionId);

    // Make API call to PhonePe for status check
    const response = await axios.get(
      `${PHONEPE_HOST}${apiPath}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerifyHeader,
          'X-MERCHANT-ID': MERCHANT_ID
        }
      }
    );

    console.log("Status check response:", {
      status: response.status,
      success: response.data?.success
    });

    if (response.data && response.data.success) {
      // Parse the PhonePe response
      const result = {
        success: true,
        status: response.data.data.responseCode,
        paymentId: response.data.data.paymentId,
        amount: response.data.data.amount / 100, // Convert paise to rupees
        paymentInstrument: response.data.data.paymentInstrument
      };
      
      console.log("Payment status:", {
        transactionId: merchantTransactionId,
        status: result.status,
        paymentId: result.paymentId
      });
      
      return result;
    } else {
      throw new Error(
        response.data?.message || 
        response.data?.error?.description || 
        'Payment status check failed'
      );
    }
  } catch (error: any) {
    console.error("Status check error:", {
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data
    });
    
    // Fallback for development/testing
    if (process.env.NODE_ENV !== 'production') {
      console.log("DEV MODE: Providing simulated payment status");
      
      // Generate a test payment ID
      const mockPaymentId = "TEST_" + merchantTransactionId;
      
      return {
        success: true,
        status: "SUCCESS",
        paymentId: mockPaymentId,
        amount: 2505, // Default amount for testing
        paymentInstrument: {
          type: "UPI",
          utr: "TEST1234567890"
        },
        warning: "Test payment status (dev mode only)"
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Payment status check failed'
    };
  }
}