-- Add deleted_at column to users table for soft deletes
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add index on deleted_at for faster queries
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at);

-- Update RLS policies to exclude deleted users (optional but recommended)
-- This ensures deleted users are treated as non-existent for most operations
-- Note: This depends on how you want to handle "soft deleted" users. 
-- For now, we'll just add the column.
