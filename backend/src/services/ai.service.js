const Groq = require('groq-sdk');
const RoleBlock = require('./blocks/RoleBlock');
const QuestionGeneratorBlock = require('./blocks/QuestionGeneratorBlock');
const EvaluationBlock = require('./blocks/EvaluationBlock');
const FeedbackBlock = require('./blocks/FeedbackBlock');

// Initialize Provider
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Initialize Blocks
const roleBlock = new RoleBlock();
const questionBlock = new QuestionGeneratorBlock(groq);
const evaluationBlock = new EvaluationBlock(groq);
const feedbackBlock = new FeedbackBlock(groq);

// --- Public API (Facade) ---

/**
 * Determine the interview rounds based on type
 */
function determineTotalRounds(interviewState) {
  const interviewType = interviewState?.interviewConfig?.interviewType || interviewState;
  switch (interviewType) {
    case 'technical': return 10;
    case 'behavioral': return 8;
    case 'hr': return 6;
    default: return 5;
  }
}

/**
 * Generate the next question
 * orchestrates RoleBlock -> QuestionGeneratorBlock
 */
async function generateNextQuestion(interviewState) {
  const { history, interviewConfig } = interviewState;

  // 1. Get Context from RoleBlock
  const roleContextPrompt = roleBlock.execute(interviewConfig);

  // 2. Generate Question using QuestionGeneratorBlock
  try {
    return await questionBlock.execute(roleContextPrompt, history, interviewConfig);
  } catch (error) {
    console.error("Orchestrator Error (GenerateQuestion):", error);
    return fallbackQuestion((history || []).length);
  }
}

/**
 * Evaluate an answer
 * delegates to EvaluationBlock
 */
async function evaluateAnswer(question, answer, interviewState) {
  const { interviewConfig } = interviewState || {};
  return await evaluationBlock.execute(question, answer, interviewConfig);
}

/**
 * Generate Final Report
 * delegates to FeedbackBlock
 */
async function generateFinalReport(interviewState) {
  const { history } = interviewState;
  return await feedbackBlock.execute(history);
}

// --- Fallback Helper ---
function fallbackQuestion(currentStep) {
  const fallbacks = [
    "Tell me about a challenging project you've worked on.",
    "How do you handle debugging complex issues?",
    "What are your key strengths in this domain?",
    "Describe a time you had a conflict with a team member.",
    "Where do you see yourself in 5 years?"
  ];
  return fallbacks[currentStep % fallbacks.length];
}

/**
 * Process audio answer using Groq Whisper API
 * @param {string} audioBase64 - Base64 encoded audio
 * @param {string} mimeType - Audio mime type (e.g., 'audio/webm')
 * @returns {Promise<{success: boolean, transcribedText?: string, error?: string, needsRetry?: boolean}>}
 */
async function processAudioAnswer(audioBase64, mimeType = 'audio/webm') {
  if (!groq) {
    return {
      success: false,
      error: 'Audio transcription not available (missing API key)',
      needsRetry: false
    };
  }

  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  let tempPath = null;

  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    console.log(`[Audio] Processing audio: ${audioBuffer.length} bytes`);

    // Determine file extension based on mime type
    const ext = mimeType.includes('webm') ? 'webm' :
      mimeType.includes('wav') ? 'wav' :
        mimeType.includes('mp3') ? 'mp3' : 'webm';

    // Write to temp file (Groq API requires file input)
    tempPath = path.join(os.tmpdir(), `interview-audio-${Date.now()}.${ext}`);
    fs.writeFileSync(tempPath, audioBuffer);
    console.log(`[Audio] Saved to temp file: ${tempPath}`);

    // Use Groq's Whisper API for transcription (turbo for faster processing)
    console.log('[Audio] Calling Groq Whisper API...');
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-large-v3-turbo', // Faster than whisper-large-v3
      response_format: 'text',
      language: 'en',
      temperature: 0.0 // Lower temperature for more accurate transcription
    });

    console.log('[Audio] Transcription received');

    // Cleanup temp file
    try {
      fs.unlinkSync(tempPath);
      console.log('[Audio] Temp file deleted');
    } catch (e) {
      console.error('[Audio] Failed to delete temp file:', e);
    }

    const transcribedText = typeof transcription === 'string' ? transcription : transcription.text;

    if (!transcribedText || transcribedText.trim().length === 0) {
      console.log('[Audio] Empty transcription result');
      return {
        success: false,
        error: 'Could not transcribe audio. Please speak clearly and try again.',
        needsRetry: true
      };
    }

    console.log(`[Audio] Success! Transcribed: "${transcribedText.substring(0, 50)}..."`);
    return {
      success: true,
      transcribedText: transcribedText.trim()
    };

  } catch (apiError) {
    // Cleanup temp file on error
    if (tempPath) {
      try { fs.unlinkSync(tempPath); } catch (e) { }
    }

    console.error('[Audio] Groq API Error:', apiError.message);
    console.error('[Audio] Error details:', apiError);

    // Check for specific error types
    if (apiError.message?.includes('rate limit')) {
      return {
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
        needsRetry: true
      };
    }

    if (apiError.message?.includes('invalid') || apiError.message?.includes('format')) {
      return {
        success: false,
        error: 'Audio format not supported. Please try recording again.',
        needsRetry: true
      };
    }

    return {
      success: false,
      error: 'Failed to process audio. Please try again or type your answer.',
      needsRetry: true
    };
  }
}

/**
 * Generate audio parameters for question text-to-speech
 * @param {string} questionText - The question to speak
 * @returns {object} Speech synthesis parameters
 */
function generateQuestionAudioParams(questionText) {
  return {
    text: questionText,
    speechParams: {
      rate: 0.9,      // Slightly slower for clarity
      pitch: 1.0,     // Normal pitch
      volume: 1.0,    // Full volume
      lang: 'en-US'   // English US
    }
  };
}

/**
 * Generate audio summary for the final report
 * @param {object} reportData - The final report data
 * @returns {object} Audio summary with speech parameters
 */
function generateReportAudioSummary(reportData) {
  const { overallScore, identifiedStrengths, areasForImprovement } = reportData;

  // Create a concise audio summary
  let summaryText = `Your overall interview score is ${overallScore} out of 100. `;

  if (identifiedStrengths && identifiedStrengths.length > 0) {
    summaryText += `Your key strengths include: ${identifiedStrengths.slice(0, 2).join(', ')}. `;
  }

  if (areasForImprovement && areasForImprovement.length > 0) {
    summaryText += `Areas to focus on: ${areasForImprovement.slice(0, 2).join(', ')}. `;
  }

  summaryText += 'Great job completing the interview!';

  return {
    text: summaryText,
    speechParams: {
      rate: 0.85,     // Slower for report summary
      pitch: 1.0,
      volume: 1.0,
      lang: 'en-US'
    }
  };
}

module.exports = {
  determineTotalRounds,
  generateNextQuestion,
  evaluateAnswer,
  generateFinalReport,
  processAudioAnswer,
  generateQuestionAudioParams,
  generateReportAudioSummary
};
