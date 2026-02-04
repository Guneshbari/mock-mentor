const supabase = require('./supabase');

/**
 * Dashboard Service - Aggregate and retrieve dashboard data
 */

/**
 * Calculate user statistics from completed sessions
 * @param {string} userId - User UUID
 * @returns {Promise<object>} User statistics
 */
async function getUserStatistics(userId) {
    if (!supabase) {
        console.warn('Supabase not configured. Returning empty stats.');
        return {
            totalSessions: 0,
            averageScore: 0,
            totalTime: 0,
            bestScore: 0,
            recentTrend: 0
        };
    }

    try {
        // Get all completed sessions for the user
        const { data: sessions, error: sessionsError } = await supabase
            .from('sessions')
            .select('id, started_at, ended_at')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('started_at', { ascending: false });

        if (sessionsError) {
            console.error('Error fetching sessions for stats:', sessionsError);
            throw sessionsError;
        }

        if (!sessions || sessions.length === 0) {
            return {
                totalSessions: 0,
                averageScore: 0,
                totalTime: 0,
                bestScore: 0,
                recentTrend: 0
            };
        }

        const sessionIds = sessions.map(s => s.id);

        // Get all feedback scores for these sessions
        const { data: feedbackData, error: feedbackError } = await supabase
            .from('feedback')
            .select('score, session_id')
            .in('session_id', sessionIds);

        if (feedbackError) {
            console.error('Error fetching feedback:', feedbackError);
        }

        // Calculate statistics
        const scores = feedbackData?.map(f => f.score) || [];
        const totalSessions = sessions.length;
        const averageScore = scores.length > 0
            ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
            : 0;
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

        // Calculate total time (difference between started_at and ended_at)
        const totalMinutes = sessions.reduce((total, session) => {
            if (session.ended_at && session.started_at) {
                const start = new Date(session.started_at);
                const end = new Date(session.ended_at);
                const minutes = Math.round((end - start) / (1000 * 60));
                return total + minutes;
            }
            return total;
        }, 0);

        // Calculate recent trend (last 5 sessions vs previous 5)
        let recentTrend = 0;
        if (feedbackData && feedbackData.length >= 10) {
            // Group scores by session
            const sessionScores = {};
            feedbackData.forEach(f => {
                if (!sessionScores[f.session_id]) {
                    sessionScores[f.session_id] = [];
                }
                sessionScores[f.session_id].push(f.score);
            });

            // Calculate average score per session
            const sessionAverages = Object.entries(sessionScores).map(([sessionId, scores]) => ({
                sessionId,
                avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length
            }));

            // Sort by session date
            const sortedAverages = sessionAverages.sort((a, b) => {
                const aIndex = sessions.findIndex(s => s.id === a.sessionId);
                const bIndex = sessions.findIndex(s => s.id === b.sessionId);
                return aIndex - bIndex; // Most recent first
            });

            if (sortedAverages.length >= 10) {
                const recent5 = sortedAverages.slice(0, 5).reduce((sum, s) => sum + s.avgScore, 0) / 5;
                const previous5 = sortedAverages.slice(5, 10).reduce((sum, s) => sum + s.avgScore, 0) / 5;
                recentTrend = Math.round(((recent5 - previous5) / previous5) * 100);
            }
        }

        return {
            totalSessions,
            averageScore,
            totalTime: totalMinutes,
            bestScore,
            recentTrend
        };

    } catch (error) {
        console.error('Failed to calculate user statistics:', error);
        throw error;
    }
}

/**
 * Get paginated session history with filters
 * @param {string} userId - User UUID
 * @param {object} options - Query options
 * @param {number} options.limit - Number of sessions to return
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.sortBy - Sort field (date, score)
 * @param {string} options.filterType - Filter by session type
 * @param {string} options.search - Search query
 * @returns {Promise<object>} Session history with pagination info
 */
async function getSessionHistory(userId, options = {}) {
    if (!supabase) {
        console.warn('Supabase not configured. Returning empty history.');
        return { sessions: [], total: 0 };
    }

    const {
        limit = 10,
        offset = 0,
        sortBy = 'date',
        filterType = null,
        search = null
    } = options;

    try {
        // Build base query
        let query = supabase
            .from('sessions')
            .select(`
                id,
                session_type,
                skill_focus,
                difficulty,
                started_at,
                ended_at,
                status
            `, { count: 'exact' })
            .eq('user_id', userId)
            .eq('status', 'completed');

        // For search, we apply it here
        if (search) {
            query = query.or(`skill_focus.ilike.%${search}%`);
        }

        // Apply sorting
        query = query.order('started_at', { ascending: false });

        // For now, fetch more than needed if filtering by type
        // We'll filter client-side after getting question types
        const fetchLimit = filterType && filterType !== 'all' ? limit * 3 : limit;
        query = query.range(offset, offset + fetchLimit - 1);

        const { data: sessions, error: sessionsError, count } = await query;

        if (sessionsError) {
            console.error('Error fetching session history:', sessionsError);
            throw sessionsError;
        }

        if (!sessions || sessions.length === 0) {
            return { sessions: [], total: 0 };
        }

        const sessionIds = sessions.map(s => s.id);

        // Get the first question for each session to determine interview type
        const { data: questionData, error: questionError } = await supabase
            .from('session_questions')
            .select('session_id, id, question_type, order_index')
            .in('session_id', sessionIds)
            .order('order_index', { ascending: true });

        if (questionError) {
            console.error('Error fetching questions for history:', questionError);
        }

        // Get feedback for these sessions to calculate scores
        const { data: feedbackData, error: feedbackError } = await supabase
            .from('feedback')
            .select('session_id, score')
            .in('session_id', sessionIds);

        if (feedbackError) {
            console.error('Error fetching feedback for history:', feedbackError);
        }

        // Aggregate data per session
        let enrichedSessions = sessions.map(session => {
            const sessionFeedback = feedbackData?.filter(f => f.session_id === session.id) || [];
            const sessionQuestions = questionData?.filter(q => q.session_id === session.id) || [];

            // Get the interview type from the first question
            const firstQuestion = sessionQuestions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))[0];
            const interviewType = firstQuestion?.question_type || 'general';

            const avgScore = sessionFeedback.length > 0
                ? Math.round(sessionFeedback.reduce((sum, f) => sum + f.score, 0) / sessionFeedback.length)
                : null;

            const duration = session.ended_at && session.started_at
                ? Math.round((new Date(session.ended_at) - new Date(session.started_at)) / (1000 * 60))
                : null;

            return {
                id: session.id,
                type: interviewType,
                role: session.skill_focus,
                difficulty: session.difficulty,
                date: session.started_at,
                duration: duration ? `${duration} min` : 'N/A',
                score: avgScore,
                questions: sessionQuestions.length,
                status: session.status
            };
        });

        // Apply filter by type after enrichment
        if (filterType && filterType !== 'all') {
            enrichedSessions = enrichedSessions.filter(s => s.type === filterType);
        }

        // Limit results to requested amount
        const limitedSessions = enrichedSessions.slice(0, limit);

        // Sort by score if requested
        if (sortBy === 'score') {
            limitedSessions.sort((a, b) => (b.score || 0) - (a.score || 0));
        }

        return {
            sessions: limitedSessions,
            total: filterType && filterType !== 'all' ? enrichedSessions.length : (count || 0),
            limit,
            offset
        };

    } catch (error) {
        console.error('Failed to fetch session history:', error);
        throw error;
    }
}

/**
 * Get user profile and preferences
 * @param {string} userId - User UUID
 * @returns {Promise<object>} User profile data
 */
async function getUserProfile(userId) {
    if (!supabase) {
        console.warn('Supabase not configured. Returning empty profile.');
        return null;
    }

    try {
        // Get user basic info
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, name, profile_image_url, created_at')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user profile:', userError);
            throw userError;
        }

        // Get user preferences
        const { data: preferences, error: prefError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (prefError && prefError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching preferences:', prefError);
        }

        // Get onboarding responses
        const { data: onboarding, error: onboardingError } = await supabase
            .from('onboarding_responses')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (onboardingError && onboardingError.code !== 'PGRST116') {
            console.error('Error fetching onboarding:', onboardingError);
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name || '',
            avatar: user.profile_image_url || null,
            createdAt: user.created_at,
            preferences: preferences || {},
            onboarding: onboarding || {}
        };

    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        throw error;
    }
}

module.exports = {
    getUserStatistics,
    getSessionHistory,
    getUserProfile
};
