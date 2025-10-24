import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const WAHA_URL = process.env.WAHA_URL || process.env.VITE_WAHA_URL || 'http://localhost:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY || process.env.VITE_WAHA_API_KEY || '';

/**
 * POST /api/v1/messages/send
 * Send text or media message via WhatsApp
 */
router.post('/send', async (req: AuthRequest, res) => {
  try {
    const { to, message, media } = req.body;
    const userId = req.userId!;
    const deviceId = req.deviceId!;

    // Validate input
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_RECIPIENT',
        message: 'Recipient phone number is required.'
      });
    }

    if (!message && !media) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CONTENT',
        message: 'Either message or media is required.'
      });
    }

    // Get user subscription and check limits
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return res.status(403).json({
        success: false,
        error: 'NO_ACTIVE_SUBSCRIPTION',
        message: 'No active subscription found.'
      });
    }

    // Auto-reset messages_used if new month (Lazy Reset)
    const lastReset = new Date(subscription.last_reset_at);
    const now = new Date();
    const needReset = lastReset.getMonth() !== now.getMonth() || 
                      lastReset.getFullYear() !== now.getFullYear();

    let messagesUsed = subscription.messages_used || 0;

    if (needReset) {
      console.log('🔄 Resetting monthly message counter for user:', userId);
      await supabase
        .from('subscriptions')
        .update({ 
          messages_used: 0, 
          last_reset_at: now.toISOString() 
        })
        .eq('id', subscription.id);
      
      messagesUsed = 0; // Reset counter for this request
    }

    // Check message limit
    const messageLimit = subscription.subscription_plans.message_limit;

    if (messagesUsed >= messageLimit) {
      return res.status(429).json({
        success: false,
        error: 'MESSAGE_LIMIT_REACHED',
        message: 'Monthly message limit reached. Please upgrade your plan.',
        quota_used: messagesUsed,
        quota_limit: messageLimit
      });
    }

    // Get device session
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('session_id, status, name')
      .eq('id', deviceId)
      .single();

    console.log('📱 Device lookup:', { deviceId, device, deviceError });

    if (deviceError || !device) {
      console.error('❌ Device not found:', deviceError);
      return res.status(404).json({
        success: false,
        error: 'DEVICE_NOT_FOUND',
        message: 'Device not found.',
        debug: { deviceId, error: deviceError }
      });
    }

    console.log('✅ Device found:', {
      name: device.name,
      session_id: device.session_id,
      status: device.status
    });

    // Format phone number (remove + and spaces)
    const formattedPhone = to.replace(/[^0-9]/g, '');
    const chatId = `${formattedPhone}@c.us`;

    // Send message via WAHA
    let wahaResponse;
    
    const wahaHeaders: any = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if configured
    if (WAHA_API_KEY) {
      wahaHeaders['X-Api-Key'] = WAHA_API_KEY;
    }
    
    if (media) {
      // Send media message
      wahaResponse = await axios.post(
        `${WAHA_URL}/api/sendImage`,
        {
          session: device.session_id,
          chatId: chatId,
          file: {
            mimetype: media.mimetype || 'image/jpeg',
            filename: media.filename || 'image.jpg',
            url: media.url
          },
          caption: message || ''
        },
        { headers: wahaHeaders }
      );
    } else {
      // Send text message
      const wahaPayload = {
        session: device.session_id,
        chatId: chatId,
        text: message
      };
      
      console.log('📤 Sending to WAHA:', {
        url: `${WAHA_URL}/api/sendText`,
        payload: wahaPayload,
        hasApiKey: !!WAHA_API_KEY
      });
      
      wahaResponse = await axios.post(
        `${WAHA_URL}/api/sendText`,
        wahaPayload,
        { headers: wahaHeaders }
      );
      
      console.log('✅ WAHA response:', { status: wahaResponse.status });
    }

    // Save message to database
    const { data: messageRecord, error: msgError } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        device_id: deviceId,
        subscription_id: subscription.id,
        recipient: formattedPhone,
        message_type: media ? 'media' : 'text',
        status: 'sent',
        api_key_id: req.apiKeyId
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error saving message:', msgError);
    }

    // Increment messages_used counter
    await supabase
      .from('subscriptions')
      .update({ messages_used: messagesUsed + 1 })
      .eq('id', subscription.id);

    // Update total_messages_sent in profile
    await supabase.rpc('increment_total_messages', { user_uuid: userId });

    // Return success response
    return res.json({
      success: true,
      message_id: wahaResponse.data.id || messageRecord?.id,
      recipient: formattedPhone,
      quota_remaining: messageLimit - messagesUsed - 1,
      quota_used: messagesUsed + 1,
      quota_limit: messageLimit,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error sending message:', error);

    // Handle WAHA errors
    if (error.response) {
      return res.status(error.response.status || 500).json({
        success: false,
        error: 'WAHA_ERROR',
        message: error.response.data?.error || 'Failed to send message via WhatsApp.',
        details: error.response.data
      });
    }

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to send message.'
    });
  }
});

/**
 * GET /api/v1/messages/quota
 * Get current message quota usage
 */
router.get('/quota', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !subscription) {
      return res.status(404).json({
        success: false,
        error: 'NO_ACTIVE_SUBSCRIPTION',
        message: 'No active subscription found.'
      });
    }

    const messageLimit = subscription.subscription_plans.message_limit;
    const messagesUsed = subscription.messages_used || 0;

    return res.json({
      success: true,
      quota_used: messagesUsed,
      quota_limit: messageLimit,
      quota_remaining: messageLimit - messagesUsed,
      plan: subscription.subscription_plans.name,
      reset_date: subscription.last_reset_at
    });

  } catch (error) {
    console.error('Error getting quota:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get quota information.'
    });
  }
});

export { router as messagesRouter };
