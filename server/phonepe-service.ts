import axios from 'axios';
import crypto from 'crypto';

// PhonePe API configuration
const PHONEPE_HOST = 'https://api.phonepe.com/apis/hermes';
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || '';
const REDIRECT_URL = 'http://localhost:5000/api/payments/phonepe/callback';
const REDIRECT_MODE = 'REDIRECT';
const MERCHANT_ID = 'BAMBOOMADEONLINE'; // Replace with your actual merchant ID if different

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

    // Generate X-VERIFY header (HMAC based auth)
    const requestData = JSON.stringify(payload);
    const base64EncodedPayload = Buffer.from(requestData).toString('base64');
    
    // Create X-VERIFY signature
    const hmac = crypto.createHmac('sha256', CLIENT_SECRET);
    const signature = hmac.update(base64EncodedPayload + '/pg/v1/pay' + CLIENT_ID).digest('hex');
    const xVerifyHeader = signature + '###' + CLIENT_ID;

    // Make the API call to PhonePe
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

    if (response.data.success) {
      return {
        success: true,
        paymentLink: response.data.data.instrumentResponse.redirectInfo.url,
        transactionId: orderId
      };
    } else {
      throw new Error(response.data.message || 'Payment initialization failed');
    }
  } catch (error: any) {
    console.error('PhonePe payment error:', error);
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
    // Generate X-VERIFY header for status check
    const hmac = crypto.createHmac('sha256', CLIENT_SECRET);
    const signature = hmac.update(`/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + CLIENT_ID).digest('hex');
    const xVerifyHeader = signature + '###' + CLIENT_ID;

    // Make the API call to PhonePe to check status
    const response = await axios.get(
      `${PHONEPE_HOST}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerifyHeader,
          'X-MERCHANT-ID': MERCHANT_ID
        }
      }
    );

    if (response.data.success) {
      return {
        success: true,
        status: response.data.data.responseCode,
        paymentId: response.data.data.paymentId,
        amount: response.data.data.amount / 100, // Convert from paise to rupees
        paymentInstrument: response.data.data.paymentInstrument
      };
    } else {
      throw new Error(response.data.message || 'Payment status check failed');
    }
  } catch (error: any) {
    console.error('PhonePe status check error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Payment status check failed'
    };
  }
}