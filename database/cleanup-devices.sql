-- ============================================
-- CLEANUP EXISTING DEVICES
-- ============================================
-- Hapus semua device yang ada untuk fresh start
-- ============================================

-- Hapus semua devices
DELETE FROM devices;

-- Reset auto-increment (optional)
-- ALTER SEQUENCE devices_id_seq RESTART WITH 1;

-- Verifikasi
SELECT COUNT(*) as total_devices FROM devices;

-- ============================================
-- SELESAI
-- ============================================
-- Sekarang bisa tambah device baru dengan session 'default'
-- ============================================
