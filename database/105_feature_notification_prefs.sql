-- ============================================
-- Migration: Create notification_preferences table
-- Description: Store user notification preferences for MockMentor
-- ============================================

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    session_reminders BOOLEAN DEFAULT true,
    weekly_report BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
ON notification_preferences(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notification preferences
CREATE POLICY "Users can view their own notification preferences"
ON notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own notification preferences
CREATE POLICY "Users can insert their own notification preferences"
ON notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notification preferences
CREATE POLICY "Users can update their own notification preferences"
ON notification_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own notification preferences
CREATE POLICY "Users can delete their own notification preferences"
ON notification_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON notification_preferences TO authenticated;
GRANT ALL ON notification_preferences TO service_role;

-- Success message
COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences for email notifications, session reminders, and weekly reports';

-- ============================================
-- Verification Queries (Run these to verify)
-- ============================================

-- Check if table exists
-- SELECT EXISTS (
--     SELECT FROM information_schema.tables 
--     WHERE table_schema = 'public' 
--     AND table_name = 'notification_preferences'
-- );

-- View table structure
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'notification_preferences'
-- ORDER BY ordinal_position;

-- View RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'notification_preferences';
