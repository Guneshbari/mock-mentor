const supabase = require('./supabase');

/**
 * Database service for persisting interview data to Supabase
 */

/**
 * Create a new interview session in the database
 * @param {string} userId - User ID from auth
 * @param {object} interviewConfig - Interview configuration
 * @param {string} sessionId - Session UUID
 * @returns {Promise<object>} Created session
 */
async function createSession(userId, interviewConfig, sessionId) {
    if (!supabase) {
        console.warn('Supabase not configured. Skipping database save.');
        return null;
    }

    try {
        // Map experiencePreset to difficulty level
        const difficultyMap = {
            'fresh': 'beginner',
            'junior': 'intermediate',
            'senior': 'advanced'
        };
        const difficulty = difficultyMap[interviewConfig.experiencePreset] || 'intermediate';

        const { data, error } = await supabase
            .from('sessions')
            .insert({
                id: sessionId,
                user_id: userId,
                session_type: 'mock_interview',
                skill_focus: interviewConfig.role || 'General',
                difficulty: difficulty,
                status: 'in_progress',
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating session:', error);
            throw error;
        }

        console.log('Session saved to database:', sessionId);
        return data;
    } catch (error) {
        console.error('Failed to save session:', error);
        console.error('Session ID:', sessionId, 'User ID:', userId);
        // Don't throw - allow interview to continue even if DB save fails
        return null;
    }
}

/**
 * Save a question to the database
 * @param {string} sessionId - Session UUID
 * @param {string} questionText - The question text
 * @param {string} questionType - Type of question (technical, behavioral, hr)
 * @param {number} orderIndex - Order of the question
 * @returns {Promise<object>} Created question
 */
async function saveQuestion(sessionId, questionText, questionType, orderIndex) {
    if (!supabase) {
        console.warn('Supabase not configured. Skipping database save.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('session_questions')
            .insert({
                session_id: sessionId,
                question_text: questionText,
                question_type: questionType || 'general',
                order_index: orderIndex,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving question:', error);
            throw error;
        }

        console.log(`Question ${orderIndex} saved for session ${sessionId}`);
        return data;
    } catch (error) {
        console.error('Failed to save question:', error);
        console.error('Session ID:', sessionId, 'Question:', questionText.substring(0, 50));
        return null;
    }
}

/**
 * Save a user response to the database
 * @param {string} sessionId - Session UUID
 * @param {string} questionId - Question UUID
 * @param {string} responseText - User's answer text
 * @param {number} responseDuration - Time taken to answer (seconds)
 * @returns {Promise<object>} Created response
 */
async function saveResponse(sessionId, questionId, responseText, responseDuration = null) {
    if (!supabase) {
        console.warn('Supabase not configured. Skipping database save.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('responses')
            .insert({
                session_id: sessionId,
                question_id: questionId,
                response_text: responseText,
                response_duration: responseDuration,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving response:', error);
            throw error;
        }

        console.log(`Response saved for question ${questionId}`);
        return data;
    } catch (error) {
        console.error('Failed to save response:', error);
        console.error('Session ID:', sessionId, 'Question ID:', questionId);
        return null;
    }
}

/**
 * Save feedback for a question
 * @param {string} sessionId - Session UUID
 * @param {string} questionId - Question UUID
 * @param {object} feedback - Feedback object with score, strengths, improvements
 * @returns {Promise<object>} Created feedback
 */
async function saveFeedback(sessionId, questionId, feedback) {
    if (!supabase) {
        console.warn('Supabase not configured. Skipping database save.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('feedback')
            .insert({
                session_id: sessionId,
                question_id: questionId,
                score: feedback.score || 50,
                strengths: feedback.strengths || [],
                improvements: feedback.improvements || [],
                confidence_score: feedback.confidence || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving feedback:', error);
            throw error;
        }

        console.log(`Feedback saved for question ${questionId}`);
        return data;
    } catch (error) {
        console.error('Failed to save feedback:', error);
        return null;
    }
}

/**
 * Update session status
 * @param {string} sessionId - Session UUID
 * @param {string} status - New status (in_progress, completed, abandoned)
 * @returns {Promise<object>} Updated session
 */
async function updateSessionStatus(sessionId, status) {
    if (!supabase) {
        console.warn('Supabase not configured. Skipping database update.');
        return null;
    }

    try {
        const updateData = { status };

        // If completing, set ended_at timestamp
        if (status === 'completed') {
            updateData.ended_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('sessions')
            .update(updateData)
            .eq('id', sessionId)
            .select()
            .single();

        if (error) {
            console.error('Error updating session status:', error);
            throw error;
        }

        console.log(`Session ${sessionId} status updated to ${status}`);
        return data;
    } catch (error) {
        console.error('Failed to update session status:', error);
        return null;
    }
}

/**
 * Get session questions (for retrieving question IDs)
 * @param {string} sessionId - Session UUID
 * @returns {Promise<Array>} Questions for the session
 */
async function getSessionQuestions(sessionId) {
    if (!supabase) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('session_questions')
            .select('*')
            .eq('session_id', sessionId)
            .order('order_index');

        if (error) {
            console.error('Error fetching questions:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to fetch questions:', error);
        return [];
    }
}

/**
 * Save or update user preferences
 * @param {string} userId - User UUID
 * @param {object} preferences - User preferences object
 * @returns {Promise<object>} Updated preferences
 */
async function saveUserPreferences(userId, preferences) {
    if (!supabase) {
        console.warn('Supabase not configured. Skipping preferences save.');
        return null;
    }

    try {
        // Map frontend experience preset to database experience_level
        let experienceLevel = null;
        if (preferences.experience_level) {
            const experienceMap = {
                'fresh': 'beginner',
                'junior': 'intermediate',
                'senior': 'advanced',
                'beginner': 'beginner',
                'intermediate': 'intermediate',
                'advanced': 'advanced'
            };
            experienceLevel = experienceMap[preferences.experience_level] || null;
        }

        const { data, error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: userId,
                preferred_role: preferences.preferred_role || null,
                interview_type: preferences.interview_type || null,
                experience_level: experienceLevel,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving user preferences:', error);
            throw error;
        }

        console.log(`User preferences saved for user ${userId}`);
        return data;
    } catch (error) {
        console.error('Failed to save user preferences:', error);
        return null;
    }
}

module.exports = {
    createSession,
    saveQuestion,
    saveResponse,
    saveFeedback,
    updateSessionStatus,
    getSessionQuestions,
    saveUserPreferences,
};
