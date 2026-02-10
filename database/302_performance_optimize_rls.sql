-- ============================================
-- Migration: Optimize RLS Policy Performance
-- ============================================
-- Description: Wraps auth.uid() calls in subqueries to prevent per-row re-evaluation
--              This significantly improves query performance at scale
-- Date: 2026-02-10
-- Issue: RLS policies re-evaluating auth.uid() for each row
-- Background: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================

-- ===========================================
-- USERS TABLE (2 policies)
-- ===========================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING ((SELECT auth.uid()) = id);

-- ===========================================
-- USER_PREFERENCES TABLE (3 policies)
-- ===========================================
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" 
ON public.user_preferences FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" 
ON public.user_preferences FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" 
ON public.user_preferences FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

-- ===========================================
-- ONBOARDING_RESPONSES TABLE (3 policies)
-- ===========================================
DROP POLICY IF EXISTS "Users can view own onboarding" ON public.onboarding_responses;
CREATE POLICY "Users can view own onboarding" 
ON public.onboarding_responses FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding" ON public.onboarding_responses;
CREATE POLICY "Users can insert own onboarding" 
ON public.onboarding_responses FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding" ON public.onboarding_responses;
CREATE POLICY "Users can update own onboarding" 
ON public.onboarding_responses FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

-- ===========================================
-- SESSIONS TABLE (3 policies)
-- ===========================================
DROP POLICY IF EXISTS "Users can view sessions" ON public.sessions;
CREATE POLICY "Users can view sessions" 
ON public.sessions FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert sessions" ON public.sessions;
CREATE POLICY "Users can insert sessions" 
ON public.sessions FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update sessions" ON public.sessions;
CREATE POLICY "Users can update sessions" 
ON public.sessions FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

-- ===========================================
-- NOTIFICATION_PREFERENCES TABLE (4 policies)
-- ===========================================
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view their own notification preferences"
ON notification_preferences FOR SELECT
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert their own notification preferences"
ON notification_preferences FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update their own notification preferences"
ON notification_preferences FOR UPDATE
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can delete their own notification preferences"
ON notification_preferences FOR DELETE
USING ((SELECT auth.uid()) = user_id);

-- ===========================================
-- USER_GOALS TABLE (4 policies)
-- ===========================================
DROP POLICY IF EXISTS "Users can view own goals" ON public.user_goals;
CREATE POLICY "Users can view own goals" 
ON public.user_goals FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON public.user_goals;
CREATE POLICY "Users can insert own goals" 
ON public.user_goals FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON public.user_goals;
CREATE POLICY "Users can update own goals" 
ON public.user_goals FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON public.user_goals;
CREATE POLICY "Users can delete own goals" 
ON public.user_goals FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

-- ===========================================
-- USER_ACHIEVEMENTS TABLE (2 policies)
-- ===========================================
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" 
ON public.user_achievements FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements" 
ON public.user_achievements FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================
-- Verification Queries
-- ============================================

-- Query 1: Check policy optimization status
-- This verifies that all policies now use the subquery pattern
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN (qual LIKE '%SELECT auth.uid()%' OR with_check LIKE '%SELECT auth.uid()%') 
        THEN '✅ OPTIMIZED'
        WHEN (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%') 
        THEN '❌ NOT OPTIMIZED'
        ELSE 'ℹ️  NO auth.uid()'
    END as optimization_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 
    'user_preferences', 
    'onboarding_responses', 
    'sessions',
    'notification_preferences',
    'user_goals',
    'user_achievements'
  )
ORDER BY tablename, policyname;

-- Expected Output: All policies should show "✅ OPTIMIZED"

-- Query 2: Count optimized vs non-optimized policies  
SELECT 
    CASE 
        WHEN (qual LIKE '%SELECT auth.uid()%' OR with_check LIKE '%SELECT auth.uid()%') 
        THEN 'Optimized'
        WHEN (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%') 
        THEN 'Not Optimized'
        ELSE 'No auth.uid()'
    END as status,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY status
ORDER BY status;

-- Expected: 21 policies should be "Optimized", 0 should be "Not Optimized"

-- ============================================
-- Functional Tests (Optional - Run if you want to verify)
-- ============================================

-- Test 1: Verify SELECT still works
-- SELECT * FROM user_goals WHERE user_id = auth.uid() LIMIT 5;

-- Test 2: Verify INSERT still works
-- INSERT INTO notification_preferences (user_id, email_notifications) 
-- VALUES (auth.uid(), true) 
-- ON CONFLICT (user_id) DO NOTHING;

-- Test 3: Verify UPDATE still works
-- UPDATE user_goals SET current_value = current_value WHERE user_id = auth.uid() LIMIT 1;

-- ============================================
-- Success Criteria
-- ============================================
-- 1. All 21 policies show "✅ OPTIMIZED" in verification query
-- 2. All CRUD operations continue to work correctly
-- 3. Supabase Security Advisor shows no RLS performance warnings
-- 4. No changes required to application code
