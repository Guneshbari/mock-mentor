import { createClient } from './supabase/client';

/**
 * Utility function to get authenticated headers for API calls
 * Includes Authorization header with Supabase JWT if user is logged in
 * Automatically refreshes token if expired
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    try {
        // Create supabase client to get current session
        const supabase = createClient();

        // Try to get current session (this will auto-refresh if expired)
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('[Auth Headers] Session check:', {
            hasSession: !!session,
            hasToken: !!session?.access_token,
            userId: session?.user?.id || 'none',
            error: error?.message || 'none'
        });

        // If no session or error, try to refresh
        if ((!session || error) && !error?.message?.includes('no session')) {
            console.log('[Auth Headers] Attempting to refresh session...');
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();

            if (refreshedSession?.access_token) {
                headers['Authorization'] = `Bearer ${refreshedSession.access_token}`;
                console.log('[Auth Headers] ✓ Used refreshed token');
                return headers;
            }
        }

        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
            console.log('[Auth Headers] ✓ Added Authorization header');
        } else {
            console.warn('[Auth Headers] ✗ No session token available - user may need to log in');
            // If we're in a browser context and no session, might need to redirect to login
            if (typeof window !== 'undefined') {
                console.warn('[Auth Headers] Consider redirecting to /login');
            }
        }
    } catch (error) {
        console.error('[Auth Headers] Failed to get auth session:', error);
        // Continue without auth header
    }

    return headers;
}
