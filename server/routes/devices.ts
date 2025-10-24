import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, getDeviceDisconnectEmail } from '../lib/email.js';

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/v1/devices/:deviceId/disconnect-notification
 * Send device disconnect notification email
 */
router.post('/:deviceId/disconnect-notification', async (req: Request, res: Response) => {
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

    // Check notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('device_disconnect')
      .eq('user_id', authUser.id)
      .single();

    if (prefs && prefs.device_disconnect === false) {
      console.log('⏭️ Device disconnect notification disabled for user:', authUser.id);
      return res.json({
        success: true,
        message: 'Notification disabled by user preferences',
        sent: false,
      });
    }

    // Send disconnect email
    console.log('📧 Sending device disconnect email...');

    const emailHtml = getDeviceDisconnectEmail({
      customerName: authUser.email?.split('@')[0] || 'User',
      deviceName: device.name,
      phoneNumber: device.phone_number,
    });

    const emailResult = await sendEmail({
      to: authUser.email!,
      subject: `⚠️ Device [${device.name}] Terputus Dari APIvro`,
      html: emailHtml,
    });

    if (emailResult.success) {
      console.log('✅ Device disconnect email sent');

      // Save notification record
      await supabase.from('notifications').insert({
        user_id: authUser.id,
        type: 'device_disconnected',
        title: 'Device Disconnected',
        message: `Your device ${device.name} has been disconnected.`,
        email_sent: true,
      });

      return res.json({
        success: true,
        message: 'Disconnect notification sent',
        sent: true,
      });
    } else {
      console.error('❌ Failed to send email:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: 'EMAIL_FAILED',
        message: emailResult.error,
      });
    }
  } catch (error: any) {
    console.error('Error sending disconnect notification:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to send notification',
    });
  }
});

export default router;
