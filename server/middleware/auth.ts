import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file!');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthRequest extends Request {
  userId?: string;
  deviceId?: string;
  apiKeyId?: string;
}

/**
 * Middleware untuk authenticate API key
 */
export async function apiKeyAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API_KEY_REQUIRED',
        message: 'API key is required. Please provide X-API-Key header.'
      });
    }

    // Validate API key format
    if (!apiKey.startsWith('apivro')) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_API_KEY_FORMAT',
        message: 'Invalid API key format.'
      });
    }

    // Hash the provided API key
    const keyHash = hashApiKey(apiKey);

    // Find API key in database
    const { data: apiKeyData, error } = await supabase
      .from('api_keys')
      .select('*, devices(*)')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error || !apiKeyData) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_API_KEY',
        message: 'Invalid or inactive API key.'
      });
    }

    // Check if device is connected
    if (apiKeyData.devices.status !== 'connected') {
      return res.status(403).json({
        success: false,
        error: 'DEVICE_NOT_CONNECTED',
        message: 'Device is not connected. Please connect your device first.'
      });
    }

    // Update last_used_at (async, don't wait)
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyData.id)
      .then();

    // Attach user info to request
    req.userId = apiKeyData.user_id;
    req.deviceId = apiKeyData.device_id;
    req.apiKeyId = apiKeyData.id;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Authentication failed.'
    });
  }
}

/**
 * Hash API key using SHA-256
 */
function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}
