const crypto = require('crypto');
const { getSession, setSession, hasSession } = require('../store/session.store');
const { TOTAL_QUESTIONS } = require('../utils/constants');
const aiService = require('./ai.service');
const databaseService = require('./database.service');
const emailService = require('./email.service');

// Dynamic round management - minimum 5, maximum 10
const MIN_ROUNDS = 5;
const MAX_ROUNDS = 10;

// Placeholder questions for the interview
const PLACEHOLDER_QUESTIONS = [
  "Tell me about yourself and your background.",
  "What interests you most about this role?",
  "Describe a challenging project you've worked on recently.",
  "How do you handle working under pressure?",
  "What are your strengths and areas for improvement?",
];

/**
 * SECURITY: Validate session ownership to prevent IDOR attacks
 * Checks both in-memory and database to ensure userId matches session owner
 * @param {string} sessionId - Session identifier
 * @param {string} userId - Authenticated user ID
 * @throws {Error} If session doesn't belong to user or doesn't exist
 */
async function validateSessionOwnership(sessionId, userId) {
  // Check in-memory session first
  if (hasSession(sessionId)) {
    const session = getSession(sessionId);
    if (session.userId && session.userId !== userId) {
      throw new Error('FORBIDDEN: Session does not belong to you');
    }
    // Session exists and belongs to user (or has no userId - legacy session)
    return;
  }

  // If not in memory, check database
  try {
    const { getSessionById } = require('./database.service');
    const sessionData = await getSessionById(sessionId);

    if (!sessionData) {
      throw new Error('Session not found');
    }

    if (sessionData.user_id !== userId) {
      throw new Error('FORBIDDEN: Session does not belong to you');
    }
  } catch (error) {
    // If it's already a forbidden error, rethrow it
    if (error.message.includes('FORBIDDEN')) {
      throw error;
    }
    // Otherwise, session not found
    throw new Error('Session not found');
  }
}


/**
 * Start a new interview session
 * @param {object} interviewConfig - Interview configuration
 * @param {string|null} userId - User ID (optional)
 * @returns {Promise<object>} Session initialization result
 */
async function startInterview(interviewConfig, userId = null) {
  // Generate sessionId using crypto.randomUUID
  const sessionId = crypto.randomUUID();

  // Initialize interview state first (for determineTotalRounds)
  const tempState = {
    interviewConfig: {
      interviewType: interviewConfig.interviewType,
      role: interviewConfig.role,
      skills: interviewConfig.skills || [],
    },
    history: [],
    currentStep: 1,
  };

  // Determine dynamic total rounds based on role and skills
  const initialTotalRounds = aiService.determineTotalRounds(tempState);

  // Fetch candidate name from DB if authenticated
  let candidateName = interviewConfig.candidateName || '';
  if (userId && !candidateName) {
    try {
      const profile = await databaseService.getUserProfile(userId);
      if (profile) {
        candidateName = profile.full_name || profile.name || '';
      }
    } catch (err) {
      console.warn('Failed to fetch candidate name for interview:', err);
    }
  }

  // Initialize interview state
  const interviewState = {
    sessionId,
    userId, // Store userId for later use in completion handlers
    interviewConfig: {
      interviewType: interviewConfig.interviewType,
      role: interviewConfig.role,
      skills: interviewConfig.skills || [],
      candidateName: candidateName, // Injected name
      resumeText: interviewConfig.resumeText || '',
    },
    currentStep: 1,
    totalSteps: Math.max(MIN_ROUNDS, Math.min(MAX_ROUNDS, initialTotalRounds)),
    history: [],
    finalReport: null,
    questionIds: {}, // Track question IDs from DB
  };

  // Get first question using AI (with fallback)
  const firstQuestion = await aiService.generateNextQuestion(interviewState);
  interviewState.lastQuestion = firstQuestion;

  // Store session in memory
  setSession(sessionId, interviewState);

  // Persist to database (if user is authenticated)
  if (userId) {
    try {
      await databaseService.createSession(userId, interviewConfig, sessionId);

      // Save user preferences (role and interview type)
      await databaseService.saveUserPreferences(userId, {
        preferred_role: interviewConfig.role,
        interview_type: interviewConfig.interviewType,
        experience_level: interviewConfig.experiencePreset || null,
      });

      // Save first question to database
      const questionData = await databaseService.saveQuestion(
        sessionId,
        firstQuestion,
        interviewConfig.interviewType,
        1
      );

      // Store question ID for later reference
      if (questionData) {
        interviewState.questionIds[1] = questionData.id;
        setSession(sessionId, interviewState);
      }

      // Log activity
      await databaseService.logActivity(userId, 'session_start');

      // Ensure user goals are populated
      await databaseService.ensureUserGoals(userId);

    } catch (dbError) {
      console.error('Database save failed, continuing with in-memory only:', dbError);
    }
  }

  return {
    sessionId,
    firstQuestion,
    totalSteps: interviewState.totalSteps,
  };
}

/**
 * Process next step in the interview
 * Backend is server-authoritative: uses session.currentStep as single source of truth
 * @param {string} sessionId - Session identifier
 * @param {string} previousAnswerText - Answer to the current question
 * @param {string} userId - Authenticated user ID (REQUIRED for security)
 * @returns {Promise<object>} Next question or final report
 */
async function processNextStep(sessionId, previousAnswerText, userId) {
  // SECURITY: Validate session ownership first
  if (userId) {
    await validateSessionOwnership(sessionId, userId);
  }

  // Validate session exists
  if (!hasSession(sessionId)) {
    throw new Error('Invalid sessionId');
  }

  const interviewState = getSession(sessionId);

  // Use session.currentStep as the single source of truth
  // The current question is the one that was generated for this step (stored in lastQuestion)
  // When we're on step N, we're answering the question that was generated when we moved to step N
  const currentQuestion = interviewState.lastQuestion || PLACEHOLDER_QUESTIONS[interviewState.currentStep - 1];

  // Evaluate the answer (real-time evaluation)
  let evaluation = null;
  try {
    evaluation = await aiService.evaluateAnswer(currentQuestion, previousAnswerText, interviewState);
    console.log(`Evaluation for step ${interviewState.currentStep}:`, evaluation);
  } catch (evalError) {
    console.error('Error evaluating answer:', evalError);
    // Provide fallback evaluation if AI evaluation fails
    evaluation = {
      score: 50,
      feedback: 'Unable to evaluate response automatically.'
    };
  }

  // Check for gibberish answer - if detected, elaborate the same question
  const isGibberish = await aiService.isGibberishAnswer(previousAnswerText);

  if (isGibberish) {
    console.log(`[Gibberish Detected] Elaborating question for step ${interviewState.currentStep}`);

    // Don't add to history yet - let them try again
    const elaboratedQuestion = await aiService.elaborateQuestion(currentQuestion, interviewState);

    // Update session without incrementing step
    setSession(sessionId, interviewState);

    return {
      nextQuestion: elaboratedQuestion,
      isElaborated: true,
      message: "Let me rephrase that question to be more specific...",
      currentStep: interviewState.currentStep,
      totalSteps: interviewState.totalSteps,
      // No evaluation for gibberish - don't show 0 score in UI
    };
  }

  // Skip evaluation during interview - only calculate in final report
  // This saves API calls and makes the interview smoother
  console.log(`[Interview] Storing answer ${interviewState.currentStep} without evaluation`);

  // Get question ID for current step (if saved to DB)
  const currentQuestionId = interviewState.questionIds?.[interviewState.currentStep];

  // Save response to database (if question ID exists)
  if (currentQuestionId) {
    try {
      await databaseService.saveResponse(
        interviewState.sessionId,
        currentQuestionId,
        previousAnswerText
      );
    } catch (dbError) {
      console.error('Failed to save response to database:', dbError);
    }
  }

  // Add answer to history WITHOUT evaluation
  interviewState.history.push({
    question: currentQuestion,
    answer: previousAnswerText,
    // No evaluation field - will be calculated in final report
  });

  // Total steps is fixed at interview start - no dynamic adjustment
  // This ensures the interview actually ends after totalSteps questions

  // Check if we've reached the end (after answering the last question)
  if (interviewState.currentStep >= interviewState.totalSteps) {
    // Generate final report with comprehensive evaluation of ALL answers
    if (!interviewState.finalReport) {
      interviewState.finalReport = await aiService.generateFinalReport(interviewState);
    }

    // Update session status to completed
    try {
      await databaseService.updateSessionStatus(interviewState.sessionId, 'completed');

      // Save final report to database
      if (interviewState.finalReport) {
        await databaseService.saveSessionReport(interviewState.sessionId, interviewState.finalReport);

        // Populate user data: Activity, Progress, Skills
        // We need userId here. Ideally it should be in interviewState, but we can query session or pass it.
        // For now, we'll try to get it from the session object if we stored it, or fetch from DB.
        // Actually, let's store userId in memory session state at startInterview to make this easy.
        // Assuming interviewState.userId exists (we need to add it in startInterview)
        if (interviewState.userId) {
          await databaseService.logActivity(interviewState.userId, 'session_end');
          await databaseService.updateUserProgress(interviewState.userId);
          if (interviewState.interviewConfig?.role) {
            await databaseService.updateUserSkills(
              interviewState.userId,
              interviewState.interviewConfig.role,
              interviewState.finalReport.overallScore || 0
            );
          }

          // Send interview completion email
          try {
            const userProfile = await databaseService.getUserProfile(interviewState.userId);
            
            // Check if user has email notifications enabled
            if (userProfile && userProfile.email) {
              const preferences = await databaseService.getUserPreferences(interviewState.userId);
              
              // Only send email if user hasn't explicitly disabled notifications
              if (!preferences || preferences.email_notifications !== false) {
                const sessionData = {
                  jobRole: interviewState.interviewConfig.role,
                  totalQuestions: interviewState.history.length,
                  overallScore: interviewState.finalReport.overallScore,
                  strengths: interviewState.finalReport.strengths,
                  improvements: interviewState.finalReport.improvements
                };

                await emailService.sendInterviewCompletionEmail(
                  userProfile.email,
                  userProfile.name || userProfile.full_name,
                  sessionData
                );
                
                console.log('✅ Interview completion email sent to:', userProfile.email);
              }
            }
          } catch (emailError) {
            // Don't fail the session if email sending fails
            console.error('Failed to send interview completion email:', emailError.message);
          }
        }
      }
    } catch (dbError) {
      console.error('Failed to update session status or save report:', dbError);
    }

    // Update session
    setSession(sessionId, interviewState);

    return {
      nextQuestion: null,
      finalReport: interviewState.finalReport,
      currentStep: interviewState.currentStep,
      totalSteps: interviewState.totalSteps,
      // No per-answer evaluation - all evaluations in finalReport
    };
  }

  // Move to next step (increment after processing current answer)
  interviewState.currentStep += 1;

  // Generate next question using AI (adaptive based on history and interview config)
  const nextQuestion = await aiService.generateNextQuestion(interviewState);
  interviewState.lastQuestion = nextQuestion;

  // Save next question to database
  try {
    const questionData = await databaseService.saveQuestion(
      interviewState.sessionId,
      nextQuestion,
      interviewState.interviewConfig.interviewType,
      interviewState.currentStep
    );

    // Store question ID
    if (questionData) {
      interviewState.questionIds[interviewState.currentStep] = questionData.id;
    }
  } catch (dbError) {
    console.error('Failed to save question to database:', dbError);
  }

  // Update session
  setSession(sessionId, interviewState);

  return {
    nextQuestion,
    finalReport: null,
    currentStep: interviewState.currentStep,
    totalSteps: interviewState.totalSteps,
    // No evaluation - only in final report
  };
}

/**
 * Get final report for a session
 * @param {string} sessionId - Session identifier
 * @returns {Promise<object>} Final report
 */
async function getFinalReport(sessionId, userId) {
  // SECURITY: Validate session ownership first
  if (userId) {
    await validateSessionOwnership(sessionId, userId);
  }

  // First, try to get from in-memory store
  if (hasSession(sessionId)) {
    console.log(`[Interview Service] Session found in memory store`);
    const interviewState = getSession(sessionId);

    // If report doesn't exist yet, generate it (shouldn't happen in normal flow)
    if (!interviewState.finalReport) {
      // Generate report if all questions are answered
      if (interviewState.history.length >= interviewState.totalSteps) {
        interviewState.finalReport = await aiService.generateFinalReport(interviewState);
        setSession(sessionId, interviewState);
      } else {
        throw new Error('Interview not completed yet');
      }
    }

    return {
      finalReport: interviewState.finalReport,
    };
  }

  // If not in memory, try to fetch from database
  console.log(`[Interview Service] Session not in memory, checking database for sessionId: ${sessionId}`);

  try {
    const { getSessionById } = require('./database.service');
    console.log(`[Interview Service] Calling getSessionById with: ${sessionId}`);
    const sessionData = await getSessionById(sessionId);

    console.log(`[Interview Service] getSessionById returned:`, sessionData ? 'data object' : 'null');

    if (!sessionData) {
      console.error(`[Interview Service] Session not found in database: ${sessionId}`);
      throw new Error('Session not found in database');
    }

    console.log(`[Interview Service] Session found in database:`, {
      hasReport: !!sessionData.final_report,
      status: sessionData.status,
      score: sessionData.overall_score
    });

    if (!sessionData.final_report) {
      console.error(`[Interview Service] Final report not generated for session: ${sessionId}, status: ${sessionData.status}`);
      throw new Error('Interview report not yet generated. Please wait a moment and try again.');
    }

    console.log(`[Interview Service] Returning report from database for session: ${sessionId}`);
    return {
      finalReport: sessionData.final_report,
    };
  } catch (error) {
    console.error(`[Interview Service] Error fetching report from database:`, {
      message: error.message,
      stack: error.stack
    });
    // Preserve the original error message to help with debugging
    throw error;
  }
}

module.exports = {
  startInterview,
  processNextStep,
  getFinalReport,
};
