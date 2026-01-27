const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');

// POST /api/interview/start - Initialize interview session
router.post('/start', interviewController.startInterview);

// POST /api/interview/next - Process next step in interview
router.post('/next', interviewController.processNextStep);

// POST /api/interview/transcribe - Transcribe audio only (no submission)
router.post('/transcribe', interviewController.transcribeAudio);

// GET /api/interview/report - Get final report
router.get('/report', interviewController.getFinalReport);

module.exports = router;
