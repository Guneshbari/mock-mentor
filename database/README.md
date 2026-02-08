# Database Schema & Migrations

Centralized location for all SQL database files. Files are organized by sequence and type for clear execution order.

## File Naming Convention

Files follow a three-part naming scheme:

```
[SEQUENCE]_[TYPE]_[DESCRIPTION].sql
```

- **SEQUENCE**: 001-002 (core schema), 101-105 (features), 201-204 (migrations)
- **TYPE**: `schema_*`, `feature_*`, or `migration_*`
- **DESCRIPTION**: Clear description of what the file does

## File Organization

### Phase 1: Core Schema (001-002)

Initialize the fundamental database structure required by all features.

| File                          | Purpose                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `001_schema_core.sql`         | Creates base tables: users, sessions, feedback, skills, user_progress, activity_logs, preferences |
| `002_schema_user_profile.sql` | Creates user profile trigger and profile-related tables                                           |

### Phase 2: Feature Tables (101-105)

Add specialized feature tables after core schema is initialized.

| File                                 | Purpose                                   | Dependencies                     |
| ------------------------------------ | ----------------------------------------- | -------------------------------- |
| `101_feature_achievements.sql`       | User achievements and milestones tracking | `001_schema_core.sql`            |
| `102_feature_pro_tips.sql`           | Pro tips content for interviews           | `001_schema_core.sql`            |
| `103_feature_goals_tracking.sql`     | User goal creation and tracking           | `001_schema_core.sql`            |
| `104_feature_user_goals.sql`         | User-specific goals management            | `103_feature_goals_tracking.sql` |
| `105_feature_notification_prefs.sql` | User notification preferences             | `001_schema_core.sql`            |

### Phase 3: Schema Migrations (201-204)

Evolve and enhance existing tables with new capabilities.

| File                                   | Purpose                             | Adds to          | Reason                             |
| -------------------------------------- | ----------------------------------- | ---------------- | ---------------------------------- |
| `201_migration_user_bio.sql`           | Add bio and updated_at to users     | `users` table    | User profile enhancements          |
| `202_migration_user_soft_delete.sql`   | Add soft delete capability to users | `users` table    | Account deletion / GDPR compliance |
| `203_migration_sessions_tracking.sql`  | Add updated_at tracking to sessions | `sessions` table | Track session modifications        |
| `204_migration_sessions_reporting.sql` | Add reporting columns to sessions   | `sessions` table | Session analytics & reports        |

## Execution Order

Execute files in sequence number order to maintain referential integrity:

```
1. 001_schema_core.sql                    (Core tables)
2. 002_schema_user_profile.sql            (User profiles)
3. 101_feature_achievements.sql           (Achievements)
4. 102_feature_pro_tips.sql               (Pro tips)
5. 103_feature_goals_tracking.sql         (Goals tracking)
6. 104_feature_user_goals.sql             (User goals)
7. 105_feature_notification_prefs.sql     (Notifications)
8. 201_migration_user_bio.sql             (User bio)
9. 202_migration_user_soft_delete.sql     (Soft deletes)
10. 203_migration_sessions_tracking.sql   (Session tracking)
11. 204_migration_sessions_reporting.sql  (Session reporting)
```

## How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. For each file in order:
   - Click **New Query**
   - Copy the entire contents of the SQL file
   - Paste into the SQL editor
   - Click **Run** to execute
   - Verify success (no errors shown)

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations in order
supabase db push --file ./database/001_schema_core.sql
supabase db push --file ./database/002_schema_user_profile.sql
supabase db push --file ./database/101_feature_achievements.sql
# ... continue with remaining files
```

### Option 3: Direct PostgreSQL Connection

If you have the PostgreSQL connection string:

```bash
# Run all migrations in order
for file in 00*.sql 10*.sql 20*.sql; do
  psql "your-connection-string" -f "./database/$file"
done
```

## File Dependencies

```
001_schema_core.sql (Core Foundation)
    ├─→ 002_schema_user_profile.sql
    ├─→ 101_feature_achievements.sql
    ├─→ 102_feature_pro_tips.sql
    ├─→ 103_feature_goals_tracking.sql
    │   └─→ 104_feature_user_goals.sql
    └─→ 105_feature_notification_prefs.sql

201_migration_user_bio.sql (Schema Evolution)
202_migration_user_soft_delete.sql
203_migration_sessions_tracking.sql
204_migration_sessions_reporting.sql
```

## Execution Checklist

After running all migrations, verify:

- [ ] All 11 files executed successfully with no errors
- [ ] Verify tables exist: `\dt` in psql
- [ ] Check Row Level Security (RLS) is enabled on sensitive tables
- [ ] Confirm triggers are active: `SELECT * FROM pg_trigger;`
- [ ] Test auth flow (users table trigger)
- [ ] Create a test interview session to verify sessions table
- [ ] Verify updated_at columns are auto-populated on updates

## Troubleshooting

### Error: "relation already exists"

- This table was already created by a previous migration
- Skip this file and continue with the next one
- This is safe if idempotent (files have `IF NOT EXISTS`)

### Error: "column already exists"

- Migration already applied
- Safe to skip and continue

### Error: "permission denied"

- Ensure your Supabase user has proper permissions
- Contact your Supabase admin or check project settings

### Error: "invalid syntax"

- Copy-paste error or file corruption
- Re-download the file from git
- Ensure line endings are Unix (LF) not Windows (CRLF)

## Notes

- All migrations are **idempotent** - safe to run multiple times
- **Do NOT skip files** - dependencies between files exist
- **Backup your database** before running migrations in production
- Test migrations on a staging database first
- Table names use `snake_case`
- All user-owned data includes Row Level Security (RLS) policies

## Schema Statistics

- **Total Tables**: 15
- **Total Columns**: ~80
- **Column Utilization**: 86% (13 unused columns identified in analysis)
- **RLS Policies**: Enabled on sensitive tables (users, sessions, feedback, skills, progress)
- **Auto-timestamping**: created_at and updated_at on all tables
- **Soft Deletes**: Implemented on users table
- **Foreign Keys**: Enforced with CASCADE delete where appropriate
