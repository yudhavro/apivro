-- ============================================
-- FIX: Database error saving new user
-- ============================================
-- Jalankan SQL ini di Supabase SQL Editor untuk memperbaiki error pendaftaran
-- Dashboard > SQL Editor > New Query > Paste & Run
-- ============================================

-- Drop trigger lama
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update function handle_new_user dengan error handling yang lebih baik
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  -- Insert profile dengan COALESCE untuk handle metadata yang berbeda dari OAuth providers
  -- Google menggunakan 'name' dan 'picture'
  -- GitHub menggunakan 'full_name' dan 'avatar_url'
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)  -- Fallback: gunakan bagian email sebelum @
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'  -- Google menggunakan 'picture'
    )
  );

  -- Get free plan ID
  SELECT id INTO free_plan_id FROM subscription_plans WHERE slug = 'free' LIMIT 1;

  -- Create free subscription (forever - no end_date)
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO subscriptions (user_id, plan_id, billing_cycle, status, start_date, end_date)
    VALUES (
      NEW.id,
      free_plan_id,
      'monthly',
      'active',
      now(),
      NULL
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error tapi jangan gagalkan pembuatan user
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat ulang trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SELESAI
-- ============================================
-- Setelah menjalankan SQL ini, coba daftar lagi
-- ============================================
