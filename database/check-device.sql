-- Check devices and their sessions
SELECT 
  d.id,
  d.name,
  d.session_id,
  d.status,
  d.phone_number,
  u.email as user_email
FROM devices d
LEFT JOIN auth.users u ON d.user_id = u.id
ORDER BY d.created_at DESC
LIMIT 5;

-- Check API keys
SELECT 
  ak.id,
  ak.name,
  ak.key_prefix,
  ak.is_active,
  ak.device_id,
  d.name as device_name,
  d.session_id,
  d.status as device_status
FROM api_keys ak
LEFT JOIN devices d ON ak.device_id = d.id
WHERE ak.is_active = true
ORDER BY ak.created_at DESC
LIMIT 5;
