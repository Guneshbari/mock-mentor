const supabase = require('../services/supabase');

/**
 * Update user's last login timestamp
 * @param {string} userId - User UUID
 */
async function updateLastLogin(userId) {
    if (!supabase) return;

    try {
        await supabase
            .from('users')
            .update({
                last_login_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
    } catch (error) {
        // Silent fail - don't block auth for this
        console.warn('[updateLastLogin] Error:', error.message);
    }
}

/**
 * Check if user account is active
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} True if active, false if deactivated
 */
async function checkAccountActive(userId) {
    if (!supabase) return true; // Default to active if DB unavailable

    try {
        const { data, error } = await supabase
            .from('users')
            .select('is_active')
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.warn('[checkAccountActive] Error or no data:', error?.message);
            return true; // Default to active on error
        }

        // is_active defaults to true in schema, so null/undefined = active
        return data.is_active !== false;
    } catch (error) {
        console.warn('[checkAccountActive] Error:', error.message);
        return true; // Default to active on error
    }
}

/**
 * Middleware to extract authenticated user from Supabase JWT
 * Adds req.userId if user is authenticated
 * Includes retry logic for network errors
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

        // Verify token with retry logic for network errors
        console.log('[Auth Middleware] Verifying token with Supabase...');
        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const { data: { user }, error } = await supabase.auth.getUser(token);

                if (error) {
                    console.warn(`[Auth Middleware] Token verification failed (attempt ${attempt}/${maxRetries}):`, error.message);

                    // If it's an authentication error (not network), don't retry
                    if (!error.message.includes('fetch failed') && !error.message.includes('socket')) {
                        req.userId = null;
                        return next();
                    }

                    lastError = error;

                    // Wait before retry (exponential backoff)
                    if (attempt < maxRetries) {
                        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000); // Cap at 3 seconds
                        console.log(`[Auth Middleware] Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                } else if (user) {
                    // Success!
                    req.userId = user.id;
                    req.user = user;
                    console.log(`[Auth Middleware] ✓ Authenticated user: ${user.id}` + (attempt > 1 ? ` (succeeded on attempt ${attempt})` : ''));

                    // Check if account is active
                    const isActive = await checkAccountActive(user.id);
                    if (!isActive) {
                        console.warn(`[Auth Middleware] Account deactivated: ${user.id}`);
                        return res.status(403).json({
                            error: 'Account deactivated. Please contact support.'
                        });
                    }

                    // Update last_login_at asynchronously (don't block the request)
                    updateLastLogin(user.id).catch(err =>
                        console.warn('[Auth Middleware] Failed to update last_login_at:', err.message)
                    );

                    return next();
                } else {
                    console.warn('[Auth Middleware] No user returned from token');
                    req.userId = null;
                    return next();
                }
            } catch (networkError) {
                lastError = networkError;
                console.warn(`[Auth Middleware] Network error (attempt ${attempt}/${maxRetries}):`, networkError.message);

                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
                    console.log(`[Auth Middleware] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
        }

        // All retries failed
        console.error('[Auth Middleware] All retry attempts failed:', lastError?.message);
        req.userId = null;
        next(); // Continue without auth rather than blocking the request
    } catch (error) {
        console.error('[Auth Middleware] UNEXPECTED ERROR:', error.message);
        req.userId = null;
        next(); // Continue even if auth fails
    }
}

/**
 * Middleware to require authentication (fail-closed)
 * MUST be used on all protected routes
 * Returns 401 if user is not authenticated
 */
function requireAuth(req, res, next) {
    if (!req.userId) {
        console.warn('[requireAuth] Unauthorized access attempt');
        return res.status(401).json({
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
        });
    }

    // User is authenticated, proceed
    next();
}

module.exports = {
    extractUser,     // Optional auth - populates req.userId if present
    requireAuth      // Mandatory auth - fails if req.userId not present
};
