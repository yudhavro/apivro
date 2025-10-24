-- ============================================
-- FIX: Total Messages Sent Counter
-- ============================================
-- This script will:
-- 1. Create increment_total_messages function
-- 2. Sync existing messages to total_messages_sent
-- ============================================

-- Step 1: Create function
CREATE OR REPLACE FUNCTION increment_total_messages(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET total_messages_sent = COALESCE(total_messages_sent, 0) + 1
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_total_messages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_total_messages(UUID) TO service_role;

COMMENT ON FUNCTION increment_total_messages IS 'Increment total_messages_sent counter for a user';

-- Step 2: Sync existing data
-- Update total_messages_sent based on existing messages
UPDATE profiles p
SET total_messages_sent = (
  SELECT COUNT(*) 
  FROM messages m 
  WHERE m.user_id = p.id
)
WHERE id IN (SELECT DISTINCT user_id FROM messages);

-- Step 3: Verify results
SELECT 
  p.email,
  p.total_messages_sent,
  (SELECT COUNT(*) FROM messages WHERE user_id = p.id) as actual_messages
FROM profiles p
WHERE p.total_messages_sent > 0
ORDER BY p.total_messages_sent DESC;

-- ============================================
-- DONE! 
-- Next: Send a test message to verify function works
-- ============================================
