import { createClient } from './supabase/client';

/**
 * Utility function to get authenticated headers for API calls
 * Includes Authorization header with Supabase JWT if user is logged in
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    try {
        // Create supabase client to get current session
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('[Auth Headers] Session check:', {
            hasSession: !!session,
            hasToken: !!session?.access_token,
            userId: session?.user?.id || 'none',
            error: error?.message || 'none'
        });

        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
            console.log('[Auth Headers] ✓ Added Authorization header');
        } else {
            console.warn('[Auth Headers] ✗ No session token available - user may not be logged in');
        }
    } catch (error) {
        console.error('[Auth Headers] Failed to get auth session:', error);
        // Continue without auth header
    }

    return headers;
}
