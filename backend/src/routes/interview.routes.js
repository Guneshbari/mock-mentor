const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// SECURITY: All interview routes require authentication
// extractUser is already applied globally in app.js
// requireAuth enforces fail-closed security
router.use(requireAuth);

// POST /api/interview/start - Initialize interview session
router.post('/start', interviewController.startInterview);

// POST /api/interview/next - Process next step in interview
router.post('/next', interviewController.processNextStep);

// POST /api/interview/transcribe - Transcribe audio only (no submission)
router.post('/transcribe', interviewController.transcribeAudio);

// GET /api/interview/report - Get final report
// SECURITY: Changed from query param to require sessionId in body (via POST)
// TODO: Migrate to POST /api/interview/report with body instead of GET
router.get('/report', interviewController.getFinalReport);

module.exports = router;
