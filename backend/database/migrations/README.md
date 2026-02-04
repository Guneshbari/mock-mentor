# Database Migrations

This directory contains SQL migration scripts for the MockMentor database.

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of the migration file
5. Paste into the SQL editor
6. Click **Run** to execute

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push --file ./backend/database/migrations/create_notification_preferences.sql
```

### Option 3: Direct PostgreSQL Connection

If you have the PostgreSQL connection string:

```bash
psql "your-connection-string" -f ./backend/database/migrations/create_notification_preferences.sql
```

## Available Migrations

### `create_notification_preferences.sql`

Creates the `notification_preferences` table for storing user notification settings.

**Features:**
- Email notifications preference
- Session reminders preference  
- Weekly report preference
- Row Level Security (RLS) policies
- Automatic `updated_at` timestamp
- User-level access control

**What it creates:**
- `notification_preferences` table
- Index on `user_id` for performance
- 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- Trigger for automatic `updated_at` updates

## Verification

After running a migration, you can verify it worked:

```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_preferences'
);

-- View table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;

-- View RLS policies
SELECT * FROM pg_policies WHERE tablename = 'notification_preferences';
```

## Rollback

If you need to rollback the notification_preferences migration:

```sql
-- Remove the table (this will cascade delete all data)
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- Remove the trigger function if no other tables use it
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## Notes

- Always backup your database before running migrations in production
- Test migrations in a development/staging environment first
- RLS policies ensure users can only access their own notification preferences
- The `auth.uid()` function is provided by Supabase Auth
