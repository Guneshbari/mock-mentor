const interviewService = require('../services/interview.service');
const aiService = require('../services/ai.service');

/**
 * Start a new interview session
 * POST /api/interview/start
 */
async function startInterview(req, res) {
  try {
    console.log('startInterview called - body:', JSON.stringify(req.body));
    const { interviewConfig } = req.body;

    // Validate request shape
    if (!interviewConfig) {
      return res.status(400).json({ error: 'Missing interviewConfig' });
    }

    if (typeof interviewConfig.interviewType !== 'string') {
      return res.status(400).json({ error: 'interviewConfig.interviewType must be a string' });
    }

    if (typeof interviewConfig.role !== 'string') {
      return res.status(400).json({ error: 'interviewConfig.role must be a string' });
    }

    if (interviewConfig.skills && !Array.isArray(interviewConfig.skills)) {
      return res.status(400).json({ error: 'interviewConfig.skills must be an array' });
    }

    // Check if audio mode is enabled (optional)
    const audioMode = interviewConfig.audioMode || false;

    // Delegate to service
    const result = await interviewService.startInterview(interviewConfig);

    // If audio mode is enabled, include speech params for the first question
    if (audioMode && result.firstQuestion) {
      const audioParams = await aiService.generateQuestionAudioParams(result.firstQuestion);
      result.questionAudio = audioParams;
    }

    res.json(result);
  } catch (error) {
    console.error('Error in startInterview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Process next step in the interview
 * POST /api/interview/next
 */
async function processNextStep(req, res) {
  try {
    console.log('processNextStep called - body:', JSON.stringify(req.body).substring(0, 500));
    const { sessionId, previousAnswerText, audioAnswer, inputMode, audioMode } = req.body;

    // Validate request shape
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required and must be a string' });
    }

    // Determine the answer text (from text input or audio transcription)
    let answerText = previousAnswerText;

    // If audio mode is enabled and audio answer is provided
    if (inputMode === 'audio' && audioAnswer) {
      console.log('Processing audio answer...');
      const mimeType = req.body.audioMimeType || 'audio/webm';
      const audioResult = await aiService.processAudioAnswer(audioAnswer, mimeType);

      if (audioResult.success) {
        answerText = audioResult.transcribedText;
        console.log('Audio transcribed successfully:', answerText.substring(0, 100));
      } else if (audioResult.needsRetry) {
        // Return error asking user to retry or type
        return res.status(400).json({
          error: audioResult.error,
          needsRetry: true,
          transcriptionFailed: true
        });
      }
    }

    // Validate that we have an answer (text or transcribed)
    if (!answerText || typeof answerText !== 'string' || answerText.trim().length === 0) {
      return res.status(400).json({ error: 'Answer is required. Please provide text or audio input.' });
    }

    // Delegate to service (backend is server-authoritative, uses session.currentStep)
    const result = await interviewService.processNextStep(
      sessionId,
      answerText
    );

    // If audio mode is enabled and there's a next question (or elaborated question), include speech params
    if (audioMode && result.nextQuestion) {
      const audioParams = await aiService.generateQuestionAudioParams(result.nextQuestion);
      result.questionAudio = audioParams;
    }

    // Check for elaborated question (gibberish detected)
    if (result.isElaborated) {
      console.log('Sending elaborated question response');
      // Ensure currentStep matches what the frontend expects for refinement
    }

    // Include transcribed text in response for audio mode
    if (inputMode === 'audio' && answerText !== previousAnswerText) {
      result.transcribedAnswer = answerText;
    }

    res.json(result);
  } catch (error) {
    console.error('Error in processNextStep:', error);

    if (error.message === 'Invalid sessionId') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Transcribe audio without submitting
 * POST /api/interview/transcribe
 */
async function transcribeAudio(req, res) {
  try {
    console.log('transcribeAudio called');
    const { audioAnswer, audioMimeType } = req.body;

    if (!audioAnswer) {
      return res.status(400).json({ error: 'audioAnswer is required' });
    }

    const mimeType = audioMimeType || 'audio/webm';
    const audioResult = await aiService.processAudioAnswer(audioAnswer, mimeType);

    if (audioResult.success) {
      console.log('Audio transcribed successfully:', audioResult.transcribedText.substring(0, 100));
      return res.json({
        success: true,
        transcribedText: audioResult.transcribedText
      });
    } else {
      return res.status(400).json({
        success: false,
        error: audioResult.error,
        needsRetry: audioResult.needsRetry
      });
    }
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio. Please try again.'
    });
  }
}

/**
 * Get final report for a session
 * GET /api/interview/report
 */
async function getFinalReport(req, res) {
  try {
    console.log('getFinalReport called - query:', JSON.stringify(req.query));
    const { sessionId } = req.query;

    // Validate request shape
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId query parameter is required' });
    }

    // Check if audio summary is requested
    const includeAudioSummary = req.query.audioSummary === 'true';

    // Delegate to service
    const result = await interviewService.getFinalReport(sessionId);

    // If audio summary is requested, generate spoken summary
    if (includeAudioSummary && result.finalReport) {
      const audioSummary = await aiService.generateReportAudioSummary(result.finalReport);
      result.audioSummary = audioSummary;
    }

    res.json(result);
  } catch (error) {
    console.error('Error in getFinalReport:', error);

    if (error.message === 'Invalid sessionId' || error.message === 'Interview not completed yet') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  startInterview,
  processNextStep,
  getFinalReport,
  transcribeAudio,
};
