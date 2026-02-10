-- ============================================
-- Migration: Fix search_path security vulnerabilities
-- ============================================
-- Description: Adds explicit search_path to all trigger functions to prevent
--              search_path hijacking attacks as identified by Supabase Security Advisor
-- Date: 2026-02-10
-- Issue: Functions with SECURITY DEFINER or used in triggers should set search_path
-- ============================================

-- Fix 1: handle_new_user function
-- This function is called on auth.users insert and uses SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, profile_image_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Fix 2: update_sessions_updated_at function
-- Trigger function for sessions table
CREATE OR REPLACE FUNCTION update_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- Fix 3: update_updated_at_column function
-- Generic trigger function for notification_preferences table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- Fix 4: update_user_goals_updated_at function
-- Trigger function for user_goals table
CREATE OR REPLACE FUNCTION update_user_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- Fix 5: update_users_updated_at function
-- Trigger function for users table
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- ============================================
-- Verification Queries
-- ============================================

-- Query 1: Verify search_path is set on all functions
-- Run this to confirm all functions have the correct search_path setting
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.proconfig IS NOT NULL THEN 
            array_to_string(p.proconfig, ', ')
        ELSE 
            'NO SEARCH_PATH SET'
    END as settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN (
    'handle_new_user',
    'update_sessions_updated_at',
    'update_updated_at_column',
    'update_user_goals_updated_at',
    'update_users_updated_at'
  )
ORDER BY p.proname;

-- Expected Output: Each function should show "search_path=public, pg_temp" in the settings column

-- Query 2: Test trigger functionality
-- This verifies that the triggers still work after the security fix
-- Note: Run these individually if you want to test

-- Test 1: Insert a test notification preference (if you have a test user)
-- INSERT INTO notification_preferences (user_id, email_notifications) 
-- VALUES (auth.uid(), true)
-- ON CONFLICT (user_id) DO UPDATE SET email_notifications = NOT notification_preferences.email_notifications;

-- Test 2: Update a session to trigger the updated_at
-- UPDATE sessions SET status = status WHERE id = (SELECT id FROM sessions LIMIT 1);

-- Test 3: Update a user goal
-- UPDATE user_goals SET current_value = current_value + 1 WHERE id = (SELECT id FROM user_goals LIMIT 1);

-- ============================================
-- Success Criteria
-- ============================================
-- 1. All 5 functions should show "search_path=public, pg_temp" in verification query
-- 2. All existing triggers should continue to work normally
-- 3. Supabase Security Advisor should no longer report search_path issues
-- 4. No application functionality should be affected
