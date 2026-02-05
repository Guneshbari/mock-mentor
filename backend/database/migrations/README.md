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

### `001_create_achievements_table.sql`

Creates the `user_achievements` table for tracking user milestones and achievements.

**Features:**
- Achievement types: first_session, sessions_5, sessions_10, high_score, perfect_score, etc.
- Unique constraint to prevent duplicate achievements
- Row Level Security (RLS) policies
- Indexed for fast querying

**What it creates:**
- `user_achievements` table with achievement tracking
- Indexes on `user_id` and `earned_at` for performance
- 2 RLS policies (SELECT, INSERT)
- Unique constraint on (user_id, achievement_type)

### `002_create_pro_tips_table.sql`

Creates the `pro_tips` table with 30 pre-seeded professional interview tips.

**Features:**
- Categories: technical, behavioral, hr, general
- Active/inactive status for tip management
- Row Level Security for authenticated users
- 30 pre-seeded tips across all categories

**What it creates:**
- `pro_tips` table
- Indexes on `category` and `is_active`
- 1 RLS policy (SELECT for authenticated users)
- 30 seeded professional interview tips

### `003_create_goals_tracking_table.sql`

Creates the `user_goals` table for tracking user goals and progress over time.

**Features:**
- Auto-calculated progress percentage
- Goal status tracking (active, completed, paused, abandoned)
- Automatic `updated_at` timestamp
- Full CRUD RLS policies

**What it creates:**
- `user_goals` table with auto-calculated progress
- Indexes on `user_id` and `status`
- 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- Trigger for automatic `updated_at` updates

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

### `add_bio_and_updated_at_to_users.sql`

Adds bio and updated_at fields to the users table.

### `add_deleted_at_to_users.sql`

Adds soft delete functionality to the users table.

## Verification

After running a migration, you can verify it worked:

```sql
-- Check if new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_achievements', 'pro_tips', 'user_goals', 'notification_preferences')
ORDER BY table_name;

-- View user_achievements table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_achievements'
ORDER BY ordinal_position;

-- Check how many pro tips were seeded
SELECT category, count(*) 
FROM pro_tips 
GROUP BY category;

-- View RLS policies for new tables
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_achievements', 'pro_tips', 'user_goals')
ORDER BY tablename, policyname;
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
