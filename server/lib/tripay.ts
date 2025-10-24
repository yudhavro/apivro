import crypto from 'crypto';
import axios from 'axios';

// Tripay Configuration
const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || 'DEV-teYeK3JqORIJfGA5Lm5Dga5nu8szjlh2mAsh3N93';
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || 'LSUYl-OQie2-iVO1I-34a7R-xUUZY';
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE || 'T17192';
const TRIPAY_MODE = process.env.TRIPAY_MODE || 'sandbox'; // 'sandbox' or 'production'

const TRIPAY_BASE_URL = TRIPAY_MODE === 'production' 
  ? 'https://tripay.co.id/api' 
  : 'https://tripay.co.id/api-sandbox';

// Payment channels (ordered as requested)
export const PAYMENT_CHANNELS = [
  { 
    code: 'QRIS', 
    name: 'QRIS', 
    fee_type: 'customer', 
    fee: 750, 
    fee_percent: 0.7,
    icon_url: 'https://tripay.co.id/images/payment_icon/QRIS.png'
  },
  { 
    code: 'MANDIRIVA', 
    name: 'Mandiri Virtual Account', 
    fee_type: 'customer', 
    fee: 4250,
    icon_url: 'https://tripay.co.id/images/payment_icon/MANDIRIVA.png'
  },
  { 
    code: 'BRIVA', 
    name: 'BRI Virtual Account', 
    fee_type: 'customer', 
    fee: 4250,
    icon_url: 'https://tripay.co.id/images/payment_icon/BRIVA.png'
  },
  { 
    code: 'BNIVA', 
    name: 'BNI Virtual Account', 
    fee_type: 'customer', 
    fee: 4250,
    icon_url: 'https://tripay.co.id/images/payment_icon/BNIVA.png'
  },
  { 
    code: 'BSIVA', 
    name: 'BSI Virtual Account', 
    fee_type: 'customer', 
    fee: 4250,
    icon_url: 'https://tripay.co.id/images/payment_icon/BSIVA.png'
  },
];

interface CreatePaymentParams {
  method: string;
  merchant_ref: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  order_items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  callback_url?: string;
  return_url?: string;
  expired_time?: number; // Unix timestamp (not seconds!)
}

interface TripayResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * Generate signature for Tripay API
 */
function generateSignature(merchantRef: string, amount: number): string {
  const data = `${TRIPAY_MERCHANT_CODE}${merchantRef}${amount}`;
  return crypto
    .createHmac('sha256', TRIPAY_PRIVATE_KEY)
    .update(data)
    .digest('hex');
}

/**
 * Get available payment channels
 */
export async function getPaymentChannels(): Promise<TripayResponse> {
  try {
    const response = await axios.get(`${TRIPAY_BASE_URL}/merchant/payment-channel`, {
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`,
      },
    });

    return {
      success: true,
      message: 'Payment channels retrieved',
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('Tripay get channels error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get payment channels',
      data: null,
    };
  }
}

/**
 * Calculate payment fee
 */
export function calculateFee(method: string, amount: number): { fee: number; total: number } {
  const channel = PAYMENT_CHANNELS.find(c => c.code === method);
  
  if (!channel) {
    return { fee: 0, total: amount };
  }

  let fee = channel.fee || 0;
  
  if (channel.fee_percent) {
    fee += Math.ceil(amount * (channel.fee_percent / 100));
  }

  return {
    fee,
    total: amount + fee,
  };
}

/**
 * Create payment transaction (Closed Payment)
 */
export async function createPayment(params: CreatePaymentParams): Promise<TripayResponse> {
  try {
    const signature = generateSignature(params.merchant_ref, params.amount);

    const payload = {
      method: params.method,
      merchant_ref: params.merchant_ref,
      amount: params.amount,
      customer_name: params.customer_name,
      customer_email: params.customer_email,
      customer_phone: '', // Optional
      order_items: params.order_items,
      callback_url: params.callback_url || `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/payments/tripay/callback`,
      return_url: params.return_url || `${process.env.VITE_APP_URL || 'http://localhost:5173'}/subscription/history`,
      expired_time: params.expired_time || (Math.floor(Date.now() / 1000) + (24 * 60 * 60)), // Unix timestamp: current time + 24 hours
      signature,
    };

    console.log('📤 Creating Tripay payment:', {
      method: payload.method,
      amount: payload.amount,
      merchant_ref: payload.merchant_ref,
    });

    const response = await axios.post(
      `${TRIPAY_BASE_URL}/transaction/create`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${TRIPAY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Tripay payment created:', response.data.data.reference);

    return {
      success: true,
      message: 'Payment created successfully',
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('❌ Tripay create payment error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create payment',
      data: error.response?.data || null,
    };
  }
}

/**
 * Get payment detail
 */
export async function getPaymentDetail(reference: string): Promise<TripayResponse> {
  try {
    const response = await axios.get(
      `${TRIPAY_BASE_URL}/transaction/detail?reference=${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${TRIPAY_API_KEY}`,
        },
      }
    );

    return {
      success: true,
      message: 'Payment detail retrieved',
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('Tripay get detail error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get payment detail',
      data: null,
    };
  }
}

/**
 * Verify callback signature
 * Signature = HMAC-SHA256(merchant_code + merchant_ref + amount, private_key)
 */
export function verifyCallbackSignature(merchantRef: string, amount: number, signature: string): boolean {
  const data = `${TRIPAY_MERCHANT_CODE}${merchantRef}${amount}`;
  const hash = crypto
    .createHmac('sha256', TRIPAY_PRIVATE_KEY)
    .update(data)
    .digest('hex');

  return hash === signature;
}

/**
 * Get merchant info
 */
export async function getMerchantInfo(): Promise<TripayResponse> {
  try {
    const response = await axios.get(`${TRIPAY_BASE_URL}/merchant/fee-calculator`, {
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`,
      },
      params: {
        amount: 10000,
        code: 'QRIS',
      },
    });

    return {
      success: true,
      message: 'Merchant info retrieved',
      data: response.data,
    };
  } catch (error: any) {
    console.error('Tripay merchant info error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get merchant info',
      data: null,
    };
  }
}

export default {
  getPaymentChannels,
  calculateFee,
  createPayment,
  getPaymentDetail,
  verifyCallbackSignature,
  getMerchantInfo,
  PAYMENT_CHANNELS,
};
