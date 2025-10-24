-- ============================================
-- Webhook Logs Table Migration
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

/*
  # Webhook Logs Table
  
  ## Purpose
  Store webhook call logs for debugging and monitoring.
  Only stores metadata (no message content for privacy).
  
  ## Features
  - Track webhook success/failure
  - Monitor response times
  - Debug webhook issues
  - Auto-cleanup old logs (7 days retention)
  
  ## Privacy
  - NO message content stored
  - Only metadata (status, timing, errors)
*/

-- ============================================
-- 1. CREATE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Webhook info
  webhook_url TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('message.in', 'message.out', 'status.update', 'webhook.test')),
  
  -- Request/Response metadata (NO message content)
  status_code INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Index for user queries (get logs by device)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_device_id ON webhook_logs(device_id);

-- Index for user queries (get logs by user)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON webhook_logs(user_id);

-- Index for time-based queries and cleanup
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Composite index for efficient device + time queries
CREATE INDEX IF NOT EXISTS idx_webhook_logs_device_created ON webhook_logs(device_id, created_at DESC);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Users can view their own webhook logs
CREATE POLICY "Users can view own webhook logs"
  ON webhook_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own webhook logs (via backend)
CREATE POLICY "Users can insert own webhook logs"
  ON webhook_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own webhook logs
CREATE POLICY "Users can delete own webhook logs"
  ON webhook_logs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 5. CREATE CLEANUP FUNCTION
-- ============================================

-- Function to delete logs older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_logs 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. SCHEDULE CLEANUP (Optional - via pg_cron)
-- ============================================

/*
  If pg_cron is enabled in your Supabase project:
  
  SELECT cron.schedule(
    'cleanup-webhook-logs',
    '0 2 * * *',  -- Run daily at 2 AM
    $$SELECT cleanup_old_webhook_logs()$$
  );
  
  Note: pg_cron might not be available in all Supabase plans.
  Alternative: Run cleanup manually or via backend cron job.
*/

-- ============================================
-- 7. HELPER FUNCTION - Get Recent Logs
-- ============================================

-- Function to get recent webhook logs for a device
CREATE OR REPLACE FUNCTION get_recent_webhook_logs(
  p_device_id UUID,
  p_limit INTEGER DEFAULT 15
)
RETURNS TABLE (
  id UUID,
  webhook_url TEXT,
  event_type TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wl.id,
    wl.webhook_url,
    wl.event_type,
    wl.status_code,
    wl.response_time_ms,
    wl.success,
    wl.error_message,
    wl.created_at
  FROM webhook_logs wl
  WHERE wl.device_id = p_device_id
    AND wl.user_id = auth.uid()  -- Security: only user's own logs
  ORDER BY wl.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. HELPER FUNCTION - Get Webhook Stats
-- ============================================

-- Function to get webhook statistics for a device
CREATE OR REPLACE FUNCTION get_webhook_stats(
  p_device_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  total_calls BIGINT,
  successful_calls BIGINT,
  failed_calls BIGINT,
  avg_response_time_ms NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_calls,
    COUNT(*) FILTER (WHERE success = true)::BIGINT as successful_calls,
    COUNT(*) FILTER (WHERE success = false)::BIGINT as failed_calls,
    ROUND(AVG(response_time_ms), 2) as avg_response_time_ms,
    ROUND(
      (COUNT(*) FILTER (WHERE success = true)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100,
      2
    ) as success_rate
  FROM webhook_logs
  WHERE device_id = p_device_id
    AND user_id = auth.uid()  -- Security: only user's own logs
    AND created_at > NOW() - (p_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE
-- ============================================

/*
  ## Next Steps:
  
  1. Run this migration in Supabase SQL Editor
  2. Verify table created: SELECT * FROM webhook_logs LIMIT 1;
  3. Test RLS policies work correctly
  4. Implement backend webhook forwarding logic
  5. Add UI to display webhook logs in DevicesPage
  
  ## Usage Examples:
  
  -- Get recent logs for a device
  SELECT * FROM get_recent_webhook_logs('device-uuid', 15);
  
  -- Get webhook stats for last 24 hours
  SELECT * FROM get_webhook_stats('device-uuid', 24);
  
  -- Manual cleanup (if needed)
  SELECT cleanup_old_webhook_logs();
*/
