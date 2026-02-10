-- ============================================
-- Migration: Add Missing Foreign Key Indexes
-- ============================================
-- Description: Adds indexes for all foreign key columns to improve JOIN performance
-- Date: 2026-02-10
-- Issue: Unindexed foreign keys cause slow queries and poor scaling
-- Impact: Expected 100-1000x performance improvement for JOIN queries
-- ============================================

-- ===========================================
-- HIGH PRIORITY: Session-Related Indexes
-- ===========================================
-- These tables are heavily used in JOIN operations

-- Index: sessions.user_id
-- Purpose: Fast lookup of all sessions for a user
-- Query Pattern: SELECT * FROM sessions WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_sessions_user_id 
ON public.sessions(user_id);

-- Index: session_questions.session_id
-- Purpose: Fast lookup of questions for a session
-- Query Pattern: SELECT * FROM session_questions WHERE session_id = ?
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id 
ON public.session_questions(session_id);

-- Index: responses.session_id
-- Purpose: Fast lookup of all responses in a session
-- Query Pattern: SELECT * FROM responses WHERE session_id = ?
CREATE INDEX IF NOT EXISTS idx_responses_session_id 
ON public.responses(session_id);

-- Index: responses.question_id
-- Purpose: Fast lookup of response for a specific question
-- Query Pattern: SELECT * FROM responses WHERE question_id = ?
CREATE INDEX IF NOT EXISTS idx_responses_question_id 
ON public.responses(question_id);

-- Index: feedback.session_id
-- Purpose: Fast lookup of all feedback in a session
-- Query Pattern: SELECT * FROM feedback WHERE session_id = ?
CREATE INDEX IF NOT EXISTS idx_feedback_session_id 
ON public.feedback(session_id);

-- Index: feedback.question_id
-- Purpose: Fast lookup of feedback for a specific question
-- Query Pattern: SELECT * FROM feedback WHERE question_id = ?
CREATE INDEX IF NOT EXISTS idx_feedback_question_id 
ON public.feedback(question_id);

-- ===========================================
-- MEDIUM PRIORITY: User-Related Indexes
-- ===========================================

-- Index: user_preferences.user_id
-- Purpose: Fast lookup of user preferences (note: already a PRIMARY KEY, but adding for consistency)
-- Query Pattern: SELECT * FROM user_preferences WHERE user_id = ?
-- Note: This is actually the PRIMARY KEY, so it's already indexed. Including for completeness.
-- CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
-- SKIPPED: user_id is PRIMARY KEY (automatically indexed)

-- Index: onboarding_responses.user_id
-- Purpose: Fast lookup of onboarding data
-- Query Pattern: SELECT * FROM onboarding_responses WHERE user_id = ?
-- Note: This is actually the PRIMARY KEY, so it's already indexed.
-- CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user_id ON public.onboarding_responses(user_id);
-- SKIPPED: user_id is PRIMARY KEY (automatically indexed)

-- Index: user_skills.user_id
-- Purpose: Fast lookup of skills for a user
-- Query Pattern: SELECT * FROM user_skills WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id 
ON public.user_skills(user_id);

-- Index: user_skills.skill_id
-- Purpose: Fast reverse lookup (find users with a specific skill)
-- Query Pattern: SELECT * FROM user_skills WHERE skill_id = ?
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id 
ON public.user_skills(skill_id);

-- Index: user_activity.user_id
-- Purpose: Fast lookup of activity history for a user
-- Query Pattern: SELECT * FROM user_activity WHERE user_id = ? ORDER BY timestamp DESC
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id 
ON public.user_activity(user_id);

-- Optional: Composite index for user_activity with timestamp for efficient sorting
-- Uncomment if activity queries commonly filter by user AND sort by time
-- CREATE INDEX IF NOT EXISTS idx_user_activity_user_timestamp 
-- ON public.user_activity(user_id, timestamp DESC);

-- ============================================
-- Index Analysis & Verification
-- ============================================

-- Query 1: Verify all new indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_sessions_user_id',
    'idx_session_questions_session_id',
    'idx_responses_session_id',
    'idx_responses_question_id',
    'idx_feedback_session_id',
    'idx_feedback_question_id',
    'idx_user_skills_user_id',
    'idx_user_skills_skill_id',
    'idx_user_activity_user_id'
  )
ORDER BY tablename, indexname;

-- Expected: 9 rows showing all the new indexes

-- Query 2: Check for any remaining unindexed foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes i 
            WHERE i.tablename = tc.table_name 
            AND i.indexdef LIKE '%' || kcu.column_name || '%'
        ) THEN '✅ INDEXED'
        WHEN kcu.column_name IN (
            SELECT a.attname 
            FROM pg_index ix
            JOIN pg_class t ON t.oid = ix.indrelid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
            WHERE t.relname = tc.table_name 
            AND ix.indisprimary
        ) THEN '✅ PRIMARY KEY (auto-indexed)'
        ELSE '❌ NOT INDEXED'
    END as index_status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Expected: All foreign keys should show ✅ INDEXED or ✅ PRIMARY KEY

-- Query 3: List all indexes on core tables for review
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'sessions', 'session_questions', 'responses', 'feedback',
    'user_skills', 'user_activity', 'user_preferences', 
    'onboarding_responses'
  )
ORDER BY tablename, indexname;

-- Query 4: Check index sizes (useful for monitoring)
SELECT
    schemaname,
    relname AS tablename,
    indexrelname AS indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- Performance Testing Queries
-- ============================================

-- Test 1: Verify session lookup is using index
-- EXPLAIN ANALYZE SELECT * FROM sessions WHERE user_id = (SELECT auth.uid()) LIMIT 10;
-- Expected: "Index Scan using idx_sessions_user_id"

-- Test 2: Verify session questions lookup is using index
-- EXPLAIN ANALYZE SELECT * FROM session_questions WHERE session_id = (SELECT id FROM sessions LIMIT 1);
-- Expected: "Index Scan using idx_session_questions_session_id"

-- Test 3: Verify responses lookup is using index
-- EXPLAIN ANALYZE SELECT * FROM responses WHERE session_id = (SELECT id FROM sessions LIMIT 1);
-- Expected: "Index Scan using idx_responses_session_id"

-- Test 4: Verify feedback lookup is using index
-- EXPLAIN ANALYZE SELECT * FROM feedback WHERE session_id = (SELECT id FROM sessions LIMIT 1);
-- Expected: "Index Scan using idx_feedback_session_id"

-- ============================================
-- Success Criteria
-- ============================================
-- 1. All 9 new indexes are created successfully
-- 2. No foreign keys remain unindexed (except PKs which are auto-indexed)
-- 3. Query plans show index scans instead of sequential scans
-- 4. Supabase Performance Advisor shows no unindexed foreign key warnings
-- 5. Application queries run significantly faster (measure with EXPLAIN ANALYZE)

-- ============================================
-- Rollback Instructions (if needed)
-- ============================================
-- If you need to remove these indexes for any reason:
/*
DROP INDEX IF EXISTS idx_sessions_user_id;
DROP INDEX IF EXISTS idx_session_questions_session_id;
DROP INDEX IF EXISTS idx_responses_session_id;
DROP INDEX IF EXISTS idx_responses_question_id;
DROP INDEX IF EXISTS idx_feedback_session_id;
DROP INDEX IF EXISTS idx_feedback_question_id;
DROP INDEX IF EXISTS idx_user_skills_user_id;
DROP INDEX IF EXISTS idx_user_skills_skill_id;
DROP INDEX IF EXISTS idx_user_activity_user_id;
*/
