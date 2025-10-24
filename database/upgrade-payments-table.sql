-- ============================================
-- UPGRADE PAYMENTS TABLE FOR TRIPAY
-- ============================================
-- This script adds missing columns to existing payments table
-- Safe to run multiple times (uses IF NOT EXISTS where possible)
-- ============================================

-- Add missing columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES subscription_plans(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tripay_merchant_ref varchar(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tripay_payment_method varchar(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_code varchar(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS fee_merchant bigint DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS fee_customer bigint DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_url text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qr_url text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pay_code text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pay_url text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_url text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_number varchar(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Update status check constraint to include 'refund'
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refund'));

-- Change amount columns from integer to bigint (for larger amounts)
ALTER TABLE payments ALTER COLUMN amount TYPE bigint;
ALTER TABLE payments ALTER COLUMN fee TYPE bigint;
ALTER TABLE payments ALTER COLUMN total_amount TYPE bigint;

-- Rename 'fee' to 'fee_customer' if needed (backward compatibility)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'payments' AND column_name = 'fee') THEN
    -- Copy data from 'fee' to 'fee_customer' if fee_customer is empty
    UPDATE payments SET fee_customer = fee WHERE fee_customer IS NULL OR fee_customer = 0;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_plan_id ON payments(plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_tripay_reference ON payments(tripay_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Add trigger for updated_at if not exists
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage all payments" ON payments;
CREATE POLICY "Service role can manage all payments"
  ON payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- ============================================
-- DONE! 
-- Payments table is now ready for Tripay integration
-- ============================================
