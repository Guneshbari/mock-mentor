-- ============================================
-- Migration: Optimize Pro Tips RLS Policy
-- ============================================
-- Description: Wraps auth.role() in a subquery to prevent per-row re-evaluation
-- Date: 2026-02-10
-- Entity: public.pro_tips
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view active tips" ON public.pro_tips;

CREATE POLICY "Authenticated users can view active tips" 
ON public.pro_tips FOR SELECT 
USING ((SELECT auth.role()) = 'authenticated' AND is_active = true);

-- ============================================
-- Verification Query
-- ============================================
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN (qual LIKE '%SELECT auth.role()%' OR with_check LIKE '%SELECT auth.role()%') 
        THEN '✅ OPTIMIZED'
        ELSE '❌ NOT OPTIMIZED'
    END as status
FROM pg_policies
WHERE tablename = 'pro_tips';
