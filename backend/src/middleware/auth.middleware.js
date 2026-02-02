const supabase = require('../services/supabase');

/**
 * Middleware to extract authenticated user from Supabase JWT
 * Adds req.userId if user is authenticated
 */
async function extractUser(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        console.log('[Auth Middleware] Checking authorization:', {
            hasAuthHeader: !!authHeader,
            headerPreview: authHeader ? authHeader.substring(0, 20) + '...' : 'none'
        });

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token - continue without user (optional auth)
            console.log('[Auth Middleware] No Bearer token found');
            req.userId = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        console.log('[Auth Middleware] Token extracted, length:', token?.length || 0);

        if (!supabase) {
            console.warn('[Auth Middleware] Supabase not configured. Cannot verify user.');
            req.userId = null;
            return next();
        }

        // Verify token and get user
        console.log('[Auth Middleware] Verifying token with Supabase...');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            console.warn('[Auth Middleware] Token verification failed:', error.message);
            req.userId = null;
            return next();
        }

        if (!user) {
            console.warn('[Auth Middleware] No user returned from token');
            req.userId = null;
            return next();
        }

        // Attach user ID to request
        req.userId = user.id;
        req.user = user; // Optional: include full user object

        console.log(`[Auth Middleware] ✓ Authenticated user: ${user.id}`);
        next();
    } catch (error) {
        console.error('[Auth Middleware] ERROR:', error.message);
        req.userId = null;
        next(); // Continue even if auth fails
    }
}

module.exports = extractUser;
