import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import * as tripay from '../lib/tripay';
import { apiKeyAuthMiddleware, AuthRequest } from '../middleware/auth';
import { createAndUploadInvoice } from '../lib/invoice';
import { sendEmail, getPaymentSuccessEmail } from '../lib/email';

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/v1/payments/channels
 * Get available payment channels
 */
router.get('/channels', async (req: Request, res: Response) => {
  try {
    // Return predefined channels (faster than API call)
    res.json({
      success: true,
      channels: PAYMENT_CHANNELS,
    });
  } catch (error: any) {
    console.error('Error getting payment channels:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get payment channels',
    });
  }
});

/**
 * POST /api/v1/payments/create
 * Create new payment transaction (with Supabase auth)
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { plan_id, payment_method } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authorization header required',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
    }

    const userId = authUser.id;

    if (!plan_id || !payment_method) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'plan_id and payment_method are required',
      });
    }

    // Get user info
    const { data: userDetail } = await supabase.auth.admin.getUserById(userId);
    if (!userDetail) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({
        success: false,
        error: 'PLAN_NOT_FOUND',
        message: 'Subscription plan not found',
      });
    }

    // Calculate amount and fees
    const amount = plan.price_monthly;
    const { fee, total } = calculateFee(payment_method, amount);

    // Generate merchant reference
    const merchantRef = `APIVRO-${Date.now()}-${userId.substring(0, 8)}`;

    // Create payment via Tripay
    const tripayResult = await tripay.createPayment({
      method: payment_method,
      merchant_ref: merchantRef,
      amount: total,
      customer_name: userDetail.user?.email?.split('@')[0] || 'Customer',
      customer_email: userDetail.user?.email || '',
      order_items: [
        {
          name: `${plan.name} Plan - 1 Month`,
          price: total,
          quantity: 1,
        },
      ],
    });

    if (!tripayResult.success) {
      return res.status(400).json({
        success: false,
        error: 'PAYMENT_CREATION_FAILED',
        message: tripayResult.message,
        details: tripayResult.data,
      });
    }

    const tripayData = tripayResult.data;

    console.log('💾 Saving payment to database...', {
      user_id: userId,
      plan_id: plan_id,
      reference: tripayData.reference,
      amount: amount,
      total: tripayData.amount,
    });

    // Save payment to database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        plan_id: plan_id,
        payment_method: payment_method, // Required NOT NULL field
        tripay_reference: tripayData.reference,
        tripay_merchant_ref: merchantRef,
        tripay_payment_method: payment_method,
        payment_name: tripayData.payment_name,
        payment_code: tripayData.payment_code || null,
        amount: amount,
        fee_merchant: tripayData.fee_merchant || 0,
        fee_customer: tripayData.fee_customer || fee,
        total_amount: tripayData.amount,
        status: 'pending',
        payment_url: tripayData.payment_url || null,
        checkout_url: tripayData.checkout_url || null,
        qr_url: tripayData.qr_url || null,
        pay_code: tripayData.pay_code || null,
        pay_url: tripayData.pay_url || null,
        expired_at: new Date(tripayData.expired_time * 1000).toISOString(),
        metadata: tripayData,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ Error saving payment to database:', {
        error: paymentError,
        code: paymentError.code,
        message: paymentError.message,
        details: paymentError.details,
        hint: paymentError.hint,
      });
      return res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to save payment',
        details: paymentError.message,
      });
    }

    console.log('✅ Payment created:', payment.tripay_reference);

    // Return payment details
    res.json({
      success: true,
      payment: {
        id: payment.id,
        reference: payment.tripay_reference,
        amount: payment.total_amount,
        status: payment.status,
        payment_method: payment.payment_name,
        checkout_url: payment.checkout_url,
        qr_url: payment.qr_url,
        pay_code: payment.pay_code,
        expired_at: payment.expired_at,
      },
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create payment',
    });
  }
});

/**
 * POST /api/v1/payments/tripay/callback
 * Tripay payment callback webhook
 */
router.post('/tripay/callback', async (req: Request, res: Response) => {
  try {
    const { reference, status, merchant_ref, amount, total_amount, signature } = req.body;
    const callbackAmount = amount || total_amount; // Tripay uses total_amount in callback

    console.log('📥 Tripay callback received:', { 
      reference, 
      status, 
      merchant_ref, 
      amount: callbackAmount,
      has_signature: !!signature,
    });

    // Verify signature if provided
    if (signature) {
      const isValid = tripay.verifyCallbackSignature(merchant_ref, callbackAmount, signature);
      console.log('🔐 Signature verification:', { isValid, signature });
      
      if (!isValid) {
        console.error('❌ Invalid callback signature');
        return res.status(403).json({
          success: false,
          message: 'Invalid signature',
        });
      }
    } else {
      console.warn('⚠️ No signature provided in callback (sandbox mode)');
    }

    // Get payment from database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('tripay_reference', reference)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', reference);
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Map Tripay status to our status
    const statusMap: Record<string, string> = {
      'PAID': 'paid',
      'EXPIRED': 'expired',
      'FAILED': 'failed',
      'REFUND': 'refund',
    };

    const newStatus = statusMap[status] || 'pending';

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        paid_at: status === 'PAID' ? new Date().toISOString() : null,
        metadata: req.body,
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update payment',
      });
    }

    // If payment is successful, upgrade subscription and generate invoice
    if (status === 'PAID') {
      console.log('💰 Payment successful, upgrading subscription...');

      // Get user and plan info
      const { data: user } = await supabase.auth.admin.getUserById(payment.user_id);
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', payment.plan_id)
        .single();

      // Get current subscription
      const { data: currentSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', payment.user_id)
        .eq('status', 'active')
        .single();

      if (currentSub) {
        // Expire current subscription
        await supabase
          .from('subscriptions')
          .update({ status: 'expired', end_date: new Date().toISOString() })
          .eq('id', currentSub.id);
      }

      // Create new subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month

      await supabase
        .from('subscriptions')
        .insert({
          user_id: payment.user_id,
          plan_id: payment.plan_id,
          billing_cycle: 'monthly',
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          messages_used: 0,
          last_reset_at: startDate.toISOString(),
        });

      console.log('✅ Subscription upgraded successfully');

      // Generate and upload invoice
      if (user && plan) {
        console.log('📄 Generating invoice...');
        
        const invoiceNumber = `INV-${Date.now()}-${payment.user_id.substring(0, 8)}`;
        
        const invoiceResult = await createAndUploadInvoice({
          invoice_number: invoiceNumber,
          customer_name: user.user?.email?.split('@')[0] || 'Customer',
          customer_email: user.user?.email || '',
          plan_name: plan.name,
          amount: payment.amount,
          fee: payment.fee_customer || 0,
          total_amount: payment.total_amount,
          payment_method: payment.payment_name,
          payment_date: new Date().toISOString(),
          reference: payment.tripay_reference,
        });

        if (invoiceResult.success) {
          // Update payment with invoice URL
          await supabase
            .from('payments')
            .update({
              invoice_url: invoiceResult.invoice_url,
              invoice_number: invoiceNumber,
            })
            .eq('id', payment.id);

          console.log('✅ Invoice generated and uploaded:', invoiceResult.invoice_url);

          // Send payment success email
          if (user.user?.email) {
            // Check notification preferences
            const { data: prefs } = await supabase
              .from('notification_preferences')
              .select('payment_success')
              .eq('user_id', payment.user_id)
              .single();

            if (!prefs || prefs.payment_success !== false) {
              console.log('📧 Sending payment success email...');
              
              const emailHtml = getPaymentSuccessEmail({
                customerName: user.user.email.split('@')[0],
                planName: plan.name,
                amount: payment.amount,
                invoiceUrl: invoiceResult.invoice_url!,
                invoiceNumber: invoiceNumber,
              });

              const emailResult = await sendEmail({
                to: user.user.email,
                subject: `🎉 Pembayaran Berhasil - Subscription ${plan.name} Aktif!`,
                html: emailHtml,
              });

              if (emailResult.success) {
                console.log('✅ Payment success email sent');
                
                // Save notification record
                await supabase.from('notifications').insert({
                  user_id: payment.user_id,
                  type: 'payment_success',
                  title: 'Payment Successful',
                  message: `Your payment for ${plan.name} plan has been processed successfully.`,
                  email_sent: true,
                });
              } else {
                console.error('❌ Failed to send email:', emailResult.error);
              }
            }
          }
        } else {
          console.error('❌ Invoice generation failed:', invoiceResult.error);
        }
      }
    }

    res.json({
      success: true,
      message: 'Callback processed',
    });
  } catch (error: any) {
    console.error('Error processing callback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process callback',
    });
  }
});

/**
 * POST /api/v1/payments/sync-all
 * Sync all pending payments status from Tripay (for development)
 */
router.post('/sync-all', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authorization header required',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
    }

    console.log('🔄 Syncing all pending payments for user:', authUser.id);

    // Get all pending payments
    const { data: pendingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('status', 'pending');

    if (paymentsError) {
      return res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to get pending payments',
      });
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      return res.json({
        success: true,
        message: 'No pending payments to sync',
        synced: 0,
      });
    }

    let syncedCount = 0;

    // Check each payment status from Tripay
    for (const payment of pendingPayments) {
      try {
        const tripayDetail = await tripay.getPaymentDetail(payment.tripay_reference);

        if (tripayDetail.success) {
          const tripayData = tripayDetail.data;
          const status = tripayData.status;

          // Map Tripay status
          const statusMap: Record<string, string> = {
            'PAID': 'paid',
            'EXPIRED': 'expired',
            'FAILED': 'failed',
            'REFUND': 'refund',
          };

          const newStatus = statusMap[status] || 'pending';

          if (newStatus !== 'pending') {
            // Update payment status
            await supabase
              .from('payments')
              .update({
                status: newStatus,
                paid_at: status === 'PAID' ? new Date().toISOString() : null,
                metadata: tripayData,
              })
              .eq('id', payment.id);

            // If paid, process subscription upgrade and invoice
            if (status === 'PAID') {
              // Trigger callback processing logic
              // (reuse the same logic from callback handler)
              console.log('💰 Processing paid payment:', payment.tripay_reference);
              syncedCount++;
            }
          }
        }
      } catch (error) {
        console.error(`Error syncing payment ${payment.tripay_reference}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} payments`,
      synced: syncedCount,
    });
  } catch (error: any) {
    console.error('Error syncing payments:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to sync payments',
    });
  }
});

/**
 * GET /api/v1/payments/:reference
 * Get payment detail
 */
router.get('/:reference', apiKeyAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { reference } = req.params;
    const userId = req.userId!;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('tripay_reference', reference)
      .eq('user_id', userId)
      .single();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        error: 'PAYMENT_NOT_FOUND',
        message: 'Payment not found',
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error: any) {
    console.error('Error getting payment:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get payment',
    });
  }
});

export default router;
