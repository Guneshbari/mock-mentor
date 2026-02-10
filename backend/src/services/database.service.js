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
 * Get user profile details
 * @param {string} userId - User UUID
 * @returns {Promise<object>} User profile
 */
async function getUserProfile(userId) {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('users')
            .select('name')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Failed to get user profile:', error);
        return null;
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

/**
 * Save final interview report to database
 * @param {string} sessionId - Session UUID
 * @param {object} reportData - The full final report object
 * @returns {Promise<object>} Updated session
 */
async function saveSessionReport(sessionId, reportData) {
    if (!supabase) {
        console.warn('Supabase not configured. Skipping report save.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('sessions')
            .update({
                final_report: reportData,
                overall_score: reportData.overallScore || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) {
            console.error('Error saving session report:', error);
            throw error;
        }

        console.log(`[Database] Report saved for session ${sessionId}. Overall Score: ${reportData.overallScore}`);

        // --- POPULATE FEEDBACK TABLE ---
        if (reportData.questionAnswerHistory && reportData.questionAnswerHistory.length > 0) {
            console.log(`[Database] Populating feedback for ${reportData.questionAnswerHistory.length} items`);
            try {
                // 1. Get session questions to map to question IDs
                const { data: questions, error: qError } = await supabase
                    .from('session_questions')
                    .select('id, order_index')
                    .eq('session_id', sessionId)
                    .order('order_index');

                if (qError) {
                    console.error('[Database] Error fetching questions for feedback map:', qError);
                    throw qError;
                }

                console.log(`[Database] Found ${questions?.length || 0} questions for session ${sessionId}`);

                if (questions && questions.length > 0) {
                    const feedbackInserts = [];

                    // Map history items to questions by index
                    reportData.questionAnswerHistory.forEach((item, index) => {
                        const question = questions[index];

                        if (question) {
                            const strengths = Array.isArray(item.strengths) ? item.strengths :
                                (item.strengths ? [item.strengths] : []);

                            const improvements = Array.isArray(item.improvements) ? item.improvements :
                                (item.improvements ? [item.improvements] : []);

                            feedbackInserts.push({
                                session_id: sessionId,
                                question_id: question.id,
                                score: item.score || 0,
                                strengths: strengths,
                                improvements: improvements,
                                confidence_score: item.confidence_score || 0,
                                created_at: new Date().toISOString()
                            });
                        } else {
                            console.warn(`[Database] No matching question found for history item ${index}`);
                        }
                    });

                    if (feedbackInserts.length > 0) {
                        const { error: fError } = await supabase
                            .from('feedback')
                            .insert(feedbackInserts);

                        if (fError) {
                            console.error('[Database] Error inserting feedback rows:', fError);
                            console.error('[Database] Feedback data that failed:', JSON.stringify(feedbackInserts, null, 2));
                            throw fError;
                        } else {
                            console.log(`[Database] Successfully inserted ${feedbackInserts.length} feedback rows`);
                        }
                    } else {
                        console.warn('[Database] No feedback inserts prepared (questions mismatch?)');
                    }
                } else {
                    console.warn('[Database] No questions found in DB to link feedback to');
                }
            } catch (fbError) {
                console.error('[Database] Failed to populate feedback table:', fbError);
            }
        } else {
            console.warn('[Database] No questionAnswerHistory in reportData to populate feedback');
        }

        return data;
    } catch (error) {
        console.error('Failed to save session report:', error);
        return null;
    }
}


/**
 * Log user activity
 * @param {string} userId - User UUID
 * @param {string} action - Activity type (e.g., 'session_start', 'session_end')
 * @param {string} ipAddress - Optional IP address of the user
 * @returns {Promise<void>}
 */
async function logActivity(userId, action, ipAddress = null) {
    if (!supabase) return;

    try {
        await supabase
            .from('user_activity')
            .insert({
                user_id: userId,
                action: action,
                ip_address: ipAddress,
                timestamp: new Date().toISOString()
            });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

/**
 * Update user progress statistics
 * @param {string} userId - User UUID
 * @returns {Promise<void>}
 */
async function updateUserProgress(userId) {
    if (!supabase) return;

    try {
        // Calculate aggregate stats
        const { count, error: countError } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');

        if (countError) throw countError;

        // Get average score
        const { data: sessions } = await supabase
            .from('sessions')
            .select('overall_score')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .not('overall_score', 'is', null);

        let avgScore = 0;
        if (sessions && sessions.length > 0) {
            const sum = sessions.reduce((acc, s) => acc + (s.overall_score || 0), 0);
            avgScore = Math.round(sum / sessions.length);
        }

        // Update progress table
        await supabase
            .from('user_progress')
            .upsert({
                user_id: userId,
                total_sessions: count || 0,
                average_score: avgScore,
                last_session_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

    } catch (error) {
        console.error('Failed to update user progress:', error);
    }
}

/**
 * Update user skills confidence
 * @param {string} userId - User UUID
 * @param {string} skillName - Name of the skill/role
 * @param {number} sessionScore - Score from the session
 * @returns {Promise<void>}
 */
async function updateUserSkills(userId, skillName, sessionScore) {
    if (!supabase || !skillName) return;

    try {
        // 1. Get or create skill
        let skillId;
        const { data: existingSkill } = await supabase
            .from('skills')
            .select('id')
            .ilike('name', skillName)
            .single();

        if (existingSkill) {
            skillId = existingSkill.id;
        } else {
            const { data: newSkill } = await supabase
                .from('skills')
                .insert({ name: skillName, category: 'Technical' }) // Default category
                .select()
                .single();
            if (newSkill) skillId = newSkill.id;
        }

        if (!skillId) return;

        // 2. Calculate new confidence level (mock logic: 1-10 scale based on score)
        // Map 0-100 score to 1-10 confidence
        const newConfidence = Math.max(1, Math.min(10, Math.round(sessionScore / 10)));

        // 3. Upsert user_skill
        await supabase
            .from('user_skills')
            .upsert({
                user_id: userId,
                skill_id: skillId,
                confidence_level: newConfidence
            });

    } catch (error) {
        console.error('Failed to update user skills:', error);
    }
}

/**
 * Ensure user goals exist (sync from onboarding if empty)
 * @param {string} userId - User UUID
 * @returns {Promise<void>}
 */
async function ensureUserGoals(userId) {
    if (!supabase) return;

    try {
        // Check if goals exist
        const { count, error } = await supabase
            .from('user_goals')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) throw error;

        // If no goals, sync from onboarding
        if (count === 0) {
            const { data: onboarding } = await supabase
                .from('onboarding_responses')
                .select('goals')
                .eq('user_id', userId)
                .single();

            if (onboarding && onboarding.goals && Array.isArray(onboarding.goals)) {
                const goalsToInsert = onboarding.goals.map(goal => ({
                    user_id: userId,
                    goal_type: goal.toLowerCase().replace(/\s+/g, '_'), // e.g., 'Land First Job' -> 'land_first_job'
                    goal_name: goal,
                    target_value: 100, // Default target
                    current_value: 0,
                    status: 'active',
                    created_at: new Date().toISOString()
                }));

                if (goalsToInsert.length > 0) {
                    await supabase
                        .from('user_goals')
                        .insert(goalsToInsert);
                    console.log(`Synced ${goalsToInsert.length} goals from onboarding for user ${userId}`);
                }
            }
        }
    } catch (error) {
        console.error('Failed to ensure user goals:', error);
    }
}

/**
 * Get a session by ID from the database
 * @param {string} sessionId - Session ID to fetch
 * @returns {Promise<object|null>} Session data or null if not found
 */
async function getSessionById(sessionId) {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot fetch session.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows found
                console.log(`Session not found in database: ${sessionId}`);
                return null;
            }
            console.error('Error fetching session by ID:', error);
            throw error;
        }

        console.log(`[Database] Session fetched: ${sessionId}`, {
            hasReport: !!data.final_report,
            status: data.status,
            score: data.overall_score
        });

        return data;
    } catch (error) {
        console.error('Failed to fetch session by ID:', sessionId, error);
        throw error; // Re-throw instead of silently returning null
    }
}

/**
 * Get user's onboarding responses
 * @param {string} userId - User UUID
 * @returns {Promise<object|null>} Onboarding data including profile_types and experience_years
 */
async function getUserOnboarding(userId) {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('onboarding_responses')
            .select('profile_types, experience_years, goals')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.warn('[getUserOnboarding] No onboarding data found:', error.message);
            return null;
        }

        return data;
    } catch (error) {
        console.error('[getUserOnboarding] Error:', error);
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
    saveSessionReport,
    getUserProfile,
    logActivity,
    updateUserProgress,
    updateUserSkills,
    ensureUserGoals,
    getSessionById,
    getUserOnboarding  // Export new function
};
