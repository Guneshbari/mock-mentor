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
            .select('id, started_at, ended_at, overall_score')
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


        // Feedback data no longer needed for aggregated stats with overall_score column


        // Calculate statistics
        const totalSessions = sessions.length;

        // Calculate average score using overall_score from sessions table
        const validScores = sessions.filter(s => s.overall_score !== null && s.overall_score !== undefined).map(s => s.overall_score);
        const averageScore = validScores.length > 0
            ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
            : 0;

        const bestScore = validScores.length > 0 ? Math.max(...validScores) : 0;

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
        if (validScores.length >= 10) {
            // Sort valid sessions by date (most recent first)
            const sortedSessions = sessions
                .filter(s => s.overall_score !== null)
                .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

            const recent5 = sortedSessions.slice(0, 5).reduce((sum, s) => sum + s.overall_score, 0) / 5;
            const previous5 = sortedSessions.slice(5, 10).reduce((sum, s) => sum + s.overall_score, 0) / 5;

            if (previous5 > 0) {
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


        // Feedback fetch removed - using overall_score from sessions table


        // Aggregate data per session
        let enrichedSessions = sessions.map(session => {
            const sessionQuestions = questionData?.filter(q => q.session_id === session.id) || [];

            // Get the interview type from the first question
            const firstQuestion = sessionQuestions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))[0];
            const interviewType = firstQuestion?.question_type || 'general';

            const avgScore = session.overall_score !== null && session.overall_score !== undefined
                ? session.overall_score
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
            .select('id, email, name, bio, profile_image_url, created_at')
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
            bio: user.bio || '',
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

/**
 * Get recent achievements for a user
 * @param {string} userId - User UUID
 * @param {number} limit - Number of achievements to return
 * @returns {Promise<Array>} Recent achievements
 */
async function getRecentAchievements(userId, limit = 5) {
    if (!supabase) {
        console.warn('Supabase not configured. Returning empty achievements.');
        return [];
    }

    try {
        const { data: achievements, error } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', userId)
            .order('earned_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching achievements:', error);
            throw error;
        }

        return achievements || [];

    } catch (error) {
        console.error('Failed to fetch achievements:', error);
        throw error;
    }
}

/**
 * Get random pro tips
 * @param {number} count - Number of tips to return
 * @param {string} category - Optional category filter
 * @returns {Promise<Array>} Random pro tips
 */
async function getRandomProTips(count = 3, category = null) {
    if (!supabase) {
        console.warn('Supabase not configured. Returning empty tips.');
        return [];
    }

    try {
        // Build query
        let query = supabase
            .from('pro_tips')
            .select('id, tip_text, category')
            .eq('is_active', true);

        // Apply category filter if provided
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        const { data: allTips, error } = await query;

        if (error) {
            console.error('Error fetching pro tips:', error);
            throw error;
        }

        if (!allTips || allTips.length === 0) {
            return [];
        }

        // Shuffle and select random tips
        const shuffled = allTips.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length));

    } catch (error) {
        console.error('Failed to fetch pro tips:', error);
        throw error;
    }
}

/**
 * Get goals performance trend for a user
 * @param {string} userId - User UUID
 * @returns {Promise<object>} Goals performance data
 */
async function getGoalsPerformanceTrend(userId) {
    if (!supabase) {
        console.warn('Supabase not configured. Returning empty goals.');
        return { goals: [], performanceTrend: [] };
    }

    try {
        // Get user's active goals
        const { data: goals, error: goalsError } = await supabase
            .from('user_goals')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (goalsError) {
            console.error('Error fetching goals:', goalsError);
            throw goalsError;
        }

        // Get user's onboarding goals
        const { data: onboarding, error: onboardingError } = await supabase
            .from('onboarding_responses')
            .select('goals')
            .eq('user_id', userId)
            .single();

        if (onboardingError && onboardingError.code !== 'PGRST116') {
            console.error('Error fetching onboarding goals:', onboardingError);
        }

        // Get session performance trend (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: sessions, error: sessionsError } = await supabase
            .from('sessions')
            .select('id, started_at, ended_at, overall_score')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('started_at', thirtyDaysAgo.toISOString())
            .order('started_at', { ascending: true });

        if (sessionsError) {
            console.error('Error fetching sessions for trend:', sessionsError);
        }

        // Calculate trend using overall_score from sessions
        let performanceTrend = [];
        if (sessions && sessions.length > 0) {
            const weeklyScores = {};
            sessions.forEach(session => {
                if (session.overall_score !== null && session.overall_score !== undefined) {
                    const weekStart = new Date(session.started_at);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
                    const weekKey = weekStart.toISOString().split('T')[0];

                    if (!weeklyScores[weekKey]) {
                        weeklyScores[weekKey] = [];
                    }
                    weeklyScores[weekKey].push(session.overall_score);
                }
            });

            // Calculate average score per week
            performanceTrend = Object.entries(weeklyScores)
                .map(([week, scores]) => ({
                    week,
                    averageScore: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
                    sessionCount: scores.length
                }))
                .sort((a, b) => a.week.localeCompare(b.week));
        }

        return {
            goals: goals || [],
            onboardingGoals: onboarding?.goals || [],
            performanceTrend
        };

    } catch (error) {
        console.error('Failed to fetch goals performance trend:', error);
        throw error;
    }
}

/**
 * Check user statistics and award achievements if criteria met
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Newly awarded achievements
 */
async function checkAndAwardAchievements(userId) {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot award achievements.');
        return [];
    }

    try {
        // Get user statistics
        const stats = await getUserStatistics(userId);

        // Get existing achievements to avoid duplicates
        const { data: existingAchievements, error: existingError } = await supabase
            .from('user_achievements')
            .select('achievement_type')
            .eq('user_id', userId);

        if (existingError) {
            console.error('Error fetching existing achievements:', existingError);
            throw existingError;
        }

        const existingTypes = new Set(existingAchievements?.map(a => a.achievement_type) || []);
        const newAchievements = [];

        // Define achievement criteria
        const achievementRules = [
            {
                type: 'first_session',
                check: stats.totalSessions >= 1,
                title: '🎉 First Step',
                description: 'Completed your first mock interview!'
            },
            {
                type: 'sessions_5',
                check: stats.totalSessions >= 5,
                title: '🔥 Getting Started',
                description: 'Completed 5 mock interviews'
            },
            {
                type: 'sessions_10',
                check: stats.totalSessions >= 10,
                title: '💪 Consistent Practice',
                description: 'Completed 10 mock interviews'
            },
            {
                type: 'sessions_25',
                check: stats.totalSessions >= 25,
                title: '⭐ Dedicated Learner',
                description: 'Completed 25 mock interviews'
            },
            {
                type: 'sessions_50',
                check: stats.totalSessions >= 50,
                title: '🏆 Interview Master',
                description: 'Completed 50 mock interviews'
            },
            {
                type: 'high_score',
                check: stats.bestScore >= 80,
                title: '📈 High Achiever',
                description: 'Scored 80+ in an interview'
            },
            {
                type: 'perfect_score',
                check: stats.bestScore >= 100,
                title: '💯 Perfect Performance',
                description: 'Scored a perfect 100!'
            }
        ];

        // Check each rule and award new achievements
        for (const rule of achievementRules) {
            if (rule.check && !existingTypes.has(rule.type)) {
                const { data: achievement, error: insertError } = await supabase
                    .from('user_achievements')
                    .insert({
                        user_id: userId,
                        achievement_type: rule.type,
                        title: rule.title,
                        description: rule.description,
                        icon: rule.title.split(' ')[0] // Extract emoji
                    })
                    .select()
                    .single();

                if (insertError) {
                    // Ignore unique constraint violations (achievement already exists)
                    if (insertError.code !== '23505') {
                        console.error('Error inserting achievement:', insertError);
                    }
                } else if (achievement) {
                    newAchievements.push(achievement);
                }
            }
        }

        return newAchievements;

    } catch (error) {
        console.error('Failed to check and award achievements:', error);
        throw error;
    }
}

/**
 * Get detailed session information including questions, responses, and feedback
 * @param {string} userId - User UUID
 * @param {string} sessionId - Session UUID
 * @returns {Promise<object>} Detailed session data
 */
async function getSessionDetail(userId, sessionId) {
    if (!supabase) {
        console.warn('Supabase not configured. Returning null.');
        return null;
    }

    try {
        // Get session basic info
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('*, overall_score')
            .eq('id', sessionId)
            .eq('user_id', userId) // Ensure user owns this session
            .single();

        if (sessionError) {
            if (sessionError.code === 'PGRST116') {
                // Session not found or doesn't belong to user
                return null;
            }
            console.error('Error fetching session detail:', sessionError);
            throw sessionError;
        }

        // Get all questions for this session
        const { data: questions, error: questionsError } = await supabase
            .from('session_questions')
            .select('*')
            .eq('session_id', sessionId)
            .order('order_index', { ascending: true });

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            throw questionsError;
        }

        // Get all responses for this session
        const { data: responses, error: responsesError } = await supabase
            .from('responses')
            .select('*')
            .eq('session_id', sessionId);

        if (responsesError) {
            console.error('Error fetching responses:', responsesError);
            throw responsesError;
        }

        // Get all feedback for this session
        const { data: feedback, error: feedbackError } = await supabase
            .from('feedback')
            .select('*')
            .eq('session_id', sessionId);

        if (feedbackError) {
            console.error('Error fetching feedback:', feedbackError);
            throw feedbackError;
        }

        // Calculate session duration
        const duration = session.ended_at && session.started_at
            ? Math.round((new Date(session.ended_at) - new Date(session.started_at)) / (1000 * 60))
            : null;

        // Calculate average score
        // Prioritize overall_score from session table if available
        let avgScore = session.overall_score;

        if (avgScore === null || avgScore === undefined) {
            const scores = feedback?.map(f => f.score) || [];
            avgScore = scores.length > 0
                ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
                : null;
        }

        // Enrich questions with responses and feedback
        const enrichedQuestions = (questions || []).map(question => {
            const questionResponse = responses?.find(r => r.question_id === question.id);
            const questionFeedback = feedback?.find(f => f.question_id === question.id);

            return {
                id: question.id,
                text: question.question_text,
                type: question.question_type,
                orderIndex: question.order_index,
                response: questionResponse ? {
                    text: questionResponse.response_text,
                    duration: questionResponse.response_duration,
                    createdAt: questionResponse.created_at
                } : null,
                feedback: questionFeedback ? {
                    score: questionFeedback.score,
                    strengths: questionFeedback.strengths || [],
                    improvements: questionFeedback.improvements || [],
                    confidenceScore: questionFeedback.confidence_score
                } : null
            };
        });

        return {
            id: session.id,
            type: enrichedQuestions[0]?.type || 'general',
            role: session.skill_focus,
            difficulty: session.difficulty,
            date: session.started_at,
            duration: duration ? `${duration} min` : 'N/A',
            score: avgScore,
            status: session.status,
            questions: enrichedQuestions,
            metadata: {
                sessionType: session.session_type,
                startedAt: session.started_at,
                endedAt: session.ended_at,
                totalQuestions: questions?.length || 0,
                totalResponses: responses?.length || 0,
                totalFeedback: feedback?.length || 0
            }
        };

    } catch (error) {
        console.error('Failed to fetch session detail:', error);
        throw error;
    }
}

module.exports = {
    getUserStatistics,
    getSessionHistory,
    getUserProfile,
    getRecentAchievements,
    getRandomProTips,
    getGoalsPerformanceTrend,
    checkAndAwardAchievements,
    getSessionDetail
};
