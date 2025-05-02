import axios from 'axios';
import crypto from 'crypto';

// PhonePe API configuration
// Use test environment URL for now, as we are in development
const PHONEPE_HOST = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || '';

// Detect environment and use appropriate redirect URL
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = isProduction 
  ? 'https://bamboomade.repl.co' // Replace with your deployed URL when known
  : 'http://localhost:5000';
const REDIRECT_URL = `${baseUrl}/api/payments/phonepe/callback`;
const REDIRECT_MODE = 'REDIRECT';

// Use PHONEPE_MERCHANT_ID from environment variables if available, otherwise use default
// For the sandbox environment, use PHONEPE as the merchant ID
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PHONEPE';

console.log("PhonePe service initialized with:", {
  host: PHONEPE_HOST,
  merchantId: MERCHANT_ID,
  redirectUrl: REDIRECT_URL,
  hasClientId: !!CLIENT_ID,
  hasClientSecret: !!CLIENT_SECRET,
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
    console.log("Starting PhonePe payment initialization with config:", {
      host: PHONEPE_HOST,
      merchantId: MERCHANT_ID,
      redirectUrl: REDIRECT_URL,
      clientIdExists: !!CLIENT_ID,
      clientSecretExists: !!CLIENT_SECRET,
      orderId
    });

    // Create payload for PhonePe API
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: orderId,
      amount: amount * 100, // Convert to paise
      redirectUrl: REDIRECT_URL,
      redirectMode: REDIRECT_MODE,
      callbackUrl: REDIRECT_URL,
      mobileNumber: customerPhone,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // Log the payload for debugging (excluding sensitive info)
    console.log("PhonePe payload prepared:", {
      merchantId: payload.merchantId,
      merchantTransactionId: payload.merchantTransactionId,
      amount: payload.amount,
      redirectUrl: payload.redirectUrl,
      hasMobileNumber: !!payload.mobileNumber,
      instrumentType: payload.paymentInstrument.type
    });

    // Generate X-VERIFY header (HMAC based auth)
    const requestData = JSON.stringify(payload);
    const base64EncodedPayload = Buffer.from(requestData).toString('base64');
    
    try {
      // Create X-VERIFY signature using CLIENT_SECRET as the salt key
      // In a production environment, you would use the dedicated SALT_KEY and SALT_INDEX
      const hmac = crypto.createHmac('sha256', CLIENT_SECRET);
      // Standard PhonePe format: SHA256(base64 payload + endpoint + salt key) + "###" + index
      // Using a default index of 1 since we don't have a specific salt index
      const signature = hmac.update(base64EncodedPayload + '/pg/v1/pay' + CLIENT_ID).digest('hex');
      const xVerifyHeader = signature + '###1'; // Using '1' as default salt index
      
      console.log("Generated X-VERIFY header (signature truncated for security):", {
        headerLength: xVerifyHeader.length,
        hasClientId: true,
        signatureFormat: "HMAC-SHA256"
      });

      // Make the API call to PhonePe
      console.log(`Making API call to ${PHONEPE_HOST}/pg/v1/pay`);
      
      const response = await axios.post(
        `${PHONEPE_HOST}/pg/v1/pay`,
        {
          request: base64EncodedPayload
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerifyHeader
          }
        }
      );

      console.log("PhonePe API response received:", {
        status: response.status,
        success: response.data?.success,
        hasData: !!response.data?.data,
        hasInstrumentResponse: !!response.data?.data?.instrumentResponse
      });

      if (response.data.success) {
        return {
          success: true,
          paymentLink: response.data.data.instrumentResponse.redirectInfo.url,
          transactionId: orderId
        };
      } else {
        console.error("PhonePe API returned success:false:", response.data);
        throw new Error(response.data.message || 'Payment initialization failed');
      }
    } catch (error) {
      const cryptoError = error as Error;
      console.error("Error in HMAC signature generation:", cryptoError);
      throw new Error("Failed to generate authentication signature: " + cryptoError.message);
    }
  } catch (error: any) {
    console.error('PhonePe payment error details:', {
      message: error.message,
      code: error.code,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      stack: error.stack
    });
    
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
    console.log(`Checking PhonePe payment status for transaction: ${merchantTransactionId}`);
    
    // Generate X-VERIFY header for status check
    // Using CLIENT_SECRET as the salt key, as we don't have a dedicated SALT_KEY
    const hmac = crypto.createHmac('sha256', CLIENT_SECRET);
    const pathWithParams = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`;
    const dataToHash = pathWithParams + CLIENT_ID;
    
    console.log("Generating signature with path:", pathWithParams);
    
    const signature = hmac.update(dataToHash).digest('hex');
    // Using default salt index of 1
    const xVerifyHeader = signature + '###1';

    console.log("Status check request details:", {
      url: `${PHONEPE_HOST}${pathWithParams}`,
      headerLength: xVerifyHeader.length,
      merchantId: MERCHANT_ID
    });

    // Make the API call to PhonePe to check status
    const response = await axios.get(
      `${PHONEPE_HOST}${pathWithParams}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerifyHeader,
          'X-MERCHANT-ID': MERCHANT_ID
        }
      }
    );

    console.log("PhonePe status check response:", {
      status: response.status,
      success: response.data?.success,
      hasData: !!response.data?.data
    });

    if (response.data.success) {
      const result = {
        success: true,
        status: response.data.data.responseCode,
        paymentId: response.data.data.paymentId,
        amount: response.data.data.amount / 100, // Convert from paise to rupees
        paymentInstrument: response.data.data.paymentInstrument
      };
      
      console.log("Payment status result:", {
        status: result.status,
        paymentId: result.paymentId,
        amount: result.amount
      });
      
      return result;
    } else {
      console.error("PhonePe status check returned success:false:", response.data);
      throw new Error(response.data.message || 'Payment status check failed');
    }
  } catch (error: any) {
    console.error('PhonePe status check error details:', {
      message: error.message,
      code: error.code,
      responseStatus: error.response?.status,
      responseData: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Payment status check failed'
    };
  }
}