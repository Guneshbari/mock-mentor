const crypto = require('crypto');
const { getSession, setSession, hasSession } = require('../store/session.store');
const { TOTAL_QUESTIONS } = require('../utils/constants');
const aiService = require('./ai.service');

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
 * Start a new interview session
 * @param {object} interviewConfig - Interview configuration
 * @returns {Promise<object>} Session initialization result
 */
async function startInterview(interviewConfig) {
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

  // Initialize interview state
  const interviewState = {
    sessionId,
    interviewConfig: {
      interviewType: interviewConfig.interviewType,
      role: interviewConfig.role,
      skills: interviewConfig.skills || [],
      resumeText: interviewConfig.resumeText || '',
    },
    currentStep: 1,
    totalSteps: Math.max(MIN_ROUNDS, Math.min(MAX_ROUNDS, initialTotalRounds)),
    history: [],
    finalReport: null,
  };

  // Get first question using AI (with fallback)
  const firstQuestion = await aiService.generateNextQuestion(interviewState);
  interviewState.lastQuestion = firstQuestion;

  // Store session
  setSession(sessionId, interviewState);

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
 * @returns {Promise<object>} Next question or final report
 */
async function processNextStep(sessionId, previousAnswerText) {
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

  // Add answer with evaluation to history
  interviewState.history.push({
    question: currentQuestion,
    answer: previousAnswerText,
    evaluation: evaluation, // Include evaluation in history
  });

  // Dynamically adjust total rounds based on answer quality (adaptive)
  // Re-evaluate after each answer to potentially extend interview
  if (interviewState.currentStep >= 3) {
    const newTotalRounds = aiService.determineTotalRounds(interviewState);
    interviewState.totalSteps = Math.max(interviewState.currentStep + 1, Math.min(MAX_ROUNDS, newTotalRounds));
  }

  // Check if we've reached the end (after answering the last question)
  if (interviewState.currentStep >= interviewState.totalSteps) {
    // Generate final report only once using AI
    if (!interviewState.finalReport) {
      interviewState.finalReport = await aiService.generateFinalReport(interviewState);
    }

    // Update session
    setSession(sessionId, interviewState);

    return {
      nextQuestion: null,
      finalReport: interviewState.finalReport,
      currentStep: interviewState.currentStep,
      totalSteps: interviewState.totalSteps,
      evaluation: evaluation, // Include evaluation for the last answer
    };
  }

  // Move to next step (increment after processing current answer)
  interviewState.currentStep += 1;

  // Generate next question using AI (adaptive based on history and interview config)
  const nextQuestion = await aiService.generateNextQuestion(interviewState);
  interviewState.lastQuestion = nextQuestion;

  // Update session
  setSession(sessionId, interviewState);

  return {
    nextQuestion,
    finalReport: null,
    currentStep: interviewState.currentStep,
    totalSteps: interviewState.totalSteps,
    evaluation: evaluation, // Return evaluation for the submitted answer
  };
}

/**
 * Get final report for a session
 * @param {string} sessionId - Session identifier
 * @returns {Promise<object>} Final report
 */
async function getFinalReport(sessionId) {
  // Validate session exists
  if (!hasSession(sessionId)) {
    throw new Error('Invalid sessionId');
  }

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

module.exports = {
  startInterview,
  processNextStep,
  getFinalReport,
};
