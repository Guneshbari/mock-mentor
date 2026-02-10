-- ============================================
-- Migration: Add bio and updated_at to users table
-- ============================================
-- Description: Adds bio and updated_at columns to the users table
-- Author: Mock Mentor Team
-- Date: 2026-02-04
-- ============================================

-- Add bio column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add updated_at column to users table with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS users_updated_at_trigger ON users;
CREATE TRIGGER users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- ============================================
-- Verification Queries
-- ============================================
-- After running this migration, you can verify with:
-- 
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name IN ('bio', 'updated_at');
--
-- Expected: 2 rows showing bio (text) and updated_at (timestamp with time zone)
-- ============================================
