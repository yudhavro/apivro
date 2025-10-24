-- ============================================
-- CREATE PROFILE FOR EXISTING USER
-- ============================================
-- SQL ini untuk membuat profile untuk user yang sudah login
-- tapi belum punya profile (karena trigger belum jalan)
-- ============================================

-- Insert profile untuk semua user yang belum punya profile
INSERT INTO profiles (id, email, full_name, avatar_url)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ) as full_name,
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  ) as avatar_url
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Insert free subscription untuk user yang belum punya subscription
INSERT INTO subscriptions (user_id, plan_id, billing_cycle, status, start_date, end_date)
SELECT 
  p.id as user_id,
  sp.id as plan_id,
  'monthly' as billing_cycle,
  'active' as status,
  now() as start_date,
  NULL as end_date
FROM profiles p
CROSS JOIN subscription_plans sp
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE sp.slug = 'free'
  AND s.id IS NULL;

-- Tampilkan hasil
SELECT 
  p.id,
  p.email,
  p.full_name,
  sp.name as plan_name,
  s.status as subscription_status
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id;

-- ============================================
-- SELESAI
-- ============================================
-- Profile dan subscription sudah dibuat untuk user yang ada
-- Refresh aplikasi dan coba tambah device lagi
-- ============================================
