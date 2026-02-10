-- ============================================
-- Migration: Add Missing RLS Policies
-- ============================================
-- Description: Adds Row Level Security policies for 7 tables that currently have
--              RLS enabled but no policies defined, making them inaccessible.
-- Date: 2026-02-10
-- Issue: Tables with RLS ON but no policies = complete lockout
-- ============================================

-- ===========================================
-- SKILLS TABLE (Shared Resource - Read Only for Users)
-- ===========================================
-- Design: Skills are a shared resource that all authenticated users can read
-- Only service_role can INSERT/UPDATE/DELETE

DROP POLICY IF EXISTS "Authenticated users can view all skills" ON public.skills;
CREATE POLICY "Authenticated users can view all skills"
ON public.skills FOR SELECT
USING ((SELECT auth.role()) = 'authenticated');

-- Note: INSERT/UPDATE/DELETE restricted to service_role only (no policies needed)

-- ===========================================
-- USER_SKILLS TABLE (User-Owned)
-- ===========================================
-- Design: Users can only manage their own skill associations

DROP POLICY IF EXISTS "Users can view own skills" ON public.user_skills;
CREATE POLICY "Users can view own skills"
ON public.user_skills FOR SELECT
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own skills" ON public.user_skills;
CREATE POLICY "Users can insert own skills"
ON public.user_skills FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own skills" ON public.user_skills;
CREATE POLICY "Users can update own skills"
ON public.user_skills FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own skills" ON public.user_skills;
CREATE POLICY "Users can delete own skills"
ON public.user_skills FOR DELETE
USING ((SELECT auth.uid()) = user_id);

-- ===========================================
-- SESSION_QUESTIONS TABLE (Session-Based Access)
-- ===========================================
-- Design: Users can only access questions from their own sessions

DROP POLICY IF EXISTS "Users can view questions from own sessions" ON public.session_questions;
CREATE POLICY "Users can view questions from own sessions"
ON public.session_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = session_questions.session_id
    AND sessions.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert questions to own sessions" ON public.session_questions;
CREATE POLICY "Users can insert questions to own sessions"
ON public.session_questions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = session_questions.session_id
    AND sessions.user_id = (SELECT auth.uid())
  )
);

-- ===========================================
-- RESPONSES TABLE (Session-Based Access)
-- ===========================================
-- Design: Users can only access responses from their own sessions

DROP POLICY IF EXISTS "Users can view own responses" ON public.responses;
CREATE POLICY "Users can view own responses"
ON public.responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = responses.session_id
    AND sessions.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert own responses" ON public.responses;
CREATE POLICY "Users can insert own responses"
ON public.responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = responses.session_id
    AND sessions.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update own responses" ON public.responses;
CREATE POLICY "Users can update own responses"
ON public.responses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = responses.session_id
    AND sessions.user_id = (SELECT auth.uid())
  )
);

-- ===========================================
-- FEEDBACK TABLE (Session-Based Read Access)
-- ===========================================
-- Design: Users can read feedback from their own sessions
-- Backend/service_role handles INSERT/UPDATE

DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
CREATE POLICY "Users can view own feedback"
ON public.feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = feedback.session_id
    AND sessions.user_id = (SELECT auth.uid())
  )
);

-- Note: INSERT/UPDATE typically handled by service_role, but if needed:
-- Service role bypasses RLS, so no additional policies needed for writes

-- ===========================================
-- USER_PROGRESS TABLE (User-Owned)
-- ===========================================
-- Design: Users can view and update their own progress statistics

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
CREATE POLICY "Users can view own progress"
ON public.user_progress FOR SELECT
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
CREATE POLICY "Users can insert own progress"
ON public.user_progress FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress"
ON public.user_progress FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

-- ===========================================
-- USER_ACTIVITY TABLE (User-Owned, Append-Only)
-- ===========================================
-- Design: Users can insert their own activity logs and read their history
-- No UPDATE/DELETE to maintain audit trail integrity

DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
CREATE POLICY "Users can view own activity"
ON public.user_activity FOR SELECT
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can log own activity" ON public.user_activity;
CREATE POLICY "Users can log own activity"
ON public.user_activity FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Note: No UPDATE/DELETE policies - activity log should be append-only

-- ============================================
-- Verification Queries
-- ============================================

-- Query 1: Verify all tables now have policies
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'skills',
    'user_skills', 
    'session_questions', 
    'responses', 
    'feedback', 
    'user_progress', 
    'user_activity'
  )
GROUP BY tablename
ORDER BY tablename;

-- Expected Output:
-- skills: 1 policy
-- user_skills: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- session_questions: 2 policies (SELECT, INSERT)
-- responses: 3 policies (SELECT, INSERT, UPDATE)
-- feedback: 1 policy (SELECT)
-- user_progress: 3 policies (SELECT, INSERT, UPDATE)
-- user_activity: 2 policies (SELECT, INSERT)

-- Query 2: Check for any tables with RLS enabled but no policies (should be empty now)
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE pg_policies.schemaname = pg_tables.schemaname 
    AND pg_policies.tablename = pg_tables.tablename
  )
ORDER BY tablename;

-- Expected: Empty result (no tables locked out)

-- Query 3: Verify all policies use optimized auth functions
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN (qual LIKE '%SELECT auth.%' OR with_check LIKE '%SELECT auth.%')
        THEN '✅ OPTIMIZED'
        WHEN (qual LIKE '%auth.%' OR with_check LIKE '%auth.%')
        THEN '⚠️  NOT OPTIMIZED'
        ELSE 'ℹ️  NO AUTH FUNCTION'
    END as optimization_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'skills', 'user_skills', 'session_questions', 
    'responses', 'feedback', 'user_progress', 'user_activity'
  )
ORDER BY tablename, policyname;

-- Expected: All policies should show "✅ OPTIMIZED"

-- ============================================
-- Functional Tests (Optional)
-- ============================================

-- Test 1: Verify skills are readable
-- SELECT * FROM skills LIMIT 5;

-- Test 2: Verify user can access their own skill associations
-- SELECT * FROM user_skills WHERE user_id = auth.uid();

-- Test 3: Verify user can access their session questions
-- SELECT sq.* FROM session_questions sq
-- JOIN sessions s ON s.id = sq.session_id
-- WHERE s.user_id = auth.uid()
-- LIMIT 5;

-- Test 4: Verify user can access their responses
-- SELECT r.* FROM responses r
-- JOIN sessions s ON s.id = r.session_id
-- WHERE s.user_id = auth.uid()
-- LIMIT 5;

-- Test 5: Verify user progress is accessible
-- SELECT * FROM user_progress WHERE user_id = auth.uid();

-- ============================================
-- Success Criteria
-- ============================================
-- 1. All 7 tables have appropriate RLS policies
-- 2. No tables with RLS ON but no policies
-- 3. All policies use optimized (SELECT auth.*()) pattern
-- 4. Users can access their own data
-- 5. Users CANNOT access other users' data
-- 6. Shared resources (skills) are accessible to all authenticated users
