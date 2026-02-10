-- ============================================
-- Migration: Add updated_at to sessions table
-- ============================================
-- Description: Adds updated_at column to sessions table for tracking last modification
-- Date: 2026-02-08
-- ============================================

-- Add updated_at column to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS sessions_updated_at_trigger ON public.sessions;
CREATE TRIGGER sessions_updated_at_trigger
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_sessions_updated_at();

-- ============================================
-- Verification Query
-- ============================================
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'sessions' AND column_name = 'updated_at';
-- Expected: 1 row showing updated_at (timestamp with time zone)
