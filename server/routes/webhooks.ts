import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Helper function to log webhook calls
 */
async function logWebhookCall(params: {
  device_id: string;
  user_id: string;
  webhook_url: string;
  event_type: string;
  status_code: number;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
}) {
  try {
    await supabase.from('webhook_logs').insert({
      device_id: params.device_id,
      user_id: params.user_id,
      webhook_url: params.webhook_url,
      event_type: params.event_type,
      status_code: params.status_code,
      response_time_ms: params.response_time_ms,
      success: params.success,
      error_message: params.error_message || null,
    });
  } catch (error) {
    console.error('Failed to log webhook call:', error);
  }
}

/**
 * POST /api/v1/webhooks/incoming
 * Receive incoming messages from WAHA and forward to user webhook
 */
router.post('/incoming', async (req, res) => {
  try {
    const { session, event, payload } = req.body;

    // Find device by session_id
    const { data: device, error } = await supabase
      .from('devices')
      .select('*, users:user_id(*)')
      .eq('session_id', session)
      .single();

    if (error || !device) {
      console.error('Device not found for session:', session);
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check if device has webhook URL configured
    if (!device.webhook_url) {
      return res.status(200).json({ message: 'No webhook configured' });
    }

    // Prepare webhook payload
    const webhookPayload = {
      event: event || 'message.received',
      timestamp: new Date().toISOString(),
      device_id: device.id,
      device_name: device.name,
      phone_number: device.phone_number,
      data: payload
    };

    // Forward to user webhook with timing
    const startTime = Date.now();
    try {
      const response = await axios.post(device.webhook_url, webhookPayload, {
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'API-VRO-Webhook/1.0'
        }
      });

      const responseTime = Date.now() - startTime;

      // Log successful webhook call
      await logWebhookCall({
        device_id: device.id,
        user_id: device.user_id,
        webhook_url: device.webhook_url,
        event_type: 'message.in',
        status_code: response.status,
        response_time_ms: responseTime,
        success: true,
      });

      console.log(`✅ Webhook delivered to ${device.webhook_url} in ${responseTime}ms`);
      return res.status(200).json({ success: true });

    } catch (webhookError: any) {
      const responseTime = Date.now() - startTime;
      const statusCode = webhookError.response?.status || 0;
      const errorMessage = webhookError.message || 'Unknown error';

      // Log failed webhook call
      await logWebhookCall({
        device_id: device.id,
        user_id: device.user_id,
        webhook_url: device.webhook_url,
        event_type: 'message.in',
        status_code: statusCode,
        response_time_ms: responseTime,
        success: false,
        error_message: errorMessage,
      });

      console.error(`❌ Webhook failed to ${device.webhook_url}: ${errorMessage}`);
      
      // Still return 200 to WAHA (don't block message processing)
      return res.status(200).json({ 
        success: false, 
        error: 'Webhook delivery failed' 
      });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/webhooks/test/:deviceId
 * Test webhook endpoint for a device
 */
router.post('/test/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
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

    // Get device details
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .eq('user_id', authUser.id)
      .single();

    if (deviceError || !device) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Device not found',
      });
    }

    if (!device.webhook_url) {
      return res.status(400).json({
        success: false,
        error: 'NO_WEBHOOK',
        message: 'No webhook URL configured for this device',
      });
    }

    // Prepare test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      device_id: device.id,
      device_name: device.name,
      message: 'This is a test webhook from API VRO',
      test: true,
    };

    // Send test webhook
    const startTime = Date.now();
    try {
      const response = await axios.post(device.webhook_url, testPayload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'API-VRO-Webhook/1.0',
        },
      });

      const responseTime = Date.now() - startTime;

      // Log test webhook call
      await logWebhookCall({
        device_id: device.id,
        user_id: authUser.id,
        webhook_url: device.webhook_url,
        event_type: 'webhook.test',
        status_code: response.status,
        response_time_ms: responseTime,
        success: true,
      });

      console.log(`✅ Test webhook successful: ${device.webhook_url} (${responseTime}ms)`);

      return res.json({
        success: true,
        message: 'Webhook test successful',
        status_code: response.status,
        response_time_ms: responseTime,
      });

    } catch (webhookError: any) {
      const responseTime = Date.now() - startTime;
      const statusCode = webhookError.response?.status || 0;
      const errorMessage = webhookError.message || 'Unknown error';

      // Log failed test webhook
      await logWebhookCall({
        device_id: device.id,
        user_id: authUser.id,
        webhook_url: device.webhook_url,
        event_type: 'webhook.test',
        status_code: statusCode,
        response_time_ms: responseTime,
        success: false,
        error_message: errorMessage,
      });

      console.error(`❌ Test webhook failed: ${device.webhook_url} - ${errorMessage}`);

      return res.status(400).json({
        success: false,
        error: 'WEBHOOK_FAILED',
        message: errorMessage,
        status_code: statusCode,
        response_time_ms: responseTime,
      });
    }

  } catch (error: any) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to test webhook',
    });
  }
});

/**
 * GET /api/v1/webhooks/logs
 * Get paginated webhook logs for authenticated user
 */
router.get('/logs', async (req, res) => {
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

    // Get query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const deviceId = req.query.device_id as string;
    const eventType = req.query.event_type as string;
    
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('webhook_logs')
      .select(`
        *,
        devices!inner(id, name, user_id)
      `, { count: 'exact' })
      .eq('devices.user_id', authUser.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data: logs, error: logsError, count } = await query;

    if (logsError) {
      console.error('Error fetching webhook logs:', logsError);
      return res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch webhook logs',
      });
    }

    // Calculate stats
    const statsQuery = supabase
      .from('webhook_logs')
      .select('success, response_time_ms', { count: 'exact' })
      .eq('user_id', authUser.id);

    if (deviceId) {
      statsQuery.eq('device_id', deviceId);
    }

    const { data: statsData, count: totalCount } = await statsQuery;

    const successCount = statsData?.filter(log => log.success).length || 0;
    const avgResponseTime = statsData && statsData.length > 0
      ? Math.round(statsData.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / statsData.length)
      : 0;

    const stats = {
      total_calls: totalCount || 0,
      successful_calls: successCount,
      failed_calls: (totalCount || 0) - successCount,
      success_rate: totalCount ? Math.round((successCount / totalCount) * 100 * 10) / 10 : 0,
      avg_response_time_ms: avgResponseTime,
    };

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
      stats,
    });

  } catch (error: any) {
    console.error('Get webhook logs error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get webhook logs',
    });
  }
});

export { router as webhooksRouter };
