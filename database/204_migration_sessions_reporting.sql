-- Run this in your Supabase SQL Editor to update the existing sessions table

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS final_report jsonb;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS overall_score integer;

-- Optional: Add comment
COMMENT ON COLUMN public.sessions.final_report IS 'Store the complete JSON report including feedback and scores';
COMMENT ON COLUMN public.sessions.overall_score IS 'Store overall score for quick sorting/filtering';
